import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db functions", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
    setDb(null);
  });

  afterEach(() => {
    setDb(null);
  });

  describe("getUserStats", () => {
    it("should return default empty stats when db is null", async () => {
      setDb(null);
      const stats = await getUserStats(1);
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    });

    it("should return aggregated metrics using SQL count, sum, and max", async () => {
      const now = new Date();
      const mockResult = [
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: now.toISOString(),
        },
      ];

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => Promise.resolve(mockResult),
          }),
        }),
      };

      setDb(mockDb as any);

      const stats = await getUserStats(1);
      expect(stats.totalSessions).toBe(5);
      expect(stats.totalMessages).toBe(42);
      expect(stats.lastActive).toBeInstanceOf(Date);
      expect(stats.lastActive?.getTime()).toBe(now.getTime());
    });
  });
});
