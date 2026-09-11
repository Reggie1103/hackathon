export type Language = "en" | "es";

export interface TranslationResult {
  text: string;
  modelName: string;
  latencyMs: number;
}

export interface AudioTranscriptionResult {
  text: string;
  modelName: string;
  latencyMs: number;
}

export interface Evidence {
  documentId: string;
  title: string;
  version: string;
  effectiveAt: string;
  expiresAt: string | null;
  status: "active" | "expired" | "draft";
  score: number;
  excerpt: string;
}

export interface LocalAiGateway {
  translate(text: string, from: Language, to: Language): Promise<TranslationResult>;
  search(query: string, limit: number): Promise<Evidence[]>;
}

export interface GuidanceStep {
  text: string;
  sourceDocumentId: string;
}

export interface SupportedGuidance {
  summary: string;
  steps: GuidanceStep[];
}

export type CriticalEntityState =
  | { kind: "valid"; entities: string[] }
  | { kind: "blocked"; missing: string[]; unexpected: string[] };

export interface CustomerTurnInput {
  text: string;
  now?: Date;
}

export interface CustomerTurnResult {
  kind: "supported" | "abstained" | "blocked";
  originalText: string;
  translatedText: string;
  translation: TranslationResult;
  evidence: Evidence[];
  guidance: SupportedGuidance | null;
  criticalEntityState: CriticalEntityState;
  abstentionReason?: string;
}

export interface PreparedCustomerResponse {
  agentText: string;
  customerText: string;
  translation: TranslationResult;
  criticalEntityState: CriticalEntityState;
  canConfirm: boolean;
}

export interface SovereignAgentApi {
  transcribeCustomerAudio(audio: ArrayBuffer): Promise<AudioTranscriptionResult>;
  processCustomerUtterance(input: { text: string }): Promise<CustomerTurnResult>;
  prepareCustomerResponse(input: { text: string }): Promise<PreparedCustomerResponse>;
  runtimeInfo(): Promise<{ mode: "qvac" | "demo"; disclosure: string }>;
  closeSession(): Promise<{ clearedAt: string; retained: string[] }>;
}
