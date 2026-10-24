import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, getDb, setDb } from "./db";

describe("database utility and functions", () => {
  beforeEach(() => {
    // Robust unit testing: prevent getDb helper from attempting automatic connection by resetting DATABASE_URL
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    // Reset the database instance mock to prevent state leakage between tests
    setDb(null);
  });

  it("should return fallback stats if database is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should calculate user stats correctly using SQL aggregations when database is mocked", async () => {
    const mockDateStr = "2026-03-29T10:00:00.000Z";

    // Create a mock database instance following the non-thenable rule
    const selectQuery = {
      from: vi.fn().mockImplementation(() => {
        const fromObj = {
          where: vi.fn().mockImplementation(() => {
            const result = [
              {
                totalSessions: "5",
                totalMessages: "123",
                lastActive: mockDateStr,
              },
            ];
            return Promise.resolve(result);
          }),
        };
        return fromObj;
      }),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(selectQuery),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(mockDb.select).toHaveBeenCalled();
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 123,
      lastActive: new Date(mockDateStr),
    });
  });

  it("should handle empty or null values in SQL aggregation result gracefully", async () => {
    const selectQuery = {
      from: vi.fn().mockImplementation(() => {
        const fromObj = {
          where: vi.fn().mockImplementation(() => {
            const result = [
              {
                totalSessions: null,
                totalMessages: null,
                lastActive: null,
              },
            ];
            return Promise.resolve(result);
          }),
        };
        return fromObj;
      }),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(selectQuery),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("getDb should return null if DATABASE_URL is empty", async () => {
    const db = await getDb();
    expect(db).toBeNull();
  });
});
