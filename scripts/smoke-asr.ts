import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

import ffmpegPath from "ffmpeg-static";

import { QvacLocalAiGateway } from "../src/infrastructure/qvac-local-ai-gateway.ts";
import { appendJsonlArtifact } from "./artifact-writer.ts";

const artifactPath = resolve("artifacts/performance/asr-smoke.jsonl");
const sourcePath = resolve("artifacts/audio/asr-source.wav");
const wavPath = resolve("artifacts/audio/asr-16khz.wav");
const phrase = "My modem shows error E one zero five and the red light does not blink.";
const gateway = new QvacLocalAiGateway();

try {
  if (!ffmpegPath) throw new Error("ffmpeg-static no está disponible.");
  mkdirSync(dirname(sourcePath), { recursive: true });
  const escapedPath = sourcePath.replace(/'/g, "''");
  const escapedPhrase = phrase.replace(/'/g, "''");
  execFileSync("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${escapedPath}'); $s.Speak('${escapedPhrase}'); $s.Dispose()`,
  ]);
  execFileSync(ffmpegPath, [
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
  ], { stdio: "ignore" });

  const result = await gateway.transcribeCustomerAudio(wavPath);
  const record = {
    recordedAt: new Date().toISOString(),
    component: "transcription",
    runtime: "@qvac/sdk@0.19.0",
    modelName: result.modelName,
    quantization: "q4_0",
    syntheticReference: phrase,
    transcript: result.text,
    latencyMs: result.latencyMs,
    inferenceLocation: "local",
  };
  appendJsonlArtifact(artifactPath, record);
  console.log(JSON.stringify(record, null, 2));
  if (!result.text.trim()) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  appendJsonlArtifact(artifactPath, { recordedAt: new Date().toISOString(), component: "transcription", status: "failed", error: message });
  console.error(message);
  process.exitCode = 1;
} finally {
  rmSync(sourcePath, { force: true });
  rmSync(wavPath, { force: true });
  await gateway.dispose();
}
