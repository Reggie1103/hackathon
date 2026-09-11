import type { Evidence } from "../shared/contracts.ts";

export function combineEvidenceRankings(
  semantic: Evidence[],
  lexical: Evidence[],
  limit: number,
): Evidence[] {
  const combined = new Map<string, Evidence>();
  for (const evidence of [...semantic, ...lexical]) {
    const current = combined.get(evidence.documentId);
    if (!current || evidence.score > current.score) combined.set(evidence.documentId, evidence);
  }
  return [...combined.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
