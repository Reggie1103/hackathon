import type { Evidence } from "../shared/contracts.ts";
import {
  demoKnowledgeDocuments,
  type DemoKnowledgeDocument,
} from "./demo-knowledge.ts";

const STOP_WORDS = new Set([
  "con", "del", "desde", "el", "ella", "en", "este", "esta", "las", "los", "para", "pero",
  "por", "que", "sin", "sus", "una", "uno", "unos", "unas", "the", "and", "for", "from", "with",
]);

const canonicalizeSpokenCodes = (value: string): string =>
  value
    // Parakeet may return a spoken support code as “E one zero five”.
    // Keep the canonical token so an exact incident code is never diluted by
    // otherwise generic customer wording.
    .replace(/\b([a-z])\s+(zero|one|two|three|four|five|six|seven|eight|nine)\s+(zero|one|two|three|four|five|six|seven|eight|nine)\s+(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi, (_, prefix: string, a: string, b: string, c: string) => {
      const digits: Record<string, string> = {
        zero: "0", one: "1", two: "2", three: "3", four: "4",
        five: "5", six: "6", seven: "7", eight: "8", nine: "9",
      };
      return `${prefix}${digits[a.toLowerCase()]}${digits[b.toLowerCase()]}${digits[c.toLowerCase()]}`;
    })
    .replace(/\b([a-z])\s+(\d{2,})\b/gi, "$1$2");

const normalize = (value: string): string[] =>
  canonicalizeSpokenCodes(value)
    .replace(/\bwi[\s-]?fi\b/gi, "wifi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

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
        const exactSupportCodes = [...queryTokens].filter(
          (token) => /^[a-z]{1,6}\d{2,}$/.test(token) && searchable.includes(token),
        );
        const titleTokens = normalize(document.title);
        const codeInTitle = exactSupportCodes.some((code) => titleTokens.includes(code));
        const score = codeInTitle
          ? 0.99
          : exactSupportCodes.length > 0
            ? 0.95
          : Math.min(
          0.99,
          uniqueMatches === 0 ? 0 : uniqueMatches === 1 ? 0.45 : 0.48 + uniqueMatches * 0.1,
          );
        return { ...document, score } satisfies Evidence;
      })
      .filter((document) => document.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }
}
