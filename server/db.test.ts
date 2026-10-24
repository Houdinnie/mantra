import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDbUrl;
    setDb(null);
  });

  it("should calculate user statistics via SQL aggregates", async () => {
    const mockTimestamp = "2025-01-01T12:00:00.000Z";
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: "5",
              totalMessages: "42",
              lastActive: mockTimestamp,
            },
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(new Date(mockTimestamp));
  });

  it("should handle null or empty aggregate results safely", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: null,
              totalMessages: null,
              lastActive: null,
            },
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });

  it("should return zeroes if database is unavailable", async () => {
    setDb(null);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
