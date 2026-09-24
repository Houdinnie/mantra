import { describe, it, expect, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("returns zeros/null when db is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("calculates stats correctly using SQL aggregation query results", async () => {
    const mockDate = new Date("2025-01-01T00:00:00.000Z");
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            { totalSessions: 5, totalMessages: 42, lastActive: mockDate }
          ])
        })
      })
    } as any;

    setDb(mockDb);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("handles null aggregates when user has no sessions", async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            { totalSessions: 0, totalMessages: null, lastActive: null }
          ])
        })
      })
    } as any;

    setDb(mockDb);
    const stats = await getUserStats(99);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
