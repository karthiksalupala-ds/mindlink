/**
 * Groq client — models that work on YOUR account
 */

const GROQ_URL = "https://api.groq.com/openai/v1";

// Only models from your Groq console
const DEFAULT_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
];

export function getGroqKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

export async function groqChat(
  messages: { role: string; content: string }[],
  options?: { model?: string; temperature?: number }
): Promise<string> {
  const key = getGroqKey();
  if (!key) {
    throw new Error("GROQ_API_KEY missing — add it to .env.local");
  }

  const models = options?.model
    ? [options.model, ...DEFAULT_MODELS.filter((m) => m !== options.model)]
    : DEFAULT_MODELS;

  let lastError = "";

  for (const model of models) {
    try {
      const res = await fetch(`${GROQ_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: 1200,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        lastError = `${model}: ${res.status} ${err}`;
        if (res.status === 404 || err.includes("model_not_found")) continue;
        throw new Error(`Groq error: ${res.status} ${err}`);
      }

      const data = await res.json();
      console.log("[Groq] using model:", model);
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (e: any) {
      lastError = e?.message || String(e);
      if (String(lastError).includes("model_not_found") || String(lastError).includes("404")) {
        continue;
      }
      throw e;
    }
  }

  throw new Error(`Groq: no available model. Last error: ${lastError}`);
}

export async function groqTTS(
  text: string,
  voice = "troy"
): Promise<ArrayBuffer | null> {
  const key = getGroqKey();
  if (!key) return null;

  try {
    const res = await fetch(`${GROQ_URL}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text.slice(0, 500),
        voice,
        response_format: "wav",
      }),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}