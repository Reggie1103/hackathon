import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import electronPath from "electron";

const capturePath = resolve("artifacts/ui/main-screen.png");
mkdirSync(dirname(capturePath), { recursive: true });

const result = spawnSync(electronPath, ["."], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    QVAC_RUNTIME_MODE: "demo",
    QVAC_CAPTURE_PATH: capturePath,
  },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
