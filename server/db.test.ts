import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    setDb(null);
  });

  it("returns aggregate user stats when database has session records", async () => {
    const mockDate = new Date("2025-01-15T12:00:00.000Z");
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => [
            {
              totalSessions: 5,
              totalMessages: "42",
              lastActive: mockDate.toISOString(),
            },
          ],
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("returns zero stats when user has no session records", async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => [
            {
              totalSessions: 0,
              totalMessages: null,
              lastActive: null,
            },
          ],
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(2);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("returns default zero stats when database is unavailable", async () => {
    setDb(null);

    const stats = await getUserStats(3);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
