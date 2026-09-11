import { delimiter, dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

import { app, BrowserWindow, ipcMain } from "electron";
import ffmpegPath from "ffmpeg-static";

import {
  prepareCustomerResponse,
  processCustomerUtterance,
} from "../application/support-flow.js";
import { DemoLocalAiGateway } from "../infrastructure/demo-local-ai-gateway.js";
import { QvacLocalAiGateway } from "../infrastructure/qvac-local-ai-gateway.js";

const runtimeMode = process.env.QVAC_RUNTIME_MODE === "demo" ? "demo" : "qvac";
const execFileAsync = promisify(execFile);
if (ffmpegPath) {
  process.env.PATH = `${dirname(ffmpegPath)}${delimiter}${process.env.PATH ?? ""}`;
}
const gateway = runtimeMode === "qvac" ? new QvacLocalAiGateway() : new DemoLocalAiGateway();

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
  ipcMain.handle("support:transcribe-audio", async (_event, audio: ArrayBuffer) => {
    if (gateway instanceof DemoLocalAiGateway) return gateway.transcribeCustomerAudio();
    if (!ffmpegPath) throw new Error("ffmpeg no está disponible.");

    const sessionId = randomUUID();
    const sourcePath = join(tmpdir(), `qvac-${sessionId}.webm`);
    const wavPath = join(tmpdir(), `qvac-${sessionId}.wav`);
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
      return await gateway.transcribeCustomerAudio(wavPath);
    } finally {
      await Promise.all([
        rm(sourcePath, { force: true }),
        rm(wavPath, { force: true }),
      ]);
    }
  });
  ipcMain.handle("support:customer-turn", (_event, input: { text: string }) =>
    processCustomerUtterance(input, gateway),
  );
  ipcMain.handle("support:prepare-response", (_event, input: { text: string }) =>
    prepareCustomerResponse(input, gateway),
  );
  ipcMain.handle("support:runtime-info", () => ({
    mode: runtimeMode,
    disclosure:
      runtimeMode === "qvac"
        ? "TranslatePsy/Bergamot y RAG se ejecutan localmente con @qvac/sdk. Ninguna API externa de IA procesa el turno."
        : "Modo demostración determinista. No representa inferencia ni métricas reales de QVAC.",
  }));
  ipcMain.handle("support:close-session", () => ({
    clearedAt: new Date().toISOString(),
    retained: ["aggregate-performance", "anonymous-problem-category"],
  }));

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
