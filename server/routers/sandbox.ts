import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSandbox, killSandbox, isSandboxAlive,
  listFilesInSandbox, readFileInSandbox, isDockerAvailable,
  type SandboxInfo,
} from "../_core/dockerSandbox";
import { runAgentLoop } from "../_core/agentLoop";
import {
  createSandboxSession, getSandboxSession,
  getUserSandboxes, updateSandboxStatus,
} from "../db";
import { getAllMemory } from "../db";
import type { Express, Request, Response } from "express";

// ─────────────────────────────────────────────────────────────
// In-memory sandbox registry (live containers)
// ─────────────────────────────────────────────────────────────

const liveSandboxes = new Map<string, SandboxInfo>();

async function getOrCreateSandbox(
  userId: number,
  sessionId: string,
  networkAccess = true
): Promise<SandboxInfo> {
  // Check in-memory first
  const existing = liveSandboxes.get(sessionId);
  if (existing && await isSandboxAlive(existing)) {
    return existing;
  }

  // Check DB for a prior sandbox
  const dbRecord = await getSandboxSession(sessionId);
  if (dbRecord) {
    const restored: SandboxInfo = {
      id: dbRecord.sandboxId,
      containerId: dbRecord.containerId ?? undefined,
      mode: dbRecord.mode as "docker" | "process",
      status: "running",
      createdAt: dbRecord.createdAt.getTime(),
      workdir: dbRecord.workdir,
    };
    if (await isSandboxAlive(restored)) {
      liveSandboxes.set(sessionId, restored);
      return restored;
    }
  }

  // Create fresh sandbox
  const sandbox = await createSandbox(sessionId, networkAccess);
  liveSandboxes.set(sessionId, sandbox);

  await createSandboxSession({
    userId,
    sessionId,
    sandboxId: sandbox.id,
    containerId: sandbox.containerId,
    mode: sandbox.mode,
    workdir: sandbox.workdir,
  });

  return sandbox;
}

// ─────────────────────────────────────────────────────────────
// SSE streaming endpoint — POST /api/sandbox/run
// ─────────────────────────────────────────────────────────────

export async function registerSandboxStream(app: Express) {
  app.post("/api/sandbox/run", async (req: Request, res: Response) => {
    const { task, sessionId, userId } = req.body as {
      task: string;
      sessionId: string;
      userId: number;
    };

    if (!task || !sessionId || !userId) {
      res.status(400).json({ error: "task, sessionId, userId required" });
      return;
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      send({ type: "status", text: "🏗️ Spinning up sandbox..." });

      const sandbox = await getOrCreateSandbox(userId, sessionId);

      send({
        type: "sandbox_ready",
        sandboxId: sandbox.id,
        mode: sandbox.mode,
        workdir: sandbox.workdir,
      });

      // Build memory context
      const memories = await getAllMemory(userId);
      const context = memories.length
        ? memories.map(m => `${m.key}: ${m.value}`).join("\n")
        : undefined;

      await updateSandboxStatus(sandbox.id, "running", task);

      // Run the agent loop, stream every event
      for await (const event of runAgentLoop(task, sandbox, context)) {
        send(event);
        if (event.type === "task_complete" || event.type === "error") break;
      }

      await updateSandboxStatus(sandbox.id, "running");
    } catch (error) {
      console.error("[Sandbox Stream]", error);
      send({ type: "error", message: (error as Error).message });
    } finally {
      res.end();
    }
  });
}

// ─────────────────────────────────────────────────────────────
// tRPC router
// ─────────────────────────────────────────────────────────────

export const sandboxRouter = router({

  /** Check if Docker is available */
  capabilities: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const docker = await isDockerAvailable();
    return {
      docker,
      mode: docker ? "docker" : "process",
      message: docker
        ? "Docker available — full isolated containers"
        : "Running in process mode — restricted sandbox",
    };
  }),

  /** Get or create a sandbox for a session */
  create: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      networkAccess: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const sandbox = await getOrCreateSandbox(ctx.user.id, input.sessionId, input.networkAccess);
        return {
          sandboxId: sandbox.id,
          mode: sandbox.mode,
          workdir: sandbox.workdir,
          alive: true,
        };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (error as Error).message });
      }
    }),

  /** Kill a sandbox */
  kill: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const sandbox = liveSandboxes.get(input.sessionId);
      if (sandbox) {
        await killSandbox(sandbox);
        liveSandboxes.delete(input.sessionId);
        await updateSandboxStatus(sandbox.id, "stopped");
      }
      return { ok: true };
    }),

  /** Check if sandbox is alive */
  status: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const sandbox = liveSandboxes.get(input.sessionId);
      if (!sandbox) return { alive: false, sandboxId: null, mode: null };
      const alive = await isSandboxAlive(sandbox);
      return { alive, sandboxId: sandbox.id, mode: sandbox.mode, workdir: sandbox.workdir };
    }),

  /** List files in sandbox workspace */
  listFiles: protectedProcedure
    .input(z.object({ sessionId: z.string(), path: z.string().default(".") }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const sandbox = liveSandboxes.get(input.sessionId);
      if (!sandbox) return [];
      return listFilesInSandbox(sandbox, input.path);
    }),

  /** Read a file from sandbox workspace */
  readFile: protectedProcedure
    .input(z.object({ sessionId: z.string(), path: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const sandbox = liveSandboxes.get(input.sessionId);
      if (!sandbox) throw new TRPCError({ code: "NOT_FOUND", message: "Sandbox not found" });
      const content = await readFileInSandbox(sandbox, input.path);
      return { path: input.path, content };
    }),

  /** Get all user sandboxes from DB */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getUserSandboxes(ctx.user.id);
  }),
});
