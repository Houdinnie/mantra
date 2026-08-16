import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("returns default stats when database returns no result", async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
    };

    setDb(mockDb as any);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("correctly formats aggregate query results", async () => {
    const now = new Date("2026-03-30T12:00:00.000Z");
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () =>
            Promise.resolve([
              {
                totalSessions: "5",
                totalMessages: "42",
                lastActive: now.toISOString(),
              },
            ]),
        }),
      }),
    };

    setDb(mockDb as any);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: now,
    });
  });
});
