// ============================================================
// Multi-LLM Orchestrator
// ============================================================
// Primary: OpenAI   |   Fallback: Gemini
// Auto-retry on invalid schema output, fallback after 2 failures.
// Tracks latency, model used, and performance metrics.
// ============================================================

export interface LLMMetrics {
  model: string;
  provider: "openai" | "gemini";
  latencyMs: number;
  success: boolean;
  attempt: number;
  schemaValid: boolean;
  timestamp: number;
}

export interface LLMResult {
  text: string;
  metrics: LLMMetrics;
}

// In-memory metrics store
const metricsHistory: LLMMetrics[] = [];
const MAX_METRICS = 200;

function recordMetrics(m: LLMMetrics) {
  metricsHistory.push(m);
  if (metricsHistory.length > MAX_METRICS) {
    metricsHistory.shift();
  }
}

export function getMetricsHistory(): LLMMetrics[] {
  return [...metricsHistory];
}

export function getPerformanceSummary() {
  const openaiMetrics = metricsHistory.filter((m) => m.provider === "openai" && m.success);
  const geminiMetrics = metricsHistory.filter((m) => m.provider === "gemini" && m.success);

  const avgLatency = (arr: LLMMetrics[]) =>
    arr.length > 0 ? arr.reduce((s, m) => s + m.latencyMs, 0) / arr.length : 0;

  const validRate = (arr: LLMMetrics[]) =>
    arr.length > 0
      ? arr.filter((m) => m.schemaValid).length / arr.length
      : 0;

  return {
    openai: {
      totalCalls: openaiMetrics.length,
      avgLatencyMs: Math.round(avgLatency(openaiMetrics)),
      schemaValidRate: Math.round(validRate(openaiMetrics) * 100),
    },
    gemini: {
      totalCalls: geminiMetrics.length,
      avgLatencyMs: Math.round(avgLatency(geminiMetrics)),
      schemaValidRate: Math.round(validRate(geminiMetrics) * 100),
    },
    fasterModel:
      avgLatency(openaiMetrics) <= avgLatency(geminiMetrics)
        ? "openai"
        : "gemini",
    moreReliableModel:
      validRate(openaiMetrics) >= validRate(geminiMetrics)
        ? "openai"
        : "gemini",
  };
}

// ============================================================
// Provider Call Functions
// ============================================================

async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string = "gpt-4o"
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // Low temperature for deterministic output
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI ${model} error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(
  prompt: string,
  apiKey: string,
  model: string = "gemini-2.5-flash"
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini ${model} error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ============================================================
// Schema Validation Callback
// ============================================================

export type SchemaValidator = (text: string) => boolean;

// ============================================================
// Core Orchestrator — Round Robin Key Rotation
// ============================================================

export interface OrchestratorOptions {
  openaiKey?: string;
  geminiKey?: string;
  schemaValidator?: SchemaValidator;
  maxRetries?: number;
  primaryModel?: string;
  fallbackModel?: string;
}

const OPENAI_MODELS = ["gpt-4o", "gpt-3.5-turbo"];
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"];

// ============================================================
// Round Robin State — persists across requests in-memory
// ============================================================
const roundRobinState = {
  openaiIndex: 0,
  geminiIndex: 0,
};

/**
 * Collect unique API keys from environment variables for a provider.
 * Deduplicates keys so the same key isn't tried twice.
 */
function getUniqueKeys(provider: "openai" | "gemini", extraKey?: string): string[] {
  const envPrefix = provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";
  const candidates = [
    process.env[`${envPrefix}_1`],
    process.env[`${envPrefix}_2`],
    process.env[`${envPrefix}_3`],
    process.env[envPrefix], // legacy fallback (if someone still has it)
    extraKey,
  ];
  // Deduplicate using Set, filter out undefined/empty
  return [...new Set(candidates.filter((k): k is string => !!k && k.length > 0))];
}

/**
 * Generate text with multi-LLM orchestration + Round Robin key rotation.
 *
 * Round Robin Strategy:
 * - Each provider (OpenAI, Gemini) maintains a global counter.
 * - On each request, the counter determines which key to start with.
 * - If a key fails (rate-limit, exhaustion, error), it advances to the next key.
 * - After trying all keys for a model, it moves to the next model.
 * - After all OpenAI models fail, it falls back to Gemini.
 * - The counter advances on every successful call so the next request uses the next key.
 */
export async function orchestratedGenerate(
  prompt: string,
  opts: OrchestratorOptions
): Promise<LLMResult> {
  const { schemaValidator, maxRetries = 2 } = opts;

  const openaiKeys = getUniqueKeys("openai", opts.openaiKey);
  const geminiKeys = getUniqueKeys("gemini", opts.geminiKey);

  let attempt = 0;

  // ---- TRY PRIMARY: OpenAI (Round Robin) ----
  if (openaiKeys.length > 0) {
    const startIdx = roundRobinState.openaiIndex % openaiKeys.length;

    for (const model of OPENAI_MODELS) {
      for (let i = 0; i < openaiKeys.length; i++) {
        const keyIdx = (startIdx + i) % openaiKeys.length;
        const key = openaiKeys[keyIdx];

        for (let retry = 0; retry < maxRetries; retry++) {
          attempt++;
          const start = Date.now();
          try {
            const text = await callOpenAI(prompt, key, model);
            const latency = Date.now() - start;
            const schemaValid = schemaValidator ? schemaValidator(text) : true;

            const metrics: LLMMetrics = {
              model,
              provider: "openai",
              latencyMs: latency,
              success: true,
              attempt,
              schemaValid,
              timestamp: Date.now(),
            };
            recordMetrics(metrics);

            if (schemaValid) {
              // Advance round-robin for next request
              roundRobinState.openaiIndex = keyIdx + 1;
              console.log(`[LLM] ✅ OpenAI/${model} succeeded with key #${keyIdx + 1} (${latency}ms, attempt ${attempt})`);
              return { text, metrics };
            }

            console.warn(
              `[LLM] OpenAI/${model} key #${keyIdx + 1} returned invalid schema (attempt ${attempt}), retrying...`
            );
          } catch (err: unknown) {
            const latency = Date.now() - start;
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[LLM] ❌ OpenAI/${model} key #${keyIdx + 1} (${key.substring(0, 10)}...) failed: ${msg}`);
            recordMetrics({
              model,
              provider: "openai",
              latencyMs: latency,
              success: false,
              attempt,
              schemaValid: false,
              timestamp: Date.now(),
            });
            // Break retry loop, try next key
            break;
          }
        }
      }
    }
  }

  // ---- FALLBACK: Gemini (Round Robin) ----
  if (geminiKeys.length > 0) {
    const startIdx = roundRobinState.geminiIndex % geminiKeys.length;

    for (const model of GEMINI_MODELS) {
      for (let i = 0; i < geminiKeys.length; i++) {
        const keyIdx = (startIdx + i) % geminiKeys.length;
        const key = geminiKeys[keyIdx];

        for (let retry = 0; retry < maxRetries; retry++) {
          attempt++;
          const start = Date.now();
          try {
            const text = await callGemini(prompt, key, model);
            const latency = Date.now() - start;
            const schemaValid = schemaValidator ? schemaValidator(text) : true;

            const metrics: LLMMetrics = {
              model,
              provider: "gemini",
              latencyMs: latency,
              success: true,
              attempt,
              schemaValid,
              timestamp: Date.now(),
            };
            recordMetrics(metrics);

            if (schemaValid) {
              // Advance round-robin for next request
              roundRobinState.geminiIndex = keyIdx + 1;
              console.log(`[LLM] ✅ Gemini/${model} succeeded with key #${keyIdx + 1} (${latency}ms, attempt ${attempt})`);
              return { text, metrics };
            }

            console.warn(
              `[LLM] Gemini/${model} key #${keyIdx + 1} returned invalid schema (attempt ${attempt}), retrying...`
            );
          } catch (err: unknown) {
            const latency = Date.now() - start;
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[LLM] ❌ Gemini/${model} key #${keyIdx + 1} (${key.substring(0, 10)}...) failed: ${msg}`);
            recordMetrics({
              model,
              provider: "gemini",
              latencyMs: latency,
              success: false,
              attempt,
              schemaValid: false,
              timestamp: Date.now(),
            });
            // Break retry loop, try next key
            break;
          }
        }
      }
    }
  }

  throw new Error(
    `All LLM models failed after ${attempt} attempts. Ensure OPENAI_API_KEY_1/2/3 or GEMINI_API_KEY_1/2/3 is set in .env`
  );
}

/**
 * Simple text generation (non-schema-validated) with orchestration.
 */
export async function generateText(
  prompt: string,
  opts: OrchestratorOptions
): Promise<string> {
  const result = await orchestratedGenerate(prompt, {
    ...opts,
    schemaValidator: undefined, // No schema validation for plain text
  });
  return result.text;
}
