/**
 * Web search tool for Claude
 * Uses the Anthropic tool_use API with a web_search_20250305 tool.
 * Falls back to a direct search API if available.
 */

import { ENV } from "./env";

const API_URL = "https://api.anthropic.com/v1/messages";

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type SearchToolParams = {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
};

export type SearchToolResult = {
  reply: string;
  sources: SearchResult[];
  searchedFor: string[];
};

/**
 * Call Claude with web search tool enabled.
 * Claude decides when to search; results are woven into the response.
 */
export async function callClaudeWithSearch(params: SearchToolParams): Promise<SearchToolResult> {
  if (!ENV.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: params.maxTokens ?? 4096,
      system: params.system,
      messages: params.messages,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search tool error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: { query?: string };
      content?: Array<{ type: string; url?: string; title?: string; encrypted_content?: string }>;
    }>;
  };

  // Extract text reply, search queries used, and source URLs
  let reply = "";
  const sources: SearchResult[] = [];
  const searchedFor: string[] = [];

  for (const block of data.content) {
    if (block.type === "text" && block.text) {
      reply += block.text;
    }
    if (block.type === "tool_use" && block.name === "web_search" && block.input?.query) {
      searchedFor.push(block.input.query);
    }
    if (block.type === "tool_result" && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.type === "web_search_result" && item.url) {
          sources.push({
            title: item.title ?? item.url,
            url: item.url,
            snippet: "",
          });
        }
      }
    }
  }

  return { reply, sources, searchedFor };
}

/**
 * Stream Claude with web search tool enabled.
 * Yields text chunks; also returns search metadata at the end.
 */
export async function* streamClaudeWithSearch(
  params: SearchToolParams
): AsyncGenerator<
  | { type: "delta"; text: string }
  | { type: "search_query"; query: string }
  | { type: "source"; url: string; title: string }
  | { type: "done" },
  void,
  unknown
> {
  if (!ENV.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: params.maxTokens ?? 4096,
      system: params.system,
      messages: params.messages,
      stream: true,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search stream error ${response.status}: ${error}`);
  }

  if (!response.body) throw new Error("No response body");

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
      if (raw === "[DONE]") { yield { type: "done" }; return; }

      try {
        const event = JSON.parse(raw) as {
          type: string;
          delta?: { type: string; text?: string };
          content_block?: { type: string; name?: string; input?: { query?: string }; content?: Array<{ url?: string; title?: string }> };
        };

        if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
          yield { type: "delta", text: event.delta.text };
        }
        if (event.type === "content_block_start" && event.content_block?.type === "tool_use") {
          if (event.content_block.input?.query) {
            yield { type: "search_query", query: event.content_block.input.query };
          }
        }
        if (event.type === "content_block_start" && event.content_block?.type === "tool_result") {
          const items = event.content_block.content ?? [];
          for (const item of items) {
            if (item.url) yield { type: "source", url: item.url, title: item.title ?? item.url };
          }
        }
      } catch {
        // ignore malformed lines
      }
    }
  }
  yield { type: "done" };
}
