import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createChannel,
  getUserChannels,
  getChannel,
  updateChannel,
  deleteChannel,
  createChatSession,
  getChatSession,
  addChatMessage,
  getSessionMessages,
  incrementMessageCount,
} from "../db";
import { streamClaude } from "../_core/anthropic";
import { getAllMemory } from "../db";
import { buildBrainMemoryContext } from "../_core/neurolinked";
import { sendToBrain } from "../_core/neurolinked";
import { nanoid } from "nanoid";
import type { Express, Request, Response } from "express";

// ─────────────────────────────────────────────────────────────
// Persona system prompts (mirrors agentRouter PERSONAS)
// ─────────────────────────────────────────────────────────────

const PERSONA_PROMPTS: Record<
  string,
  { name: string; emoji: string; prompt: string }
> = {
  ideator: {
    name: "Ideator",
    emoji: "💡",
    prompt:
      "You are the Ideator persona. Help founders validate, processize and launch ideas using the Minimalist Entrepreneur methodology.",
  },
  "tax-strategist": {
    name: "Tax Strategist",
    emoji: "💰",
    prompt:
      "You are the Tax Strategist. Specialise in international tax optimisation, NHR, UAE Freezone, Singapore incentives, tax treaty analysis.",
  },
  "entity-lawyer": {
    name: "Entity Lawyer",
    emoji: "⚖️",
    prompt:
      "You are the Entity Lawyer. Help founders choose and structure legal entities. Always note final legal decisions require a qualified attorney.",
  },
  "compliance-officer": {
    name: "Compliance Officer",
    emoji: "🔐",
    prompt:
      "You are the Compliance Officer. Guide teams through GDPR, SOC 2, KYC/AML, and substance requirements.",
  },
  "nomad-navigator": {
    name: "Nomad Navigator",
    emoji: "🗺️",
    prompt:
      "You are the Nomad Navigator. Help digital nomads optimise visa strategies, presence requirements, and relocations.",
  },
  "luxury-concierge": {
    name: "Luxury Concierge",
    emoji: "✈️",
    prompt:
      "You are the Luxury Concierge. Help access premium travel, hotel programs, empty-leg flights, and exclusive experiences.",
  },
  "health-wellness": {
    name: "Wellness Director",
    emoji: "🏥",
    prompt:
      "You are the Wellness Director. Guide founders on health optimisation, international insurance, and longevity protocols.",
  },
  "wealth-advisor": {
    name: "Wealth Architect",
    emoji: "📈",
    prompt:
      "You are the Wealth Architect. Help build investment strategies, banking structures, and portfolio approaches.",
  },
  ceo: {
    name: "CEO",
    emoji: "👑",
    prompt:
      "You are the CEO. Operate at the strategic level — mission, vision, priorities, and high-stakes decisions. Be decisive.",
  },
  cfo: {
    name: "CFO",
    emoji: "💹",
    prompt:
      "You are the CFO. Own financial strategy, unit economics, tax structure, and capital allocation. Always provide specific numbers.",
  },
  cto: {
    name: "CTO",
    emoji: "⚙️",
    prompt:
      "You are the CTO. Own technical architecture, stack decisions, and engineering standards. Prefer boring, proven technology.",
  },
  coo: {
    name: "COO",
    emoji: "⚡",
    prompt:
      "You are the COO. Own operations, processes, and execution. Always bias toward doing things manually first.",
  },
  cmo: {
    name: "CMO",
    emoji: "📣",
    prompt:
      "You are the CMO. Own marketing strategy, brand, and growth. Apply Minimalist Entrepreneur principles: community first.",
  },
  cso: {
    name: "CSO",
    emoji: "🤝",
    prompt:
      "You are the CSO. Own revenue generation, sales process, and customer success. Start with manual sales before hiring.",
  },
  default: {
    name: "Mantra",
    emoji: "🤖",
    prompt: "You are Mantra — an AI Co-Founder platform powered by Claude.",
  },
};

// ─────────────────────────────────────────────────────────────
// Build system prompt for a channel
// ─────────────────────────────────────────────────────────────

function buildChannelSystemPrompt(
  channel: {
    personaId: string;
    systemPromptOverride?: string | null;
    name: string;
  },
  memoryCtx: string
): string {
  if (channel.systemPromptOverride?.trim()) {
    return channel.systemPromptOverride + memoryCtx;
  }
  const persona =
    PERSONA_PROMPTS[channel.personaId] ?? PERSONA_PROMPTS["default"];
  return `${persona.prompt}

This is a dedicated "${channel.name}" channel. Stay in character consistently across all messages in this channel. Be direct, concrete, and action-oriented.${memoryCtx}`;
}

// ─────────────────────────────────────────────────────────────
// SSE streaming endpoint for channel messages
// POST /api/channels/:channelId/stream
// ─────────────────────────────────────────────────────────────

export async function registerChannelStreams(app: Express) {
  app.post(
    "/api/channels/:channelId/stream",
    async (req: Request, res: Response) => {
      const channelId = parseInt(req.params.channelId);
      const { message, userId, sessionId } = req.body as {
        message: string;
        userId: number;
        sessionId: string;
      };

      if (!message || !userId || !sessionId || isNaN(channelId)) {
        res
          .status(400)
          .json({ error: "channelId, message, userId, sessionId required" });
        return;
      }

      const channel = await getChannel(channelId, userId);
      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }

      // Ensure session exists
      let session = await getChatSession(sessionId);
      if (!session) {
        await createChatSession(
          userId,
          sessionId,
          `${channel.emoji} ${channel.name}`
        );
      }

      // SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const send = (data: object) =>
        res.write(`data: ${JSON.stringify(data)}\n\n`);

      try {
        await addChatMessage(sessionId, "user", message);
        await incrementMessageCount(sessionId);

        const history = await getSessionMessages(sessionId, 100);
        const prior = history.slice(0, -1).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const [memories, brainCtx] = await Promise.all([
          getAllMemory(userId),
          buildBrainMemoryContext(message),
        ]);

        const memoryCtx = [
          memories.length
            ? `\nKnown facts: ${memories.map(m => `${m.key}: ${m.value}`).join("; ")}`
            : "",
          brainCtx,
        ].join("");

        const systemPrompt = buildChannelSystemPrompt(channel, memoryCtx);
        const persona =
          PERSONA_PROMPTS[channel.personaId] ?? PERSONA_PROMPTS["default"];

        send({
          type: "routing",
          persona: persona.name,
          personaEmoji: persona.emoji,
          channelName: channel.name,
          channelColor: channel.color,
        });

        let fullReply = "";
        const model = (channel.modelOverride as any) ?? undefined;

        const stream = streamClaude({
          system: systemPrompt,
          messages: [...prior, { role: "user", content: message }],
          ...(model ? { model } : {}),
        });

        for await (const chunk of stream) {
          fullReply += chunk;
          send({ type: "delta", text: chunk });
        }

        await addChatMessage(sessionId, "assistant", fullReply);
        await incrementMessageCount(sessionId);
        await updateChannel(channelId, userId, {
          lastMessage: fullReply.substring(0, 200),
        });

        sendToBrain(message, "user").catch(() => {});
        sendToBrain(fullReply, "assistant").catch(() => {});

        send({ type: "done" });
      } catch (error) {
        send({ type: "error", message: (error as Error).message });
      } finally {
        res.end();
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// tRPC router
// ─────────────────────────────────────────────────────────────

const PRESET_CHANNELS = [
  {
    name: "Tax Strategist",
    emoji: "💰",
    personaId: "tax-strategist",
    color: "#ffd700",
    description: "International tax, NHR, UAE, Singapore",
  },
  {
    name: "Nomad Navigator",
    emoji: "🗺️",
    personaId: "nomad-navigator",
    color: "#00f5ff",
    description: "Visa strategy, presence tracking, relocation",
  },
  {
    name: "Wealth Architect",
    emoji: "📈",
    personaId: "wealth-advisor",
    color: "#8844ff",
    description: "Portfolio, banking, crypto, investments",
  },
  {
    name: "Luxury Concierge",
    emoji: "✈️",
    personaId: "luxury-concierge",
    color: "#ff6600",
    description: "Travel, hotels, VIP access, points",
  },
  {
    name: "CEO",
    emoji: "👑",
    personaId: "ceo",
    color: "#ff00aa",
    description: "Strategy, vision, high-stakes decisions",
  },
  {
    name: "CTO",
    emoji: "⚙️",
    personaId: "cto",
    color: "#00ff88",
    description: "Architecture, stack, engineering",
  },
  {
    name: "CMO",
    emoji: "📣",
    personaId: "cmo",
    color: "#ff4444",
    description: "Marketing, brand, growth, content",
  },
  {
    name: "Wellness Director",
    emoji: "🏥",
    personaId: "health-wellness",
    color: "#00ffcc",
    description: "Health optimisation, insurance, longevity",
  },
];

export const channelRouter = router({
  /** Get all available persona IDs and names */
  personas: protectedProcedure.query(() => {
    return Object.entries(PERSONA_PROMPTS).map(([id, p]) => ({
      id,
      name: p.name,
      emoji: p.emoji,
    }));
  }),

  /** Get preset channel templates */
  presets: protectedProcedure.query(() => PRESET_CHANNELS),

  /** List user's channels */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getUserChannels(ctx.user.id);
  }),

  /** Get a single channel */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const ch = await getChannel(input.id, ctx.user.id);
      if (!ch) throw new TRPCError({ code: "NOT_FOUND" });
      return ch;
    }),

  /** Create a channel */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        description: z.string().optional(),
        emoji: z.string().optional(),
        personaId: z.string().default("default"),
        systemPromptOverride: z.string().optional(),
        modelOverride: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await createChannel({ userId: ctx.user.id, ...input });
      return { ok: true };
    }),

  /** Create channels from presets in bulk */
  createFromPresets: protectedProcedure
    .input(z.object({ presetIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const toCreate = PRESET_CHANNELS.filter(p =>
        input.presetIds.includes(p.personaId)
      );
      await Promise.all(
        toCreate.map(p => createChannel({ userId: ctx.user!.id, ...p }))
      );
      return { created: toCreate.length };
    }),

  /** Update a channel */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        personaId: z.string().optional(),
        systemPromptOverride: z.string().optional(),
        modelOverride: z.string().optional(),
        color: z.string().optional(),
        pinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { id, ...updates } = input;
      await updateChannel(id, ctx.user.id, updates);
      return { ok: true };
    }),

  /** Delete a channel */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await deleteChannel(input.id, ctx.user.id);
      return { ok: true };
    }),

  /** Get session history for a channel */
  getHistory: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        sessionId: z.string(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getSessionMessages(input.sessionId, input.limit);
    }),
});
