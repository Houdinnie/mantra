import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  callExecutive,
  runBoardSession,
  detectExecutiveRole,
  type ExecutiveRole,
} from "../_core/clawCompany";
import {
  runMarketingAgent,
  runTradingAgent,
  runContentAgent,
} from "../_core/franklinAgents";
import { runMillionDollarIdea } from "../_core/millionDollarIdea";

// ─────────────────────────────────────────────────────────────
// ClawCompany executive router
// ─────────────────────────────────────────────────────────────

export const executiveRouter = router({
  /** Ask a specific executive directly */
  ask: protectedProcedure
    .input(
      z.object({
        role: z.enum(["ceo", "cfo", "cto", "coo", "cmo", "cso"]),
        message: z.string().min(1),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const result = await callExecutive(input.role as ExecutiveRole, [
          ...input.history,
          { role: "user", content: input.message },
        ]);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  /** Auto-detect the right executive and call them */
  autoRoute: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const role = detectExecutiveRole(input.message);
      const result = await callExecutive(role, [
        ...input.history,
        { role: "user", content: input.message },
      ]);
      return result;
    }),

  /** Full board session — CEO delegates to C-suite and synthesises */
  boardSession: protectedProcedure
    .input(
      z.object({
        task: z.string().min(1),
        roles: z
          .array(z.enum(["ceo", "cfo", "cto", "coo", "cmo", "cso"]))
          .default(["cfo", "cto", "coo"]),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        return await runBoardSession(
          input.task,
          input.history,
          input.roles as ExecutiveRole[]
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),
});

// ─────────────────────────────────────────────────────────────
// Franklin agents router
// ─────────────────────────────────────────────────────────────

export const franklinRouter = router({
  /** Marketing strategy agent */
  marketing: protectedProcedure
    .input(
      z.object({
        productDescription: z.string().min(1),
        targetAudience: z.string().min(1),
        goal: z.string().default("launch"),
        budget: z.string().optional(),
        channels: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        return await runMarketingAgent(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  /** Trading research agent */
  trading: protectedProcedure
    .input(
      z.object({
        asset: z.string().min(1),
        timeframe: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        return await runTradingAgent(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  /** Content creation agent */
  content: protectedProcedure
    .input(
      z.object({
        format: z.enum([
          "blog_post",
          "twitter_thread",
          "linkedin_post",
          "video_script",
          "email_sequence",
        ]),
        topic: z.string().min(1),
        audience: z.string().min(1),
        tone: z.string().optional(),
        wordCount: z.number().optional(),
        includeResearch: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        return await runContentAgent(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),
});

// ─────────────────────────────────────────────────────────────
// Million Dollar Idea router
// ─────────────────────────────────────────────────────────────

export const millionDollarRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        skills: z.string().optional(),
        audience: z.string().optional(),
        constraints: z.string().optional(),
        industries: z.string().optional(),
        rawContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        return await runMillionDollarIdea(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),
});
