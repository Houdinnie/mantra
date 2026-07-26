import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("Database functions", () => {
  beforeEach(() => {
    // Prevent getDb from attempting automatic connection
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
    vi.clearAllMocks();
  });

  describe("getUserStats", () => {
    it("should return correct aggregate user statistics when data is present", async () => {
      const mockResult = [
        {
          totalSessions: 12,
          totalMessages: 45,
          lastActive: "2026-02-15T12:30:00.000Z",
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
      } as any;

      setDb(mockDb);

      const stats = await getUserStats(1);

      expect(stats).toEqual({
        totalSessions: 12,
        totalMessages: 45,
        lastActive: new Date("2026-02-15T12:30:00.000Z"),
      });

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it("should handle default/empty results when no session data is found", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      } as any;

      setDb(mockDb);

      const stats = await getUserStats(1);

      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    });

    it("should gracefully handle null aggregated values", async () => {
      const mockResult = [
        {
          totalSessions: "0",
          totalMessages: null,
          lastActive: null,
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult),
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
});
