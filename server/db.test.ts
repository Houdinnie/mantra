import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setDb, getUserStats } from "./db";

describe("db.getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("should return zeros/null when db is null", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should execute aggregate query and return calculated stats", async () => {
    const now = new Date("2025-01-01T12:00:00.000Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "3",
          totalMessages: "15",
          lastActive: now.toISOString(),
        },
      ]),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
    expect(stats).toEqual({
      totalSessions: 3,
      totalMessages: 15,
      lastActive: now,
    });
  });

  it("should handle null aggregate query results gracefully", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ]),
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
