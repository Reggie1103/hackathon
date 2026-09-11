import { describe, expect, it } from "vitest";

import { resampleToPcm16 } from "../src/shared/audio-stream.js";

describe("microphone PCM conversion", () => {
  it("downsamples mono audio to 16 kHz signed PCM and clips the signal", () => {
    const input = new Float32Array(48_000).fill(0);
    input.fill(2, 0, 3);
    input.fill(-2, 3, 6);

    const output = new Int16Array(resampleToPcm16(input, 48_000));

    expect(output).toHaveLength(16_000);
    expect(output[0]).toBe(32_767);
    expect(output[1]).toBe(-32_768);
  });

  it("rejects invalid sample rates", () => {
    expect(() => resampleToPcm16(new Float32Array(10), 0)).toThrow("positivas");
  });
});
