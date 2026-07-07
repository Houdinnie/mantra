import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts", () => {
  it("getUserStats should use SQL aggregates and return correct stats", async () => {
    const lastActiveDate = new Date("2023-01-02T10:00:00Z");
    const mockResult = {
      totalSessions: 2,
      totalMessages: "15", // Drizzle may return sum as string depending on driver
      lastActive: lastActiveDate.toISOString(),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    } as any;

    setDb(mockDb);

    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "mock://db";

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.toISOString()).toBe(lastActiveDate.toISOString());

    process.env.DATABASE_URL = originalUrl;
    setDb(null);
  });

  it("getUserStats should return defaults when no results found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    } as any;

    setDb(mockDb);
    process.env.DATABASE_URL = "mock://db";

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();

    setDb(null);
  });
});
