import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  it("should return correct stats for a user", async () => {
    const d2 = new Date("2023-01-02T00:00:00.000Z");

    // Updated mock to match new optimized implementation that uses select({ ... })
    const mockResult = {
      totalSessions: 2,
      totalMessages: 15,
      lastActive: d2,
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.toISOString()).toBe(d2.toISOString());
  });

  it("should handle no sessions", async () => {
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
