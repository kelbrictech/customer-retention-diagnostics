import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "./store.mjs";
import { runAnalyticsAgent } from "./agent.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "public/index.html"), "utf8");
const port = Number(process.env.PORT || 8788);
const host = process.env.HOST || "127.0.0.1";
let pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = await import("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" },
    max: Number(process.env.PGPOOL_MAX || 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000
  });
  await pool.query("SELECT 1");
}
const store = createStore({ pool });
const metrics = [
  { id: "campaign_spend", label: "Campaign spend", value: 12500, unit: "USD", period: "2026-10", source: "synthetic_demo_fixture" },
  { id: "qualified_leads", label: "Qualified leads", value: 625, unit: "leads", period: "2026-10", source: "synthetic_demo_fixture" },
  { id: "conversion_rate", label: "Lead conversion rate", value: 0.08, unit: "ratio", period: "2026-10", source: "synthetic_demo_fixture" }
];

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw, "utf8") > 20_000) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return res.end(html);
    }
    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, {
        status: "ok", mode: store.mode, analytics: "synthetic-demo",
        agent: process.env.OPENAI_API_KEY ? "live-model-configured" : "disabled-no-api-key",
        modules: ["creative", "analytics", "operations", "agent-harness"]
      });
    }
    if (req.method === "GET" && url.pathname === "/api/analytics/metrics") {
      return send(res, 200, { mode: "synthetic-demo", metrics });
    }
    if (req.method === "POST" && url.pathname === "/api/analytics/query") {
      const body = await readBody(req);
      if (!String(body.question || "").trim()) return send(res, 400, { error: "question is required" });
      return send(res, 200, {
        status: "demo_answer",
        answer: "The October demonstration fixture records $12,500 campaign spend, 625 qualified leads, and an 8% lead conversion rate.",
        evidence: metrics.map(({ id, label, value, unit, period, source }) => ({ id, label, value, unit, period, source })),
        limitations: ["Synthetic demonstration data only; not connected to DirectMeds systems.", "No causal conclusion can be drawn from these three aggregate metrics."]
      });
    }
    if (req.method === "POST" && url.pathname === "/api/analytics/agent") {
      const body = await readBody(req);
      const result = await runAnalyticsAgent(String(body.question || ""));
      return send(res, 200, result);
    }
    if (req.method === "POST" && url.pathname === "/api/creative/briefs") {
      const body = await readBody(req);
      const brief = String(body.brief || "").trim();
      if (!brief) return send(res, 400, { error: "brief is required" });
      return send(res, 202, await store.createCampaign(brief));
    }
    if (req.method === "POST" && url.pathname === "/api/operations/jobs") {
      const body = await readBody(req);
      const request = String(body.request || "").trim();
      if (!request) return send(res, 400, { error: "request is required" });
      return send(res, 202, await store.createJob(request));
    }
    if (req.method === "GET" && url.pathname.startsWith("/api/operations/jobs/")) {
      const job = await store.getJob(url.pathname.split("/").at(-1));
      return job ? send(res, 200, job) : send(res, 404, { error: "job not found" });
    }
    return send(res, 404, { error: "not found" });
  } catch (error) {
    const status = error.statusCode || (error instanceof SyntaxError ? 400 : (error.message === "Request body too large" ? 413 : 500));
    return send(res, status, { error: status === 500 ? "internal server error" : error.message });
  }
});
server.listen(port, host, () => console.log(`DirectMeds platform listening at http://${host}:${port} (${store.mode})`));
process.on("SIGTERM", async () => { server.close(); await store.close(); });
process.on("SIGINT", async () => { server.close(); await store.close(); });
