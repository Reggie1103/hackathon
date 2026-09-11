import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function appendJsonlArtifact(path: string, record: Record<string, unknown>): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(record)}\n`, "utf8");
}
