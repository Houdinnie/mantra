import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts - getUserStats", () => {
  beforeEach(() => {
    setDb(null);
  });

  it("should return zeros when no sessions exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 0,
        totalMessages: 0,
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
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should return aggregated stats when sessions exist", async () => {
    const lastActiveDate = new Date("2023-01-01T12:00:00Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 5,
        totalMessages: 42,
        lastActive: lastActiveDate.toISOString(),
      }]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: lastActiveDate,
    });
  });

  it("should return zeros if database is not available", async () => {
    // Ensure getDb returns null
    process.env.DATABASE_URL = "";
    setDb(null);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
