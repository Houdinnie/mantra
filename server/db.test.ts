import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  afterEach(() => {
    setDb(null);
  });

  it("returns zeros/null when db is not available", async () => {
    setDb(null);
    process.env.DATABASE_URL = "";
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("returns aggregate stats correctly using mocked query builder", async () => {
    const now = new Date();
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: now,
        },
      ]),
    };

    setDb(mockDb as any);
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(now);
  });

  it("handles string numbers returned from DB aggregate drivers", async () => {
    const nowStr = "2025-01-01T12:00:00.000Z";
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "12",
          totalMessages: "100",
          lastActive: nowStr,
        },
      ]),
    };

    setDb(mockDb as any);
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(12);
    expect(stats.totalMessages).toBe(100);
    expect(stats.lastActive).toEqual(new Date(nowStr));
  });

  it("handles empty results or null aggregate outputs", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ]),
    };

    setDb(mockDb as any);
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
