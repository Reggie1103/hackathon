import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import {
  prepareCustomerResponse,
  processCustomerUtterance,
} from "../src/application/support-flow.ts";
import { QvacLocalAiGateway } from "../src/infrastructure/qvac-local-ai-gateway.ts";
import { appendJsonlArtifact } from "./artifact-writer.ts";

const outputPath = resolve("artifacts/performance/flow-smoke.jsonl");
const gateway = new QvacLocalAiGateway();

try {
  const started = performance.now();
  const turn = await processCustomerUtterance(
    {
      text: "My modem shows error E105 and the red light does not blink.",
      now: new Date("2026-09-10T12:00:00Z"),
    },
    gateway,
  );
  const response = await prepareCustomerResponse(
    {
      text: "Confirme la luz WAN. Si el código E105 continúa después de reiniciar el módem, transfiera el caso a soporte técnico.",
    },
    gateway,
    turn.kind,
  );
  const endToEndLatencyMs = Math.round(performance.now() - started);
  const record = {
    recordedAt: new Date().toISOString(),
    component: "bilingual-turn",
    runtime: "@qvac/sdk@0.19.0",
    translationModels: ["BERGAMOT_EN_ES", "BERGAMOT_ES_EN"],
    embeddingModel: "EMBEDDINGGEMMA_300M_Q4_0",
    input: turn.originalText,
    translatedInput: turn.translatedText,
    decision: turn.kind,
    evidence: turn.evidence.map(({ documentId, score }) => ({ documentId, score })),
    agentResponse: response.agentText,
    customerResponse: response.customerText,
    criticalEntityState: response.criticalEntityState,
    canConfirm: response.canConfirm,
    endToEndLatencyMs,
    inferenceLocation: "local",
  };
  appendJsonlArtifact(outputPath, record);
  console.log(JSON.stringify(record, null, 2));
  if (turn.kind !== "supported" || !response.canConfirm) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  appendJsonlArtifact(outputPath, { recordedAt: new Date().toISOString(), component: "bilingual-turn", status: "failed", error: message });
  console.error(message);
  process.exitCode = 1;
} finally {
  await gateway.dispose();
}
