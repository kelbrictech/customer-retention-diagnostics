const DEFAULT_TIMEOUT = Number(process.env.AGENT_TIMEOUT_MS || 20000);

export function createOpenAIModel({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || "gpt-4.1-mini" } = {}) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for live agent runs.");
  return async function callModel({ role, system, input }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify({ role, ...input }) }
          ]
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Model API ${response.status}: ${body.slice(0, 500)}`);
      }
      const payload = await response.json();
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("Model returned no JSON content.");
      try { return JSON.parse(content); }
      catch { throw new Error("Model returned invalid JSON."); }
    } finally {
      clearTimeout(timer);
    }
  };
}

// Deterministic test double. Never used as a live model fallback.
export function createTestModel() {
  return async ({ role, input }) => {
    if (role === "planner") {
      const q = String(input.question || "").toLowerCase();
      const metric_ids = q.includes("support") || q.includes("ticket")
        ? ["churn_by_support_tickets"]
        : q.includes("channel") || q.includes("acquisition")
          ? ["churn_by_acquisition"]
          : q.includes("retention")
            ? ["retention_change"]
            : ["churn_by_order_band"];
      return { metric_ids, rationale: "Selected the closest certified metric for this test case." };
    }
    if (role === "analyst") {
      const evidence = input.evidence;
      const first = evidence[0];
      return {
        answer: `${first.label}: ${JSON.stringify(first.value)} ${first.unit}.`,
        claims: [{ text: `${first.label} is reported in the certified case-study registry.`, evidence_ids: [first.id] }],
        limitations: [first.limitation]
      };
    }
    if (role === "critic") return { approved: true, issues: [] };
    throw new Error(`Unknown agent role: ${role}`);
  };
}