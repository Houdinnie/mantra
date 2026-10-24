import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db functions", () => {
  let originalDatabaseUrl: string | undefined;

  beforeEach(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    setDb(null);
  });

  it("should calculate user stats correctly using database aggregates", async () => {
    const mockLastActive = new Date("2025-02-19T00:00:00.000Z");

    const mockResult = [
      {
        totalSessions: 5,
        totalMessages: "42",
        lastActive: mockLastActive.toISOString(),
      },
    ];

    const mockWhereResult = {
      then: (onFulfilled: any) => Promise.resolve(mockResult).then(onFulfilled),
    };

    const mockWhere = vi.fn().mockReturnValue(mockWhereResult);

    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere,
    });

    const mockSelect = vi.fn().mockReturnValue({
      from: mockFrom,
    });

    const mockDb = {
      select: mockSelect,
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockLastActive,
    });

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("should handle empty stats correctly", async () => {
    const mockResult = [
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ];

    const mockWhereResult = {
      then: (onFulfilled: any) => Promise.resolve(mockResult).then(onFulfilled),
    };

    const mockWhere = vi.fn().mockReturnValue(mockWhereResult);

    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere,
    });

    const mockSelect = vi.fn().mockReturnValue({
      from: mockFrom,
    });

    const mockDb = {
      select: mockSelect,
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
