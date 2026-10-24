import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { sql } from "drizzle-orm";

describe("getUserStats", () => {
  it("should correctly aggregate stats from database results", async () => {
    const mockDate = new Date("2025-01-01T00:00:00Z");

    // Mock database instance
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: 150,
          lastActive: mockDate,
        },
      ]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: mockDate,
    });

    // Verify that it called with expected aggregate functions
    expect(mockDb.select).toHaveBeenCalledWith(expect.objectContaining({
      totalSessions: expect.anything(),
      totalMessages: expect.anything(),
      lastActive: expect.anything(),
    }));

    // Reset DB for other tests
    setDb(null);
  });

  it("should handle empty results from database", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });

    setDb(null);
  });
});
