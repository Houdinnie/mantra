import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when db is not available", async () => {
    setDb(null);
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should calculate user stats using SQL aggregate query", async () => {
    const mockDate = new Date("2025-01-15T12:00:00Z");
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
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockQueryBuilder.from).toHaveBeenCalled();
    expect(mockQueryBuilder.where).toHaveBeenCalled();
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("should return zeros when aggregate result has no sessions", async () => {
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
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
