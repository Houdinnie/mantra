/**
 * Anthropic Claude API client
 * Replaces the Forge/Gemini llm.ts with direct Claude API calls.
 * Supports both standard (full response) and streaming (SSE) modes.
 */

import { ENV } from "./env";

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClaudeParams = {
  system: string;
  messages: ClaudeMessage[];
  model?: string;
  maxTokens?: number;
};

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 4096;
const API_URL = "https://api.anthropic.com/v1/messages";

function buildHeaders() {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return {
    "Content-Type": "application/json",
    "x-api-key": ENV.anthropicApiKey,
    "anthropic-version": "2023-06-01",
  };
}

/**
 * Standard (non-streaming) call — returns the full text reply.
 */
export async function callClaude(params: ClaudeParams): Promise<string> {
  const { system, messages, model = DEFAULT_MODEL, maxTokens = DEFAULT_MAX_TOKENS } = params;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Streaming call — yields text delta chunks via an async generator.
 * The caller is responsible for writing these to an SSE response.
 */
export async function* streamClaude(
  params: ClaudeParams
): AsyncGenerator<string, void, unknown> {
  const { system, messages, model = DEFAULT_MODEL, maxTokens = DEFAULT_MAX_TOKENS } = params;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic streaming error ${response.status}: ${error}`);
  }

  if (!response.body) throw new Error("No response body for streaming");

  const reader = response.body.getReader();
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
        const event = JSON.parse(raw) as {
          type: string;
          delta?: { type: string; text?: string };
        };
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          yield event.delta.text ?? "";
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}
