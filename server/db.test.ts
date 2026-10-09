import { describe, it, expect, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    setDb(null);
    process.env.DATABASE_URL = originalEnv;
  });

  it("should return zeros when db is null", async () => {
    process.env.DATABASE_URL = "";
    setDb(null);
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return aggregated stats from query result", async () => {
    const mockDate = new Date("2025-01-15T12:00:00Z");
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

  it("should handle null or missing aggregate results safely", async () => {
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
