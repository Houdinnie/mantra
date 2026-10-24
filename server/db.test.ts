import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  it("should return aggregated stats for a user", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 5,
              totalMessages: 150,
              lastActive: "2023-10-27T10:00:00Z",
            },
          ]),
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(150);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe("2023-10-27T10:00:00.000Z");
  });

  it("should return zeros if no sessions found", async () => {
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

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
