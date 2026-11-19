import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

async function waitForServer(port, child) {
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null) throw new Error("server exited before becoming ready");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("server did not start");
}

test("platform APIs and integrated agent safety boundary", async (t) => {
  const port = 18878;
  const child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", OPENAI_API_KEY: "" },
    stdio: "ignore"
  });
  t.after(() => child.kill("SIGTERM"));
  await waitForServer(port, child);

  const base = `http://127.0.0.1:${port}`;
  const health = await (await fetch(`${base}/health`)).json();
  assert.equal(health.status, "ok");
  assert.equal(health.agent, "disabled-no-api-key");

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

  const agentResponse = await fetch(`${base}/api/analytics/agent`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "What happened to retention?" })
  });
  assert.equal(agentResponse.status, 503);

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

test("non-loopback bind requires and enforces bearer token", async (t) => {
  const port = 18879;
  const token = "test-only-token-with-more-than-32-characters";
  const child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port), HOST: "0.0.0.0", ADMIN_API_TOKEN: token, OPENAI_API_KEY: "" },
    stdio: "ignore"
  });
  t.after(() => child.kill("SIGTERM"));
  await waitForServer(port, child);

  const denied = await fetch(`http://127.0.0.1:${port}/api/analytics/metrics`);
  assert.equal(denied.status, 401);
  const allowed = await fetch(`http://127.0.0.1:${port}/api/analytics/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(allowed.status, 200);
});
