import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createChatSession, getChatSession, getUserSessions, addChatMessage,
  getSessionMessages, updateSessionMetadata, incrementMessageCount, deleteChatSession,
  getUserStats, getAllMemory,
} from "../db";
import { streamClaude, callClaude } from "../_core/anthropic";
import { streamClaudeWithSearch } from "../_core/searchTool";
import { routeMessage } from "../_core/agentRouter";
import { runBoardSession, detectExecutiveRole, EXECUTIVES } from "../_core/clawCompany";
import { runMarketingAgent, runTradingAgent, runContentAgent } from "../_core/franklinAgents";
import { runMillionDollarIdea } from "../_core/millionDollarIdea";
import {
  sendToBrain,
  buildBrainMemoryContext,
  getFullBrainContext,
  recallMemories,
  isBrainOnline,
} from "../_core/neurolinked";
import {
  isGatewayOnline,
  getGatewayStatus,
  sendTask,
  deepRead,
  getFlows,
  getTaskLedger,
} from "../_core/openclawBridge";
import { nanoid } from "nanoid";
import type { Request, Response } from "express";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function buildMemoryContext(userId: number, userMessage?: string): Promise<string> {
  const [memories, brainCtx] = await Promise.all([
    getAllMemory(userId),
    userMessage ? buildBrainMemoryContext(userMessage) : Promise.resolve(""),
  ]);

  const mantraMemory = memories.length
    ? `\n---\n## User Memory\nKnown facts about this user:\n${memories.map((m) => `- ${m.key}: ${m.value}`).join("\n")}`
    : "";

  return mantraMemory + brainCtx;
}

// ─────────────────────────────────────────────────────────────
// SSE streaming endpoint
// ─────────────────────────────────────────────────────────────

export async function registerChatStream(app: import("express").Express) {
  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    const { sessionId, message, userId } = req.body as { sessionId: string; message: string; userId: number };
    if (!sessionId || !message || !userId) { res.status(400).json({ error: "Missing required fields" }); return; }

    const session = await getChatSession(sessionId);
    if (!session || session.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    await addChatMessage(sessionId, "user", message);
    await incrementMessageCount(sessionId);

    const history = await getSessionMessages(sessionId, 200);
    const prior = history.slice(0, -1).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    const routing = routeMessage(message, prior);

    // Inject memory context (Mantra memory + NeuroLinked associative recall)
    const memoryCtx = await buildMemoryContext(userId, routing.userMessage);
    const systemPrompt = routing.systemPrompt + memoryCtx;

    // Feed message into NeuroLinked brain (fire-and-forget, non-blocking)
    sendToBrain(message, "user").catch(() => {});

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Routing metadata
    send({
      type: "routing",
      persona: (routing.persona as any).name ?? "Mantra",
      personaEmoji: (routing.persona as any).emoji ?? "🤖",
      skill: routing.skill?.name ?? null,
      tier: routing.tier ?? null,
      routeType: routing.routeType,
    });

    let fullReply = "";

    try {
      // ── Board session ──────────────────────────────────────
      if (routing.routeType === "board_session") {
        send({ type: "status", text: "Convening your C-suite board session..." });
        const role = detectExecutiveRole(routing.userMessage);
        const exec = EXECUTIVES[role];
        send({ type: "status", text: `Delegating to ${exec.emoji} ${exec.title} and colleagues...` });

        const result = await runBoardSession(
          routing.userMessage,
          prior,
          ["cfo", "cto", "coo"].filter((r) => r !== role) as any
        );

        for (const c of result.contributions) {
          send({ type: "board_contribution", role: c.role, title: c.title, emoji: c.emoji, insight: c.insight });
        }

        fullReply = `## 🏛️ Board Session\n\n${result.contributions.map((c) => `### ${c.emoji} ${c.title}\n${c.insight}`).join("\n\n---\n\n")}\n\n---\n\n## 👑 CEO Synthesis\n\n${result.synthesis}`;
        send({ type: "delta", text: fullReply });

      // ── Marketing agent ────────────────────────────────────
      } else if (routing.routeType === "marketing") {
        send({ type: "status", text: "📣 Franklin Marketing Agent activated — researching your market..." });
        const plan = await runMarketingAgent({
          productDescription: routing.userMessage,
          targetAudience: "founders and entrepreneurs",
          goal: "launch",
        });
        fullReply = `## 📣 Marketing Strategy\n\n**Positioning:** ${plan.positioning}\n\n**Core Message:** ${plan.coreMessage}\n\n### Channels\n${plan.channels.map((c) => `**${c.channel}**\n${c.tactics.map((t) => `- ${t}`).join("\n")}\nKPIs: ${c.kpis.join(", ")}`).join("\n\n")}\n\n### 4-Week Content Calendar\n${plan.contentCalendar.map((w) => `**Week ${w.week} — ${w.theme}:** ${w.formats.join(", ")}`).join("\n")}\n\n### First Action\n${plan.firstAction}${plan.sources.length ? `\n\n**Sources:** ${plan.sources.map((s) => `[${s.title}](${s.url})`).join(", ")}` : ""}`;
        send({ type: "delta", text: fullReply });

      // ── Trading agent ──────────────────────────────────────
      } else if (routing.routeType === "trading") {
        send({ type: "status", text: "📊 Franklin Trading Agent activated — researching markets..." });
        const research = await runTradingAgent({ asset: routing.userMessage, context: routing.userMessage });
        const sentimentEmoji = research.sentiment === "bullish" ? "🟢" : research.sentiment === "bearish" ? "🔴" : "🟡";
        fullReply = `## 📊 Trading Research: ${research.asset}\n\n${sentimentEmoji} **Sentiment:** ${research.sentiment.toUpperCase()} (${research.confidence} confidence)\n\n### Key Levels\n**Support:** ${research.keyLevels.support.join(", ") || "N/A"}\n**Resistance:** ${research.keyLevels.resistance.join(", ") || "N/A"}\n\n### Catalysts\n${research.catalysts.map((c) => `- ${c}`).join("\n")}\n\n### Risks\n${research.risks.map((r) => `- ${r}`).join("\n")}\n\n### Recommendation\n${research.recommendation}\n\n> ⚠️ ${research.disclaimer}${research.sources.length ? `\n\n**Sources:** ${research.sources.map((s) => `[${s.title}](${s.url})`).join(", ")}` : ""}`;
        send({ type: "delta", text: fullReply });

      // ── Task dispatch → OpenClaw ───────────────────────────
      } else if (routing.routeType === "task_dispatch") {
        const taskText = routing.userMessage;
        send({ type: "status", text: "🦞 Dispatching to OpenClaw gateway..." });

        const online = await isGatewayOnline();
        if (!online) {
          fullReply = `## 🦞 OpenClaw — Offline\n\nThe OpenClaw gateway is not running.\n\nStart it with:\n\`\`\`\nopenclaw start\n\`\`\`\nThen set \`OPENCLAW_URL=http://localhost:18789\` and \`OPENCLAW_TOKEN=your-token\` in your \`.env\`.\n\nOnce running, \`/task\` will dispatch natural language tasks to OpenClaw for autonomous execution — shell commands, file operations, browser automation, messaging, and more.`;
        } else {
          const result = await sendTask(taskText, "main", false);
          const status = await getGatewayStatus();
          const [flows, ledger] = await Promise.all([getFlows(), getTaskLedger(5)]);

          if (!result?.ok) {
            fullReply = `## 🦞 Task Failed\n\nFailed to dispatch task to OpenClaw. Check the gateway logs.`;
          } else {
            const recentRuns = ledger.slice(0, 3).map(e =>
              `- **${e.flowName}** — ${e.status} ${e.completedAt ? `(${Math.round((e.completedAt - e.startedAt) / 1000)}s)` : "(running)"}`
            ).join("\n");

            fullReply = `## 🦞 Task Dispatched\n\n**Task:** ${taskText}\n**Message ID:** \`${result.messageId ?? "pending"}\`\n**Status:** Queued for autonomous execution\n\nOpenClaw will execute this using its available tools (shell, browser, file system, messaging). Check the Tasks dashboard for live status.\n\n${flows.length ? `**Active flows:** ${flows.length}` : ""}\n${recentRuns ? `\n**Recent runs:**\n${recentRuns}` : ""}`;
          }
        }
        send({ type: "delta", text: fullReply });

      // ── DeepRead → OpenClaw DeepReeder ────────────────────
      } else if (routing.routeType === "deep_read") {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = routing.userMessage.match(urlRegex) ?? [];

        if (!urls.length) {
          fullReply = `## 🔍 DeepRead\n\nNo URLs found in your message. Usage:\n\`\`\`\n/deepread https://example.com/article\n/deepread https://x.com/user/status/123 https://reddit.com/r/...\n\`\`\`\nDeepReader scrapes the content, converts to clean Markdown, and saves it to your OpenClaw agent's memory — searchable in future conversations.`;
        } else {
          send({ type: "status", text: `📥 Ingesting ${urls.length} URL${urls.length > 1 ? "s" : ""} via DeepReeder...` });
          const online = await isGatewayOnline();
          if (!online) {
            fullReply = `## 🔍 DeepRead — OpenClaw Offline\n\nStart OpenClaw first: \`openclaw start\`\n\nURLs to ingest when it's running:\n${urls.map(u => `- ${u}`).join("\n")}`;
          } else {
            const result = await deepRead(urls);
            fullReply = result?.ok
              ? `## 🔍 DeepRead — Ingesting ${urls.length} URL${urls.length > 1 ? "s" : ""}\n\n${urls.map(u => `- 📄 \`${u}\``).join("\n")}\n\nOpenClaw is scraping and saving these to memory. You can \`/recall\` the content in future sessions.\n\n**Message ID:** \`${result.messageId ?? "queued"}\``
              : `## 🔍 DeepRead — Failed\n\nCould not dispatch to OpenClaw. Check the gateway.`;
          }
        }
        send({ type: "delta", text: fullReply });

      // ── Brain status ───────────────────────────────────────
      } else if (routing.routeType === "brain_status") {
        send({ type: "status", text: "🧠 Connecting to NeuroLinked brain..." });
        const ctx = await getFullBrainContext();

        if (!ctx.online) {
          fullReply = `## 🧠 NeuroLinked Brain — Offline\n\nThe NeuroLinked brain is not running. Start it with:\n\`\`\`\ncd neurolinked && ./start.sh\n\`\`\`\nOnce running at \`localhost:8000\`, Mantra will automatically connect and start feeding your conversations into it.`;
        } else {
          const s = ctx.state!;
          const nm = s.neuromodulators;
          const i = ctx.insights;
          const l = ctx.learned;
          fullReply = `## 🧠 NeuroLinked Brain — ${s.development_stage}

**Status:** Online · ${(s.uptime_hours).toFixed(1)}h uptime
**Scale:** ${s.total_neurons.toLocaleString()} neurons · ${s.total_synapses.toLocaleString()} synapses
**Memories:** ${s.memory_count.toLocaleString()} stored · Learning rate: ${(s.learning_rate * 100).toFixed(1)}%
**Attention:** ${(s.attention_level * 100).toFixed(0)}%

### Neuromodulators
| | Level |
|---|---|
| 🟡 Dopamine (reward/learning) | ${(nm.dopamine * 100).toFixed(0)}% |
| 🔵 Acetylcholine (attention) | ${(nm.acetylcholine * 100).toFixed(0)}% |
| 🔴 Norepinephrine (arousal) | ${(nm.norepinephrine * 100).toFixed(0)}% |
| 🟢 Serotonin (calm) | ${(nm.serotonin * 100).toFixed(0)}% |

### Active Regions
${s.active_regions.map((r) => `- ${r}`).join("\n") || "- None currently active"}

${i?.recent_patterns?.length ? `### Recent Patterns\n${i.recent_patterns.slice(0, 3).map((p) => `- ${p}`).join("\n")}` : ""}

${l?.top_concepts?.length ? `### Top Concepts Learned\n${l.top_concepts.slice(0, 5).map((c) => `- **${c.concept}** (×${c.count})`).join("\n")}` : ""}

${i?.cross_references?.length ? `### Cross-References Found\n${i.cross_references.slice(0, 3).map((r) => `- "${r.a}" ↔ "${r.b}" (strength: ${(r.strength).toFixed(2)})`).join("\n")}` : ""}`;
        }
        send({ type: "delta", text: fullReply });

      // ── Brain recall ───────────────────────────────────────
      } else if (routing.routeType === "brain_recall") {
        const query = routing.userMessage || message;
        send({ type: "status", text: `🧠 Recalling memories for: "${query}"...` });
        const memories = await recallMemories(query, 10);

        if (!memories.length) {
          fullReply = `## 🧠 Brain Recall — No Results\n\nNo memories found matching "${query}".\n\nThe brain stores everything you feed it through conversations. Keep chatting and it will build up an associative knowledge base you can search.`;
        } else {
          const memLines = memories.map((m, i) =>
            `### ${i + 1}. Score: ${(m.score).toFixed(3)} · Source: ${m.source}\n${m.text}${m.tags?.length ? `\n*Tags: ${m.tags.join(", ")}*` : ""}`
          ).join("\n\n---\n\n");
          fullReply = `## 🧠 Brain Recall — "${query}"\n\nFound ${memories.length} related memories:\n\n${memLines}`;
        }
        send({ type: "delta", text: fullReply });

      // ── Million Dollar Idea ────────────────────────────────
      } else if (routing.routeType === "milliondollaridea") {
        send({ type: "status", text: "💡 Convening board ideation session — CEO, CFO, and CMO thinking..." });

        // Parse context from the message
        const contextText = routing.userMessage;
        const context = {
          rawContext: contextText || undefined,
          skills: contextText.match(/skills?[:\s]+([^.]+)/i)?.[1],
          audience: contextText.match(/audience[:\s]+([^.]+)/i)?.[1],
          constraints: contextText.match(/constraints?[:\s]+([^.]+)/i)?.[1],
          industries: contextText.match(/industr(?:y|ies)[:\s]+([^.]+)/i)?.[1],
        };

        send({ type: "status", text: "🧠 CEO generating 5 raw ideas..." });
        const result = await runMillionDollarIdea(context);
        send({ type: "status", text: "💹 CFO scoring unit economics..." });
        send({ type: "status", text: "📣 CMO validating market demand..." });
        send({ type: "status", text: "🔍 Web-validating top idea..." });

        // Format as rich markdown
        const ideaLines = result.ideas.map((idea, i) => {
          const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
          const complexity = { weekend: "⚡ Weekend build", "1-month": "📅 1-month build", "3-months": "🏗️ 3-month build" }[idea.buildComplexity];
          return `## ${rank} #${i + 1}: ${idea.name}
**Score:** ${idea.overallScore ?? "—"}/10 · CFO: ${idea.cfoScore}/10 · CMO: ${idea.cmoScore}/10 · ${complexity}

**Problem:** ${idea.problem}
**Solution:** ${idea.solution}
**Community:** ${idea.community}
**Revenue model:** ${idea.revenueModel}
**Estimated MRR:** ${idea.estimatedMRR}
**Time to first revenue:** ${idea.timeToFirstRevenue}
**Why now:** ${idea.whyNow}

✅ **First action:** ${idea.firstAction}`;
        }).join("\n\n---\n\n");

        const validation = result.topIdeaValidation;
        const validationSection = `## 🔍 Market Validation: ${result.ideas[0]?.name ?? "Top Idea"}

**Market size:** ${validation.marketSize}
**Competitors:** ${validation.competitors.join(", ") || "None identified"}
**Whitespace:** ${validation.whitespace}
**Validation step:** ${validation.validationStep}${validation.sources.length ? `\n**Sources:** ${validation.sources.map((s) => `[${s.title}](${s.url})`).join(", ")}` : ""}`;

        fullReply = `# 💡 Million Dollar Idea — Board Session Results

${result.boardSummary}

---

${ideaLines}

---

${validationSection}`;

        send({ type: "delta", text: fullReply });

      // ── Content agent ──────────────────────────────────────
      } else if (routing.routeType === "content") {
        send({ type: "status", text: "✍️ Franklin Content Agent writing..." });
        const content = await runContentAgent({
          format: "blog_post",
          topic: routing.userMessage,
          audience: "founders and entrepreneurs",
          includeResearch: true,
        });
        fullReply = `## ✍️ ${content.title}\n\n${content.estimatedReadTime ? `*${content.estimatedReadTime}*\n\n` : ""}${content.content}${content.callToAction ? `\n\n---\n**CTA:** ${content.callToAction}` : ""}`;
        send({ type: "delta", text: fullReply });

      // ── Web search mode ────────────────────────────────────
      } else if (routing.routeType === "web_search" || routing.useWebSearch) {
        send({ type: "status", text: "🔍 Searching the web..." });
        const messages = [...prior, { role: "user" as const, content: routing.userMessage }];
        const stream = streamClaudeWithSearch({ system: systemPrompt, messages });
        for await (const event of stream) {
          if (event.type === "delta") { fullReply += event.text; send({ type: "delta", text: event.text }); }
          else if (event.type === "search_query") { send({ type: "status", text: `🔍 Searching: ${event.query}` }); }
          else if (event.type === "source") { send({ type: "source", url: event.url, title: event.title }); }
          else if (event.type === "done") break;
        }

      // ── Sandbox redirect ───────────────────────────────────
      } else if (routing.routeType === "sandbox_redirect") {
        const task = routing.userMessage;
        fullReply = `## 🖥️ Opening Sandbox\n\n${task ? `Task queued: **${task}**\n\n` : ""}Opening the Mantra Sandbox — an isolated Linux environment where the agent will autonomously write and execute code to complete your task.\n\n→ Redirecting to Sandbox...`;
        send({ type: "delta", text: fullReply });
        send({ type: "redirect", url: "/sandbox", task });

      // ── Standard streaming ─────────────────────────────────
      } else {
        const messages = [...prior, { role: "user" as const, content: routing.userMessage }];
        const stream = streamClaude({ system: systemPrompt, messages });
        for await (const chunk of stream) {
          fullReply += chunk;
          send({ type: "delta", text: chunk });
        }
      }

      await addChatMessage(sessionId, "assistant", fullReply);
      await incrementMessageCount(sessionId);
      await updateSessionMetadata(sessionId, message.substring(0, 80), fullReply);

      // Feed assistant reply into brain (non-blocking)
      sendToBrain(fullReply, "assistant").catch(() => {});

      send({ type: "done" });

    } catch (error) {
      console.error("[Chat Stream] Error:", error);
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      send({ type: "error", message: errMsg });
    } finally {
      res.end();
    }
  });
}

// ─────────────────────────────────────────────────────────────
// tRPC router
// ─────────────────────────────────────────────────────────────

export const chatRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({ sessionId: z.string(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { sessionId, message } = input;
      const session = await getChatSession(sessionId);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      if (session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      try {
        await addChatMessage(sessionId, "user", message);
        await incrementMessageCount(sessionId);
        const history = await getSessionMessages(sessionId, 200);
        const prior = history.slice(0, -1).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const routing = routeMessage(message, prior);
        const memoryCtx = await buildMemoryContext(ctx.user.id);
        const systemPrompt = routing.systemPrompt + memoryCtx;

        const reply = await callClaude({ system: systemPrompt, messages: [...prior, { role: "user", content: routing.userMessage }] });
        await addChatMessage(sessionId, "assistant", reply);
        await incrementMessageCount(sessionId);
        await updateSessionMetadata(sessionId, message.substring(0, 80), reply);
        return { sessionId, reply, persona: (routing.persona as any).name ?? "Mantra", skill: routing.skill?.name ?? null, success: true };
      } catch (error) {
        console.error("[Chat] LLM error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to process your message" });
      }
    }),

  createSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const sessionId = `s_${nanoid(12)}_${Date.now()}`;
    try {
      await createChatSession(ctx.user.id, sessionId);
      return { sessionId, userId: ctx.user.id, success: true };
    } catch (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session" });
    }
  }),

  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.string(), limit: z.number().default(200) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const session = await getChatSession(input.sessionId);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getSessionMessages(input.sessionId, input.limit);
    }),

  getSessions: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getUserSessions(ctx.user.id, input.limit);
    }),

  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const session = await getChatSession(input.sessionId);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteChatSession(input.sessionId);
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getUserStats(ctx.user.id);
  }),
});
