import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  compareCriticalEntities,
  extractCriticalEntities,
} from "../src/application/support-flow.ts";
import { ragEvaluationCases } from "../src/infrastructure/evaluation-cases.ts";
import { QvacLocalAiGateway } from "../src/infrastructure/qvac-local-ai-gateway.ts";

const outputPath = resolve("artifacts/evaluation/bilingual-critical-entities.json");
const gateway = new QvacLocalAiGateway();

try {
  const results = [];
  for (const evaluationCase of ragEvaluationCases) {
    const translatedCustomer = await gateway.translate(evaluationCase.customerTextEn, "en", "es");
    const translatedResponse = await gateway.translate(evaluationCase.approvedResponseEs, "es", "en");
    const customerLock = compareCriticalEntities(evaluationCase.customerTextEn, translatedCustomer.text);
    const responseLock = compareCriticalEntities(evaluationCase.approvedResponseEs, translatedResponse.text);
    const declaredEntitiesFound = evaluationCase.expectedCriticalEntities.every((entity) =>
      extractCriticalEntities(evaluationCase.customerTextEn).includes(entity),
    );
    const protectedByLock = customerLock.kind === "valid" || customerLock.kind === "blocked";
    const responseProtectedByLock = responseLock.kind === "valid" || responseLock.kind === "blocked";
    results.push({
      id: evaluationCase.id,
      expectedCriticalEntities: evaluationCase.expectedCriticalEntities,
      customer: { input: evaluationCase.customerTextEn, output: translatedCustomer.text, lock: customerLock },
      response: { input: evaluationCase.approvedResponseEs, output: translatedResponse.text, lock: responseLock },
      declaredEntitiesFound,
      protectedByLock,
      responseProtectedByLock,
    });
  }

  const report = {
    recordedAt: new Date().toISOString(),
    runtime: "@qvac/sdk@0.19.0",
    models: ["BERGAMOT_EN_ES", "BERGAMOT_ES_EN"],
    caseCount: results.length,
    declaredEntityCoverage: results.filter((result) => result.declaredEntitiesFound).length / results.length,
    protectedRate: results.filter((result) => result.protectedByLock && result.responseProtectedByLock).length / results.length,
    preservedCustomerRate: results.filter((result) => result.customer.lock.kind === "valid").length / results.length,
    preservedResponseRate: results.filter((result) => result.response.lock.kind === "valid").length / results.length,
    passedTarget: results.every((result) => result.protectedByLock && result.responseProtectedByLock && result.declaredEntitiesFound),
    results,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
  if (!report.passedTarget) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  await gateway.dispose();
}
