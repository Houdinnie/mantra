import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { chatRouter } from "./chat";
import type { TrpcContext } from "../_core/context";
import { setDb } from "../db";

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
  let originalDatabaseUrl: string | undefined;

  beforeEach(() => {
    ctx = createAuthContext();
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";

    // Mock query builder chain for database
    const mockValuesResult = {
      then: (onFulfilled: any) => Promise.resolve({}).then(onFulfilled),
    };
    const mockValues = vi.fn().mockReturnValue(mockValuesResult);
    const mockInsert = vi.fn().mockReturnValue({
      values: mockValues,
    });

    const mockLimitResult = {
      then: (onFulfilled: any) => Promise.resolve([]).then(onFulfilled),
    };
    const mockLimit = vi.fn().mockReturnValue(mockLimitResult);
    const mockOrderBy = vi.fn().mockReturnValue({
      limit: mockLimit,
    });
    const mockWhere = vi.fn().mockReturnValue({
      orderBy: mockOrderBy,
    });
    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere,
    });
    const mockSelect = vi.fn().mockReturnValue({
      from: mockFrom,
    });

    const mockDb = {
      insert: mockInsert,
      select: mockSelect,
    };

    setDb(mockDb as any);
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
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
});
