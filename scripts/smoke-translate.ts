import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import {
  BERGAMOT_EN_ES,
  BERGAMOT_ES_EN,
  close,
  loadModel,
  translate,
  unloadModel,
} from "@qvac/sdk";
import { appendJsonlArtifact } from "./artifact-writer.ts";

interface SmokeCase {
  direction: "en-es" | "es-en";
  from: "en" | "es";
  to: "es" | "en";
  input: string;
  model: typeof BERGAMOT_EN_ES | typeof BERGAMOT_ES_EN;
}

const outputPath = resolve("artifacts/performance/translate-smoke.jsonl");

const cases: SmokeCase[] = [
  {
    direction: "en-es",
    from: "en",
    to: "es",
    input: "My modem shows error E105 and the red light does not blink.",
    model: BERGAMOT_EN_ES,
  },
  {
    direction: "es-en",
    from: "es",
    to: "en",
    input: "El código E105 no debe cambiar durante la traducción.",
    model: BERGAMOT_ES_EN,
  },
];

async function runCase(smokeCase: SmokeCase): Promise<void> {
  let lastProgress = -10;
  const loadStarted = performance.now();
  const onProgress = (progress: { percentage: number }): void => {
      const rounded = Math.floor(progress.percentage / 10) * 10;
      if (rounded > lastProgress) {
        lastProgress = rounded;
        console.log(`[${smokeCase.direction}] model download/load ${rounded}%`);
      }
  };
  const modelId =
    smokeCase.direction === "en-es"
      ? await loadModel({
          modelSrc: BERGAMOT_EN_ES,
          modelConfig: { engine: "Bergamot", from: "en", to: "es" },
          onProgress,
        })
      : await loadModel({
          modelSrc: BERGAMOT_ES_EN,
          modelConfig: { engine: "Bergamot", from: "es", to: "en" },
          onProgress,
        });
  const loadTimeMs = performance.now() - loadStarted;

  try {
    const translationStarted = performance.now();
    const result = translate({
      modelId,
      text: smokeCase.input,
      modelType: "nmtcpp-translation",
      stream: false,
    });
    const [translatedText, stats] = await Promise.all([result.text, result.stats]);
    const translationLatencyMs = performance.now() - translationStarted;

    const record = {
      recordedAt: new Date().toISOString(),
      component: "translation",
      runtime: "@qvac/sdk@0.19.0",
      modelName: smokeCase.model.name,
      modelId,
      engine: smokeCase.model.engine,
      quantization: smokeCase.model.quantization || "INTGEMM pack",
      direction: smokeCase.direction,
      input: smokeCase.input,
      output: translatedText,
      loadTimeMs: Math.round(loadTimeMs),
      translationLatencyMs: Math.round(translationLatencyMs),
      stats: stats ?? null,
      inferenceLocation: "local",
    };

    appendJsonlArtifact(outputPath, record);
    console.log(`\n${smokeCase.direction}: ${smokeCase.input}`);
    console.log(`=> ${translatedText}`);
    console.log(`load=${record.loadTimeMs}ms translate=${record.translationLatencyMs}ms`);
  } finally {
    await unloadModel({ modelId, clearStorage: false });
  }
}

try {
  for (const smokeCase of cases) {
    await runCase(smokeCase);
  }
  console.log(`\nPerformance records: ${outputPath}`);
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  appendJsonlArtifact(outputPath, {
    recordedAt: new Date().toISOString(),
    component: "translation",
    status: "failed",
    error: message,
  });
  console.error(message);
  process.exitCode = 1;
} finally {
  await close();
}
