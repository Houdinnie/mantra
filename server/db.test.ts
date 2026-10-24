import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  it("should return correct stats using aggregate functions", async () => {
    const mockStats = {
      totalSessions: 5,
      totalMessages: "150",
      lastActive: new Date("2023-10-27T10:00:00Z").toISOString(),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStats]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(150);
    expect(stats.lastActive).toEqual(new Date("2023-10-27T10:00:00Z"));
  });

  it("should handle null results", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([null]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
