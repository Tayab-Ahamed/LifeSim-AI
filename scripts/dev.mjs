import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

try {
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .forEach((line) => {
      const parts = line.split("=");
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      process.env[key] ??= value;
    });
} catch {
  // .env is optional
}

const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";

const children = [];

const spawnChild = (command, args, name, isShell = false) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: isShell,
  });

  child.on("exit", (code) => {
    if (!child.killed) {
      console.log(`${name} exited with code ${code ?? 0}.`);
      children.forEach((current) => {
        if (current !== child && !current.killed) {
          current.kill();
        }
      });
      process.exit(code ?? 0);
    }
  });

  children.push(child);
};

spawnChild(process.execPath, ["server/server.mjs"], "API server", false);
spawnChild(npmBin, ["run", "start:client"], "React app", process.platform === "win32");

const shutdown = () => {
  children.forEach((child) => {
    if (!child.killed) {
      child.kill();
    }
  });
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
