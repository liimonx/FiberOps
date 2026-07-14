/**
 * Lightweight reversible seal for mock/in-memory credential storage.
 * Production backends must use real envelope encryption (see database-schema.md).
 * Sealed values are never returned from public APIs.
 */

const SEAL_PREFIX = "enc:v1:";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}

function xorWithKey(bytes: Uint8Array, key: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(key);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i]! ^ keyBytes[i % keyBytes.length]!;
  }
  return out;
}

function vaultKey(): string {
  return (
    process.env.FIBEROPS_MOCK_SECRET_KEY ||
    process.env.NEXT_PUBLIC_MOCK_SECRET_KEY ||
    "fiberops-mock-vault-key"
  );
}

export function isSealedSecret(value: string | undefined | null): boolean {
  return Boolean(value && value.startsWith(SEAL_PREFIX));
}

export function sealSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (isSealedSecret(plaintext)) return plaintext;
  const encoded = new TextEncoder().encode(plaintext);
  return `${SEAL_PREFIX}${toBase64Url(xorWithKey(encoded, vaultKey()))}`;
}

export function unsealSecret(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (!isSealedSecret(value)) return value;
  const payload = value.slice(SEAL_PREFIX.length);
  try {
    const decoded = xorWithKey(fromBase64Url(payload), vaultKey());
    return new TextDecoder().decode(decoded);
  } catch {
    return undefined;
  }
}
