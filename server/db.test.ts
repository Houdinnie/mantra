import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when db is null", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("should query aggregates and parse numeric / date values correctly", async () => {
    const mockDate = new Date("2025-01-01T00:00:00.000Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "5",
          totalMessages: "42",
          lastActive: mockDate.toISOString(),
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("should handle empty or null aggregates gracefully", async () => {
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
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
