import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when database is unavailable", async () => {
    setDb(null);
    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return correct aggregate stats when sessions exist", async () => {
    const mockDate = new Date("2025-01-01T12:00:00Z");

    const mockDb: any = {
      select: vi.fn().mockImplementation(() => {
        const queryBuilder: any = {
          from: vi.fn().mockImplementation(() => queryBuilder),
          where: vi.fn().mockImplementation(() => queryBuilder),
          then: (resolve: (value: any) => void) => {
            resolve([
              {
                totalSessions: 5,
                totalMessages: 42,
                lastActive: mockDate.toISOString(),
              },
            ]);
          },
        };
        return queryBuilder;
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(mockDate.toISOString());
  });

  it("should return zeros when user has no sessions", async () => {
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => {
        const queryBuilder: any = {
          from: vi.fn().mockImplementation(() => queryBuilder),
          where: vi.fn().mockImplementation(() => queryBuilder),
          then: (resolve: (value: any) => void) => {
            resolve([
              {
                totalSessions: 0,
                totalMessages: null,
                lastActive: null,
              },
            ]);
          },
        };
        return queryBuilder;
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(999);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
