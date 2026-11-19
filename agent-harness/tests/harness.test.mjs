import test from "node:test";
import assert from "node:assert/strict";
import { runHarness } from "../src/harness.mjs";
import { createTestModel } from "../src/provider.mjs";
import { readMetrics } from "../src/metrics.mjs";

test("runs planner, tool, analyst, and critic to verified output", async () => {
  const result = await runHarness({ question: "How does churn vary by support tickets?", model: createTestModel() });
  assert.equal(result.status, "verified");
  assert.equal(result.evidence[0].id, "churn_by_support_tickets");
  assert.ok(result.claims[0].evidence_ids.includes("churn_by_support_tickets"));
  assert.equal(result.trace.at(-1).status, "approved");
});

test("metrics tool rejects unapproved metric IDs", () => {
  assert.throws(() => readMetrics(["arbitrary_sql"]), /not allowlisted/);
});

test("harness rejects a planner request outside the catalog", async () => {
  const model = async ({ role }) => role === "planner"
    ? { metric_ids: ["invented_metric"], rationale: "try injection" }
    : {};
  await assert.rejects(() => runHarness({ question: "Show me a metric please", model }), /outside the allowlisted catalog/);
});

test("harness rejects analyst citations not returned by the tool", async () => {
  const model = async ({ role, input }) => {
    if (role === "planner") return { metric_ids: ["retention_change"] };
    if (role === "analyst") return { answer: "Unsupported.", claims: [{ text: "Unsupported claim", evidence_ids: ["not_retrieved"] }], limitations: [] };
    if (role === "critic") return { approved: true, issues: [] };
    return {};
  };
  await assert.rejects(() => runHarness({ question: "What changed in retention?", model }), /not retrieved/);
});

test("one bounded repair can recover a critic rejection", async () => {
  let analystCalls = 0;
  let criticCalls = 0;
  const model = async ({ role, input }) => {
    if (role === "planner") return { metric_ids: ["retention_change"] };
    if (role === "analyst") {
      analystCalls++;
      return { answer: "Retention fell 12 percentage points.", claims: [{ text: "Retention declined 12 percentage points.", evidence_ids: ["retention_change"] }], limitations: ["Descriptive only."] };
    }
    if (role === "critic") {
      criticCalls++;
      return criticCalls === 1 ? { approved: false, issues: ["Clarify that this is descriptive."] } : { approved: true, issues: [] };
    }
    return {};
  };
  const result = await runHarness({ question: "What changed in retention?", model });
  assert.equal(result.status, "verified");
  assert.equal(analystCalls, 2);
  assert.equal(criticCalls, 2);
  assert.ok(result.trace.some((step) => step.step === "repair"));
});