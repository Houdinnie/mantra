import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.getUserStats", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    setDb(null);
  });

  it("should return zeros when no sessions exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([
              { totalSessions: 0, totalMessages: null, lastActive: null },
            ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should correctly aggregate session data", async () => {
    const now = new Date();
    // Using a proper ISO string for date conversion consistency
    const nowStr = now.toISOString();

    const mockResult = {
      totalSessions: 2,
      totalMessages: "15", // MySQL might return strings for aggregates
      lastActive: nowStr,
    };

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockResult]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive instanceof Date).toBe(true);
    expect(stats.lastActive?.getTime()).toBe(new Date(nowStr).getTime());
  });
});
