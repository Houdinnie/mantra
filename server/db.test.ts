import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("getUserStats", () => {
  beforeEach(() => {
    // Prevent getDb from attempting actual connection
    process.env.DATABASE_URL = "";
    setDb(null);
  });

  it("should correctly aggregate stats for a user with multiple sessions", async () => {
    const userId = 1;
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000 * 60 * 60);

    const mockStats = {
      totalSessions: 2,
      totalMessages: "25", // DB drivers often return sum as string
      lastActive: now.toISOString(),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStats]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(userId);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(chatSessions);
    expect(stats).toEqual({
      totalSessions: 2,
      totalMessages: 25,
      lastActive: now,
    });
  });

  it("should handle users with no sessions", async () => {
    const userId = 999;

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      }]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(userId);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return zeros if database is not available", async () => {
    setDb(null);
    process.env.DATABASE_URL = "";

    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });
});
