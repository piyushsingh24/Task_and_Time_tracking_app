import "server-only";
import { httpError } from "@/lib/errors";
import { suggestionSchema, type Suggestion } from "@/lib/validators/ai";

/**
 * Phase 6 — Groq AI task enhancement (server-only).
 *
 * Decisions:
 * - Plain fetch to Groq's OpenAI-compatible endpoint + JSON mode.
 *   No groq-sdk dependency (rule: avoid unnecessary dependencies).
 * - GROQ_API_KEY never leaves the server; the client only receives
 *   the validated { title, description } suggestion.
 * - Model defaults to openai/gpt-oss-20b, overridable via
 *   GROQ_MODEL env (Groq retires models; see .env.example).
 * - Suggestion only — nothing is written to the DB. The user reviews
 *   and edits the suggestion, then saves via POST /api/tasks.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 15_000;

function model(): string {
  return process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";
}

export async function suggestTask(input: string): Promise<Suggestion> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw httpError(503, "AI enhancement is not configured.", "AI_UNAVAILABLE");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model(),
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You rewrite a rough task note into a clear task. Respond with JSON only: {"title": "...", "description": "..."}. ' +
              "Title: concise, title case, max 12 words. Description: one or two actionable sentences expanding the note. " +
              "No markdown, no extra keys, no commentary.",
          },
          { role: "user", content: input },
        ],
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    console.error("groq request failed", err);
    throw httpError(502, "AI service is unreachable. Try again later.", "AI_UPSTREAM_ERROR");
  }
  clearTimeout(timer);

  if (!res.ok) {
    console.error("groq upstream status", res.status);
    if (res.status === 401 || res.status === 403) {
      throw httpError(503, "AI enhancement is not configured correctly.", "AI_UNAVAILABLE");
    }
    throw httpError(502, "AI service failed. Try again later.", "AI_UPSTREAM_ERROR");
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw httpError(502, "AI service returned an invalid response.", "AI_BAD_RESPONSE");
  }

  const content = (payload as { choices?: Array<{ message?: { content?: string } }> })
    ?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw httpError(502, "AI service returned an empty response.", "AI_BAD_RESPONSE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw httpError(502, "AI service returned an invalid response.", "AI_BAD_RESPONSE");
  }

  const suggestion = suggestionSchema.safeParse(parsed);
  if (!suggestion.success) {
    console.error("groq schema mismatch", suggestion.error.issues);
    throw httpError(502, "AI service returned an unusable suggestion.", "AI_BAD_RESPONSE");
  }
  return suggestion.data;
}
