/**
 * OpenClaw Gateway Bridge
 *
 * TypeScript client for the OpenClaw gateway (default: localhost:18789).
 * Exposes:
 *   - sendTask()        → POST /api/sessions/main/messages  (fire a task)
 *   - invokeTool()      → POST /tools/invoke                (direct tool exec)
 *   - chatCompletion()  → POST /v1/chat/completions         (OpenAI-compat)
 *   - getStatus()       → GET  /api/status
 *   - getFlows()        → GET  /api/flows
 *   - createFlow()      → POST /api/flows
 *   - triggerFlow()     → POST /api/flows/:id/trigger
 *   - getTaskLedger()   → GET  /api/flows/ledger
 *   - deepRead()        → sends a DeepReeder skill invocation as a task
 *
 * All methods degrade gracefully — if OpenClaw isn't running they return null.
 * Set OPENCLAW_URL and OPENCLAW_TOKEN in .env.
 */

const GATEWAY_URL = process.env.OPENCLAW_URL ?? "http://localhost:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_TOKEN ?? "";
const TIMEOUT_MS = 8000;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type OpenClawStatus = {
  ok: boolean;
  version: string;
  uptime: number;
  sessions: number;
  activeFlows: number;
  model: string;
  channels: string[];
};

export type TaskResult = {
  ok: boolean;
  messageId?: string;
  response?: string;
  pending?: boolean;
};

export type ToolInvokeResult = {
  ok: boolean;
  output?: string;
  exitCode?: number;
  error?: string;
};

export type FlowDefinition = {
  id?: string;
  name: string;
  description?: string;
  trigger: "manual" | "cron" | "webhook" | "message";
  cronExpression?: string;    // e.g. "0 8 * * *" for 8am daily
  webhookPath?: string;
  messagePattern?: string;    // regex to match on incoming messages
  steps: FlowStep[];
  enabled?: boolean;
};

export type FlowStep = {
  id: string;
  type: "message" | "tool" | "condition" | "wait";
  content?: string;           // message to send to agent
  tool?: string;              // tool name for type=tool
  toolArgs?: Record<string, unknown>;
  condition?: string;         // JS expression for type=condition
  waitMs?: number;            // for type=wait
  onSuccess?: string;         // next step id
  onFailure?: string;
};

export type LedgerEntry = {
  id: string;
  flowId: string;
  flowName: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: number;
  completedAt?: number;
  output?: string;
  error?: string;
};

// ─────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────

async function clawFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (GATEWAY_TOKEN) {
      headers["Authorization"] = `Bearer ${GATEWAY_TOKEN}`;
    }
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`[OpenClaw] ${options.method ?? "GET"} ${path} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      // Only log unexpected errors, not timeout/offline
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Connection
// ─────────────────────────────────────────────────────────────

export async function isGatewayOnline(): Promise<boolean> {
  const result = await clawFetch<{ ok: boolean }>("/api/status");
  return result?.ok === true;
}

export async function getGatewayStatus(): Promise<OpenClawStatus | null> {
  return clawFetch<OpenClawStatus>("/api/status");
}

// ─────────────────────────────────────────────────────────────
// Task dispatch — send a natural language task to the agent
// ─────────────────────────────────────────────────────────────

/**
 * Send a task message to the main OpenClaw session.
 * The agent will execute it autonomously using its available tools/skills.
 * Returns immediately with a messageId; the agent works in the background.
 */
export async function sendTask(
  task: string,
  sessionKey = "main",
  waitForResponse = false
): Promise<TaskResult | null> {
  const result = await clawFetch<{ ok: boolean; messageId: string; response?: string }>(
    `/api/sessions/${sessionKey}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        message: task,
        waitForResponse,
        timeoutMs: waitForResponse ? 30000 : undefined,
      }),
    }
  );
  if (!result) return null;
  return {
    ok: result.ok,
    messageId: result.messageId,
    response: result.response,
    pending: !waitForResponse,
  };
}

// ─────────────────────────────────────────────────────────────
// Direct tool invocation (no LLM round-trip)
// ─────────────────────────────────────────────────────────────

/**
 * Invoke an OpenClaw tool directly without going through the LLM.
 * Useful for scripted automations: run shell commands, write files, etc.
 */
export async function invokeTool(
  toolName: string,
  args: Record<string, unknown> = {}
): Promise<ToolInvokeResult | null> {
  return clawFetch<ToolInvokeResult>("/tools/invoke", {
    method: "POST",
    body: JSON.stringify({ tool: toolName, args }),
  });
}

// ─────────────────────────────────────────────────────────────
// OpenAI-compatible completions (routes through OpenClaw agent)
// ─────────────────────────────────────────────────────────────

export async function clawCompletion(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  model = "openclaw:main"
): Promise<string | null> {
  const result = await clawFetch<{
    choices: Array<{ message: { content: string } }>;
  }>("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({ model, messages, stream: false }),
  });
  return result?.choices?.[0]?.message?.content ?? null;
}

// ─────────────────────────────────────────────────────────────
// Flows — SQLite-backed task automation (2026.3.31+)
// ─────────────────────────────────────────────────────────────

export async function getFlows(): Promise<FlowDefinition[]> {
  const result = await clawFetch<{ flows: FlowDefinition[] }>("/api/flows");
  return result?.flows ?? [];
}

export async function createFlow(flow: FlowDefinition): Promise<FlowDefinition | null> {
  return clawFetch<FlowDefinition>("/api/flows", {
    method: "POST",
    body: JSON.stringify(flow),
  });
}

export async function updateFlow(
  id: string,
  updates: Partial<FlowDefinition>
): Promise<FlowDefinition | null> {
  return clawFetch<FlowDefinition>(`/api/flows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteFlow(id: string): Promise<boolean> {
  const result = await clawFetch<{ ok: boolean }>(`/api/flows/${id}`, {
    method: "DELETE",
  });
  return result?.ok ?? false;
}

export async function triggerFlow(
  id: string,
  input?: Record<string, unknown>
): Promise<{ runId: string } | null> {
  return clawFetch<{ runId: string }>(`/api/flows/${id}/trigger`, {
    method: "POST",
    body: JSON.stringify({ input: input ?? {} }),
  });
}

export async function getTaskLedger(limit = 50): Promise<LedgerEntry[]> {
  const result = await clawFetch<{ entries: LedgerEntry[] }>(
    `/api/flows/ledger?limit=${limit}`
  );
  return result?.entries ?? [];
}

export async function getFlowRun(runId: string): Promise<LedgerEntry | null> {
  return clawFetch<LedgerEntry>(`/api/flows/runs/${runId}`);
}

// ─────────────────────────────────────────────────────────────
// DeepReeder — ingest any URL into agent memory
// ─────────────────────────────────────────────────────────────

/**
 * Feed one or more URLs to the OpenClaw DeepReeder skill.
 * Scrapes content, converts to clean Markdown, saves to agent memory.
 * Requires DeepReeder skill installed: clawhub install deepreeder
 */
export async function deepRead(
  urls: string[],
  sessionKey = "main"
): Promise<TaskResult | null> {
  const urlList = urls.join("\n");
  const task = `Read and save the following URLs to memory using the DeepReeder skill:\n\n${urlList}`;
  return sendTask(task, sessionKey, false);
}

// ─────────────────────────────────────────────────────────────
// Pre-built task templates — common automations
// ─────────────────────────────────────────────────────────────

export const TASK_TEMPLATES = {
  /** Daily morning briefing sent to WhatsApp/Telegram */
  morningBriefing: (channels: string[]): FlowDefinition => ({
    name: "Morning Briefing",
    description: "Sends a daily morning briefing with news, tasks, and priorities",
    trigger: "cron",
    cronExpression: "0 7 * * *",
    steps: [
      {
        id: "brief",
        type: "message",
        content: `/digest Send this as a morning briefing message to ${channels.join(", ")}`,
        onSuccess: "done",
      },
      { id: "done", type: "wait", waitMs: 0 },
    ],
    enabled: true,
  }),

  /** Monitor a URL for changes, notify on change */
  urlMonitor: (url: string, checkEveryHours = 6): FlowDefinition => ({
    name: `Monitor: ${url.substring(0, 40)}`,
    description: `Check ${url} every ${checkEveryHours}h and alert on changes`,
    trigger: "cron",
    cronExpression: `0 */${checkEveryHours} * * *`,
    steps: [
      {
        id: "read",
        type: "message",
        content: `Read ${url} and check if anything has changed since the last time you read it. If significant changes are detected, summarise them and send a notification.`,
        onSuccess: "done",
      },
      { id: "done", type: "wait", waitMs: 0 },
    ],
    enabled: true,
  }),

  /** Research a topic and save findings to memory */
  researchTask: (topic: string): FlowDefinition => ({
    name: `Research: ${topic.substring(0, 40)}`,
    description: `Deep research on: ${topic}`,
    trigger: "manual",
    steps: [
      {
        id: "search",
        type: "message",
        content: `/research ${topic} — find the top 5 sources, summarise key findings, and save everything to memory.`,
        onSuccess: "done",
      },
      { id: "done", type: "wait", waitMs: 0 },
    ],
    enabled: true,
  }),

  /** Trading alert — check an asset on schedule */
  tradingAlert: (asset: string, cronExpr = "0 9,17 * * 1-5"): FlowDefinition => ({
    name: `Trading Alert: ${asset}`,
    description: `Check ${asset} price and signals at market open/close`,
    trigger: "cron",
    cronExpression: cronExpr,
    steps: [
      {
        id: "check",
        type: "message",
        content: `/trading ${asset} — check current price, key levels, and any breaking news. Send a brief update.`,
        onSuccess: "done",
      },
      { id: "done", type: "wait", waitMs: 0 },
    ],
    enabled: true,
  }),
};
