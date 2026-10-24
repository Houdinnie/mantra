import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("should return correct stats for a user with sessions", async () => {
    const lastActiveDate = new Date();
    mockDb.where.mockResolvedValueOnce([
      {
        totalSessions: 5,
        totalMessages: 25,
        lastActive: lastActiveDate,
      },
    ]);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 25,
      lastActive: lastActiveDate,
    });
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should return zero stats for a user with no sessions", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ]);

    const stats = await getUserStats(2);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should handle null messageCount correctly", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        totalSessions: 1,
        totalMessages: null,
        lastActive: new Date(),
      },
    ]);

    const stats = await getUserStats(3);
    expect(stats.totalMessages).toBe(0);
  });

  it("should return default values if database is not available", async () => {
    setDb(null);
    // Note: getDb() will still try to connect if process.env.DATABASE_URL is set,
    // but in test environment without it, it returns null.
    // However, since we already called setDb(null), and getDb has:
    // if (!_db && process.env.DATABASE_URL) { ... } return _db;
    // It should return null if _db is null and DATABASE_URL is not set.

    const stats = await getUserStats(4);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });
});
