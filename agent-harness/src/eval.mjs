import { runHarness } from "./harness.mjs";
import { createTestModel } from "./provider.mjs";

const cases = [
  { name: "order lifecycle question", question: "Which order lifecycle cohort has the highest churn?", expected: "churn_by_order_band" },
  { name: "support friction question", question: "How does churn vary by support tickets?", expected: "churn_by_support_tickets" },
  { name: "acquisition question", question: "Compare churn by acquisition channel.", expected: "churn_by_acquisition" },
  { name: "retention trend question", question: "What happened to retention from Q2 to Q4?", expected: "retention_change" }
];

let failures = 0;
for (const testCase of cases) {
  try {
    const result = await runHarness({ question: testCase.question, model: createTestModel() });
    const passed = result.status === "verified" && result.evidence.some((item) => item.id === testCase.expected)
      && result.claims.every((claim) => claim.evidence_ids.every((id) => result.evidence.some((item) => item.id === id)));
    console.log(`${passed ? "PASS" : "FAIL"} ${testCase.name}`);
    if (!passed) failures++;
  } catch (error) {
    console.log(`FAIL ${testCase.name}: ${error.message}`);
    failures++;
  }
}
console.log(`\nEval result: ${cases.length - failures}/${cases.length} passed`);
if (failures) process.exitCode = 1;