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

// Helper to create a chainable, non-thenable mock database for Drizzle queries
function createMockDb(overrides?: {
  select?: any[];
  insert?: any;
}) {
  const selectQuery = {
    from: vi.fn().mockImplementation(() => {
      const fromObj = {
        where: vi.fn().mockImplementation(() => {
          const whereObj = {
            orderBy: vi.fn().mockImplementation(() => {
              const orderByObj = {
                limit: vi.fn().mockImplementation(() => Promise.resolve(overrides?.select ?? [])),
              };
              Object.defineProperty(orderByObj, "then", {
                value: (resolve: any) => Promise.resolve(overrides?.select ?? []).then(resolve),
                configurable: true,
              });
              return orderByObj;
            }),
            limit: vi.fn().mockImplementation(() => Promise.resolve(overrides?.select ?? [])),
          };
          Object.defineProperty(whereObj, "then", {
            value: (resolve: any) => Promise.resolve(overrides?.select ?? []).then(resolve),
            configurable: true,
          });
          return whereObj;
        }),
      };
      Object.defineProperty(fromObj, "then", {
        value: (resolve: any) => Promise.resolve(overrides?.select ?? []).then(resolve),
        configurable: true,
      });
      return fromObj;
    }),
  };

  const insertQuery = {
    values: vi.fn().mockImplementation(() => Promise.resolve(overrides?.insert ?? { insertId: 1 })),
  };

  return {
    select: vi.fn().mockReturnValue(selectQuery),
    insert: vi.fn().mockReturnValue(insertQuery),
    update: vi.fn().mockReturnValue({}),
    delete: vi.fn().mockReturnValue({}),
  };
}

describe("chat router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    // Prevent real database connections
    process.env.DATABASE_URL = "";
    // Supply mocked database query builder chain
    const mockDb = createMockDb({
      select: [],
      insert: { insertId: 1 },
    });
    setDb(mockDb as any);
  });

  afterEach(() => {
    // Prevent state leakage between tests
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
