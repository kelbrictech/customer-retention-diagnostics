import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "public/index.html"), "utf8");
const port = Number(process.env.PORT || 8788);
const host = process.env.HOST || "127.0.0.1";
const demoMode = process.env.DEMO_MODE !== "false";

// Clearly labeled, synthetic demonstration data. Never represent this as DirectMeds production data.
const metrics = [
  { id: "campaign_spend", label: "Campaign spend", value: 12500, unit: "USD", period: "2026-10", source: "synthetic_demo_fixture" },
  { id: "qualified_leads", label: "Qualified leads", value: 625, unit: "leads", period: "2026-10", source: "synthetic_demo_fixture" },
  { id: "conversion_rate", label: "Lead conversion rate", value: 0.08, unit: "ratio", period: "2026-10", source: "synthetic_demo_fixture" }
];
const jobs = new Map();
const campaigns = new Map();

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20_000) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    return res.end(html);
  }
  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { status: "ok", mode: demoMode ? "synthetic-demo" : "integration-required", modules: ["creative", "analytics", "operations", "agent-harness"] });
  }
  if (req.method === "GET" && url.pathname === "/api/analytics/metrics") {
    return send(res, 200, { mode: "synthetic-demo", metrics });
  }
  if (req.method === "POST" && url.pathname === "/api/analytics/query") {
    try {
      const body = await readBody(req);
      const q = String(body.question || "").trim();
      if (!q) return send(res, 400, { error: "question is required" });
      return send(res, 200, {
        status: "demo_answer",
        answer: "The October demonstration fixture records $12,500 campaign spend, 625 qualified leads, and an 8% lead conversion rate.",
        evidence: metrics.map(({ id, label, value, unit, period, source }) => ({ id, label, value, unit, period, source })),
        limitations: ["Synthetic demonstration data only; not connected to DirectMeds systems.", "No causal conclusion can be drawn from these three aggregate metrics."]
      });
    } catch (error) { return send(res, 400, { error: error.message }); }
  }
  if (req.method === "POST" && url.pathname === "/api/creative/briefs") {
    try {
      const body = await readBody(req);
      const brief = String(body.brief || "").trim();
      if (!brief) return send(res, 400, { error: "brief is required" });
      const item = { id: randomUUID(), brief, status: "brief_received", generated_assets: [], note: "Asset generation is not connected yet. This endpoint records the brief only." };
      campaigns.set(item.id, item);
      return send(res, 202, item);
    } catch (error) { return send(res, 400, { error: error.message }); }
  }
  if (req.method === "POST" && url.pathname === "/api/operations/jobs") {
    try {
      const body = await readBody(req);
      const request = String(body.request || "").trim();
      if (!request) return send(res, 400, { error: "request is required" });
      const job = { id: randomUUID(), request, status: "awaiting_approval", steps: [{ id: "review", label: "Review request", status: "pending" }, { id: "execute", label: "Execute approved action", status: "blocked_pending_approval" }], created_at: new Date().toISOString(), note: "No external action is executed by this demo endpoint." };
      jobs.set(job.id, job);
      return send(res, 202, job);
    } catch (error) { return send(res, 400, { error: error.message }); }
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/operations/jobs/")) {
    const job = jobs.get(url.pathname.split("/").at(-1));
    return job ? send(res, 200, job) : send(res, 404, { error: "job not found" });
  }
  return send(res, 404, { error: "not found" });
});
server.listen(port, host, () => console.log(`DirectMeds platform starter listening at http://${host}:${port}`));
