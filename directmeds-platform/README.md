# DirectMeds AI Production Platform — integration scaffold

This branch adds an operator dashboard and API scaffold, PostgreSQL persistence, a protected API mode, and an integration adapter for the existing certified analytics agent harness.

## Run locally
Requires Node.js 20+.

```bash
cd directmeds-platform
npm install
npm start
```

Open http://127.0.0.1:8788. Without DATABASE_URL, campaign briefs and operations jobs use in-memory demo storage. With DATABASE_URL, they use PostgreSQL. Analytics fixtures remain synthetic in both modes.

## PostgreSQL setup
1. Provision a dedicated database for this platform; do not reuse another product's database.
2. Apply `migrations/001_initial.sql` manually after review.
3. Set DATABASE_URL in the runtime environment. For Neon, retain TLS verification (`PGSSL=require`, `PGSSL_REJECT_UNAUTHORIZED=true`).
4. Install dependencies and start the server.
5. Check `/health`; it reports the active storage mode.

The application does not run migrations automatically.

## API access
- The default `HOST=127.0.0.1` mode is for local development only.
- A non-loopback bind is refused unless `ADMIN_API_TOKEN` is set to a random secret of at least 32 characters.
- Protected API requests require `Authorization: Bearer <token>`. The dashboard holds the token in sessionStorage for that browser tab.
- Put the token in the hosting provider's secret manager, never in Git or the HTML.
- Terminate HTTPS at the deployment edge. Do not send bearer tokens over plain public HTTP.

This is a single shared operator token, not a user identity system or role-based authorization. Rotate it if exposed.

## Agent integration
- `POST /api/analytics/agent` calls the existing planner → allowlisted metrics → analyst → critic harness.
- The endpoint requires server-side OPENAI_API_KEY. No mock fallback is used for live requests.
- The adapter caps each run at five model calls and defaults to one concurrent run.
- The existing harness limits metric lookups to four and repair attempts to one.
- Results identify their source as the TrendVibe case-study aggregate brief, not DirectMeds data.
- The current provider adapter does not enforce a token or monetary spend ceiling. Model calls may incur API charges when enabled.

## Implemented
- Dashboard for creative intake, demo analytics, operations intake, agent runs, and service status.
- Campaign brief and operations job storage in PostgreSQL when configured.
- Synthetic analytics fixture with explicit source labels.
- Operations jobs start in `awaiting_approval`; there is no execution endpoint.

## Still not production-ready
- No DirectMeds data connections, production metrics, credentials, or approved source definitions.
- No patient data processing or clinical functionality.
- No image/video generation or asset storage.
- No individual user accounts, roles, SSO, or fine-grained permissions.
- No durable workflow runner, approval action, idempotency, retry queue, or audit log.
- No provider-side token budget, billing cap, or cumulative spend guard.
- No production deployment, security assessment, or end-to-end validation against DirectMeds systems.

Never enter patient information into this demo. Do not describe TrendVibe or synthetic fixtures as DirectMeds business data.
