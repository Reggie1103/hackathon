const PCM_16_MAX = 0x7fff;
const PCM_16_MIN = 0x8000;

export function resampleToPcm16(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate = 16_000,
): ArrayBuffer {
  if (inputSampleRate <= 0 || outputSampleRate <= 0) {
    throw new RangeError("Las frecuencias de audio deben ser positivas.");
  }
  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.max(1, Math.floor(input.length / ratio));
  const pcm = new Int16Array(outputLength);

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const start = Math.floor(outputIndex * ratio);
    const end = Math.max(start + 1, Math.min(input.length, Math.floor((outputIndex + 1) * ratio)));
    let sum = 0;
    for (let inputIndex = start; inputIndex < end; inputIndex += 1) sum += input[inputIndex];
    const sample = Math.max(-1, Math.min(1, sum / (end - start)));
    pcm[outputIndex] = sample < 0
      ? Math.round(sample * PCM_16_MIN)
      : Math.round(sample * PCM_16_MAX);
  }

  return pcm.buffer;
}
