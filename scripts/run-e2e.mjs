import { spawn } from "node:child_process";

const root = process.cwd();
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5175"], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});

const stopServer = () => {
  if (!server.killed) server.kill();
};

const waitForServer = async () => {
  const started = Date.now();
  while (Date.now() - started < 120000) {
    try {
      const response = await fetch("http://127.0.0.1:5175/");
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Vite did not start within 120 seconds");
};

try {
  await waitForServer();
  const runner = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  const exitCode = await new Promise((resolve, reject) => {
    runner.on("error", reject);
    runner.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  stopServer();
  process.exitCode = exitCode;
} catch (error) {
  stopServer();
  console.error(error);
  process.exitCode = 1;
}
