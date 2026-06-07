import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db getUserStats", () => {
  const mockUserId = 1;

  it("should calculate user stats correctly using aggregates", async () => {
    const lastActiveDate = new Date("2023-10-27T10:00:00Z");

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 5,
              totalMessages: 120,
              lastActive: lastActiveDate.toISOString(),
            },
          ]),
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(mockUserId);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 120,
      lastActive: lastActiveDate,
    });
  });

  it("should return zeros when no sessions found", async () => {
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

    setDb(mockDb);

    const stats = await getUserStats(mockUserId);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should handle missing database connection", async () => {
    setDb(null);

    const stats = await getUserStats(mockUserId);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
