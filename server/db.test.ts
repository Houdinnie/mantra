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

  it("should return zeros when database is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should correctly aggregate user stats using SQL aggregate queries", async () => {
    const mockDate = new Date("2025-01-01T12:00:00Z");

    const mockWhere = vi.fn().mockResolvedValue([
      {
        totalSessions: "3",
        totalMessages: "15",
        lastActive: mockDate.toISOString(),
      },
    ]);

    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(42);

    expect(stats.totalSessions).toBe(3);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive).toEqual(mockDate);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("should handle null results gracefully when user has no chat sessions", async () => {
    const mockWhere = vi.fn().mockResolvedValue([
      {
        totalSessions: "0",
        totalMessages: null,
        lastActive: null,
      },
    ]);

    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(99);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
