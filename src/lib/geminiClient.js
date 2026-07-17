import { GoogleGenerativeAI } from "@google/generative-ai";

let client = null;

/**
 * Lazily instantiates a singleton Gemini client using the server-side
 * GEMINI_API_KEY environment variable. Throws a descriptive error if the
 * key is missing so route handlers can surface a helpful message.
 *
 * Get a free API key (no credit card required) at https://aistudio.google.com/apikey
 */
export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to a .env.local file at the project root. Get a free key at https://aistudio.google.com/apikey"
    );
  }

  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return client;
}

export const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-3.1-flash-lite";
export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.1-flash-lite";

/**
 * Classifies a Gemini SDK error into a semantic category so route handlers
 * can surface a tailored message. Google's API returns a plain HTTP `status`
 * (often 400, not 401/403, even for an invalid key) plus a structured
 * `errorDetails[].reason` and a human-readable `message` — this checks all
 * three since none of them alone is reliable across every failure mode.
 *
 * Returns "auth" (bad/missing API key), "rate_limit" (quota/RPM exceeded),
 * "unavailable" (transient 503 / model overloaded — common on free-tier
 * Flash models during demand spikes), or `null` (anything else, e.g. a
 * network failure or a malformed-request error).
 */
export function classifyGeminiError(err) {
  const message = String(err?.message || "");
  const status = typeof err?.status === "number" ? err.status : null;
  const reasons = Array.isArray(err?.errorDetails)
    ? err.errorDetails.map((detail) => detail?.reason).filter(Boolean)
    : [];

  const isAuthError =
    status === 401 ||
    status === 403 ||
    reasons.includes("API_KEY_INVALID") ||
    reasons.includes("PERMISSION_DENIED") ||
    /api key not valid|api_key_invalid|permission.denied/i.test(message);
  if (isAuthError) return "auth";

  const isRateLimitError =
    status === 429 ||
    reasons.includes("RESOURCE_EXHAUSTED") ||
    /quota|rate limit|resource_exhausted/i.test(message);
  if (isRateLimitError) return "rate_limit";

  const isUnavailableError =
    status === 503 ||
    reasons.includes("UNAVAILABLE") ||
    /unavailable|overloaded|high demand/i.test(message);
  if (isUnavailableError) return "unavailable";

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls model.generateContent(request), automatically retrying with a short
 * backoff if Gemini responds with a transient "overloaded" / 503 error.
 * Google's free-tier Flash models are prone to brief demand spikes that
 * usually clear up within a couple of seconds, so a couple of quick retries
 * meaningfully improves real-world reliability without making the user
 * click "try again" themselves. Any other kind of error (auth, rate limit,
 * malformed request, etc.) is re-thrown immediately without retrying, since
 * retrying those would just fail the same way again.
 */
export async function generateContentWithRetry(model, request, options = {}) {
  const { retries = 2, baseDelayMs = 800 } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await model.generateContent(request);
    } catch (err) {
      lastError = err;
      const canRetry = attempt < retries && classifyGeminiError(err) === "unavailable";
      if (!canRetry) throw err;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}
