import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.getUserStats", () => {
  beforeEach(() => {
    // Reset DB mock before each test
    setDb(null);
  });

  it("should return zeros when no sessions found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { totalSessions: 0, totalMessages: null, lastActive: null }
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should correctly aggregate session stats", async () => {
    const lastActiveDate = new Date("2024-01-01T12:00:00Z");
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 5,
              totalMessages: "125", // MySQL might return strings for aggregates
              lastActive: lastActiveDate.toISOString()
            }
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(125);
    expect(stats.lastActive).toEqual(lastActiveDate);
  });

  it("should handle null message counts correctly", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { totalSessions: 2, totalMessages: null, lastActive: null }
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats.totalMessages).toBe(0);
  });
});
