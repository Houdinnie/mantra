import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts unit tests", () => {
  beforeEach(() => {
    // Ensure we reset process.env.DATABASE_URL to avoid connection attempts during testing
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return aggregated stats when user has sessions", async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        const queryBuilder = {
          from: vi.fn().mockImplementation(() => {
            const fromBuilder = {
              where: vi.fn().mockImplementation(() => {
                const results = [
                  {
                    totalSessions: 5,
                    totalMessages: 42,
                    lastActive: "2025-02-14T12:00:00.000Z",
                  },
                ];
                // Make it thenable to return results when awaited
                const then = (onfulfilled: any) => Promise.resolve(results).then(onfulfilled);
                return Object.assign(Promise.resolve(results), { then });
              }),
            };
            const then = (onfulfilled: any) => Promise.resolve([]).then(onfulfilled);
            return Object.assign(Promise.resolve([]), fromBuilder, { then });
          }),
        };
        return queryBuilder;
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: new Date("2025-02-14T12:00:00.000Z"),
    });
  });

  it("should return empty/zero stats when user has no sessions", async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        const queryBuilder = {
          from: vi.fn().mockImplementation(() => {
            const fromBuilder = {
              where: vi.fn().mockImplementation(() => {
                const results = [
                  {
                    totalSessions: 0,
                    totalMessages: null,
                    lastActive: null,
                  },
                ];
                const then = (onfulfilled: any) => Promise.resolve(results).then(onfulfilled);
                return Object.assign(Promise.resolve(results), { then });
              }),
            };
            const then = (onfulfilled: any) => Promise.resolve([]).then(onfulfilled);
            return Object.assign(Promise.resolve([]), fromBuilder, { then });
          }),
        };
        return queryBuilder;
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(2);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
