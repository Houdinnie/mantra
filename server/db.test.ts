import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
    setDb(null);
  });

  afterEach(() => {
    setDb(null);
  });

  it("returns default zero values when database is unavailable", async () => {
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("calculates aggregated session stats via database aggregation query", async () => {
    const nowISO = new Date().toISOString();

    const mockQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() =>
        Promise.resolve([
          {
            totalSessions: 5,
            totalMessages: 42,
            maxLastActive: nowISO,
          },
        ])
      ),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(10);

    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.from).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.where).toHaveBeenCalledTimes(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(nowISO);
  });
});
