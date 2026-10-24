import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("getUserStats should return aggregated stats", async () => {
    const mockStats = {
      totalSessions: 5,
      totalMessages: 25,
      lastActive: new Date("2023-01-01"),
    };
    mockDb.where.mockResolvedValueOnce([mockStats]);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(25);
    expect(stats.lastActive).toEqual(new Date("2023-01-01"));
  });

  it("getUserStats should handle null results", async () => {
    mockDb.where.mockResolvedValueOnce([undefined]);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
