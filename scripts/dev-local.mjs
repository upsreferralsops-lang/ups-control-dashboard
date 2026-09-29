import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDevSlot } from "./dev-lock.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CORE = "http://localhost:8090";

const nextArgs = process.argv.slice(2);

if (!ensureDevSlot(root, { replace: true })) {
  process.exit(1);
}

function loadDotEnv(filename) {
  const env = { ...process.env };
  const path = resolve(root, filename);
  if (!existsSync(path)) return env;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) env[key] = value;
  }
  return env;
}

const envPath = resolve(root, ".env.local");
const env = loadDotEnv(".env.local");
if (!env.CORE_API_URL) {
  env.CORE_API_URL = DEFAULT_CORE;
}

const coreUrl = env.CORE_API_URL.trim().replace(/\/$/, "");

console.log("");
console.log("  Panel en modo LOCAL");
console.log(`  CORE_API_URL → ${coreUrl}`);
if (!existsSync(envPath)) {
  console.log("  (tip: copiá .env.example a .env.local para fijar la URL)");
}
console.log("  Para AWS: pnpm dev:aws");
console.log("");

const nextBin = resolve(root, "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", ...nextArgs], {
  stdio: "inherit",
  env,
  cwd: root,
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
