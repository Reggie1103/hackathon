import type { Evidence } from "../shared/contracts.ts";
import {
  demoKnowledgeDocuments,
  type DemoKnowledgeDocument,
} from "./demo-knowledge.ts";

const normalize = (value: string): string[] =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

export class LocalKnowledgeIndex {
  private readonly documents: DemoKnowledgeDocument[];

  constructor(documents: DemoKnowledgeDocument[] = demoKnowledgeDocuments) {
    this.documents = documents;
  }

  search(query: string, limit: number): Evidence[] {
    const queryTokens = new Set(normalize(query));

    return this.documents
      .map((document) => {
        const searchable = normalize(`${document.title} ${document.keywords.join(" ")} ${document.excerpt}`);
        const matches = searchable.filter((token) => queryTokens.has(token));
        const uniqueMatches = new Set(matches).size;
        const score = Math.min(0.99, uniqueMatches === 0 ? 0 : 0.58 + uniqueMatches * 0.1);
        return { ...document, score } satisfies Evidence;
      })
      .filter((document) => document.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }
}
