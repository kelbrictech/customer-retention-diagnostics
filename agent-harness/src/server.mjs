import http from "node:http";
import { readFile } from "node:fs/promises";
import { createOpenAIModel } from "./provider.mjs";
import { runHarness } from "./harness.mjs";

const port = Number(process.env.PORT || 8787);
const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    return res.end(html);
  }
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ status: "ok", mode: process.env.OPENAI_API_KEY ? "live-model-configured" : "model-not-configured" }));
  }
  if (req.method === "POST" && req.url === "/api/run") {
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 10_000) {
        res.writeHead(413); return res.end("Request too large");
      }
    }
    try {
      const body = JSON.parse(raw || "{}");
      const result = await runHarness({ question: body.question, model: createOpenAIModel() });
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      return res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(400, { "content-type": "application/json", "cache-control": "no-store" });
      return res.end(JSON.stringify({ status: "blocked", error: error.message }));
    }
  }
  res.writeHead(404); res.end("Not found");
});

server.listen(port, () => console.log(`Agent harness listening on http://localhost:${port}`));