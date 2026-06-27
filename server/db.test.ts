import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("getUserStats", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("should return zeros when no sessions exist", async () => {
    mockDb.where.mockResolvedValueOnce([
      { totalSessions: 0, totalMessages: 0, lastActive: null }
    ]);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null
    });
  });

  it("should correctly aggregate stats from multiple sessions", async () => {
    const lastActiveDate = new Date("2024-01-01T12:00:00Z");
    mockDb.where.mockResolvedValueOnce([
      {
        totalSessions: 3,
        totalMessages: 42,
        lastActive: lastActiveDate.toISOString()
      }
    ]);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(3);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.getTime()).toBe(lastActiveDate.getTime());
  });

  it("should handle null results gracefully", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null
    });
  });
});
