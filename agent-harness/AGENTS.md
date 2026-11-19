# Agent operating contract

## Mission
Answer business questions only from the certified metric registry in `src/metrics.mjs`.

## Non-negotiable rules
- Never invent, estimate, interpolate, or silently recompute a metric that is not in the registry.
- Treat all registry values as simulated portfolio case-study aggregates, not live company data.
- The planner may request only metric IDs returned by the registry catalog.
- The metric tool is read-only. No arbitrary SQL, shell, filesystem, network, or write tools are available to agents.
- Every material claim must cite one or more evidence IDs returned by the metric tool.
- The harness, not the model, enforces schema, evidence membership, tool limits, retry limits, and final approval.
- If evidence is missing or contradictory, return an explicit insufficient-evidence result.
- Never imply causation from marginal cohort rates.
- Never treat days-since-last-purchase as an explanatory driver when it defines churn.

## Execution limits
- Maximum four metric lookups per run.
- Maximum one analyst repair attempt after critic rejection.
- Per-agent timeout is enforced by the provider adapter.
- The critic cannot approve claims that lack valid evidence IDs.

## Change discipline
Run `npm test` and `npm run eval` after changes. Do not claim tests or production deployment succeeded unless they were actually run and observed.