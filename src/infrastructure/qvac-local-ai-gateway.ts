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
  translate,
  unloadModel,
} from "@qvac/sdk";

import type {
  Evidence,
  AudioTranscriptionResult,
  Language,
  LocalAiGateway,
  TranslationResult,
} from "../shared/contracts.ts";
import { LocalKnowledgeIndex } from "./local-knowledge-index.ts";
import { demoKnowledgeDocuments } from "./demo-knowledge.ts";

const RAG_WORKSPACE = "qvac-sovereign-agent-v1";

export class QvacLocalAiGateway implements LocalAiGateway {
  private readonly index = new LocalKnowledgeIndex();
  private readonly modelIds = new Map<string, string>();
  private embeddingModelId: string | null = null;
  private asrModelId: string | null = null;
  private ragInitialization: Promise<void> | null = null;

  private async modelFor(from: Language, to: Language): Promise<string> {
    const direction = `${from}-${to}`;
    const cached = this.modelIds.get(direction);
    if (cached) return cached;

    const modelId =
      direction === "en-es"
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
    if (!this.asrModelId) {
      this.asrModelId = await loadModel({
        modelSrc: PARAKEET_UNIFIED_0_6B_Q4_0,
        modelType: "parakeet-transcription",
      });
    }
    const started = performance.now();
    const text = await transcribe({ modelId: this.asrModelId, audioChunk: wavPath });
    return {
      text: text.trim(),
      modelName: PARAKEET_UNIFIED_0_6B_Q4_0.name,
      latencyMs: Math.round(performance.now() - started),
    };
  }

  async search(query: string, limit: number): Promise<Evidence[]> {
    await this.ensureRagReady();
    if (!this.embeddingModelId) return this.index.search(query, limit);

    const results = await ragSearch({
      workspace: RAG_WORKSPACE,
      modelId: this.embeddingModelId,
      query,
      topK: Math.max(limit, 3),
    });
    const documentsById = new Map(
      demoKnowledgeDocuments.map((document) => [document.documentId, document]),
    );

    return results
      .flatMap((result): Evidence[] => {
        const document = documentsById.get(result.id);
        return document ? [{ ...document, score: result.score }] : [];
      })
      .slice(0, limit);
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
