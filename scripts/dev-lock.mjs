import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

export function devLockPath(root) {
  return resolve(root, ".next/dev/lock");
}

export function readDevLock(root) {
  const lockPath = devLockPath(root);
  if (!existsSync(lockPath)) return null;
  try {
    return JSON.parse(readFileSync(lockPath, "utf8"));
  } catch {
    unlinkSync(lockPath);
    return null;
  }
}

export function isProcessRunning(pid) {
  if (!pid || !Number.isFinite(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function stopProcess(pid) {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/F", "/T"], { stdio: "ignore" });
  } else {
    spawnSync("kill", ["-9", String(pid)], { stdio: "ignore" });
  }
}

/** Quita el lock de Next si el PID ya no existe. */
export function clearStaleDevLock(root) {
  const lock = readDevLock(root);
  if (!lock) return null;
  if (lock.pid && isProcessRunning(lock.pid)) return lock;
  try {
    unlinkSync(devLockPath(root));
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {string} root
 * @param {{ replace?: boolean }} opts
 * @returns {boolean} false si hay otro dev vivo y no se pidió reemplazar
 */
export function ensureDevSlot(root, { replace = false }) {
  const lock = clearStaleDevLock(root) ?? readDevLock(root);
  if (!lock?.pid || !isProcessRunning(lock.pid)) return true;

  if (!replace) {
    console.error(
      `\nYa hay un \`next dev\` en este proyecto (PID ${lock.pid}, ${lock.appUrl ?? "puerto " + lock.port}).\n` +
        `Ciérralo con Ctrl+C en esa terminal, ejecuta \`pnpm dev:stop\`, o arranca con:\n` +
        `  pnpm dev:aws   (reemplaza el servidor anterior)\n`,
    );
    return false;
  }

  console.warn(`\nDeteniendo servidor dev anterior (PID ${lock.pid})…\n`);
  stopProcess(lock.pid);
  try {
    unlinkSync(devLockPath(root));
  } catch {
    /* ignore */
  }
  return true;
}
