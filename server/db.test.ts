import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("returns default zero stats when db is not available", async () => {
    setDb(null);
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("returns aggregated stats using SQL aggregations", async () => {
    const mockDate = new Date("2025-01-15T12:00:00Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: mockDate.toISOString(),
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(mockDate);
  });

  it("handles null/undefined aggregation results gracefully", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
