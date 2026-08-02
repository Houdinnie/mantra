import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { chatRouter } from "./chat";
import { setDb } from "../db";
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

function createMockDb(resolvedValue: any = []) {
  const queryBuilder = {
    values: vi.fn().mockResolvedValue(resolvedValue),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(resolvedValue),
    then: (onFulfilled: any) => Promise.resolve(resolvedValue).then(onFulfilled),
  };

  return {
    insert: vi.fn().mockReturnValue(queryBuilder),
    select: vi.fn().mockReturnValue(queryBuilder),
    update: vi.fn().mockReturnValue(queryBuilder),
    delete: vi.fn().mockReturnValue(queryBuilder),
  } as any;
}

describe("chat router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    setDb(createMockDb([]));
  });

  afterEach(() => {
    setDb(null);
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

  it("should get user stats", async () => {
    const mockDb = createMockDb([
      {
        totalSessions: "5",
        totalMessages: "42",
        lastActive: "2026-03-30T12:00:00.000Z",
      },
    ]);
    setDb(mockDb);

    const caller = chatRouter.createCaller(ctx);
    const result = await caller.getStats();

    expect(result).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: new Date("2026-03-30T12:00:00.000Z"),
    });
  });
});
