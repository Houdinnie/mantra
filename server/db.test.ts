import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const originalDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    // Reset database instance before each test
    setDb(null);
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDbUrl;
    setDb(null);
  });

  it("returns default zero stats when database is not available", async () => {
    process.env.DATABASE_URL = "";
    setDb(null);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("calculates aggregate stats correctly when data exists", async () => {
    const mockDate = new Date("2025-01-15T12:00:00Z");

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
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

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toEqual(mockDate);
  });

  it("handles null / zero results from empty tables gracefully", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
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

    const stats = await getUserStats(999);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("handles string representations returned by mysql2 driver aggregate queries", async () => {
    const mockDate = new Date("2025-05-20T10:30:00Z");

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: "12",
              totalMessages: "150",
              lastActive: mockDate,
            },
          ]),
        }),
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(2);
    expect(stats.totalSessions).toBe(12);
    expect(stats.totalMessages).toBe(150);
    expect(stats.lastActive).toEqual(mockDate);
  });
});
