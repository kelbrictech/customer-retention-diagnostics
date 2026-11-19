import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

test("platform server exposes health and synthetic analytics endpoints", async (t) => {
  const port = 18878;
  const child = spawn(process.execPath, ["src/server.mjs"], { cwd: new URL("..", import.meta.url), env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" }, stdio: "ignore" });
  t.after(() => child.kill("SIGTERM"));
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/health`); if (r.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server should start");
  const health = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
  assert.equal(health.status, "ok");
  const analytics = await (await fetch(`http://127.0.0.1:${port}/api/analytics/query`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({question:"October performance?"}) })).json();
  assert.equal(analytics.status, "demo_answer");
  assert.equal(analytics.evidence[0].source, "synthetic_demo_fixture");
});
