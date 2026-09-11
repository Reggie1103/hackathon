import { describe, expect, it } from "vitest";

import { evaluateEnvironment, type EnvironmentFacts } from "../scripts/doctor.js";

const readyEnvironment: EnvironmentFacts = {
  nodeVersion: "22.17.0",
  npmVersion: "10.9.2",
  freeDiskGb: 77.8,
  vulkanVersion: "1.4.325",
  ffmpegVersion: null,
};

describe("QVAC environment diagnosis", () => {
  it("accepts the mandatory QVAC requirements while flagging microphone readiness", () => {
    const diagnosis = evaluateEnvironment(readyEnvironment);

    expect(diagnosis.readyForTextInference).toBe(true);
    expect(diagnosis.readyForMicrophone).toBe(false);
    expect(diagnosis.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Node.js", status: "pass" }),
        expect.objectContaining({ name: "Vulkan", status: "pass" }),
        expect.objectContaining({ name: "ffmpeg", status: "optional-missing" }),
      ]),
    );
  });

  it("rejects text inference when Vulkan is below 1.4", () => {
    const diagnosis = evaluateEnvironment({
      ...readyEnvironment,
      vulkanVersion: "1.3.280",
    });

    expect(diagnosis.readyForTextInference).toBe(false);
    expect(diagnosis.checks).toContainEqual(
      expect.objectContaining({ name: "Vulkan", status: "fail" }),
    );
  });
});
