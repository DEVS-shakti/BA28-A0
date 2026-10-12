import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;

export function hashClassAccessCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(code.trim(), salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyClassAccessCode(code: string, storedHash: string): boolean {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex || expectedHex.length !== KEY_LENGTH * 2) return false;

  try {
    const actual = scryptSync(code.trim(), salt, KEY_LENGTH);
    const expected = Buffer.from(expectedHex, "hex");
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
