import { describe, it, expect, beforeEach, vi } from "vitest";
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
  let mockDb: any;

  beforeEach(() => {
    ctx = createAuthContext();
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("should create a new session", async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

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
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const caller = chatRouter.createCaller(ctx);
    const result = await caller.getSessions({ limit: 50 });

    expect(Array.isArray(result)).toBe(true);
  });
});
