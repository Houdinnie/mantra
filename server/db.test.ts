import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats database helper", () => {
  beforeEach(() => {
    // Set DATABASE_URL to empty string to prevent automatic connection attempts
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    // Reset database mock
    setDb(null);
    vi.restoreAllMocks();
  });

  it("should calculate correct stats when the user has sessions", async () => {
    const mockDate = new Date("2026-05-02T15:47:13.000Z");

    // Explicitly mock all chained methods in the query builder
    const mockWhere = vi.fn().mockResolvedValue([
      {
        totalSessions: 3,
        totalMessages: 15,
        lastActive: mockDate.toISOString(),
      },
    ]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    const mockDb = { select: mockSelect } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(3);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(mockDate.toISOString());

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("should return default stats when the user has no sessions", async () => {
    // Explicitly mock all chained methods in the query builder
    const mockWhere = vi.fn().mockResolvedValue([
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    const mockDb = { select: mockSelect } as any;

    setDb(mockDb);

    const stats = await getUserStats(2);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("should return default stats if database is not available", async () => {
    setDb(null);
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
