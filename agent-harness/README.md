# Certified Metrics Agent Harness

A small, inspectable multi-agent analytics workflow built to demonstrate agent orchestration and harness engineering.

## What it does

1. A **planner agent** selects metrics from a fixed catalog.
2. A **read-only metrics tool** returns only allowlisted case-study aggregates.
3. An **analyst agent** drafts an answer with evidence IDs attached to each claim.
4. A **critic agent** reviews support and causal language.
5. The **harness** validates schemas and evidence membership, enforces four lookups maximum, and allows one bounded analyst repair attempt.

The model is replaceable through the provider adapter. There is no silent fallback from a failed live model call to a mock. The deterministic test double is used only by tests and evals.

## Run locally

Requires Node.js 20+.

```bash
cp .env.example .env
# Set OPENAI_API_KEY in your local environment; do not commit it.
# Set OPENAI_MODEL if you want a different supported model.
npm test
npm run eval
npm start
```

Open http://localhost:8787.

The HTTP service reads environment variables from the process. It does not load `.env` automatically; use your shell or a local environment manager to supply them.

## Evaluation

`npm test` checks tool allowlisting, planner rejection, evidence enforcement, and the bounded workflow. `npm run eval` runs four deterministic routing cases.

## Data provenance

The registry contains aggregate values from the TrendVibe portfolio case-study brief in the parent repository. These are simulated case-study aggregates, not production metrics. They are intentionally not regenerated from the synthetic CSV generator, which creates a separate plausible dataset for demonstrating the original Python diagnostic pipeline.

## Security and reliability boundaries

- No arbitrary SQL, shell, filesystem, or write-capable agent tools.
- Only metric IDs in the registry can be requested.
- Unknown IDs, duplicate IDs, malformed plans, and unsupported citations are rejected.
- Per-agent timeout is enforced in the live provider adapter.
- One repair attempt maximum; unresolved review failures block the run.
- The local HTTP demo is not an authenticated production service. Do not expose it publicly or send confidential data to it.
- This portfolio demo is not connected to DirectMeds and does not process patient data or make clinical recommendations.

## Production work still required

Authentication, rate limiting, persistent run storage, structured telemetry, provider-side cost budgets, deployment configuration, and end-to-end tests against the chosen model remain out of scope for this demo. A passing local test suite is not evidence of production deployment.