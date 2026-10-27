import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db functions", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
    setDb(null);
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    setDb(null);
  });

  it("getUserStats returns default empty stats when db is not connected", async () => {
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("getUserStats calculates aggregates correctly using setDb mock", async () => {
    const now = new Date();
    const mockDb: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: "42",
          lastActive: now.toISOString(),
        },
      ]),
    };

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(now);
  });
});
