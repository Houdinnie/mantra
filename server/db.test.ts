import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    setDb(null);
  });

  it("returns default zero stats if database is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("returns aggregated stats using SQL aggregate functions", async () => {
    const mockDate = new Date("2025-01-01T12:00:00.000Z");

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: mockDate,
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(10);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("handles empty result or null aggregate values gracefully", async () => {
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

    const stats = await getUserStats(99);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
