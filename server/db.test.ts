import { describe, it, expect, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when database is not available", async () => {
    const origEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    setDb(null);

    const stats = await getUserStats(123);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });

    process.env.DATABASE_URL = origEnv;
  });

  it("should calculate user stats correctly via SQL aggregates", async () => {
    const now = new Date();
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            {
              totalSessions: "5",
              totalMessages: "42",
              lastActive: now.toISOString(),
            },
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.getTime()).toBe(now.getTime());
  });
});
