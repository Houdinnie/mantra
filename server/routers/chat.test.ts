import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { chatRouter } from "./chat";
import type { TrpcContext } from "../_core/context";
import { setDb } from "../db";

const mockQueryBuilder = {
  select: () => mockQueryBuilder,
  insert: () => mockQueryBuilder,
  update: () => mockQueryBuilder,
  delete: () => mockQueryBuilder,
  from: () => mockQueryBuilder,
  where: () => mockQueryBuilder,
  orderBy: () => mockQueryBuilder,
  limit: () => mockQueryBuilder,
  values: () => mockQueryBuilder,
  set: () => mockQueryBuilder,
  resolvedValue: [] as any,
  then(onFulfilled: any) {
    return Promise.resolve(this.resolvedValue).then(onFulfilled);
  },
};

const mockDb = {
  select: () => mockQueryBuilder,
  insert: () => mockQueryBuilder,
  update: () => mockQueryBuilder,
  delete: () => mockQueryBuilder,
};

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
    setDb(mockDb as any);
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
});
