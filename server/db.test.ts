import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { sql } from "drizzle-orm";

describe("getUserStats", () => {
  it("should return correct stats using optimized SQL aggregates", async () => {
    const mockStats = {
      totalSessions: 5,
      totalMessages: 25,
      lastActive: "2023-10-27T10:00:00.000Z",
    };

    const mockDb: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStats]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 25,
      lastActive: new Date("2023-10-27T10:00:00.000Z"),
    });

    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should handle empty results correctly", async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should handle null message counts and dates", async () => {
    const mockStats = {
      totalSessions: 0,
      totalMessages: null,
      lastActive: null,
    };

    const mockDb: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStats]),
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
