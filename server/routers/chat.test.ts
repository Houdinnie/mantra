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

  beforeEach(() => {
    ctx = createAuthContext();

    // Set up chainable, non-thenable mock database
    const mockDb = {
      insert: vi.fn().mockImplementation(() => {
        return {
          values: vi.fn().mockResolvedValue([{ insertId: 1 }])
        };
      }),
      select: vi.fn().mockImplementation(() => {
        const queryBuilder = {
          from: vi.fn().mockImplementation(() => {
            const fromBuilder = {
              where: vi.fn().mockImplementation(() => {
                const whereBuilder = {
                  orderBy: vi.fn().mockImplementation(() => {
                    const orderByBuilder = {
                      limit: vi.fn().mockResolvedValue([])
                    };
                    return Object.assign(Promise.resolve([]), orderByBuilder, {
                      then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled)
                    });
                  })
                };
                return Object.assign(Promise.resolve([]), whereBuilder, {
                  then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled)
                });
              })
            };
            return Object.assign(Promise.resolve([]), fromBuilder, {
              then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled)
            });
          })
        };
        return queryBuilder;
      })
    };

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
