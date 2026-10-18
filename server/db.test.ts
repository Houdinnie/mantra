import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when database is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should aggregate stats correctly from database query", async () => {
    const mockDate = new Date("2025-01-01T00:00:00.000Z");
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 5,
              totalMessages: 42,
              lastActive: mockDate.toISOString(),
            },
          ]),
        }),
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(mockDate);
  });
});
