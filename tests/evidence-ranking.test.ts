import { describe, expect, it } from "vitest";

import { combineEvidenceRankings } from "../src/infrastructure/evidence-ranking.js";
import type { Evidence } from "../src/shared/contracts.js";

const evidence = (documentId: string, score: number): Evidence => ({
  documentId,
  score,
  title: documentId,
  version: "1.0",
  effectiveAt: "2026-01-01",
  expiresAt: null,
  status: "active",
  excerpt: documentId,
});

describe("hybrid evidence ranking", () => {
  it("promotes an exact business-term match above a weak semantic result", () => {
    const result = combineEvidenceRankings(
      [evidence("NET-002", 0.5), evidence("NET-005", 0.46)],
      [evidence("NET-005", 0.78)],
      3,
    );

    expect(result.map(({ documentId, score }) => ({ documentId, score }))).toEqual([
      { documentId: "NET-005", score: 0.78 },
      { documentId: "NET-002", score: 0.5 },
    ]);
  });
});
