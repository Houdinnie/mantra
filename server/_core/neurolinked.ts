/**
 * NeuroLinked Brain Bridge — with embedded fallback
 *
 * Tries the NeuroLinked REST API first (localhost:8000).
 * If offline, falls back to the in-process embedded memory store.
 * The embedded store uses TF-IDF recall and works with zero setup.
 *
 * Callers never need to check which mode is active — the API is identical.
 */

import { ENV } from "./env";
import {
  embeddedObserve,
  embeddedRecall,
  embeddedBuildContext,
  embeddedGetLearned,
  embeddedGetStatus,
  embeddedGetInsights,
  isEmbeddedMemoryOnline,
} from "./embeddedMemory";

const BRAIN_URL = process.env.NEUROLINKED_URL ?? "http://localhost:8000";
const TIMEOUT_MS = 2000; // Short timeout — fall back fast

// ─────────────────────────────────────────────────────────────
// Types
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
  created_at?: number;
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
// NeuroLinked HTTP helper — fails fast
// ─────────────────────────────────────────────────────────────

let _neuroOnline: boolean | null = null;
let _lastCheck = 0;
const CHECK_INTERVAL = 30_000; // re-check every 30s

async function checkNeuroOnline(): Promise<boolean> {
  const now = Date.now();
  if (_neuroOnline !== null && now - _lastCheck < CHECK_INTERVAL)
    return _neuroOnline;
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(`${BRAIN_URL}/api/claude/status`, {
      signal: ctrl.signal,
    });
    _neuroOnline = res.ok;
  } catch {
    _neuroOnline = false;
  }
  _lastCheck = now;
  return _neuroOnline;
}

async function neuroFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(`${BRAIN_URL}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Public API — same interface regardless of mode
// ─────────────────────────────────────────────────────────────

export async function isBrainOnline(): Promise<boolean> {
  return true; // embedded is always online
}

export async function isNeuroLinkedOnline(): Promise<boolean> {
  return checkNeuroOnline();
}

export async function readBrainState(): Promise<BrainSummary | null> {
  if (await checkNeuroOnline()) {
    const r = await neuroFetch<BrainSummary>("/api/claude/summary");
    if (r) return r;
  }
  return embeddedGetStatus() as BrainSummary;
}

export async function getBrainInsights(): Promise<BrainInsights | null> {
  if (await checkNeuroOnline()) {
    const r = await neuroFetch<BrainInsights>("/api/claude/insights");
    if (r) return r;
  }
  return embeddedGetInsights();
}

export async function sendToBrain(
  content: string,
  source: "user" | "assistant" | "mantra" = "mantra",
  type: "text" | "action" | "context" = "text"
): Promise<boolean> {
  // Always store in embedded memory (cheap, instant)
  embeddedObserve(content, source);

  // Also try NeuroLinked if online (best effort, non-blocking)
  if (await checkNeuroOnline()) {
    neuroFetch<{ ok: boolean }>("/api/claude/observe", {
      method: "POST",
      body: JSON.stringify({ type, content, source }),
    }).catch(() => {});
  }

  return true;
}

export async function recallMemories(
  query: string,
  limit = 5
): Promise<RecalledMemory[]> {
  if (await checkNeuroOnline()) {
    const encoded = encodeURIComponent(query);
    const r = await neuroFetch<{ results: RecalledMemory[] }>(
      `/api/claude/recall?q=${encoded}&limit=${limit}`
    );
    if (r?.results?.length) return r.results;
  }
  // Embedded fallback
  return embeddedRecall(query, limit);
}

export async function getBrainLearned(): Promise<BrainLearned | null> {
  if (await checkNeuroOnline()) {
    const r = await neuroFetch<BrainLearned>("/api/claude/learned");
    if (r) return r;
  }
  return embeddedGetLearned();
}

export async function saveBrain(): Promise<boolean> {
  if (await checkNeuroOnline()) {
    const r = await neuroFetch<{ ok: boolean }>("/api/brain/save", {
      method: "POST",
    });
    if (r?.ok) return true;
  }
  return true; // embedded is in-process, no explicit save needed
}

export async function getSleepInsights(limit = 10): Promise<BrainInsight[]> {
  if (await checkNeuroOnline()) {
    const r = await neuroFetch<{ insights: BrainInsight[] }>(
      `/api/brain/insights/recent?limit=${limit}`
    );
    if (r?.insights?.length) return r.insights;
  }
  return []; // embedded doesn't do sleep consolidation yet
}

export async function buildBrainMemoryContext(
  userMessage: string
): Promise<string> {
  if (await checkNeuroOnline()) {
    const memories = await recallMemories(userMessage, 4);
    if (memories.length) {
      const lines = memories
        .filter(m => m.score > 0.1)
        .slice(0, 3)
        .map(
          m =>
            `- [${m.source}] ${m.text.substring(0, 200)}${m.text.length > 200 ? "…" : ""}`
        );
      if (lines.length) {
        return `\n---\n## NeuroLinked Memory (associative recall)\n${lines.join("\n")}`;
      }
    }
  }
  // Embedded fallback
  return embeddedBuildContext(userMessage);
}

export async function getFullBrainContext(): Promise<{
  state: BrainSummary | null;
  insights: BrainInsights | null;
  learned: BrainLearned | null;
  online: boolean;
  mode: "neurolinked" | "embedded";
}> {
  const neuroOnline = await checkNeuroOnline();
  const [state, insights, learned] = await Promise.all([
    readBrainState(),
    getBrainInsights(),
    getBrainLearned(),
  ]);
  return {
    state,
    insights,
    learned,
    online: true,
    mode: neuroOnline ? "neurolinked" : "embedded",
  };
}
