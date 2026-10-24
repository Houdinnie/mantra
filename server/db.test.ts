import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const origEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "mysql://mock:mock@localhost:3306/mock";
  });

  afterEach(() => {
    setDb(null);
    process.env.DATABASE_URL = origEnv;
  });

  it("returns default zero stats when no database or empty results", async () => {
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
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("calculates correct user stats using aggregate results", async () => {
    const now = new Date();
    const nowISO = now.toISOString();
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 5,
              totalMessages: "42",
              lastActive: nowISO,
            },
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(123);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(nowISO);
  });
});
