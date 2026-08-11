import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb, getDb } from "./db";

describe("Database helpers - getUserStats", () => {
  let originalDatabaseUrl: string | undefined;

  beforeEach(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    // Always reset mock state to prevent leaking between tests
    setDb(null);
  });

  it("should return empty stats if no database is connected or mocked", async () => {
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should calculate correct aggregate stats when database is mocked", async () => {
    const now = new Date();
    // Use ISO string to ensure consistent timezone and type casting conversion
    const nowIso = now.toISOString();

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 12,
              totalMessages: "450", // Database aggregate count/sum can return string
              lastActive: nowIso,
            }
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(12);
    expect(stats.totalMessages).toBe(450);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(nowIso);
  });

  it("should return zero stats if database query returns empty array", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
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
});
