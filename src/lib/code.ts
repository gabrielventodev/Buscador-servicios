import { randomBytes } from "node:crypto";

// Sin letras ni números que se confundan (0/O, 1/l/I).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

export function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function isValidCode(code: string): boolean {
  return /^[23456789abcdefghijkmnpqrstuvwxyz]{8}$/.test(code);
}
