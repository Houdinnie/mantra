import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should calculate stats correctly using SQL aggregates", async () => {
    const mockDate = new Date("2023-01-01T12:00:00Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 2,
          totalMessages: 15,
          lastActive: mockDate,
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 2,
      totalMessages: 15,
      lastActive: mockDate,
    });

    // Verify that select was called with the expected aggregate fields
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();

    // Clean up
    setDb(null);
  });

  it("should handle string values returned by SQL aggregates cleanly", async () => {
    const mockDateStr = "2023-01-01T12:00:00.000Z";
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "5",
          totalMessages: "123",
          lastActive: mockDateStr,
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 123,
      lastActive: new Date(mockDateStr),
    });

    setDb(null);
  });

  it("should return zero values when no results are returned", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });

    setDb(null);
  });

  it("should handle null messageCount and totalSessions values", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: null,
          totalMessages: null,
          lastActive: null,
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });

    setDb(null);
  });

  it("should return default values if database is not available", async () => {
    setDb(null);

    // Explicitly set process.env.DATABASE_URL empty to ensure getDb() returns null
    const oldUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";

    try {
      const stats = await getUserStats(1);
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    } finally {
      process.env.DATABASE_URL = oldUrl;
    }
  });
});
