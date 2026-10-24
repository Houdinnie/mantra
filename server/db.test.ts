import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    setDb(null);
    vi.resetAllMocks();
  });

  it("should return zeros when database is not available", async () => {
    setDb(null);
    process.env.DATABASE_URL = "";
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("should correctly aggregate session data using SQL aggregates", async () => {
    const mockResult = [
      {
        totalSessions: 2,
        totalMessages: "15", // Drizzle/MySQL might return sum as string
        lastActive: new Date("2023-01-02T10:00:00Z").toISOString(),
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockResult),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive).toEqual(new Date("2023-01-02T10:00:00Z"));
  });

  it("should handle no sessions", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });
});
