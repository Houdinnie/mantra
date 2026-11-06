import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalEnvUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    // Reset db before each test
    setDb(null);
  });

  afterEach(() => {
    // Restore db and env
    setDb(null);
    process.env.DATABASE_URL = originalEnvUrl;
  });

  it("should return default stats when database is not available", async () => {
    process.env.DATABASE_URL = "";
    setDb(null);

    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should correctly compute aggregates from database query", async () => {
    const mockDate = new Date("2026-03-30T12:00:00Z");

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            {
              totalSessions: 5,
              totalMessages: 42,
              lastActive: mockDate.toISOString(),
            },
          ]),
        }),
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(123);
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockDate,
    });
  });

  it("should handle null results or zero sessions gracefully", async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            {
              totalSessions: 0,
              totalMessages: null,
              lastActive: null,
            },
          ]),
        }),
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(456);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should handle string numbers returned by some MySQL drivers", async () => {
    const mockDate = new Date("2026-03-29T10:00:00Z");

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            {
              totalSessions: "15",
              totalMessages: "150",
              lastActive: mockDate,
            },
          ]),
        }),
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(789);
    expect(stats).toEqual({
      totalSessions: 15,
      totalMessages: 150,
      lastActive: mockDate,
    });
  });
});
