import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
    setDb(null);
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    setDb(null);
  });

  it("should return default stats when database is not available", async () => {
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return aggregated stats from database when available", async () => {
    const nowISO = new Date().toISOString();
    const mockDb: any = {
      select: () => mockDb,
      from: () => mockDb,
      where: () => [
        {
          totalSessions: "3",
          totalMessages: "42",
          lastActive: nowISO,
        },
      ],
    };

    setDb(mockDb);

    const stats = await getUserStats(10);
    expect(stats).toEqual({
      totalSessions: 3,
      totalMessages: 42,
      lastActive: new Date(nowISO),
    });
  });

  it("should handle null results from SQL aggregates gracefully", async () => {
    const mockDb: any = {
      select: () => mockDb,
      from: () => mockDb,
      where: () => [
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ],
    };

    setDb(mockDb);

    const stats = await getUserStats(99);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
