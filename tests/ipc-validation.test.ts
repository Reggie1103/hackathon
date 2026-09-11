import { describe, expect, it } from "vitest";

import {
  validateAudioInput,
  validateAudioStreamChunkInput,
  validateStreamId,
  validateTextInput,
} from "../src/main/ipc-validation.js";

describe("IPC validation boundary", () => {
  it("normalizes acceptable text and rejects missing, empty, and oversized values", () => {
    expect(validateTextInput({ text: "  hello  " })).toEqual({ text: "hello" });
    expect(() => validateTextInput({ text: "" })).toThrow("vacío");
    expect(() => validateTextInput({ text: "a".repeat(4_001) })).toThrow("supera");
    expect(() => validateTextInput("hello")).toThrow("entrada");
  });

  it("accepts bounded binary audio and rejects invalid payloads", () => {
    expect(validateAudioInput(new ArrayBuffer(32)).byteLength).toBe(32);
    expect(() => validateAudioInput(new ArrayBuffer(0))).toThrow("vacío");
    expect(() => validateAudioInput(new Uint8Array(5))).toThrow("ArrayBuffer");
  });

  it("accepts ordered PCM stream chunks and rejects malformed chunks", () => {
    const audio = new ArrayBuffer(3200);
    expect(validateAudioStreamChunkInput({ streamId: "stream-1", audio })).toEqual({
      streamId: "stream-1",
      audio,
    });
    expect(() => validateStreamId(42)).toThrow("stream");
    expect(() =>
      validateAudioStreamChunkInput({ streamId: "stream-1", audio: new ArrayBuffer(3) }),
    ).toThrow("muestras completas");
    expect(() => validateAudioStreamChunkInput({ streamId: "stream-1" })).toThrow(
      "ArrayBuffer",
    );
  });
});
