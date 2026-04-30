import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  isGatewayOnline,
  getGatewayStatus,
  sendTask,
  invokeTool,
  getFlows,
  createFlow,
  updateFlow,
  deleteFlow,
  triggerFlow,
  getTaskLedger,
  getFlowRun,
  deepRead,
  TASK_TEMPLATES,
  type FlowDefinition,
} from "../_core/openclawBridge";

// ── Zod schemas ────────────────────────────────────────────────

const FlowStepSchema = z.object({
  id: z.string(),
  type: z.enum(["message", "tool", "condition", "wait"]),
  content: z.string().optional(),
  tool: z.string().optional(),
  toolArgs: z.record(z.unknown()).optional(),
  condition: z.string().optional(),
  waitMs: z.number().optional(),
  onSuccess: z.string().optional(),
  onFailure: z.string().optional(),
});

const FlowSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  trigger: z.enum(["manual", "cron", "webhook", "message"]),
  cronExpression: z.string().optional(),
  webhookPath: z.string().optional(),
  messagePattern: z.string().optional(),
  steps: z.array(FlowStepSchema).min(1),
  enabled: z.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────

export const taskRouter = router({

  /** Gateway health check */
  status: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const [online, status] = await Promise.all([isGatewayOnline(), getGatewayStatus()]);
    return { online, status };
  }),

  // ── Tasks ──────────────────────────────────────────────────

  /** Dispatch a free-form natural language task to OpenClaw */
  send: protectedProcedure
    .input(z.object({
      task: z.string().min(1).max(4000),
      sessionKey: z.string().default("main"),
      waitForResponse: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = await sendTask(input.task, input.sessionKey, input.waitForResponse);
      if (!result) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "OpenClaw gateway is offline" });
      return result;
    }),

  /** Invoke a specific OpenClaw tool directly */
  invokeTool: protectedProcedure
    .input(z.object({
      tool: z.string().min(1),
      args: z.record(z.unknown()).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = await invokeTool(input.tool, input.args);
      if (!result) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "OpenClaw gateway is offline" });
      return result;
    }),

  // ── Flows ──────────────────────────────────────────────────

  /** List all automation flows */
  getFlows: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getFlows();
  }),

  /** Create a new automation flow */
  createFlow: protectedProcedure
    .input(FlowSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = await createFlow(input as FlowDefinition);
      if (!result) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "OpenClaw gateway is offline" });
      return result;
    }),

  /** Update an existing flow */
  updateFlow: protectedProcedure
    .input(z.object({ id: z.string(), updates: FlowSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = await updateFlow(input.id, input.updates as Partial<FlowDefinition>);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  /** Delete a flow */
  deleteFlow: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const ok = await deleteFlow(input.id);
      return { ok };
    }),

  /** Manually trigger a flow */
  triggerFlow: protectedProcedure
    .input(z.object({
      id: z.string(),
      input: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = await triggerFlow(input.id, input.input);
      if (!result) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Could not trigger flow" });
      return result;
    }),

  // ── Ledger ─────────────────────────────────────────────────

  /** Get recent task execution history */
  getLedger: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getTaskLedger(input.limit);
    }),

  /** Get status of a specific flow run */
  getFlowRun: protectedProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getFlowRun(input.runId);
    }),

  // ── DeepReeder ─────────────────────────────────────────────

  /** Ingest URLs into agent memory via DeepReeder skill */
  deepRead: protectedProcedure
    .input(z.object({
      urls: z.array(z.string().url()).min(1).max(10),
      sessionKey: z.string().default("main"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = await deepRead(input.urls, input.sessionKey);
      if (!result) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "OpenClaw gateway is offline" });
      return result;
    }),

  // ── Templates ──────────────────────────────────────────────

  /** Create a flow from a pre-built template */
  createFromTemplate: protectedProcedure
    .input(z.object({
      template: z.enum(["morningBriefing", "urlMonitor", "researchTask", "tradingAlert"]),
      params: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      let flowDef: FlowDefinition;
      const p = input.params as Record<string, any>;

      switch (input.template) {
        case "morningBriefing":
          flowDef = TASK_TEMPLATES.morningBriefing(p.channels ?? ["main"]);
          break;
        case "urlMonitor":
          if (!p.url) throw new TRPCError({ code: "BAD_REQUEST", message: "url required" });
          flowDef = TASK_TEMPLATES.urlMonitor(p.url, p.checkEveryHours ?? 6);
          break;
        case "researchTask":
          if (!p.topic) throw new TRPCError({ code: "BAD_REQUEST", message: "topic required" });
          flowDef = TASK_TEMPLATES.researchTask(p.topic);
          break;
        case "tradingAlert":
          if (!p.asset) throw new TRPCError({ code: "BAD_REQUEST", message: "asset required" });
          flowDef = TASK_TEMPLATES.tradingAlert(p.asset, p.cronExpr);
          break;
      }

      const result = await createFlow(flowDef!);
      if (!result) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "OpenClaw gateway is offline" });
      return result;
    }),
});
