import { performance } from "node:perf_hooks";

import { appendJsonlArtifact } from "./artifact-writer.ts";
import { QvacLocalAiGateway } from "../src/infrastructure/qvac-local-ai-gateway.ts";

const outputPath = "artifacts/performance/runtime-warmup.jsonl";
const gateway = new QvacLocalAiGateway();

try {
  const started = performance.now();
  await gateway.warmup();
  const record = {
    recordedAt: new Date().toISOString(),
    component: "runtime-warmup",
    runtime: "@qvac/sdk@0.19.0",
    components: ["BERGAMOT_EN_ES", "BERGAMOT_ES_EN", "EMBEDDINGGEMMA_300M_Q4_0", "PARAKEET_UNIFIED_0_6B_Q4_0"],
    latencyMs: Math.round(performance.now() - started),
    status: "ready",
    inferenceLocation: "local",
  };
  appendJsonlArtifact(outputPath, record);
  console.log(JSON.stringify(record, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  appendJsonlArtifact(outputPath, { recordedAt: new Date().toISOString(), component: "runtime-warmup", status: "failed", error: message });
  console.error(message);
  process.exitCode = 1;
} finally {
  await gateway.dispose();
}
