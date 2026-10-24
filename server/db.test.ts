import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db getUserStats", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("should return zeros and null when no sessions exist", async () => {
    mockDb.where.mockResolvedValue([]);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should aggregate stats from multiple sessions", async () => {
    const lastActive = new Date("2024-01-02");
    mockDb.where.mockResolvedValue([{
      totalSessions: 2,
      totalMessages: 15,
      lastActive: lastActive,
    }]);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive).toEqual(lastActive);
  });
});
