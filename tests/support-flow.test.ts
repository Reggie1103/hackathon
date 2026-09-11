import { describe, expect, it } from "vitest";

import {
  prepareCustomerResponse,
  processCustomerUtterance,
} from "../src/application/support-flow.js";
import type {
  Evidence,
  LocalAiGateway,
  TranslationResult,
} from "../src/shared/contracts.js";

class StubLocalAiGateway implements LocalAiGateway {
  constructor(
    private readonly translations: Record<string, string>,
    private readonly evidence: Evidence[],
  ) {}

  async translate(text: string): Promise<TranslationResult> {
    return {
      text: this.translations[text] ?? text,
      modelName: "stub-translation",
      latencyMs: 1,
    };
  }

  async search(): Promise<Evidence[]> {
    return this.evidence;
  }
}

const activeEvidence: Evidence = {
  documentId: "NET-001",
  title: "Interrupciones periódicas y luz roja",
  version: "2.1",
  effectiveAt: "2026-01-01",
  expiresAt: "2027-01-01",
  status: "active",
  score: 0.91,
  excerpt: "Confirme si la luz roja permanece encendida o parpadea.",
};

describe("customer support flow", () => {
  it("returns Supported Guidance with the original, translation and active Evidence", async () => {
    const original = "My modem shows error E105 and the red light does not blink.";
    const translated = "Mi módem muestra el error E105 y la luz roja no parpadea.";
    const gateway = new StubLocalAiGateway({ [original]: translated }, [activeEvidence]);

    const result = await processCustomerUtterance(
      { text: original, now: new Date("2026-09-10T12:00:00Z") },
      gateway,
    );

    expect(result.kind).toBe("supported");
    expect(result.originalText).toBe(original);
    expect(result.translatedText).toBe(translated);
    expect(result.evidence).toEqual([activeEvidence]);
    expect(result.guidance?.steps[0]?.sourceDocumentId).toBe("NET-001");
  });

  it("returns Abstention when the only matching document is expired", async () => {
    const gateway = new StubLocalAiGateway({}, [
      { ...activeEvidence, status: "expired", expiresAt: "2025-01-01" },
    ]);

    const result = await processCustomerUtterance(
      { text: "Unknown issue", now: new Date("2026-09-10T12:00:00Z") },
      gateway,
    );

    expect(result.kind).toBe("abstained");
    expect(result.abstentionReason).toBe("No hay evidencia vigente suficiente.");
    expect(result.evidence).toEqual([]);
  });

  it("blocks an agent response when TranslatePsy changes a Critical Entity", async () => {
    const spanish = "Indique al técnico que aparece el código E105.";
    const gateway = new StubLocalAiGateway(
      { [spanish]: "Tell the technician that code E150 appears." },
      [],
    );

    const result = await prepareCustomerResponse({ text: spanish }, gateway, "supported");

    expect(result.canConfirm).toBe(false);
    expect(result.criticalEntityState).toEqual({
      kind: "blocked",
      missing: ["E105"],
      unexpected: ["E150"],
    });
  });

  it("allows human confirmation when Critical Entities are preserved", async () => {
    const spanish = "El código E105 no debe cambiar.";
    const gateway = new StubLocalAiGateway(
      { [spanish]: "Code E105 should not change." },
      [],
    );

    const result = await prepareCustomerResponse({ text: spanish }, gateway, "supported");

    expect(result.canConfirm).toBe(true);
    expect(result.criticalEntityState.kind).toBe("valid");
  });

  it("blocks confirmation when Evidence Gate did not support the customer turn", async () => {
    const gateway = new StubLocalAiGateway({}, []);
    const result = await prepareCustomerResponse(
      { text: "Confirme la luz WAN." },
      gateway,
      "abstained",
    );

    expect(result.criticalEntityState.kind).toBe("valid");
    expect(result.evidenceState).toBe("blocked");
    expect(result.canConfirm).toBe(false);
  });
});
