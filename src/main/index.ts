import { dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";

import {
  prepareCustomerResponse,
  processCustomerUtterance,
} from "../application/support-flow.js";
import { DemoLocalAiGateway } from "../infrastructure/demo-local-ai-gateway.js";
import { QvacLocalAiGateway } from "../infrastructure/qvac-local-ai-gateway.js";
import type { CustomerAudioTranscriptionStream } from "../shared/contracts.js";
import {
  validateAudioStreamChunkInput,
  validateStreamId,
  validateTextInput,
} from "./ipc-validation.js";

const runtimeMode = process.env.QVAC_RUNTIME_MODE === "demo" ? "demo" : "qvac";
const gateway = runtimeMode === "qvac" ? new QvacLocalAiGateway() : new DemoLocalAiGateway();
const trustedWebContentsIds = new Set<number>();
const activeAudioStreams = new Map<string, {
  ownerId: number;
  generation: number;
  byteLength: number;
  stream: CustomerAudioTranscriptionStream;
}>();
const MAX_STREAM_AUDIO_BYTES = 20 * 1024 * 1024;
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

function destroyAudioStreams(ownerId?: number): void {
  for (const [streamId, entry] of activeAudioStreams) {
    if (ownerId !== undefined && entry.ownerId !== ownerId) continue;
    entry.stream.destroy();
    activeAudioStreams.delete(streamId);
  }
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
  window.on("closed", () => {
    destroyAudioStreams(window.webContents.id);
    trustedWebContentsIds.delete(window.webContents.id);
  });

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

  ipcMain.handle("support:start-audio-stream", async (event) => {
    assertTrustedSender(event);
    const generation = sessionGeneration;
    await warmupPromise;
    assertRuntimeReady();
    assertActiveSession(generation);
    if ([...activeAudioStreams.values()].some((entry) => entry.ownerId === event.sender.id)) {
      throw new Error("Ya existe una transcripción en vivo para esta ventana.");
    }
    const streamId = randomUUID();
    const ownerId = event.sender.id;
    const stream = await gateway.createCustomerAudioStream((update) => {
      const current = activeAudioStreams.get(streamId);
      if (!current || current.generation !== sessionGeneration || event.sender.isDestroyed()) return;
      event.sender.send("support:transcription-update", {
        ...update,
        streamId,
        isFinal: false,
      });
    });
    try {
      assertActiveSession(generation);
      if (event.sender.isDestroyed()) throw new Error("La ventana se cerró durante la preparación.");
    } catch (cause) {
      stream.destroy();
      throw cause;
    }
    activeAudioStreams.set(streamId, { ownerId, generation, byteLength: 0, stream });
    return { streamId, sampleRate: 16_000 as const };
  });
  ipcMain.handle("support:append-audio-stream", (event, payload: unknown) => {
    assertTrustedSender(event);
    const { streamId, audio } = validateAudioStreamChunkInput(payload);
    const entry = activeAudioStreams.get(streamId);
    if (!entry || entry.ownerId !== event.sender.id) {
      throw new Error("La transcripción en vivo no existe o ya terminó.");
    }
    assertActiveSession(entry.generation);
    entry.byteLength += audio.byteLength;
    if (entry.byteLength > MAX_STREAM_AUDIO_BYTES) {
      entry.stream.destroy();
      activeAudioStreams.delete(streamId);
      throw new Error("La intervención supera el límite de diez minutos.");
    }
    try {
      entry.stream.write(new Uint8Array(audio));
    } catch (cause) {
      entry.stream.destroy();
      activeAudioStreams.delete(streamId);
      throw cause;
    }
  });
  ipcMain.handle("support:finish-audio-stream", async (event, payload: unknown) => {
    assertTrustedSender(event);
    const streamId = validateStreamId(payload);
    const entry = activeAudioStreams.get(streamId);
    if (!entry || entry.ownerId !== event.sender.id) {
      throw new Error("La transcripción en vivo no existe o ya terminó.");
    }
    try {
      entry.stream.end();
      const result = await entry.stream.result;
      assertActiveSession(entry.generation);
      event.sender.send("support:transcription-update", {
        ...result,
        streamId,
        isFinal: true,
      });
      return result;
    } finally {
      activeAudioStreams.delete(streamId);
    }
  });
  ipcMain.handle("support:cancel-audio-stream", (event, payload: unknown) => {
    assertTrustedSender(event);
    const streamId = validateStreamId(payload);
    const entry = activeAudioStreams.get(streamId);
    if (entry?.ownerId === event.sender.id) {
      entry.stream.destroy();
      activeAudioStreams.delete(streamId);
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
        ? "Parakeet streaming, TranslatePsy/Bergamot y RAG se ejecutan localmente con @qvac/sdk. Ninguna API externa de IA procesa el turno."
        : "Modo demostración determinista. No representa inferencia ni métricas reales de QVAC.",
    };
  });
  ipcMain.handle("support:close-session", async (event) => {
    assertTrustedSender(event);
    sessionGeneration += 1;
    currentTurnDecision = null;
    destroyAudioStreams(event.sender.id);
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
  destroyAudioStreams();
  if (gateway instanceof QvacLocalAiGateway) void gateway.dispose();
});
