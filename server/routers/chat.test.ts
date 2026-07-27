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

describe("chat router", () => {
  let ctx: TrpcContext;
  let mockSelectResult: any[] = [];

  const mockDb = {
    select: vi.fn().mockImplementation(() => {
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (onfulfilled: any) =>
          Promise.resolve(mockSelectResult).then(onfulfilled),
      };
      return chain;
    }),
    insert: vi.fn().mockImplementation(() => {
      const chain = {
        values: vi.fn().mockReturnThis(),
        then: (onfulfilled: any) => Promise.resolve().then(onfulfilled),
      };
      return chain;
    }),
    update: vi.fn().mockImplementation(() => {
      const chain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: (onfulfilled: any) => Promise.resolve().then(onfulfilled),
      };
      return chain;
    }),
    delete: vi.fn().mockImplementation(() => {
      const chain = {
        where: vi.fn().mockReturnThis(),
        then: (onfulfilled: any) => Promise.resolve().then(onfulfilled),
      };
      return chain;
    }),
  };

  beforeEach(() => {
    ctx = createAuthContext();
    setDb(mockDb as any);
    mockSelectResult = [];
    vi.clearAllMocks();
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
    expect(mockDb.insert).toHaveBeenCalled();
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
    mockSelectResult = [
      {
        id: 1,
        sessionId: "s_session_1",
        title: "Session 1",
        userId: 1,
        messageCount: 5,
        updatedAt: new Date(),
      },
    ];

    const caller = chatRouter.createCaller(ctx);
    const result = await caller.getSessions({ limit: 50 });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].sessionId).toBe("s_session_1");
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should fetch user statistics via getStats", async () => {
    const lastActiveDate = new Date("2026-05-01T12:00:00.000Z");
    mockSelectResult = [
      {
        totalSessions: 5,
        totalMessages: 42,
        lastActive: lastActiveDate.toISOString(),
      },
    ];

    const caller = chatRouter.createCaller(ctx);
    const result = await caller.getStats();

    expect(result).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: lastActiveDate,
    });
    expect(mockDb.select).toHaveBeenCalled();
  });
});
