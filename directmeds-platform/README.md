# DirectMeds AI Production Platform — starter

This branch adds an operator dashboard and API skeleton alongside the separate agent-harness prototype.

## Run
Requires Node.js 20+.

```bash
cd directmeds-platform
npm install
npm start
```

Open http://127.0.0.1:8788. Without DATABASE_URL, the app uses in-memory demo storage. With DATABASE_URL, campaign briefs and operations jobs use PostgreSQL. Analytics remains synthetic in both modes.

## PostgreSQL setup
1. Create a dedicated database for this platform. Do not reuse another product's database.
2. Apply `migrations/001_initial.sql` to that database.
3. Set DATABASE_URL in the deployment environment. For Neon, retain TLS verification (`PGSSL=require`, `PGSSL_REJECT_UNAUTHORIZED=true`).
4. Install dependencies with `npm install`, then start the server.
5. Check `/health`; it reports `postgres` only after a successful database connection.

The app does not run migrations automatically. Database schema changes must be reviewed and applied deliberately.

## Implemented
- Operator dashboard and health endpoint.
- Synthetic analytics fixture with explicit evidence/source labels.
- Campaign brief intake, persisted in PostgreSQL when configured.
- Operations job intake and retrieval, persisted in PostgreSQL when configured.
- Jobs remain `awaiting_approval`; no approval or external execution endpoint exists.

## Not production-ready
- No authentication or authorization. Bind to localhost only; do not expose publicly.
- No DirectMeds credentials, production datasets, or internal API connections.
- No image/video generation provider integration or asset storage.
- Analytics is synthetic and is not connected to DirectMeds sources.
- No integrated model-powered orchestration in this platform. The existing `agent-harness/` remains separate.
- No durable workflow execution, retries, idempotency, approval UI, or audit log.
- No deployment configuration or production security review.

Never commit secrets. Do not describe synthetic analytics as DirectMeds business data.

## Remaining production work
1. Add authenticated operator accounts and role-based authorization.
2. Integrate the existing agent harness through bounded model/tool adapters and enforce per-call plus cumulative cost limits.
3. Implement creative generation, asset storage, review, and export.
4. Connect approved analytics sources and validate metric definitions against known answers.
5. Implement durable workflow execution, approvals, idempotency, retries, and audit logs.
6. Expand integration/evaluation tests and CI.
7. Deploy, then verify real workflows in the deployed environment.
