const MAX_TEXT_LENGTH = 4_000;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export function validateTextInput(value: unknown): { text: string } {
  if (!value || typeof value !== "object" || !("text" in value)) {
    throw new TypeError("La entrada debe contener texto.");
  }
  const text = (value as { text?: unknown }).text;
  if (typeof text !== "string") throw new TypeError("El texto debe ser una cadena.");
  const normalized = text.trim();
  if (!normalized) throw new TypeError("El texto no puede estar vacío.");
  if (normalized.length > MAX_TEXT_LENGTH) {
    throw new RangeError(`El texto supera ${MAX_TEXT_LENGTH} caracteres.`);
  }
  return { text: normalized };
}

export function validateAudioInput(value: unknown): ArrayBuffer {
  if (!(value instanceof ArrayBuffer)) throw new TypeError("El audio debe ser un ArrayBuffer.");
  if (value.byteLength === 0) throw new RangeError("El audio está vacío.");
  if (value.byteLength > MAX_AUDIO_BYTES) {
    throw new RangeError(`El audio supera ${MAX_AUDIO_BYTES} bytes.`);
  }
  return value;
}
