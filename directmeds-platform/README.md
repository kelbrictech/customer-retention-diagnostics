# DirectMeds AI Production Platform — starter

This branch adds an integrated operator dashboard and API skeleton alongside the existing agent-harness demo.

## Run
Requires Node.js 20+.

```bash
cd directmeds-platform
npm start
``

Open http://127.0.0.1:8788. No API key is needed for the synthetic demo endpoints.

## Current implemented behavior
- Operator dashboard with four module entry points.
- Health endpoint.
- Analytics endpoint backed by explicitly synthetic, fixed metrics and evidence IDs.
- Creative brief intake endpoint (records a brief; does not generate assets).
- Operations job intake endpoint with an approval gate (does not execute external actions).

## Not implemented / not production-ready
- No DirectMeds credentials, production datasets, or internal API connections.
- No image/video generation provider integration.
- No persistent database; records are in memory and disappear on restart.
- No authentication or authorization; bind to localhost only.
- No real operations connectors or external side effects.
- No integrated model-powered orchestration in this platform starter.
- No deployment configuration or production security review.

Do not expose this server publicly. Do not put secrets in source control. The existing `agent-harness/` folder is a separate prototype and still requires live API and environment testing.

## Production completion plan
1. Confirm approved data sources, metric definitions, and access permissions.
2. Add persistent storage and authenticated operator accounts.
3. Connect a model provider through a bounded adapter with per-call and cumulative cost limits.
4. Implement creative generation, asset storage, review, and export.
5. Implement durable workflow execution, retries, idempotency, approvals, and audit logs.
6. Connect analytics to approved sources and test metric calculations against known answers.
7. Add automated integration/evaluation tests and CI.
8. Deploy only after security, data handling, and operational checks pass.

All current analytics values are synthetic demonstration fixtures, not DirectMeds business data.
