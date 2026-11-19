// Certified metric registry for a simulated portfolio case.
// These aggregate values come from the TrendVibe case-study brief;
// they are not computed from the separate synthetic CSV generator.
const metrics = Object.freeze({
  retention_change: Object.freeze({
    id: "retention_change",
    label: "Retention change, Q2 to Q4",
    value: -12,
    unit: "percentage_points",
    detail: "Retention declined from 78% in Q2 to 66% in Q4.",
    source: "TrendVibe case-study aggregate brief",
    limitation: "Descriptive change; does not identify cause."
  }),
  churn_by_order_band: Object.freeze({
    id: "churn_by_order_band",
    label: "Observed churn by lifetime order band",
    value: { "1_order": 68, "2_to_3_orders": 18, "4_to_5_orders": 6, "6_plus_orders": 2 },
    unit: "percent",
    source: "TrendVibe case-study aggregate brief",
    limitation: "Marginal cohort rates; not adjusted for overlapping characteristics."
  }),
  churn_by_support_tickets: Object.freeze({
    id: "churn_by_support_tickets",
    label: "Observed churn by support-ticket band",
    value: { "0_tickets": 15, "1_ticket": 18, "2_tickets": 45, "3_plus_tickets": 82 },
    unit: "percent",
    source: "TrendVibe case-study aggregate brief",
    limitation: "Association only; does not establish that support contacts cause churn."
  }),
  churn_by_acquisition: Object.freeze({
    id: "churn_by_acquisition",
    label: "Observed churn by acquisition channel",
    value: { "Social_Media": 38, "Paid_Ads": 24, "Organic_Search": 12, "Referral": 8 },
    unit: "percent",
    source: "TrendVibe case-study aggregate brief",
    limitation: "Marginal cohort rates; no causal attribution or adjustment for mix."
  })
});

export function listMetrics() {
  return Object.values(metrics).map(({ id, label, unit }) => ({ id, label, unit }));
}

export function readMetrics(ids) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 4) {
    throw new Error("Request between one and four metric IDs.");
  }
  const unique = [...new Set(ids)];
  if (unique.length !== ids.length) throw new Error("Duplicate metric IDs are not allowed.");
  return unique.map((id) => {
    const metric = metrics[id];
    if (!metric) throw new Error(`Metric is not allowlisted: ${id}`);
    return structuredClone(metric);
  });
}