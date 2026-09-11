import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import ffmpegPath from "ffmpeg-static";

import { QvacLocalAiGateway } from "../src/infrastructure/qvac-local-ai-gateway.ts";
import { appendJsonlArtifact } from "./artifact-writer.ts";

const artifactPath = resolve("artifacts/performance/asr-stream-smoke.jsonl");
const sourcePath = resolve("artifacts/audio/asr-stream-source.wav");
const pcmPath = resolve("artifacts/audio/asr-stream-16khz.pcm");
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
    "-y", "-i", sourcePath, "-ar", "16000", "-ac", "1", "-f", "s16le", pcmPath,
  ], { stdio: "ignore" });

  const updates: string[] = [];
  const stream = await gateway.createCustomerAudioStream((update) => updates.push(update.text));
  const audio = readFileSync(pcmPath);
  const chunkBytes = 8_000;
  for (let offset = 0; offset < audio.byteLength; offset += chunkBytes) {
    stream.write(new Uint8Array(audio.subarray(offset, offset + chunkBytes)));
    await delay(250);
  }
  stream.end();
  const result = await stream.result;
  const record = {
    recordedAt: new Date().toISOString(),
    component: "streaming-transcription",
    runtime: "@qvac/sdk@0.19.0",
    modelName: result.modelName,
    quantization: "q4_0",
    syntheticReference: phrase,
    transcript: result.text,
    incrementalUpdates: updates.length,
    latencyMs: result.latencyMs,
    audioFormat: "PCM s16le, 16 kHz, mono",
    inferenceLocation: "local",
  };
  appendJsonlArtifact(artifactPath, record);
  console.log(JSON.stringify(record, null, 2));
  if (!result.text.trim() || updates.length === 0) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  appendJsonlArtifact(artifactPath, {
    recordedAt: new Date().toISOString(), component: "streaming-transcription", status: "failed", error: message,
  });
  console.error(message);
  process.exitCode = 1;
} finally {
  rmSync(sourcePath, { force: true });
  rmSync(pcmPath, { force: true });
  await gateway.dispose();
}
