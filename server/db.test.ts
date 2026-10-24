import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    setDb(null);
    process.env.DATABASE_URL = "";
  });

  it("should return zeros when database is not available", async () => {
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return aggregated stats for a user", async () => {
    const lastActiveDate = new Date("2024-01-01T12:00:00Z");

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 3,
          totalMessages: "15", // Drizzle may return sum as string for some drivers
          lastActive: lastActiveDate.toISOString(),
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 3,
      totalMessages: 15,
      lastActive: lastActiveDate,
    });

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
  });

  it("should handle empty results from database", async () => {
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

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
