import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

let server;
let baseUrl;
before(async () => {
  const reservation = net.createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["server/server.mjs"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, API_PORT: String(port), API_HOST: "127.0.0.1", API_ALLOWED_ORIGINS: "http://localhost:3000" },
    windowsHide: true,
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("API did not start")), 5000);
    server.once("error", (error) => { clearTimeout(timeout); reject(error); });
    server.once("exit", () => { clearTimeout(timeout); reject(new Error("API exited before startup")); });
    server.stdout.on("data", (chunk) => {
      if (String(chunk).includes("listening on")) { clearTimeout(timeout); resolve(); }
    });
  });
});
after(() => { server?.kill(); });

test("untrusted websites cannot submit requests to the provider proxy", async () => {
  const response = await fetch(`${baseUrl}/api/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://untrusted.example" },
    body: JSON.stringify({ config: { provider: "unsupported", apiKey: "test" }, history: [] }),
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("preflight is restricted to configured frontend origins", async () => {
  const blocked = await fetch(`${baseUrl}/api/scenario`, { method: "OPTIONS", headers: { Origin: "https://untrusted.example" } });
  assert.equal(blocked.status, 403);
  const allowed = await fetch(`${baseUrl}/api/scenario`, { method: "OPTIONS", headers: { Origin: "http://localhost:3000" } });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3000");
  assert.match(allowed.headers.get("vary") || "", /Origin/);
});

test("local clients without Origin retain health access", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test("configured frontend requests still reach normal route validation", async () => {
  const response = await fetch(`${baseUrl}/api/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ config: { provider: "unsupported", apiKey: "test" }, history: [] }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Unsupported provider/);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
});
