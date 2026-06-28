import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("db.ts unit tests", () => {
  beforeEach(() => {
    setDb(null);
  });

  describe("getUserStats", () => {
    it("should return zeros when database is not available", async () => {
      setDb(null);
      const stats = await getUserStats(1);
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    });

    it("should return aggregated stats for a user", async () => {
      const mockLastActive = new Date();
      const mockStats = {
        totalSessions: 5,
        totalMessages: "42", // MySQL sum might return string
        lastActive: mockLastActive.toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockStats]),
          }),
        }),
      };

      setDb(mockDb as any);

      const stats = await getUserStats(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(stats.totalSessions).toBe(5);
      expect(stats.totalMessages).toBe(42);
      expect(stats.lastActive).toBeInstanceOf(Date);
      expect(stats.lastActive?.getTime()).toBe(mockLastActive.getTime());
    });

    it("should handle null results from aggregation", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                totalSessions: 0,
                totalMessages: null,
                lastActive: null,
              },
            ]),
          }),
        }),
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
