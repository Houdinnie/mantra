import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
    process.env.DATABASE_URL = originalDbUrl;
  });

  it("returns default zero stats when db is null", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("calculates stats using aggregate SQL query results", async () => {
    const now = new Date("2025-01-01T12:00:00Z");

    const createQueryBuilder = (queryResult: any[]) => {
      const builder = {
        from: () => builder,
        where: () => builder,
        then: (resolve: (val: any) => void) => resolve(queryResult),
      };
      return builder;
    };

    const mockDb = {
      select: () => createQueryBuilder([
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: now,
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(now.toISOString());
  });

  it("handles empty results when user has no chat sessions", async () => {
    const createQueryBuilder = (queryResult: any[]) => {
      const builder = {
        from: () => builder,
        where: () => builder,
        then: (resolve: (val: any) => void) => resolve(queryResult),
      };
      return builder;
    };

    const mockDb = {
      select: () => createQueryBuilder([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(999);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
