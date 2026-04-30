/**
 * NeuroLinked Brain Bridge
 *
 * TypeScript HTTP client for the NeuroLinked V1.3 REST API running at
 * localhost:8000. Mantra calls this to:
 *   - Feed every conversation turn into the brain (learning)
 *   - Recall associated memories before Claude responds
 *   - Read brain state, insights, neuromodulators
 *   - Surface sleep-consolidation insights in the morning digest
 *
 * The brain is OPTIONAL — if it's not running, all methods return
 * graceful nulls and Mantra continues normally.
 */

import { ENV } from "./env";

const BRAIN_URL = process.env.NEUROLINKED_URL ?? "http://localhost:8000";
const TIMEOUT_MS = 3000; // Don't block chat if brain is slow

// ─────────────────────────────────────────────────────────────
// Types mirrored from NeuroLinked server.py response shapes
// ─────────────────────────────────────────────────────────────

export type BrainSummary = {
  status: string;
  development_stage: string;
  total_neurons: number;
  total_synapses: number;
  uptime_hours: number;
  neuromodulators: {
    dopamine: number;
    acetylcholine: number;
    norepinephrine: number;
    serotonin: number;
  };
  active_regions: string[];
  memory_count: number;
  learning_rate: number;
  attention_level: number;
};

export type BrainInsights = {
  novelty_score: number;
  energy_level: number;
  recent_patterns: string[];
  memory_replays: number;
  cross_references: Array<{ a: string; b: string; strength: number }>;
};

export type RecalledMemory = {
  id: number;
  text: string;
  source: string;
  tags: string[];
  score: number;
  created_at: number;
};

export type BrainLearned = {
  top_concepts: Array<{ concept: string; count: number }>;
  recent_memories: Array<{ text: string; source: string; ts: number }>;
  total_memories: number;
  session_memories: number;
};

export type BrainInsight = {
  ts: number;
  kind: string;
  title: string;
  body: string;
  score: number;
};

// ─────────────────────────────────────────────────────────────
// HTTP helper with timeout + graceful failure
// ─────────────────────────────────────────────────────────────

async function brainFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(`${BRAIN_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Brain not running — fail silently
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Check if the brain is reachable.
 */
export async function isBrainOnline(): Promise<boolean> {
  const result = await brainFetch<{ status: string }>("/api/claude/status");
  return result !== null;
}

/**
 * Read the full brain state summary.
 */
export async function readBrainState(): Promise<BrainSummary | null> {
  return brainFetch<BrainSummary>("/api/claude/summary");
}

/**
 * Get brain insights (novelty, energy, patterns, cross-references).
 */
export async function getBrainInsights(): Promise<BrainInsights | null> {
  return brainFetch<BrainInsights>("/api/claude/insights");
}

/**
 * Send a conversation turn to the brain for learning.
 * Called after every user message and assistant reply.
 */
export async function sendToBrain(
  content: string,
  source: "user" | "assistant" | "mantra" = "mantra",
  type: "text" | "action" | "context" = "text"
): Promise<boolean> {
  const result = await brainFetch<{ ok: boolean }>("/api/claude/observe", {
    method: "POST",
    body: JSON.stringify({ type, content, source }),
  });
  return result?.ok ?? false;
}

/**
 * Recall memories related to a query — used to inject context
 * into the Claude system prompt before responding.
 */
export async function recallMemories(
  query: string,
  limit = 5
): Promise<RecalledMemory[]> {
  const encoded = encodeURIComponent(query);
  const result = await brainFetch<{ results: RecalledMemory[] }>(
    `/api/claude/recall?q=${encoded}&limit=${limit}`
  );
  return result?.results ?? [];
}

/**
 * Get what the brain has learned — top concepts and recent memories.
 */
export async function getBrainLearned(): Promise<BrainLearned | null> {
  return brainFetch<BrainLearned>("/api/claude/learned");
}

/**
 * Save the current brain state to disk.
 */
export async function saveBrain(): Promise<boolean> {
  const result = await brainFetch<{ ok: boolean }>("/api/brain/save", { method: "POST" });
  return result?.ok ?? false;
}

/**
 * Get recent sleep-consolidation insights (for morning digest).
 */
export async function getSleepInsights(limit = 10): Promise<BrainInsight[]> {
  const result = await brainFetch<{ insights: BrainInsight[] }>(
    `/api/brain/insights/recent?limit=${limit}`
  );
  return result?.insights ?? [];
}

/**
 * Build a memory context string to inject into Claude's system prompt.
 * Returns empty string if brain is offline or no relevant memories found.
 */
export async function buildBrainMemoryContext(userMessage: string): Promise<string> {
  const memories = await recallMemories(userMessage, 4);
  if (!memories.length) return "";

  const lines = memories
    .filter((m) => m.score > 0.1) // Only surface meaningful matches
    .slice(0, 3)
    .map((m) => `- [${m.source}] ${m.text.substring(0, 200)}${m.text.length > 200 ? "…" : ""}`);

  if (!lines.length) return "";

  return `\n---\n## NeuroLinked Memory (associative recall)\nRelated memories your brain surfaced for this query:\n${lines.join("\n")}`;
}

/**
 * Full brain context for the /brain command — state + insights + learned.
 */
export async function getFullBrainContext(): Promise<{
  state: BrainSummary | null;
  insights: BrainInsights | null;
  learned: BrainLearned | null;
  online: boolean;
}> {
  const [state, insights, learned] = await Promise.all([
    readBrainState(),
    getBrainInsights(),
    getBrainLearned(),
  ]);
  return { state, insights, learned, online: state !== null };
}
