import { execFileSync } from "node:child_process";
import { statfsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

export type CheckStatus = "pass" | "fail" | "optional-missing";

export interface EnvironmentFacts {
  nodeVersion: string;
  npmVersion: string;
  freeDiskGb: number;
  vulkanVersion: string | null;
  ffmpegVersion: string | null;
}

export interface EnvironmentCheck {
  name: string;
  status: CheckStatus;
  actual: string;
  requirement: string;
}

export interface EnvironmentDiagnosis {
  readyForTextInference: boolean;
  readyForMicrophone: boolean;
  checks: EnvironmentCheck[];
}

const versionParts = (version: string): number[] =>
  version
    .replace(/^v/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

const versionAtLeast = (actual: string, minimum: string): boolean => {
  const actualParts = versionParts(actual);
  const minimumParts = versionParts(minimum);

  for (let index = 0; index < Math.max(actualParts.length, minimumParts.length); index += 1) {
    const difference = (actualParts[index] ?? 0) - (minimumParts[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }

  return true;
};

export function evaluateEnvironment(facts: EnvironmentFacts): EnvironmentDiagnosis {
  const checks: EnvironmentCheck[] = [
    {
      name: "Node.js",
      status: versionAtLeast(facts.nodeVersion, "22.17.0") ? "pass" : "fail",
      actual: facts.nodeVersion,
      requirement: ">=22.17.0",
    },
    {
      name: "npm",
      status: versionAtLeast(facts.npmVersion, "10.9.2") ? "pass" : "fail",
      actual: facts.npmVersion,
      requirement: ">=10.9.2",
    },
    {
      name: "Free disk",
      status: facts.freeDiskGb >= 5 ? "pass" : "fail",
      actual: `${facts.freeDiskGb.toFixed(1)} GB`,
      requirement: ">=5 GB",
    },
    {
      name: "Vulkan",
      status:
        facts.vulkanVersion && versionAtLeast(facts.vulkanVersion, "1.4") ? "pass" : "fail",
      actual: facts.vulkanVersion ?? "not found",
      requirement: ">=1.4",
    },
    {
      name: "ffmpeg",
      status: facts.ffmpegVersion ? "pass" : "optional-missing",
      actual: facts.ffmpegVersion ?? "not found",
      requirement: "required for microphone/audio; optional for text inference",
    },
  ];

  const mandatoryReady = checks
    .filter((check) => check.name !== "ffmpeg")
    .every((check) => check.status === "pass");

  return {
    readyForTextInference: mandatoryReady,
    readyForMicrophone:
      mandatoryReady && checks.find((check) => check.name === "ffmpeg")?.status === "pass",
    checks,
  };
}

const run = (command: string, args: string[] = []): string | null => {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

export function collectEnvironment(): EnvironmentFacts {
  const npmVersion =
    (process.platform === "win32"
      ? run("cmd.exe", ["/d", "/s", "/c", "npm --version"])
      : run("npm", ["--version"])) ?? "0.0.0";
  const vulkanOutput = run("vulkaninfo", ["--summary"]);
  const vulkanVersion = vulkanOutput?.match(/Vulkan Instance Version:\s*([\d.]+)/)?.[1] ?? null;
  const ffmpegOutput = run("ffmpeg", ["-version"]) ??
    (ffmpegPath ? run(ffmpegPath, ["-version"]) : null);
  const ffmpegVersion = ffmpegOutput?.match(/^ffmpeg version\s+([^\s]+)/)?.[1] ?? null;
  const disk = statfsSync(process.cwd());
  const freeDiskGb = (Number(disk.bavail) * Number(disk.bsize)) / 1024 ** 3;

  return {
    nodeVersion: process.versions.node,
    npmVersion,
    freeDiskGb,
    vulkanVersion,
    ffmpegVersion,
  };
}

function printDiagnosis(diagnosis: EnvironmentDiagnosis): void {
  for (const check of diagnosis.checks) {
    const marker = check.status === "pass" ? "PASS" : check.status === "fail" ? "FAIL" : "INFO";
    console.log(`[${marker}] ${check.name}: ${check.actual} (${check.requirement})`);
  }

  console.log(
    `\nText inference: ${diagnosis.readyForTextInference ? "READY" : "BLOCKED"}`,
  );
  console.log(`Microphone flow: ${diagnosis.readyForMicrophone ? "READY" : "NEEDS FFMPEG"}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const diagnosis = evaluateEnvironment(collectEnvironment());
  printDiagnosis(diagnosis);
  process.exitCode = diagnosis.readyForTextInference ? 0 : 1;
}
