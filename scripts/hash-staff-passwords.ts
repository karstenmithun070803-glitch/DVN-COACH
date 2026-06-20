/**
 * One-time utility: hash plaintext staff passwords for STAFF_CREDENTIALS.
 *
 * Usage:
 *   1. Ensure your .env.local has the current STAFF_CREDENTIALS with plaintext passwords.
 *   2. Run: npx tsx scripts/hash-staff-passwords.ts
 *   3. Copy the printed JSON into your .env.local as the new STAFF_CREDENTIALS value.
 *   4. Restart the dev server. Staff can still log in — the login route accepts both
 *      plaintext (legacy) and bcrypt hashes automatically.
 *   5. Once confirmed working, this transition is complete. Plaintext support can
 *      be removed from the login route after all deployments are updated.
 *
 * IMPORTANT: Run this locally only. Never commit output containing passwords.
 */

import { hashSync } from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

const SALT_ROUNDS = 10;

function loadEnv(): Record<string, string> {
  const envPath = resolve(process.cwd(), ".env.local");
  const env: Record<string, string> = {};
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  } catch {
    console.error("Could not read .env.local — make sure you run this from the project root.");
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
const rawCredentials = env["STAFF_CREDENTIALS"];

if (!rawCredentials) {
  console.error("STAFF_CREDENTIALS not found in .env.local");
  process.exit(1);
}

let staffList: { u: string; p: string }[];
try {
  staffList = JSON.parse(rawCredentials);
} catch {
  console.error("STAFF_CREDENTIALS is not valid JSON");
  process.exit(1);
}

console.log("\nHashing staff passwords...\n");

const hashed = staffList.map(({ u, p }) => {
  const alreadyHashed = p.startsWith("$2b$") || p.startsWith("$2a$");
  if (alreadyHashed) {
    console.log(`  ${u}: already hashed — skipping`);
    return { u, p };
  }
  const hash = hashSync(p, SALT_ROUNDS);
  console.log(`  ${u}: hashed`);
  return { u, p: hash };
});

console.log("\n=== PASTE THIS INTO .env.local as STAFF_CREDENTIALS ===\n");
console.log(`STAFF_CREDENTIALS='${JSON.stringify(hashed)}'`);
console.log("\n=======================================================\n");
