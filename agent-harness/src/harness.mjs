import { listMetrics, readMetrics } from "./metrics.mjs";

const PLANNER_SYSTEM = `You are the planner in a tightly scoped analytics agent system.
Choose one to four metric IDs from the supplied catalog. Return JSON only:
{"metric_ids":["..."],"rationale":"..."}.
Never invent IDs. Select only metrics needed to answer the question.`;

const ANALYST_SYSTEM = `You are an evidence-bound business analyst.
Use only the supplied evidence objects. Return JSON only:
{"answer":"...","claims":[{"text":"...","evidence_ids":["metric_id"]}],"limitations":["..."]}.
Every factual claim in the answer must be represented in claims and cite one or more supplied evidence IDs. Distinguish association from causation. If evidence is insufficient, say so.`;

const CRITIC_SYSTEM = `You are a skeptical output reviewer. Check whether every material claim is supported by supplied evidence IDs, whether limitations are preserved, and whether causation is overstated. Return JSON only: {"approved":true|false,"issues":["..."]}. Reject unsupported claims.`;

function assertPlannerPlan(plan, catalog) {
  if (!plan || !Array.isArray(plan.metric_ids) || plan.metric_ids.length < 1 || plan.metric_ids.length > 4) {
    throw new Error("Planner produced an invalid metric plan.");
  }
  const allowed = new Set(catalog.map((m) => m.id));
  if (plan.metric_ids.some((id) => !allowed.has(id))) {
    throw new Error("Planner requested a metric outside the allowlisted catalog.");
  }
  if (new Set(plan.metric_ids).size !== plan.metric_ids.length) {
    throw new Error("Planner requested duplicate metrics.");
  }
}

function validateDraft(draft, evidence) {
  if (!draft || typeof draft.answer !== "string" || !draft.answer.trim() || !Array.isArray(draft.claims) || draft.claims.length < 1 || !Array.isArray(draft.limitations)) {
    throw new Error("Analyst returned an invalid response schema.");
  }
  const allowed = new Set(evidence.map((item) => item.id));
  for (const claim of draft.claims) {
    if (!claim || typeof claim.text !== "string" || !Array.isArray(claim.evidence_ids) || claim.evidence_ids.length === 0) {
      throw new Error("Every analyst claim must include evidence IDs.");
    }
    if (claim.evidence_ids.some((id) => !allowed.has(id))) {
      throw new Error("Analyst cited evidence that was not retrieved by the harness.");
    }
  }
}

export async function runHarness({ question, model }) {
  if (typeof question !== "string" || question.trim().length < 4 || question.length > 1000) {
    throw new Error("Question must contain 4–1000 characters.");
  }
  const trace = [];
  const catalog = listMetrics();
  const plan = await model({ role: "planner", system: PLANNER_SYSTEM, input: { question, catalog } });
  assertPlannerPlan(plan, catalog);
  trace.push({ step: "planner", status: "complete", detail: plan.rationale || "Plan accepted", metric_ids: plan.metric_ids });

  const evidence = readMetrics(plan.metric_ids);
  trace.push({ step: "metrics_tool", status: "complete", detail: `Retrieved ${evidence.length} allowlisted metric(s)`, metric_ids: plan.metric_ids });

  let draft = await model({ role: "analyst", system: ANALYST_SYSTEM, input: { question, evidence } });
  validateDraft(draft, evidence);
  trace.push({ step: "analyst", status: "complete", detail: `${draft.claims.length} evidence-linked claim(s)` });

  let review = await model({ role: "critic", system: CRITIC_SYSTEM, input: { question, draft, evidence } });
  if (!review || typeof review.approved !== "boolean" || !Array.isArray(review.issues)) {
    throw new Error("Critic returned an invalid review schema.");
  }
  trace.push({ step: "critic", status: review.approved ? "approved" : "rejected", detail: review.issues.join("; ") || "No issues reported" });

  if (!review.approved) {
    draft = await model({ role: "analyst", system: ANALYST_SYSTEM, input: { question, evidence, prior_draft: draft, reviewer_issues: review.issues } });
    validateDraft(draft, evidence);
    review = await model({ role: "critic", system: CRITIC_SYSTEM, input: { question, draft, evidence } });
    if (!review || typeof review.approved !== "boolean" || !Array.isArray(review.issues)) throw new Error("Critic returned an invalid review schema after repair.");
    trace.push({ step: "critic_recheck", status: review.approved ? "approved" : "rejected", detail: review.issues.join("; ") || "No issues reported" });
    if (!review.approved) throw new Error("Run blocked: critic did not approve after one repair attempt.");
    trace.push({ step: "repair", status: "complete", detail: "One bounded analyst repair passed review." });
  }

  return {
    status: "verified",
    answer: draft.answer,
    claims: draft.claims,
    limitations: [...new Set([...draft.limitations, ...evidence.map((item) => item.limitation)])],
    evidence,
    trace,
    policy: { max_metric_lookups: 4, max_repair_attempts: 1, arbitrary_sql: false, write_tools: false }
  };
}