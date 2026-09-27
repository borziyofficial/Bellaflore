/** Decode legacy JSON strings as well as native JSONB values. */
export function decodeDraftJson<T>(value: unknown, fallback: T): unknown {
  let decoded = value;
  for (let attempt = 0; attempt < 2 && typeof decoded === "string"; attempt += 1) {
    try {
      decoded = JSON.parse(decoded);
    } catch {
      return fallback;
    }
  }
  return decoded ?? fallback;
}
