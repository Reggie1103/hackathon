import { performance } from "node:perf_hooks";

import {
  BERGAMOT_EN_ES,
  BERGAMOT_ES_EN,
  EMBEDDINGGEMMA_300M_Q4_0,
  PARAKEET_UNIFIED_0_6B_Q4_0,
  close,
  embed,
  loadModel,
  ragCloseWorkspace,
  ragDeleteWorkspace,
  ragSaveEmbeddings,
  ragSearch,
  transcribe,
  transcribeStream,
  translate,
  unloadModel,
} from "@qvac/sdk";

import type {
  Evidence,
  AudioTranscriptionResult,
  CustomerAudioTranscriptionStream,
  Language,
  LocalAiGateway,
  TranslationResult,
} from "../shared/contracts.ts";
import { LocalKnowledgeIndex } from "./local-knowledge-index.ts";
import { demoKnowledgeDocuments } from "./demo-knowledge.ts";
import { combineEvidenceRankings } from "./evidence-ranking.ts";

const RAG_WORKSPACE = "qvac-sovereign-agent-v1";
type TranslationDirection = "en-es" | "es-en";

function translationDirection(from: Language, to: Language): TranslationDirection {
  if (from === "en" && to === "es") return "en-es";
  if (from === "es" && to === "en") return "es-en";
  throw new Error(`Dirección de traducción no soportada: ${from}→${to}.`);
}

export class QvacLocalAiGateway implements LocalAiGateway {
  private readonly index = new LocalKnowledgeIndex();
  private readonly modelIds = new Map<string, string>();
  private embeddingModelId: string | null = null;
  private asrModelId: string | null = null;
  private ragInitialization: Promise<void> | null = null;

  private async modelFor(from: Language, to: Language): Promise<string> {
    const direction = translationDirection(from, to);
    const cached = this.modelIds.get(direction);
    if (cached) return cached;

    const modelId = direction === "en-es"
        ? await loadModel({
            modelSrc: BERGAMOT_EN_ES,
            modelConfig: { engine: "Bergamot", from: "en", to: "es" },
          })
        : await loadModel({
            modelSrc: BERGAMOT_ES_EN,
            modelConfig: { engine: "Bergamot", from: "es", to: "en" },
          });
    this.modelIds.set(direction, modelId);
    return modelId;
  }

  private async ensureAsrModel(): Promise<string> {
    if (!this.asrModelId) {
      this.asrModelId = await loadModel({
        modelSrc: PARAKEET_UNIFIED_0_6B_Q4_0,
        modelType: "parakeet-transcription",
      });
    }
    return this.asrModelId;
  }

  async warmup(): Promise<void> {
    await this.modelFor("en", "es");
    await this.modelFor("es", "en");
    await this.ensureRagReady();
    await this.ensureAsrModel();
  }

  async translate(text: string, from: Language, to: Language): Promise<TranslationResult> {
    const modelId = await this.modelFor(from, to);
    const started = performance.now();
    const result = translate({ modelId, text, modelType: "nmtcpp-translation", stream: false });
    const translatedText = await result.text;

    return {
      text: translatedText,
      modelName: from === "en" ? BERGAMOT_EN_ES.name : BERGAMOT_ES_EN.name,
      latencyMs: Math.round(performance.now() - started),
    };
  }

  async transcribeCustomerAudio(wavPath: string): Promise<AudioTranscriptionResult> {
    const asrModelId = await this.ensureAsrModel();
    const started = performance.now();
    const text = await transcribe({ modelId: asrModelId, audioChunk: wavPath });
    return {
      text: text.trim(),
      modelName: PARAKEET_UNIFIED_0_6B_Q4_0.name,
      latencyMs: Math.round(performance.now() - started),
    };
  }

  async createCustomerAudioStream(
    onUpdate: (result: AudioTranscriptionResult) => void,
  ): Promise<CustomerAudioTranscriptionStream> {
    const asrModelId = await this.ensureAsrModel();
    const started = performance.now();
    const session = await transcribeStream({
      modelId: asrModelId,
      parakeetStreamingConfig: {
        chunkMs: 500,
        emitPartials: true,
      },
    });
    let transcript = "";
    const audioChunks: Buffer[] = [];
    const result = (async (): Promise<AudioTranscriptionResult> => {
      try {
        for await (const event of session) {
          if (event.type !== "text" || !event.text) continue;
          transcript += event.text;
          onUpdate({
            text: transcript.trimStart(),
            modelName: PARAKEET_UNIFIED_0_6B_Q4_0.name,
            latencyMs: Math.round(performance.now() - started),
          });
        }
        await session.stats.catch(() => undefined);
        const stableText = audioChunks.length > 0
          ? await transcribe({
              modelId: asrModelId,
              audioChunk: Buffer.concat(audioChunks) as never,
            })
          : transcript;
        return {
          text: stableText.trim(),
          modelName: PARAKEET_UNIFIED_0_6B_Q4_0.name,
          latencyMs: Math.round(performance.now() - started),
        };
      } finally {
        audioChunks.length = 0;
      }
    })();
    result.catch(() => undefined);
    return {
      write: (audio) => {
        audioChunks.push(Buffer.from(audio));
        session.write(audio);
      },
      end: () => session.end(),
      destroy: () => {
        audioChunks.length = 0;
        session.destroy();
      },
      result,
    };
  }

  async search(query: string, limit: number): Promise<Evidence[]> {
    await this.ensureRagReady();
    if (!this.embeddingModelId) return this.index.search(query, limit);

    const results = await ragSearch({
      workspace: RAG_WORKSPACE,
      modelId: this.embeddingModelId,
      query,
      topK: Math.max(limit, 12),
    });
    const documentsById = new Map(
      demoKnowledgeDocuments.map((document) => [document.documentId, document]),
    );

    const semanticEvidence = results
      .flatMap((result): Evidence[] => {
        const document = documentsById.get(result.id);
        return document ? [{ ...document, score: result.score }] : [];
      });
    const lexicalEvidence = this.index.search(query, limit);
    return combineEvidenceRankings(semanticEvidence, lexicalEvidence, limit);
  }

  private async ensureRagReady(): Promise<void> {
    if (this.ragInitialization) return this.ragInitialization;

    this.ragInitialization = (async () => {
      this.embeddingModelId = await loadModel({
        modelSrc: EMBEDDINGGEMMA_300M_Q4_0,
      });
      const texts = demoKnowledgeDocuments.map(
        (document) => `${document.title}\n${document.keywords.join(" ")}\n${document.excerpt}`,
      );
      const { embedding: embeddings } = await embed({
        modelId: this.embeddingModelId,
        text: texts,
      });
      await ragDeleteWorkspace({ workspace: RAG_WORKSPACE }).catch(() => undefined);
      const saved = await ragSaveEmbeddings({
        workspace: RAG_WORKSPACE,
        modelId: this.embeddingModelId,
        documents: demoKnowledgeDocuments.map((document, index) => ({
          id: document.documentId,
          content: texts[index],
          embedding: embeddings[index],
          embeddingModelId: this.embeddingModelId!,
          metadata: {
            version: document.version,
            status: document.status,
            effectiveAt: document.effectiveAt,
            expiresAt: document.expiresAt,
          },
        })),
      });
      const failures = saved.filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        throw new Error(`QVAC RAG rechazó ${failures.length} documentos.`);
      }
    })();

    return this.ragInitialization;
  }

  async dispose(): Promise<void> {
    if (this.ragInitialization) {
      await this.ragInitialization.catch(() => undefined);
      await ragCloseWorkspace({ workspace: RAG_WORKSPACE, deleteOnClose: false }).catch(
        () => undefined,
      );
    }
    for (const modelId of this.modelIds.values()) {
      await unloadModel({ modelId, clearStorage: false });
    }
    if (this.embeddingModelId) {
      await unloadModel({ modelId: this.embeddingModelId, clearStorage: false });
    }
    if (this.asrModelId) {
      await unloadModel({ modelId: this.asrModelId, clearStorage: false });
    }
    this.modelIds.clear();
    this.embeddingModelId = null;
    this.asrModelId = null;
    await close();
  }
}
