/**
 * Optional OpenAI-compatible chat provider, meant for free-tier endpoints.
 * Off unless LLM_PROVIDER is set (gemini | groq | openrouter | custom).
 * LLM_BASE_URL, LLM_MODEL and LLM_API_KEY override the preset values.
 */
import { ENV } from "./env";

const PRESETS: Record<string, { baseUrl: string; model: string }> = {
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.8-flash",
  },
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "" },
  custom: { baseUrl: "", model: "" },
};

export type FreeLlmConfig = { baseUrl: string; model: string; apiKey: string };

export function getFreeLlmConfig(): FreeLlmConfig | null {
  const name = ENV.llmProvider.trim().toLowerCase();
  if (!name) return null;
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown LLM_PROVIDER "${name}". Use gemini, groq, openrouter or custom.`);
  }
  const baseUrl = (ENV.llmBaseUrl || preset.baseUrl).replace(/\/$/, "");
  const model = ENV.llmModel || preset.model;
  if (!baseUrl) throw new Error("LLM_BASE_URL is required for LLM_PROVIDER=custom");
  if (!model) throw new Error(`LLM_MODEL is required for LLM_PROVIDER=${name}`);
  if (!ENV.llmApiKey) throw new Error("LLM_API_KEY is not configured");
  return { baseUrl, model, apiKey: ENV.llmApiKey };
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

function body(cfg: FreeLlmConfig, system: string, messages: Msg[], maxTokens: number, stream: boolean) {
  return JSON.stringify({
    model: cfg.model,
    max_tokens: maxTokens,
    stream,
    messages: [{ role: "system", content: system }, ...messages],
  });
}

function headers(cfg: FreeLlmConfig) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` };
}

export async function freeChat(
  cfg: FreeLlmConfig,
  system: string,
  messages: Msg[],
  maxTokens: number
): Promise<string> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: headers(cfg),
    body: body(cfg, system, messages, maxTokens, false),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function* freeChatStream(
  cfg: FreeLlmConfig,
  system: string,
  messages: Msg[],
  maxTokens: number
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: headers(cfg),
    body: body(cfg, system, messages, maxTokens, true),
  });
  if (!res.ok) throw new Error(`LLM streaming error ${res.status}: ${await res.text()}`);
  if (!res.body) throw new Error("No response body for streaming");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const ev = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
        const text = ev.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}
