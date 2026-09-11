import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { QvacLocalAiGateway } from "../src/infrastructure/qvac-local-ai-gateway.ts";

const outputPath = resolve("artifacts/performance/rag-smoke.jsonl");
const query = "Mi módem muestra el error E105 y la luz roja no parpadea.";
const gateway = new QvacLocalAiGateway();

const writeRecord = (record: Record<string, unknown>): void => {
  mkdirSync(dirname(outputPath), { recursive: true });
  appendFileSync(outputPath, `${JSON.stringify(record)}\n`, "utf8");
};

try {
  const started = performance.now();
  const results = await gateway.search(query, 3);
  const latencyMs = Math.round(performance.now() - started);
  const record = {
    recordedAt: new Date().toISOString(),
    component: "rag",
    runtime: "@qvac/sdk@0.19.0",
    modelName: "EMBEDDINGGEMMA_300M_Q4_0",
    quantization: "q4_0",
    workspace: "qvac-sovereign-agent-v1",
    documentCount: 20,
    query,
    latencyMs,
    results: results.map(({ documentId, title, score }) => ({ documentId, title, score })),
    inferenceLocation: "local",
  };
  writeRecord(record);
  console.log(JSON.stringify(record, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  writeRecord({ recordedAt: new Date().toISOString(), component: "rag", status: "failed", error: message });
  console.error(message);
  process.exitCode = 1;
} finally {
  await gateway.dispose();
}
