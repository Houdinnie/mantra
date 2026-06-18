import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats optimization", () => {
  it("should calculate user stats using SQL aggregate mock", async () => {
    const mockDate = new Date("2024-01-01T00:00:00Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "5",
          totalMessages: "150",
          lastActive: mockDate.toISOString(),
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: mockDate,
    });

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();

    // Clean up
    setDb(null);
  });

  it("should handle empty results", async () => {
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

    setDb(null);
  });
});
