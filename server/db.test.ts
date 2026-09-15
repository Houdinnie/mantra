import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return zero stats when database is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("should aggregate totalSessions, totalMessages, and lastActive correctly from database", async () => {
    const mockDate = new Date("2025-01-15T12:00:00.000Z");

    // Create query builder mock chain
    const queryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: mockDate.toISOString(),
        },
      ]),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(queryBuilder),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(mockDb.select).toHaveBeenCalled();
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("should handle empty stats response when user has no chat sessions", async () => {
    const queryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ]),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(queryBuilder),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(456);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
