import { describe, it, expect, beforeEach, vi } from "vitest";
import { chatRouter } from "./chat";
import type { TrpcContext } from "../_core/context";
import * as dbFunctions from "../db";

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
    ctx = createAuthContext();
    // Mock the database to avoid connection errors during tests
    const mockDb: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onDuplicateKeyUpdate: vi.fn().mockReturnThis(),
    };

    // Ensure all chainable methods return the mockDb object itself
    const methods = ['insert', 'select', 'from', 'where', 'limit', 'orderBy', 'update', 'set', 'delete', 'values', 'onDuplicateKeyUpdate'];
    methods.forEach(method => {
      mockDb[method].mockReturnValue(mockDb);
    });

    // Make mockDb look like a promise (for await db.select()...)
    mockDb.then = (onFulfilled: any) => Promise.resolve([]).then(onFulfilled);

    // Completely replace database functions to return our mock
    vi.spyOn(dbFunctions, 'getDb').mockResolvedValue(mockDb);
    vi.spyOn(dbFunctions, 'createChatSession').mockResolvedValue({} as any);
    vi.spyOn(dbFunctions, 'getUserSessions').mockResolvedValue([]);
    vi.spyOn(dbFunctions, 'getChatSession').mockResolvedValue({ userId: 1 } as any);
  });

  it("should create a new session", async () => {
    const caller = chatRouter.createCaller(ctx);
    const result = await caller.createSession();

    expect(result.success).toBe(true);
    expect(result.sessionId).toBeDefined();
    expect(result.sessionId).toMatch(/^s_/);
  });

  it("should reject unauthorized requests", async () => {
    const unAuthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = chatRouter.createCaller(unAuthCtx);

    try {
      await caller.createSession();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("should reject empty messages", async () => {
    const caller = chatRouter.createCaller(ctx);

    try {
      await caller.sendMessage({
        sessionId: "s_test_123",
        message: "",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("should get sessions for authenticated user", async () => {
    const caller = chatRouter.createCaller(ctx);

    const result = await caller.getSessions({ limit: 50 });

    expect(Array.isArray(result)).toBe(true);
  });
});
