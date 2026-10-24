import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("db.ts unit tests", () => {
  beforeEach(() => {
    setDb(null);
    vi.clearAllMocks();
  });

  describe("getUserStats", () => {
    it("should return zeros if database is not available", async () => {
      setDb(null);
      const stats = await getUserStats(1);
      expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
    });

    it("should aggregate session data correctly", async () => {
      const mockResult = [
        {
          totalSessions: 2,
          totalMessages: 15,
          lastActive: "2023-01-02T10:00:00.000Z",
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockResult),
          }),
        }),
      } as any;

      setDb(mockDb);

      const stats = await getUserStats(1);

      expect(stats.totalSessions).toBe(2);
      expect(stats.totalMessages).toBe(15);
      expect(stats.lastActive?.toISOString()).toBe(new Date("2023-01-02T10:00:00Z").toISOString());
    });
  });
});
