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
import { sdk } from "../_core/sdk";
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
  // Session IDs are client-supplied, so always verify ownership before
  // consulting the process-wide sandbox registry.
  const dbRecord = await getSandboxSession(sessionId);
  if (dbRecord && dbRecord.userId !== userId) {
    throw new Error("Forbidden: sandbox session belongs to another user");
  }

  const existing = liveSandboxes.get(sessionId);
  if (existing && dbRecord && await isSandboxAlive(existing)) {
    return existing;
  }

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
  } else if (existing) {
    // Never reuse an in-memory session if its ownership record is missing.
    liveSandboxes.delete(sessionId);
  }

  const sandbox = await createSandbox(sessionId, networkAccess);
  await createSandboxSession({
    userId,
    sessionId,
    sandboxId: sandbox.id,
    containerId: sandbox.containerId,
    mode: sandbox.mode,
    workdir: sandbox.workdir,
  });
  liveSandboxes.set(sessionId, sandbox);
  return sandbox;
}

async function authenticateSandboxRequest(req: Request, res: Response) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
}

async function ownsSandboxSession(sessionId: string, userId: number): Promise<boolean> {
  const record = await getSandboxSession(sessionId);
  return Boolean(record && record.userId === userId);
}

// ─────────────────────────────────────────────────────────────
// SSE streaming endpoint — POST /api/sandbox/run
// ─────────────────────────────────────────────────────────────

export async function registerSandboxStream(app: Express) {
  // ── File upload into sandbox workspace ───────────────────────
  app.post("/api/sandbox/upload", async (req: Request, res: Response) => {
    const user = await authenticateSandboxRequest(req, res);
    if (!user) return;

    const sessionId = req.headers["x-session-id"] as string;
    const rawFilename = req.headers["x-filename"];
    let filename = "upload";
    try {
      if (typeof rawFilename === "string") filename = decodeURIComponent(rawFilename);
    } catch {
      res.status(400).json({ error: "Invalid filename encoding" });
      return;
    }

    if (!sessionId || !filename) {
      res.status(400).json({ error: "x-session-id and x-filename headers required" });
      return;
    }
    if (!await ownsSandboxSession(sessionId, user.id)) {
      res.status(403).json({ error: "Sandbox session not found or access denied" });
      return;
    }

    const sandbox = liveSandboxes.get(sessionId);
    if (!sandbox) {
      res.status(404).json({ error: "Sandbox not found — run a task first to initialise" });
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    await new Promise<void>((resolve) => req.on("end", resolve));
    const fileBuffer = Buffer.concat(chunks);

    if (!fileBuffer.length) {
      res.status(400).json({ error: "Empty file" });
      return;
    }

    // Write into sandbox workspace
    try {
      const { writeFileInSandbox } = await import("../_core/dockerSandbox");
      const safeFilename = filename.replace(/[^a-zA-Z0-9._\-]/g, "_");
      await writeFileInSandbox(sandbox, safeFilename, fileBuffer.toString("utf8").replace(/\0/g, ""));

      // For binary files, use base64 write via shell
      if (fileBuffer.includes(0)) {
        const { execInSandbox } = await import("../_core/dockerSandbox");
        const b64 = fileBuffer.toString("base64");
        await execInSandbox(sandbox, `echo '${b64}' | base64 -d > /workspace/${safeFilename}`);
      }

      res.json({ ok: true, path: safeFilename, size: fileBuffer.length });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── File download from sandbox workspace ─────────────────────
  app.get("/api/sandbox/download", async (req: Request, res: Response) => {
    const user = await authenticateSandboxRequest(req, res);
    if (!user) return;

    const sessionId = req.query.sessionId as string;
    const filePath  = req.query.path as string;

    if (!sessionId || !filePath) {
      res.status(400).json({ error: "sessionId and path required" });
      return;
    }

    if (!await ownsSandboxSession(sessionId, user.id)) {
      res.status(403).json({ error: "Sandbox session not found or access denied" });
      return;
    }

    const sandbox = liveSandboxes.get(sessionId);
    if (!sandbox) { res.status(404).json({ error: "Sandbox not found" }); return; }

    try {
      const { readFileInSandbox } = await import("../_core/dockerSandbox");
      const content = await readFileInSandbox(sandbox, filePath);
      const filename = filePath.split("/").pop() ?? "file";
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.send(content);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Agent task SSE ────────────────────────────────────────────
  app.post("/api/sandbox/run", async (req: Request, res: Response) => {
    const user = await authenticateSandboxRequest(req, res);
    if (!user) return;

    const { task, sessionId } = req.body as {
      task: string;
      sessionId: string;
    };

    if (typeof task !== "string" || !task.trim() || task.length > 20000 ||
        typeof sessionId !== "string" || !sessionId.trim() || sessionId.length > 200) {
      res.status(400).json({ error: "A valid task and sessionId are required" });
      return;
    }

    // The user identity always comes from the signed session cookie, never
    // from a caller-controlled request body.
    const userId = user.id;

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
