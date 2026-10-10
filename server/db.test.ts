import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats database aggregation", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("returns default zero stats when database is unavailable", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("calculates aggregate stats correctly using SQL aggregates mock", async () => {
    const mockDate = new Date("2025-01-15T12:00:00.000Z");

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            {
              totalSessions: 5,
              totalMessages: 42,
              lastActive: mockDate,
            },
          ]),
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(mockDate);
  });

  it("handles null/empty aggregate result safely", async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            {
              totalSessions: 0,
              totalMessages: null,
              lastActive: null,
            },
          ]),
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(99);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
