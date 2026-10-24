import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getMemory, setMemory, getAllMemory, deleteMemory,
  createNote, getNotes, updateNote, deleteNote,
} from "../db";
import { callClaude } from "../_core/anthropic";
import { getUserStats, getUserSessions } from "../db";
import { getSleepInsights, isBrainOnline } from "../_core/neurolinked";

// ─────────────────────────────────────────────────────────────
// Memory router
// ─────────────────────────────────────────────────────────────

export const memoryRouter = router({
  get: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return { key: input.key, value: await getMemory(ctx.user.id, input.key) };
    }),

  set: protectedProcedure
    .input(z.object({ key: z.string().min(1).max(255), value: z.string().max(5000) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await setMemory(ctx.user.id, input.key, input.value);
      return { success: true };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getAllMemory(ctx.user.id);
  }),

  delete: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await deleteMemory(ctx.user.id, input.key);
      return { success: true };
    }),
});

// ─────────────────────────────────────────────────────────────
// Notes router
// ─────────────────────────────────────────────────────────────

export const notesRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      content: z.string(),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await createNote(ctx.user.id, input.title, input.content, input.tags);
      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getNotes(ctx.user.id, input.search);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      tags: z.array(z.string()).optional(),
      pinned: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { id, ...updates } = input;
      await updateNote(id, ctx.user.id, updates);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await deleteNote(input.id, ctx.user.id);
      return { success: true };
    }),

  /** AI-powered note from conversation: summarise and save */
  saveFromChat: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      instructions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { getSessionMessages } = await import("../db");
      const messages = await getSessionMessages(input.sessionId, 100);
      if (!messages.length) throw new TRPCError({ code: "NOT_FOUND", message: "No messages in session" });

      const transcript = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
      const instructions = input.instructions ?? "Extract the key decisions, action items, and insights from this conversation.";

      const summary = await callClaude({
        system: `You summarise conversations into concise, well-structured markdown notes. 
Output format:
# [Title — 5 words max]

## Key Decisions
- ...

## Action Items
- [ ] ...

## Key Insights
- ...

## Notes
[any other relevant info]

Be extremely concise. No filler.`,
        messages: [{ role: "user", content: `${instructions}\n\n---\n\n${transcript}` }],
        maxTokens: 1024,
      });

      const titleMatch = summary.match(/^#\s+(.+)$/m);
      const title = titleMatch?.[1]?.trim() ?? "Session Note";
      await createNote(ctx.user.id, title, summary, ["from-chat"]);
      return { success: true, title };
    }),
});

// ─────────────────────────────────────────────────────────────
// Morning digest router
// ─────────────────────────────────────────────────────────────

const DIGEST_SYSTEM = `You are Mantra's Morning Digest agent. You generate a concise, personalised daily briefing for a global founder and digital nomad. 

Your briefing style:
- Direct, no fluff — every line earns its place
- Actionable: each item has a clear implication for today
- Prioritised: most urgent items first
- Formatted in clean markdown

Structure:
## ☀️ Morning Digest — [Day, Date]

### 🔴 Urgent (act today)
### 🟡 This Week  
### 🟢 On Radar
### 💡 Insight of the Day

Keep total length under 300 words.`;

export const digestRouter = router({
  generate: protectedProcedure
    .input(z.object({ context: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const stats = await getUserStats(ctx.user.id);
      const memories = await getAllMemory(ctx.user.id);
      const memoryCtx = memories.length
        ? `Known facts about this user:\n${memories.map((m) => `- ${m.key}: ${m.value}`).join("\n")}`
        : "";

      // Pull NeuroLinked sleep insights if brain is online
      const brainOnline = await isBrainOnline();
      let brainInsightCtx = "";
      if (brainOnline) {
        const [sleepInsights, learned] = await Promise.all([
          getSleepInsights(5),
          getBrainLearned(),
        ]);
        if (sleepInsights.length) {
          brainInsightCtx = `\nNeuroLinked sleep consolidation surfaced these insights while you were away:\n${sleepInsights.map((i) => `- [${i.kind}] ${i.title}: ${i.body}`).join("\n")}`;
        }
        if (learned?.top_concepts?.length) {
          brainInsightCtx += `\nTop concepts your brain has been processing: ${learned.top_concepts.slice(0, 5).map((c) => c.concept).join(", ")}`;
        }
      }

      const prompt = `Generate a morning briefing.
User: ${ctx.user.name ?? "Founder"}
Chat history: ${stats.totalSessions} sessions, ${stats.totalMessages} messages
Last active: ${stats.lastActive ? new Date(stats.lastActive).toDateString() : "Unknown"}
${memoryCtx}
${brainInsightCtx}
${input.context ? `Additional context: ${input.context}` : ""}
${brainOnline ? "NeuroLinked brain: ONLINE" : ""}

Today's date: ${new Date().toDateString()}

Generate the briefing. If brain insights were provided, surface the most important ones under the 🔴 Urgent or 🟡 This Week sections. Make it feel genuinely personalised.`;

      const digest = await callClaude({
        system: DIGEST_SYSTEM,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 800,
      });

      return { digest, generatedAt: new Date().toISOString() };
    }),
});

// ─────────────────────────────────────────────────────────────
// NeuroLinked brain router
// ─────────────────────────────────────────────────────────────

import {
  readBrainState,
  getBrainInsights,
  getBrainLearned,
  recallMemories,
  saveBrain,
  getFullBrainContext,
} from "../_core/neurolinked";

export const brainRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getFullBrainContext();
  }),

  recall: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return recallMemories(input.query, input.limit);
    }),

  save: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const ok = await saveBrain();
    return { ok };
  }),

  sleepInsights: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getSleepInsights(input.limit);
    }),
});

// ─────────────────────────────────────────────────────────────
// Voice router — transcribe audio via Whisper, feed into brain
// ─────────────────────────────────────────────────────────────

import { transcribeAudio } from "../_core/voiceTranscription";
import { sendToBrain } from "../_core/neurolinked";

export const voiceRouter = router({
  transcribe: protectedProcedure
    .input(z.object({
      audioUrl: z.string().url(),
      language: z.string().optional(),
      prompt: z.string().optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language,
        prompt: input.prompt,
      });
      if ("error" in result) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      // Feed transcription into brain as user speech
      sendToBrain(result.text, "user", "text").catch(() => {});
      return result;
    }),
});

// ─────────────────────────────────────────────────────────────
// Notification router
// ─────────────────────────────────────────────────────────────

import { notifyOwner } from "../_core/notification";

export const notificationRouter = router({
  send: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const ok = await notifyOwner({ title: input.title, content: input.content });
      return { ok };
    }),
});

// ─────────────────────────────────────────────────────────────
// Collaboration router
// ─────────────────────────────────────────────────────────────

import { getRoomPresence, getActiveRooms } from "../_core/collabServer";

export const collabRouter = router({
  /** Get who is currently in a session */
  presence: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getRoomPresence(input.sessionId);
    }),

  /** Get all active collaborative rooms (admin/owner only) */
  activeRooms: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getActiveRooms();
  }),
});
