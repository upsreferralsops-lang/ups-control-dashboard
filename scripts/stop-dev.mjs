import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearStaleDevLock,
  devLockPath,
  isProcessRunning,
  readDevLock,
  stopProcess,
} from "./dev-lock.mjs";
import { unlinkSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const stale = clearStaleDevLock(root);
const lock = stale ?? readDevLock(root);

if (!lock?.pid) {
  console.log("No hay servidor `next dev` registrado en .next/dev/lock.");
  process.exit(0);
}

if (!isProcessRunning(lock.pid)) {
  try {
    unlinkSync(devLockPath(root));
  } catch {
    /* ignore */
  }
  console.log("Lock obsoleto eliminado; no había proceso activo.");
  process.exit(0);
}

stopProcess(lock.pid);
try {
  unlinkSync(devLockPath(root));
} catch {
  /* ignore */
}
console.log(`Servidor dev detenido (PID ${lock.pid}).`);
