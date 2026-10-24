import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { sql } from "drizzle-orm";

describe("db.getUserStats", () => {
  it("should return correct stats using SQL aggregates", async () => {
    const mockDate = new Date("2024-01-01T00:00:00Z");

    // Mock database result for the aggregate query
    const mockStats = [{
      totalSessions: 5,
      totalMessages: 150,
      lastActive: mockDate
    }];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStats),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: mockDate
    });

    // Verify the query structure
    expect(mockDb.select).toHaveBeenCalled();
    const selectArg = (mockDb.select as any).mock.calls[0][0];
    expect(selectArg.totalSessions).toBeDefined();
    expect(selectArg.totalMessages).toBeDefined();
    expect(selectArg.lastActive).toBeDefined();
  });

  it("should return zero stats when no sessions exist", async () => {
    const mockStats = [{
      totalSessions: 0,
      totalMessages: null,
      lastActive: null
    }];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStats),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null
    });
  });
});
