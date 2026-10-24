import { describe, it, expect, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("returns default zero stats when db is null", async () => {
    setDb(null);
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const stats = await getUserStats(123);
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    } finally {
      process.env.DATABASE_URL = originalEnv;
    }
  });

  it("calculates aggregate user stats via SQL query", async () => {
    const mockDateStr = "2025-01-01T12:00:00.000Z";
    const mockResult = [
      {
        totalSessions: 5,
        totalMessages: 42,
        lastActive: mockDateStr,
      },
    ];

    const mockQueryBuilder = {
      from: () => mockQueryBuilder,
      where: () => mockQueryBuilder,
      then: (resolve: (val: any) => void) => resolve(mockResult),
    };

    const mockDb = {
      select: () => mockQueryBuilder,
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(new Date(mockDateStr));
  });

  it("handles null values from SQL aggregate query", async () => {
    const mockResult = [
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ];

    const mockQueryBuilder = {
      from: () => mockQueryBuilder,
      where: () => mockQueryBuilder,
      then: (resolve: (val: any) => void) => resolve(mockResult),
    };

    const mockDb = {
      select: () => mockQueryBuilder,
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(999);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
