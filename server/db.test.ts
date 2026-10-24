import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("should return default stats when db is not available", async () => {
    setDb(null);
    const prevEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });

    process.env.DATABASE_URL = prevEnv;
  });

  it("should correctly aggregate user stats from mocked database response", async () => {
    const mockDate = new Date("2025-01-01T12:00:00Z");

    const mockDb = {
      select: () => ({
        from: () => ({
          where: async () => [
            {
              totalSessions: 5,
              totalMessages: 42,
              lastActive: mockDate,
            },
          ],
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

  it("should return zero/null stats when user has no chat sessions", async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: async () => [
            {
              totalSessions: 0,
              totalMessages: null,
              lastActive: null,
            },
          ],
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(999);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
