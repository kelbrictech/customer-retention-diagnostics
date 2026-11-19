import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

test("platform API health, analytics, creative intake, and approval-gated jobs", async (t) => {
  const port = 18878;
  const child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: "ignore"
  });
  t.after(() => child.kill("SIGTERM"));

  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server should start");

  const base = `http://127.0.0.1:${port}`;
  const health = await (await fetch(`${base}/health`)).json();
  assert.equal(health.status, "ok");

  const emptyQuery = await fetch(`${base}/api/analytics/query`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: " " })
  });
  assert.equal(emptyQuery.status, 400);

  const analytics = await (await fetch(`${base}/api/analytics/query`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "October performance?" })
  })).json();
  assert.equal(analytics.status, "demo_answer");
  assert.equal(analytics.evidence[0].source, "synthetic_demo_fixture");

  const briefResponse = await fetch(`${base}/api/creative/briefs`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ brief: "Autumn campaign" })
  });
  assert.equal(briefResponse.status, 202);
  const brief = await briefResponse.json();
  assert.equal(brief.status, "brief_received");
  assert.deepEqual(brief.generated_assets, []);

  const jobResponse = await fetch(`${base}/api/operations/jobs`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ request: "Prepare a weekly report" })
  });
  assert.equal(jobResponse.status, 202);
  const job = await jobResponse.json();
  assert.equal(job.status, "awaiting_approval");
  assert.equal(job.steps[1].status, "blocked_pending_approval");

  const storedJob = await (await fetch(`${base}/api/operations/jobs/${job.id}`)).json();
  assert.equal(storedJob.id, job.id);
});
