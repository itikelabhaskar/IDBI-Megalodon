// GSTIN generation and validation with a correct checksum digit.
//
// A GSTIN is 15 characters:
//   [0-1]  state code (2 digits)
//   [2-11] PAN (5 letters + 4 digits + 1 letter)
//   [12]   entity / registration number (1 char)
//   [13]   default letter 'Z'
//   [14]   checksum digit (computed over the first 14 chars)
//
// Generating structurally valid, checksum-correct GSTINs is what stops the
// synthetic data from looking fake under a banker's eye.

import type { Rng } from "./rng";

const GST_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIGITS = "0123456789".split("");

/** Compute the GSTIN checksum character for the first 14 characters. */
export function gstinCheckDigit(first14: string): string {
  const mod = GST_CHARS.length; // 36
  let factor = 2;
  let sum = 0;
  for (let i = first14.length - 1; i >= 0; i--) {
    const code = GST_CHARS.indexOf(first14[i]);
    if (code < 0) throw new Error(`Invalid GSTIN character: ${first14[i]}`);
    let digit = factor * code;
    factor = factor === 2 ? 1 : 2;
    digit = Math.floor(digit / mod) + (digit % mod);
    sum += digit;
  }
  const check = (mod - (sum % mod)) % mod;
  return GST_CHARS[check];
}

/** Validate the structure and checksum of a GSTIN. */
export function isValidGstin(gstin: string): boolean {
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(gstin)) return false;
  return gstinCheckDigit(gstin.slice(0, 14)) === gstin[14];
}

/** Build a structurally valid, checksum-correct GSTIN for a given state code. */
export function makeGstin(stateCode: string, rng: Rng): string {
  const letters = (n: number) => Array.from({ length: n }, () => rng.pick(LETTERS)).join("");
  const digits = (n: number) => Array.from({ length: n }, () => rng.pick(DIGITS)).join("");
  const pan = letters(5) + digits(4) + letters(1); // 10-char PAN core
  const entity = digits(1); // entity / registration number
  const first14 = `${stateCode}${pan}${entity}Z`;
  return first14 + gstinCheckDigit(first14);
}
