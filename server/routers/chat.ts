import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createChatSession,
  getChatSession,
  getUserSessions,
  addChatMessage,
  getSessionMessages,
  updateSessionMetadata,
  incrementMessageCount,
  deleteChatSession,
} from "../db";
import { streamClaude, callClaude } from "../_core/anthropic";
import { routeMessage } from "../_core/agentRouter";
import { nanoid } from "nanoid";
import type { Request, Response } from "express";

// ─────────────────────────────────────────────────────────────
// SSE streaming endpoint (registered on Express, not tRPC)
// Called by the frontend via POST /api/chat/stream
// ─────────────────────────────────────────────────────────────

export async function registerChatStream(app: import("express").Express) {
  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    const { sessionId, message, userId } = req.body as {
      sessionId: string;
      message: string;
      userId: number;
    };

    if (!sessionId || !message || !userId) {
      res.status(400).json({ error: "sessionId, message, and userId are required" });
      return;
    }

    const session = await getChatSession(sessionId);
    if (!session || session.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Persist user message
    await addChatMessage(sessionId, "user", message);
    await incrementMessageCount(sessionId);

    // Fetch history excluding the just-persisted message
    const history = await getSessionMessages(sessionId, 200);
    const prior = history.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Route through agent router
    const routing = routeMessage(message, prior);

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // First event: routing metadata so the client can show persona / skill badges
    res.write(
      `data: ${JSON.stringify({
        type: "routing",
        persona: (routing.persona as any).name ?? "Mantra",
        personaEmoji: (routing.persona as any).emoji ?? "🤖",
        skill: routing.skill?.name ?? null,
        tier: routing.tier ?? null,
      })}\n\n`
    );

    let fullReply = "";

    try {
      const stream = streamClaude({
        system: routing.systemPrompt,
        messages: [
          ...prior,
          { role: "user", content: routing.userMessage },
        ],
      });

      for await (const chunk of stream) {
        fullReply += chunk;
        res.write(`data: ${JSON.stringify({ type: "delta", text: chunk })}\n\n`);
      }

      await addChatMessage(sessionId, "assistant", fullReply);
      await incrementMessageCount(sessionId);
      await updateSessionMetadata(sessionId, message.substring(0, 80), fullReply);

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    } catch (error) {
      console.error("[Chat Stream] Error:", error);
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      res.write(`data: ${JSON.stringify({ type: "error", message: errMsg })}\n\n`);
    } finally {
      res.end();
    }
  });
}

// ─────────────────────────────────────────────────────────────
// tRPC router
// ─────────────────────────────────────────────────────────────

export const chatRouter = router({
  /**
   * Non-streaming fallback (used in contexts where SSE is unavailable)
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        message: z.string().min(1, "Message cannot be empty"),
      })
    )
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
        const prior = history.slice(0, -1).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const routing = routeMessage(message, prior);

        const reply = await callClaude({
          system: routing.systemPrompt,
          messages: [...prior, { role: "user", content: routing.userMessage }],
        });

        await addChatMessage(sessionId, "assistant", reply);
        await incrementMessageCount(sessionId);
        await updateSessionMetadata(sessionId, message.substring(0, 80), reply);

        return {
          sessionId,
          reply,
          persona: (routing.persona as any).name ?? "Mantra",
          skill: routing.skill?.name ?? null,
          success: true,
        };
      } catch (error) {
        console.error("[Chat] LLM error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process your message",
        });
      }
    }),

  createSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const sessionId = `s_${nanoid(12)}_${Date.now()}`;

    try {
      await createChatSession(ctx.user.id, sessionId);
      return { sessionId, userId: ctx.user.id, success: true };
    } catch (error) {
      console.error("[Chat] Failed to create session:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session" });
    }
  }),

  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.string(), limit: z.number().default(200) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const session = await getChatSession(input.sessionId);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
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
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      if (session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      try {
        await deleteChatSession(input.sessionId);
        return { success: true };
      } catch (error) {
        console.error("[Chat] Failed to delete session:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete session" });
      }
    }),
});
