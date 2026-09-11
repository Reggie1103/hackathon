import { describe, expect, it } from "vitest";

import { LocalKnowledgeIndex } from "../src/infrastructure/local-knowledge-index.js";

describe("local lexical evidence", () => {
  it("finds the Wi-Fi credentials procedure for a short translated request", () => {
    const results = new LocalKnowledgeIndex().search(
      "Hola, olvidé mi contraseña Wi-Fi. ¿Puedes ayudarme por favor?",
      3,
    );

    expect(results[0]?.documentId).toBe("NET-005");
    expect(results[0]?.score).toBeGreaterThanOrEqual(0.5);
    expect(results.filter((item) => item.score >= 0.5)).toHaveLength(1);
  });

  it("does not treat a single generic term as sufficient evidence", () => {
    const results = new LocalKnowledgeIndex().search("Tengo un problema con el módem.", 5);
    expect(results.every((item) => item.score < 0.5)).toBe(true);
  });
});
