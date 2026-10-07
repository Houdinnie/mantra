import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("returns default zero stats when db is not available", async () => {
    process.env.DATABASE_URL = "";
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("returns aggregated user stats using SQL aggregate query", async () => {
    const mockDate = new Date("2025-01-01T12:00:00Z");

    // Create query builder mock that handles .select().from().where() chaining
    const mockQueryBuilder = {
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
      select: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(mockDb.select).toHaveBeenCalled();
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("handles null aggregate query results gracefully", async () => {
    const mockQueryBuilder = {
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
      select: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(999);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
