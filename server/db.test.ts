import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  it("should return correct stats using optimized SQL aggregates", async () => {
    const lastActiveDate = new Date("2023-01-01T12:00:00Z");
    const mockResult = {
      totalSessions: 2,
      totalMessages: "15", // Drizzle/MySQL might return sum as string
      lastActive: lastActiveDate.toISOString(),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.toISOString()).toBe(lastActiveDate.toISOString());
  });

  it("should handle null results from SQL aggregates", async () => {
    const mockResult = {
      totalSessions: 0,
      totalMessages: null,
      lastActive: null,
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
