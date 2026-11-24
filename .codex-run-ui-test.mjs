import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), "atnurmi-ui-"));
let setup;
let edge;

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: "utf8", ...options });
}

try {
  const setupResult = runNode([".codex-ui-test.mjs"]);
  if (setupResult.status !== 0) throw new Error(setupResult.stderr || "Unable to prepare the test artist.");
  setup = JSON.parse(setupResult.stdout);

  edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--remote-debugging-port=9333",
    `--user-data-dir=${profilePath}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9333/json/version");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("Browser debugging endpoint did not start.");

  const testResult = runNode([
    ".codex-browser-test.mjs",
    "http://127.0.0.1:9333",
    path.resolve("src/app/favicon.ico"),
  ], { env: { ...process.env, ATNURMI_UI_TEST_TOKEN: setup.token } });
  if (testResult.status !== 0) throw new Error(testResult.stderr || `Browser test exited with ${testResult.status}.`);
  process.stdout.write(testResult.stdout);
} finally {
  edge?.kill();
  if (setup?.uid) {
    const cleanup = runNode([".codex-ui-test.mjs", "cleanup", setup.uid]);
    if (cleanup.status !== 0) process.stderr.write(cleanup.stderr);
    else process.stdout.write(cleanup.stdout);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  const tempRoot = path.resolve(os.tmpdir()) + path.sep;
  const resolvedProfile = path.resolve(profilePath);
  if (!resolvedProfile.startsWith(tempRoot) || !path.basename(resolvedProfile).startsWith("atnurmi-ui-")) {
    throw new Error(`Refusing to remove unexpected browser profile: ${resolvedProfile}`);
  }
  fs.rmSync(resolvedProfile, { recursive: true, force: true });
}
