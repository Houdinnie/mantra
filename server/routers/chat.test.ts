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

function createMockDb(overrides: {
  selectResult?: any;
  insertResult?: any;
  updateResult?: any;
  deleteResult?: any;
} = {}) {
  let currentOp = "select";

  const queryMock: any = {
    from: vi.fn().mockImplementation(() => queryMock),
    where: vi.fn().mockImplementation(() => queryMock),
    orderBy: vi.fn().mockImplementation(() => queryMock),
    limit: vi.fn().mockImplementation(() => queryMock),
    values: vi.fn().mockImplementation(() => {
      currentOp = "insert";
      return queryMock;
    }),
    set: vi.fn().mockImplementation(() => {
      currentOp = "update";
      return queryMock;
    }),
    then: vi.fn().mockImplementation((onFulfilled, onRejected) => {
      let val: any = overrides.selectResult ?? [];
      if (currentOp === "insert") {
        val = overrides.insertResult ?? { id: 1 };
      } else if (currentOp === "update") {
        val = overrides.updateResult ?? { id: 1 };
      } else if (currentOp === "delete") {
        val = overrides.deleteResult ?? { success: true };
      }
      currentOp = "select";
      return Promise.resolve(val).then(onFulfilled, onRejected);
    }),
  };

  const dbMock = {
    select: vi.fn().mockImplementation(() => {
      currentOp = "select";
      return queryMock;
    }),
    insert: vi.fn().mockImplementation(() => {
      currentOp = "insert";
      return queryMock;
    }),
    update: vi.fn().mockImplementation(() => {
      currentOp = "update";
      return queryMock;
    }),
    delete: vi.fn().mockImplementation(() => {
      currentOp = "delete";
      return queryMock;
    }),
  };

  return dbMock as any;
}

describe("chat router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    // Inject the mock database
    const mockDb = createMockDb({
      selectResult: [
        {
          id: 1,
          userId: 1,
          sessionId: "s_test_123",
          title: "Test Chat",
          messageCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      insertResult: { id: 1 },
    });
    setDb(mockDb);
  });

  afterEach(() => {
    // Reset DB back to null
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
