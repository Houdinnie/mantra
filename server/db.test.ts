import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db utils", () => {
  describe("getUserStats", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should return zeros when database is not available", async () => {
      setDb(null);
      const stats = await getUserStats(1);
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    });

    it("should correctly aggregate user stats using SQL aggregates", async () => {
      const mockLastActive = new Date();
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{
          totalSessions: "5",
          totalMessages: "150",
          lastActive: mockLastActive.toISOString(),
        }]),
      };

      setDb(mockDb as any);
      const stats = await getUserStats(1);

      expect(stats.totalSessions).toBe(5);
      expect(stats.totalMessages).toBe(150);
      expect(stats.lastActive).toBeInstanceOf(Date);
      expect(stats.lastActive?.getTime()).toBe(new Date(mockLastActive.toISOString()).getTime());
    });

    it("should handle empty results gracefully", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([null]),
      };

      setDb(mockDb as any);
      const stats = await getUserStats(1);

      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    });
  });
});
