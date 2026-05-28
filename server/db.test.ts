import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.getUserStats", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("should return correct stats when sessions exist", async () => {
    const lastActiveDate = new Date("2023-01-01T12:00:00Z");
    mockDb.where.mockResolvedValueOnce([{
      totalSessions: 5,
      totalMessages: 42,
      lastActive: lastActiveDate,
    }]);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: lastActiveDate,
    });
  });

  it("should return zero stats when no sessions exist", async () => {
    mockDb.where.mockResolvedValueOnce([{
      totalSessions: 0,
      totalMessages: null,
      lastActive: null,
    }]);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should handle string values from SQL (common in some drivers)", async () => {
    mockDb.where.mockResolvedValueOnce([{
      totalSessions: "10",
      totalMessages: "100",
      lastActive: "2023-10-27T10:00:00.000Z",
    }]);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(10);
    expect(stats.totalMessages).toBe(100);
    expect(stats.lastActive).toBeInstanceOf(Date);
  });
});
