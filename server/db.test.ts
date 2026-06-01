import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  it("should calculate stats from sessions correctly", async () => {
    const mockStats = {
      totalSessions: 3,
      totalMessages: 17,
      lastActive: "2023-01-02T10:00:00Z",
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStats]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(3);
    expect(stats.totalMessages).toBe(17);
    expect(stats.lastActive).toEqual(new Date("2023-01-02T10:00:00Z"));
  });

  it("should return zeros for no sessions", async () => {
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

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
