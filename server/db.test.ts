import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.getUserStats", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
    setDb(null);
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    setDb(null);
  });

  it("returns zero stats when database is not connected", async () => {
    setDb(null);
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("calculates aggregated stats correctly using SQL aggregate query result", async () => {
    const mockLastActive = new Date("2025-01-15T12:00:00Z");
    const mockSelectResult = [
      {
        totalSessions: 5,
        totalMessages: 42,
        lastActive: mockLastActive.toISOString(),
      },
    ];

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: async () => mockSelectResult,
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(mockLastActive.toISOString());
  });

  it("handles null aggregate results when user has no sessions", async () => {
    const mockSelectResult = [
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ];

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: async () => mockSelectResult,
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(999);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
