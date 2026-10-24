import { describe, it, expect, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when database is not available", async () => {
    process.env.DATABASE_URL = "";
    setDb(null);
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should calculate user stats correctly using SQL aggregation result", async () => {
    const mockLastActive = new Date("2025-01-01T12:00:00Z");
    const mockDb = {
      select: () => ({
        from: () => ({
          where: async () => [
            {
              totalSessions: 5,
              totalMessages: 42,
              lastActive: mockLastActive.toISOString(),
            },
          ],
        }),
      }),
    } as any;

    setDb(mockDb);
    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockLastActive,
    });
  });

  it("should handle empty or null aggregate results gracefully", async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: async () => [
            {
              totalSessions: 0,
              totalMessages: null,
              lastActive: null,
            },
          ],
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
});
