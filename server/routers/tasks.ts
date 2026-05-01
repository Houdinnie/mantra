import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  isGatewayOnline, getGatewayStatus, sendTask, invokeTool,
  getFlows, createFlow, updateFlow, deleteFlow,
  triggerFlow, getTaskLedger, getFlowRun, deepRead,
  TASK_TEMPLATES, type FlowDefinition,
} from "../_core/openclawBridge";
import {
  createEmbeddedFlow, getEmbeddedFlows, updateEmbeddedFlow,
  deleteEmbeddedFlow, triggerEmbeddedFlow, getEmbeddedLedger,
  getEmbeddedRunnerStatus,
} from "../_core/embeddedRunner";

const FlowStepSchema = z.object({
  id: z.string(),
  type: z.enum(["message", "tool", "shell", "condition", "wait"]),
  content: z.string().optional(),
  tool: z.string().optional(),
  command: z.string().optional(),
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

export const taskRouter = router({

  status: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const [online, status] = await Promise.all([isGatewayOnline(), getGatewayStatus()]);
    return {
      online: true,
      externalGateway: online,
      status: online ? status : getEmbeddedRunnerStatus(),
      mode: online ? "external" : "embedded",
    };
  }),

  send: protectedProcedure
    .input(z.object({ task: z.string().min(1).max(4000), sessionKey: z.string().default("main"), waitForResponse: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) {
        const result = await sendTask(input.task, input.sessionKey, input.waitForResponse);
        if (result) return { ...result, mode: "external" };
      }
      const flow = createEmbeddedFlow({ name: `Task: ${input.task.slice(0,50)}`, trigger: "manual", steps: [{ id: "run", type: "message", content: input.task }], enabled: true });
      const runId = await triggerEmbeddedFlow(flow.id);
      return { ok: true, messageId: runId, pending: true, mode: "embedded" };
    }),

  invokeTool: protectedProcedure
    .input(z.object({ tool: z.string().min(1), args: z.record(z.unknown()).default({}) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (!online) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Direct tool invoke requires OpenClaw gateway" });
      const result = await invokeTool(input.tool, input.args);
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return result;
    }),

  getFlows: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const online = await isGatewayOnline();
    if (online) return getFlows();
    return getEmbeddedFlows();
  }),

  createFlow: protectedProcedure
    .input(FlowSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) { const r = await createFlow(input as FlowDefinition); if (r) return r; }
      return createEmbeddedFlow({ name: input.name, description: input.description, trigger: input.trigger as any, cronExpression: input.cronExpression, steps: input.steps.map(s => ({ id: s.id, type: s.type as any, content: s.content, command: s.command, waitMs: s.waitMs, condition: s.condition, onSuccess: s.onSuccess, onFailure: s.onFailure })), enabled: input.enabled });
    }),

  updateFlow: protectedProcedure
    .input(z.object({ id: z.string(), updates: FlowSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) { const r = await updateFlow(input.id, input.updates as any); if (r) return r; }
      const r = updateEmbeddedFlow(input.id, input.updates as any);
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });
      return r;
    }),

  deleteFlow: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) { await deleteFlow(input.id); } else { deleteEmbeddedFlow(input.id); }
      return { ok: true };
    }),

  triggerFlow: protectedProcedure
    .input(z.object({ id: z.string(), input: z.record(z.unknown()).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) { const r = await triggerFlow(input.id, input.input); if (r) return r; }
      const runId = await triggerEmbeddedFlow(input.id, (input.input ?? {}) as Record<string, string>);
      return { runId };
    }),

  getLedger: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) return getTaskLedger(input.limit);
      return getEmbeddedLedger(input.limit);
    }),

  getFlowRun: protectedProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) return getFlowRun(input.runId);
      return getEmbeddedLedger(500).find((e: any) => e.id === input.runId) ?? null;
    }),

  deepRead: protectedProcedure
    .input(z.object({ urls: z.array(z.string().url()).min(1).max(10), sessionKey: z.string().default("main") }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const online = await isGatewayOnline();
      if (online) { const r = await deepRead(input.urls, input.sessionKey); if (r) return r; }
      const flow = createEmbeddedFlow({ name: `DeepRead: ${input.urls.length} URLs`, trigger: "manual", steps: input.urls.map((url, i) => ({ id: `read_${i}`, type: "message" as const, content: `Fetch and summarise key content from: ${url}`, onSuccess: i < input.urls.length - 1 ? `read_${i+1}` : undefined })), enabled: true });
      const runId = await triggerEmbeddedFlow(flow.id);
      return { ok: true, messageId: runId, pending: true, mode: "embedded" };
    }),

  createFromTemplate: protectedProcedure
    .input(z.object({ template: z.enum(["morningBriefing","urlMonitor","researchTask","tradingAlert"]), params: z.record(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const p = input.params as Record<string, any>;
      let fd: FlowDefinition;
      switch (input.template) {
        case "morningBriefing": fd = TASK_TEMPLATES.morningBriefing(p.channels ?? ["main"]); break;
        case "urlMonitor": fd = TASK_TEMPLATES.urlMonitor(p.url, p.checkEveryHours ?? 6); break;
        case "researchTask": fd = TASK_TEMPLATES.researchTask(p.topic); break;
        case "tradingAlert": fd = TASK_TEMPLATES.tradingAlert(p.asset, p.cronExpr); break;
      }
      const online = await isGatewayOnline();
      if (online) { const r = await createFlow(fd!); if (r) return r; }
      return createEmbeddedFlow({ name: fd!.name, description: fd!.description, trigger: fd!.trigger as any, cronExpression: fd!.cronExpression, steps: fd!.steps.map(s => ({ id: s.id, type: s.type as any, content: s.content, waitMs: s.waitMs })), enabled: fd!.enabled ?? true });
    }),
});
