import { runHarness } from "../../agent-harness/src/harness.mjs";
import { createOpenAIModel } from "../../agent-harness/src/provider.mjs";

const MAX_MODEL_CALLS_PER_RUN = 5;
const MAX_CONCURRENT_RUNS = Number(process.env.AGENT_MAX_CONCURRENT_RUNS || 1);
let activeRuns = 0;

export async function runAnalyticsAgent(question) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Agent runs are disabled: configure OPENAI_API_KEY in the server environment.");
    error.statusCode = 503;
    throw error;
  }
  if (activeRuns >= MAX_CONCURRENT_RUNS) {
    const error = new Error("Agent capacity reached. Retry after the active run completes.");
    error.statusCode = 429;
    throw error;
  }
  activeRuns++;
  let modelCalls = 0;
  const liveModel = createOpenAIModel();
  const boundedModel = async (args) => {
    modelCalls++;
    if (modelCalls > MAX_MODEL_CALLS_PER_RUN) {
      throw new Error("Run blocked: maximum model-call budget reached.");
    }
    return liveModel(args);
  };
  try {
    const result = await runHarness({ question, model: boundedModel });
    return {
      ...result,
      provenance: {
        dataset: "TrendVibe case-study aggregate brief",
        directmeds_data: false,
        live_model: true,
        model_calls: modelCalls
      },
      cost_controls: {
        max_model_calls_per_run: MAX_MODEL_CALLS_PER_RUN,
        max_concurrent_runs: MAX_CONCURRENT_RUNS,
        provider_token_budget: "Not enforced by current provider adapter"
      }
    };
  } finally {
    activeRuns--;
  }
}
