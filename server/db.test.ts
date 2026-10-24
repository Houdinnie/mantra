import { describe, it, expect, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("returns default zero stats when db is null", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("calculates stats correctly using aggregate query", async () => {
    const mockDate = new Date("2025-01-15T12:00:00.000Z");
    const mockSelectResult = [
      {
        totalSessions: 5,
        totalMessages: 42,
        lastActive: mockDate.toISOString(),
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve(mockSelectResult),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("handles zero sessions returned from aggregate query", async () => {
    const mockSelectResult = [
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve(mockSelectResult),
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

  it("handles string numbers returned from DB aggregate functions", async () => {
    const mockDate = new Date("2025-02-10T10:30:00.000Z");
    const mockSelectResult = [
      {
        totalSessions: "12",
        totalMessages: "150",
        lastActive: mockDate.toISOString(),
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve(mockSelectResult),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 12,
      totalMessages: 150,
      lastActive: mockDate,
    });
  });
});
