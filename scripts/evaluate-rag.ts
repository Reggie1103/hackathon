import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { DEFAULT_EVIDENCE_THRESHOLD } from "../src/application/support-flow.ts";
import { demoKnowledgeDocuments } from "../src/infrastructure/demo-knowledge.ts";
import { ragEvaluationCases } from "../src/infrastructure/evaluation-cases.ts";
import { QvacLocalAiGateway } from "../src/infrastructure/qvac-local-ai-gateway.ts";

const outputPath = resolve("artifacts/evaluation/rag-evaluation.json");
const gateway = new QvacLocalAiGateway();
const activeIds = new Set(
  demoKnowledgeDocuments.filter((document) => document.status === "active").map((document) => document.documentId),
);

try {
  const results = [];
  for (const evaluationCase of ragEvaluationCases) {
    const matches = await gateway.search(evaluationCase.referenceTranslationEs, 12);
    const accepted = matches.find(
      (match) => activeIds.has(match.documentId) && match.score >= DEFAULT_EVIDENCE_THRESHOLD,
    );
    const predictedDocumentId = accepted?.documentId ?? null;
    results.push({
      ...evaluationCase,
      predictedDocumentId,
      correct: predictedDocumentId === evaluationCase.expectedDocumentId,
      matches: matches.map(({ documentId, score, status }) => ({ documentId, score, status })),
    });
  }

  const answerable = results.filter((result) => result.expectedDocumentId !== null);
  const precisionAt1 = answerable.filter((result) => result.correct).length / answerable.length;
  const abstentionCases = results.filter((result) => result.expectedDocumentId === null);
  const abstentionAccuracy =
    abstentionCases.filter((result) => result.correct).length / abstentionCases.length;
  const report = {
    recordedAt: new Date().toISOString(),
    runtime: "@qvac/sdk@0.19.0",
    modelName: "EMBEDDINGGEMMA_300M_Q4_0",
    quantization: "q4_0",
    evidenceThreshold: DEFAULT_EVIDENCE_THRESHOLD,
    caseCount: results.length,
    precisionAt1,
    abstentionAccuracy,
    passedTarget: precisionAt1 >= 0.85,
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
