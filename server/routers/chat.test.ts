import { describe, it, expect, beforeEach, vi } from "vitest";

// Keep router unit tests independent of a live database. These tests exercise
// procedure validation and authorization, not database connectivity.
vi.mock("../db", () => ({
  createChatSession: vi.fn().mockResolvedValue(undefined),
  getChatSession: vi.fn().mockResolvedValue(null),
  getUserSessions: vi.fn().mockResolvedValue([]),
  addChatMessage: vi.fn().mockResolvedValue(undefined),
  getSessionMessages: vi.fn().mockResolvedValue([]),
  updateSessionMetadata: vi.fn().mockResolvedValue(undefined),
  incrementMessageCount: vi.fn().mockResolvedValue(undefined),
  deleteChatSession: vi.fn().mockResolvedValue(undefined),
  getUserStats: vi.fn().mockResolvedValue({}),
  getAllMemory: vi.fn().mockResolvedValue([]),
}));

import { chatRouter } from "./chat";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("chat router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createAuthContext();
  });

  it("should create a new session", async () => {
    const caller = chatRouter.createCaller(ctx);
    const result = await caller.createSession();

    expect(result.success).toBe(true);
    expect(result.sessionId).toMatch(/^s_/);
    expect(result.userId).toBe(ctx.user?.id);
  });

  it("should reject unauthorized requests", async () => {
    const unAuthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = chatRouter.createCaller(unAuthCtx);

    await expect(caller.createSession()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("should reject empty messages", async () => {
    const caller = chatRouter.createCaller(ctx);

    await expect(caller.sendMessage({
      sessionId: "s_test_123",
      message: "",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("should get sessions for authenticated user", async () => {
    const caller = chatRouter.createCaller(ctx);
    const result = await caller.getSessions({ limit: 50 });

    expect(Array.isArray(result)).toBe(true);
  });
});
