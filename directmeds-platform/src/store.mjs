import { randomUUID } from "node:crypto";

export function createStore({ pool = null } = {}) {
  const memoryJobs = new Map();
  const memoryCampaigns = new Map();

  return {
    mode: pool ? "postgres" : "memory-demo",

    async createCampaign(brief) {
      const item = { id: randomUUID(), brief, status: "brief_received", generated_assets: [], note: "Asset generation is not connected yet." };
      if (pool) {
        const result = await pool.query(
          "INSERT INTO campaign_briefs (id, brief, status) VALUES ($1, $2, $3) RETURNING id, brief, status, created_at",
          [item.id, item.brief, item.status]
        );
        return { ...result.rows[0], generated_assets: [], note: "Asset generation is not connected yet." };
      }
      memoryCampaigns.set(item.id, item);
      return item;
    },

    async createJob(request) {
      const item = {
        id: randomUUID(), request, status: "awaiting_approval",
        steps: [
          { id: "review", label: "Review request", status: "pending" },
          { id: "execute", label: "Execute approved action", status: "blocked_pending_approval" }
        ],
        note: "No external action is executed by this endpoint."
      };
      if (pool) {
        const result = await pool.query(
          "INSERT INTO operations_jobs (id, request, status, steps) VALUES ($1, $2, $3, $4::jsonb) RETURNING id, request, status, steps, created_at",
          [item.id, item.request, item.status, JSON.stringify(item.steps)]
        );
        return { ...result.rows[0], note: item.note };
      }
      item.created_at = new Date().toISOString();
      memoryJobs.set(item.id, item);
      return item;
    },

    async getJob(id) {
      if (pool) {
        const result = await pool.query(
          "SELECT id, request, status, steps, created_at FROM operations_jobs WHERE id = $1",
          [id]
        );
        return result.rows[0] || null;
      }
      return memoryJobs.get(id) || null;
    },

    async close() {
      if (pool) await pool.end();
    }
  };
}
