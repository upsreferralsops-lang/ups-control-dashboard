import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDevSlot } from "./dev-lock.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const nextArgs = process.argv.slice(2);

if (!ensureDevSlot(root, { replace: true })) {
  process.exit(1);
}

function loadDotEnv(filename) {
  const env = { ...process.env };
  const path = resolve(root, filename);
  if (!existsSync(path)) {
    console.error(`No se encontró ${filename}. Creá el archivo o usá pnpm dev (local).`);
    process.exit(1);
  }
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

const env = loadDotEnv(".env.aws");
const coreUrl = (env.CORE_API_URL ?? "").trim().replace(/\/$/, "");

console.log("");
console.log("  Panel en modo AWS (core remoto)");
console.log(`  CORE_API_URL → ${coreUrl || "(sin definir en .env.aws)"}`);
console.log("  Para local: pnpm dev");
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
