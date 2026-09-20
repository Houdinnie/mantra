import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("returns zeroed stats when database is unavailable", async () => {
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("returns aggregated stats using SQL aggregate query", async () => {
    const mockDate = new Date("2025-01-01T00:00:00.000Z");
    const mockQueryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "5",
          totalMessages: "42",
          lastActive: mockDate.toISOString(),
        },
      ]),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });
});
