import type {
  CriticalEntityState,
  CustomerTurnInput,
  CustomerTurnResult,
  Evidence,
  LocalAiGateway,
  PreparedCustomerResponse,
  SupportedGuidance,
} from "../shared/contracts.ts";

export const DEFAULT_EVIDENCE_THRESHOLD = 0.5;

const CODE_OR_NUMBER = /\b(?:[A-Za-z]{1,6}-?\d{2,}|\d+(?:[.,]\d+)?)\b/g;
const NEGATION_EN = /\b(?:no|not|never|without)\b/i;
const NEGATION_ES = /\b(?:no|nunca|jamás|sin)\b/i;

export function extractCriticalEntities(text: string): string[] {
  const values = [...text.matchAll(CODE_OR_NUMBER)].map((match) =>
    match[0].replace(",", ".").toUpperCase(),
  );
  if (NEGATION_EN.test(text) || NEGATION_ES.test(text)) values.push("NEGATION");
  return [...new Set(values)].sort();
}

export function compareCriticalEntities(source: string, translated: string): CriticalEntityState {
  const sourceEntities = extractCriticalEntities(source);
  const translatedEntities = extractCriticalEntities(translated);
  const missing = sourceEntities.filter((entity) => !translatedEntities.includes(entity));
  const unexpected = translatedEntities.filter((entity) => !sourceEntities.includes(entity));

  return missing.length || unexpected.length
    ? { kind: "blocked", missing, unexpected }
    : { kind: "valid", entities: sourceEntities };
}

function isUsableEvidence(evidence: Evidence, now: Date, threshold: number): boolean {
  const effectiveAt = new Date(`${evidence.effectiveAt}T00:00:00Z`);
  const expiresAt = evidence.expiresAt
    ? new Date(`${evidence.expiresAt}T23:59:59Z`)
    : null;

  return (
    evidence.status === "active" &&
    evidence.score >= threshold &&
    effectiveAt <= now &&
    (!expiresAt || expiresAt >= now)
  );
}

function buildExtractiveGuidance(evidence: Evidence[]): SupportedGuidance {
  return {
    summary: "Guía respaldada por documentación vigente.",
    steps: evidence.map((item) => ({
      text: item.excerpt,
      sourceDocumentId: item.documentId,
    })),
  };
}

export async function processCustomerUtterance(
  input: CustomerTurnInput,
  gateway: LocalAiGateway,
  evidenceThreshold = DEFAULT_EVIDENCE_THRESHOLD,
): Promise<CustomerTurnResult> {
  const translation = await gateway.translate(input.text, "en", "es");
  const criticalEntityState = compareCriticalEntities(input.text, translation.text);

  if (criticalEntityState.kind === "blocked") {
    return {
      kind: "blocked",
      originalText: input.text,
      translatedText: translation.text,
      translation,
      evidence: [],
      guidance: null,
      criticalEntityState,
    };
  }

  const now = input.now ?? new Date();
  const evidence = (await gateway.search(translation.text, 12))
    .filter((item) => isUsableEvidence(item, now, evidenceThreshold))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  if (evidence.length === 0) {
    return {
      kind: "abstained",
      originalText: input.text,
      translatedText: translation.text,
      translation,
      evidence: [],
      guidance: null,
      criticalEntityState,
      abstentionReason: "No hay evidencia vigente suficiente.",
    };
  }

  return {
    kind: "supported",
    originalText: input.text,
    translatedText: translation.text,
    translation,
    evidence,
    guidance: buildExtractiveGuidance(evidence),
    criticalEntityState,
  };
}

export async function prepareCustomerResponse(
  input: { text: string },
  gateway: LocalAiGateway,
  turnDecision: CustomerTurnResult["kind"] | null,
): Promise<PreparedCustomerResponse> {
  const translation = await gateway.translate(input.text, "es", "en");
  const criticalEntityState = compareCriticalEntities(input.text, translation.text);

  const evidenceState = turnDecision === "supported" ? "supported" : "blocked";
  const blockedReason =
    evidenceState === "blocked"
      ? "Evidence Gate está cerrado. Procese una consulta con evidencia vigente antes de confirmar."
      : undefined;

  return {
    agentText: input.text,
    customerText: translation.text,
    translation,
    criticalEntityState,
    evidenceState,
    blockedReason,
    canConfirm: evidenceState === "supported" && criticalEntityState.kind === "valid",
  };
}
