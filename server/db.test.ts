import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("should return zeros when no sessions exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      }]),
    };
    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should calculate stats from aggregated results", async () => {
    const now = new Date();
    // Aggregates might return strings for numbers depending on the driver
    const mockResult = [{
      totalSessions: "2",
      totalMessages: "15",
      lastActive: now.toISOString(),
    }];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockResult),
    };
    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 2,
      totalMessages: 15,
      lastActive: now,
    });
  });

  it("should handle null results gracefully", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
