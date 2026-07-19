import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts getUserStats", () => {
  beforeEach(() => {
    // Prevent getDb from trying to connect if database_url is set
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
    vi.restoreAllMocks();
  });

  it("should return zeros and null when database is not connected", async () => {
    setDb(null);
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return aggregate statistics correctly when rows exist", async () => {
    const mockDate = new Date("2026-03-01T12:00:00.000Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 5,
          totalMessages: "125", // some DB drivers might return sum as string
          lastActive: mockDate.toISOString(),
        }
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 125, // cast to number
      lastActive: mockDate, // converted to Date object
    });
  });

  it("should return default statistics when no rows match query", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
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
