import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("getUserStats", () => {
  beforeEach(() => {
    // Reset DB before each test
    setDb(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return zeros when database is not available", async () => {
    process.env.DATABASE_URL = "";
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("should aggregate stats correctly using SQL functions", async () => {
    const mockDate = new Date("2024-01-01T00:00:00Z");

    // Create a mock DB that follows the Drizzle query builder pattern
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            totalSessions: 5,
            totalMessages: "42", // MySQL often returns count/sum as strings
            lastActive: mockDate.toISOString(),
          }
        ]);
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(123);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(chatSessions);
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("should handle null results from database gracefully", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        }
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(456);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
