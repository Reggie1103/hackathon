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

export interface AudioStreamStarted {
  streamId: string;
  sampleRate: 16_000;
}

export interface AudioTranscriptionUpdate extends AudioTranscriptionResult {
  streamId: string;
  isFinal: boolean;
}

export interface CustomerAudioTranscriptionStream {
  write(audio: Uint8Array): void;
  end(): void;
  destroy(): void;
  result: Promise<AudioTranscriptionResult>;
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
  customerDraft: string;
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
  evidenceState: "supported" | "blocked";
  blockedReason?: string;
  canConfirm: boolean;
}

export interface RuntimeInfo {
  mode: "qvac" | "demo";
  status: "loading" | "ready" | "error";
  disclosure: string;
  error?: string;
}

export interface SovereignAgentApi {
  startCustomerAudioStream(): Promise<AudioStreamStarted>;
  appendCustomerAudioStream(input: { streamId: string; audio: ArrayBuffer }): Promise<void>;
  finishCustomerAudioStream(streamId: string): Promise<AudioTranscriptionResult>;
  cancelCustomerAudioStream(streamId: string): Promise<void>;
  onAudioTranscriptionUpdate(
    listener: (update: AudioTranscriptionUpdate) => void,
  ): () => void;
  processCustomerUtterance(input: { text: string }): Promise<CustomerTurnResult>;
  prepareCustomerResponse(input: { text: string }): Promise<PreparedCustomerResponse>;
  runtimeInfo(): Promise<RuntimeInfo>;
  closeSession(): Promise<{ clearedAt: string; retained: string[] }>;
}
