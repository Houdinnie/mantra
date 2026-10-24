import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    setDb(null);
  });

  it("should return default stats when database is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should calculate user stats correctly using SQL aggregation results", async () => {
    const mockDateStr = new Date("2025-01-15T12:00:00Z").toISOString();

    const mockSelectBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: mockDateStr,
        },
      ]),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(mockSelectBuilder),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(new Date(mockDateStr));
  });

  it("should handle null aggregation results gracefully", async () => {
    const mockSelectBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ]),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(mockSelectBuilder),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(456);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
