import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when db is null", async () => {
    setDb(null);
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return aggregated user stats correctly", async () => {
    const nowISO = new Date().toISOString();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "5",
          totalMessages: "42",
          lastActive: nowISO,
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(new Date(nowISO));
  });

  it("should handle empty query result gracefully", async () => {
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
    };

    setDb(mockDb as any);

    const stats = await getUserStats(99);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
