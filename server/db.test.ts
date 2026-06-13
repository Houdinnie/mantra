import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  it("should return correct stats", async () => {
    const mockResult = {
      totalSessions: 2,
      totalMessages: "15",
      lastActive: new Date("2023-01-02"),
    };

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockResult]),
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.getTime()).toBe(new Date("2023-01-02").getTime());
  });

  it("should return zeros when no sessions exist", async () => {
    // Drizzle returns an array with one object containing nulls/zeros for aggregate queries even if no rows match
    const mockResult = {
      totalSessions: 0,
      totalMessages: null,
      lastActive: null,
    };

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockResult]),
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
