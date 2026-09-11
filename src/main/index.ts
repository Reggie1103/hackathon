import { delimiter, dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import ffmpegPath from "ffmpeg-static";

import {
  prepareCustomerResponse,
  processCustomerUtterance,
} from "../application/support-flow.js";
import { DemoLocalAiGateway } from "../infrastructure/demo-local-ai-gateway.js";
import { QvacLocalAiGateway } from "../infrastructure/qvac-local-ai-gateway.js";
import { validateAudioInput, validateTextInput } from "./ipc-validation.js";

const runtimeMode = process.env.QVAC_RUNTIME_MODE === "demo" ? "demo" : "qvac";
const execFileAsync = promisify(execFile);
if (ffmpegPath) {
  process.env.PATH = `${dirname(ffmpegPath)}${delimiter}${process.env.PATH ?? ""}`;
}
const gateway = runtimeMode === "qvac" ? new QvacLocalAiGateway() : new DemoLocalAiGateway();
const trustedWebContentsIds = new Set<number>();
const temporaryFiles = new Set<string>();
let sessionGeneration = 0;
let currentTurnDecision: "supported" | "abstained" | "blocked" | null = null;
let runtimeStatus: "loading" | "ready" | "error" = runtimeMode === "demo" ? "ready" : "loading";
let runtimeError: string | undefined;
let warmupPromise: Promise<void> = Promise.resolve();

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (!trustedWebContentsIds.has(event.sender.id)) {
    throw new Error("Solicitud IPC rechazada: origen no autorizado.");
  }
}

function assertActiveSession(generation: number): void {
  if (generation !== sessionGeneration) {
    throw new Error("La sesión se cerró antes de completar la operación.");
  }
}

function assertRuntimeReady(): void {
  if (runtimeStatus === "error") {
    throw new Error(`QVAC no está disponible: ${runtimeError ?? "error durante la preparación"}`);
  }
  if (runtimeStatus !== "ready") throw new Error("QVAC todavía está preparando los componentes locales.");
}

async function clearTemporaryFiles(): Promise<void> {
  const paths = [...temporaryFiles];
  temporaryFiles.clear();
  await Promise.allSettled(paths.map((path) => rm(path, { force: true })));
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: "#07130f",
    title: "QVAC Sovereign Agent",
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  trustedWebContentsIds.add(window.webContents.id);
  window.on("closed", () => trustedWebContentsIds.delete(window.webContents.id));

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  const capturePath = process.env.QVAC_CAPTURE_PATH;
  if (capturePath) {
    window.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        await window.webContents.executeJavaScript(
          "document.querySelector('button.primary')?.click()",
        );
        await new Promise((resolve) => setTimeout(resolve, 250));
        await window.webContents.executeJavaScript(
          "document.querySelector('button.secondary')?.click()",
        );
        await new Promise((resolve) => setTimeout(resolve, 250));
        await mkdir(dirname(capturePath), { recursive: true });
        const image = await window.webContents.capturePage();
        await writeFile(capturePath, image.toPNG());
        app.quit();
      }, 800);
    });
  }
}

app.whenReady().then(() => {
  if (gateway instanceof QvacLocalAiGateway) {
    warmupPromise = gateway.warmup().then(
      () => {
        runtimeStatus = "ready";
      },
      (cause: unknown) => {
        runtimeStatus = "error";
        runtimeError = cause instanceof Error ? cause.message : String(cause);
      },
    );
  }

  ipcMain.handle("support:transcribe-audio", async (event, payload: unknown) => {
    assertTrustedSender(event);
    const audio = validateAudioInput(payload);
    const generation = sessionGeneration;
    await warmupPromise;
    assertRuntimeReady();
    assertActiveSession(generation);
    if (gateway instanceof DemoLocalAiGateway) return gateway.transcribeCustomerAudio();
    if (!ffmpegPath) throw new Error("ffmpeg no está disponible.");

    const sessionId = randomUUID();
    const sourcePath = join(tmpdir(), `qvac-${sessionId}.webm`);
    const wavPath = join(tmpdir(), `qvac-${sessionId}.wav`);
    temporaryFiles.add(sourcePath);
    temporaryFiles.add(wavPath);
    try {
      await writeFile(sourcePath, Buffer.from(audio));
      await execFileAsync(ffmpegPath, [
        "-y",
        "-i",
        sourcePath,
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        wavPath,
      ]);
      const transcription = await gateway.transcribeCustomerAudio(wavPath);
      assertActiveSession(generation);
      return transcription;
    } finally {
      temporaryFiles.delete(sourcePath);
      temporaryFiles.delete(wavPath);
      await Promise.allSettled([rm(sourcePath, { force: true }), rm(wavPath, { force: true })]);
    }
  });
  ipcMain.handle("support:customer-turn", async (event, payload: unknown) => {
    assertTrustedSender(event);
    const input = validateTextInput(payload);
    const generation = sessionGeneration;
    await warmupPromise;
    assertRuntimeReady();
    assertActiveSession(generation);
    const result = await processCustomerUtterance(input, gateway);
    assertActiveSession(generation);
    currentTurnDecision = result.kind;
    return result;
  });
  ipcMain.handle("support:prepare-response", async (event, payload: unknown) => {
    assertTrustedSender(event);
    const input = validateTextInput(payload);
    const generation = sessionGeneration;
    await warmupPromise;
    assertRuntimeReady();
    assertActiveSession(generation);
    const result = await prepareCustomerResponse(input, gateway, currentTurnDecision);
    assertActiveSession(generation);
    return result;
  });
  ipcMain.handle("support:runtime-info", (event) => {
    assertTrustedSender(event);
    return {
    mode: runtimeMode,
    status: runtimeStatus,
    error: runtimeError,
    disclosure:
      runtimeMode === "qvac"
        ? "TranslatePsy/Bergamot y RAG se ejecutan localmente con @qvac/sdk. Ninguna API externa de IA procesa el turno."
        : "Modo demostración determinista. No representa inferencia ni métricas reales de QVAC.",
    };
  });
  ipcMain.handle("support:close-session", async (event) => {
    assertTrustedSender(event);
    sessionGeneration += 1;
    currentTurnDecision = null;
    await clearTemporaryFiles();
    return {
      clearedAt: new Date().toISOString(),
      retained: ["aggregate-performance", "anonymous-problem-category"],
    };
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (gateway instanceof QvacLocalAiGateway) void gateway.dispose();
});
