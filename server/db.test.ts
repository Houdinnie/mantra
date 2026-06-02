import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts unit tests", () => {
  it("getUserStats should return aggregated stats for a user", async () => {
    const userId = 123;
    const mockResult = [
      {
        totalSessions: 3,
        totalMessages: "17", // sum can return string in some drivers
        lastActive: "2023-01-05T00:00:00.000Z",
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockResult),
    };

    setDb(mockDb);

    const stats = await getUserStats(userId);

    expect(stats).toEqual({
      totalSessions: 3,
      totalMessages: 17,
      lastActive: new Date("2023-01-05"),
    });

    expect(mockDb.select).toHaveBeenCalledWith(expect.objectContaining({
      totalSessions: expect.any(Object),
      totalMessages: expect.any(Object),
      lastActive: expect.any(Object),
    }));
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
  });

  it("getUserStats should handle no sessions", async () => {
    const userId = 123;
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ totalSessions: 0, totalMessages: null, lastActive: null }]),
    };

    setDb(mockDb);

    const stats = await getUserStats(userId);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
