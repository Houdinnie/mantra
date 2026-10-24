import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate stats correctly using SQL aggregates", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 2,
          totalMessages: 15,
          lastActive: new Date("2023-01-01T12:00:00Z"),
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 2,
      totalMessages: 15,
      lastActive: new Date("2023-01-01T12:00:00Z"),
    });

    // Verify that select was called with the expected structure
    expect(mockDb.select).toHaveBeenCalledWith(expect.objectContaining({
      totalSessions: expect.anything(),
      totalMessages: expect.anything(),
      lastActive: expect.anything(),
    }));
  });

  it("should return zeros when no results are returned", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
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
