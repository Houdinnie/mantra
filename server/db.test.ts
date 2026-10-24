import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
};

describe("db.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.setDb(mockDb);
  });

  describe("getUserStats", () => {
    it("should calculate stats correctly using aggregates", async () => {
      const mockResult = [{
        totalSessions: "2",
        totalMessages: "15",
        lastActive: "2023-01-02 00:00:00",
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockResult)
        })
      } as any);

      const stats = await db.getUserStats(1);

      expect(stats.totalSessions).toBe(2);
      expect(stats.totalMessages).toBe(15);
      expect(stats.lastActive?.getTime()).toBe(new Date("2023-01-02 00:00:00").getTime());
    });

    it("should handle empty results", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      } as any);

      const stats = await db.getUserStats(1);

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.lastActive).toBeNull();
    });
  });
});
