import { performance } from "node:perf_hooks";

import type {
  Evidence,
  AudioTranscriptionResult,
  Language,
  LocalAiGateway,
  TranslationResult,
} from "../shared/contracts.js";
import { LocalKnowledgeIndex } from "./local-knowledge-index.js";

const translations: Record<string, string> = {
  "My internet disconnects every ten minutes. The modem light turns red and then it reconnects by itself.":
    "Mi internet se desconecta cada diez minutos. La luz del módem se pone roja y después vuelve a conectarse sola.",
  "My modem shows error E105 and the red light does not blink.":
    "Mi módem muestra el error E105 y la luz roja no parpadea.",
  "¿El indicador rojo permanece encendido o parpadea?":
    "Does the red indicator stay on or blink?",
  "Confirme la luz WAN. Si E105 continúa después del reinicio, escale con el código exacto.":
    "Confirm the WAN light. If E105 continues after restarting, escalate with the exact code.",
  "Confirme la luz WAN. Si el código E105 continúa después de reiniciar el módem, transfiera el caso a soporte técnico.":
    "Confirm the WAN light. If code E105 continues after restarting the modem, transfer the case to technical support.",
};

export class DemoLocalAiGateway implements LocalAiGateway {
  private readonly index = new LocalKnowledgeIndex();

  async translate(text: string, _from: Language, _to: Language): Promise<TranslationResult> {
    const started = performance.now();
    return {
      text: translations[text] ?? text,
      modelName: "DEMO_DETERMINISTIC_NOT_QVAC",
      latencyMs: Math.max(1, Math.round(performance.now() - started)),
    };
  }

  async search(query: string, limit: number): Promise<Evidence[]> {
    return this.index.search(query, limit);
  }

  async transcribeCustomerAudio(): Promise<AudioTranscriptionResult> {
    return {
      text: "My modem shows error E105 and the red light does not blink.",
      modelName: "DEMO_DETERMINISTIC_NOT_QVAC",
      latencyMs: 1,
    };
  }
}
