import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
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
import { invokeLLM } from "../_core/llm";
import { nanoid } from "nanoid";

const SYSTEM_PROMPT = `You are Mantra, an action-oriented AI agent that decomposes user intent into concrete, executable steps. Your goal is to understand what the user wants and provide a clear, structured plan with verifiable deliverables.

When a user makes a request:
1. Parse their intent carefully
2. Break it down into logical, sequential steps
3. Identify the deliverable or outcome
4. Provide clear, actionable guidance

Be concise, direct, and focus on actionable outcomes. Mirror the user's language and tone. Think of yourself as a hands-on partner who turns vague goals into concrete plans.`;

export const chatRouter = router({
  /**
   * Send a message and get an AI response
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        message: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { sessionId, message } = input;

      // Verify session exists and belongs to user
      const session = await getChatSession(sessionId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this session",
        });
      }

      try {
        // Add user message to database
        await addChatMessage(sessionId, "user", message);
        await incrementMessageCount(sessionId);

        // Get conversation history
        const messages = await getSessionMessages(sessionId);

        // Build LLM context
        const llmMessages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: message },
        ];

        // Call LLM
        const response = await invokeLLM({
          messages: llmMessages as any,
        });

        const assistantReply =
          typeof response.choices?.[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "I encountered an error processing your request.";

        // Add assistant response to database
        if (typeof assistantReply === "string") {
          await addChatMessage(sessionId, "assistant", assistantReply);
          await incrementMessageCount(sessionId);
        }

        // Update session metadata
        const preview = message.substring(0, 80);
        if (typeof assistantReply === "string") {
          await updateSessionMetadata(sessionId, preview, assistantReply);
        }

        return {
          sessionId,
          reply: assistantReply,
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

  /**
   * Create a new chat session
   */
  createSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const sessionId = `s_${nanoid(12)}_${Date.now()}`;

    try {
      await createChatSession(ctx.user.id, sessionId);
      return { sessionId, success: true };
    } catch (error) {
      console.error("[Chat] Failed to create session:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create session",
      });
    }
  }),

  /**
   * Get all messages for a session
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().default(200),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const session = await getChatSession(input.sessionId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this session",
        });
      }

      const messages = await getSessionMessages(input.sessionId, input.limit);
      return messages;
    }),

  /**
   * Get all sessions for the current user
   */
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const sessions = await getUserSessions(ctx.user.id, input.limit);
      return sessions;
    }),

  /**
   * Delete a session
   */
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const session = await getChatSession(input.sessionId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this session",
        });
      }

      try {
        await deleteChatSession(input.sessionId);
        return { success: true };
      } catch (error) {
        console.error("[Chat] Failed to delete session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete session",
        });
      }
    }),
});
