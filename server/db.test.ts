import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  it("should return aggregated stats using SQL aggregates", async () => {
    const mockLastActive = new Date();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: "2",
        totalMessages: "10",
        lastActive: mockLastActive.toISOString(),
      }]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(mockDb.select).toHaveBeenCalled();
    expect(stats).toEqual({
      totalSessions: 2,
      totalMessages: 10,
      lastActive: expect.any(Date),
    });
    expect(stats.lastActive?.toISOString()).toBe(mockLastActive.toISOString());
  });

  it("should handle empty results", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([null]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
