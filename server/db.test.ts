import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db functions", () => {
  let mockSelectResult: any[] = [];

  const mockDb = {
    select: vi.fn().mockImplementation(() => {
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: (onfulfilled: any) =>
          Promise.resolve(mockSelectResult).then(onfulfilled),
      };
      return chain;
    }),
  };

  beforeEach(() => {
    // Prevent getDb from trying to read database url or initialize real driver
    process.env.DATABASE_URL = "";
    setDb(mockDb as any);
    mockSelectResult = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    setDb(null);
  });

  describe("getUserStats", () => {
    it("should return zeros and null if no DB is available", async () => {
      setDb(null);
      const stats = await getUserStats(1);
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    });

    it("should return zeros and null if DB result is empty", async () => {
      mockSelectResult = [];
      const stats = await getUserStats(1);
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      });
    });

    it("should aggregate stats correctly using count, sum and max", async () => {
      const testDate = new Date("2026-05-02T15:00:00.000Z");
      mockSelectResult = [
        {
          totalSessions: "12",
          totalMessages: "135",
          lastActive: testDate.toISOString(),
        },
      ];

      const stats = await getUserStats(1);
      expect(stats).toEqual({
        totalSessions: 12,
        totalMessages: 135,
        lastActive: testDate,
      });
      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
