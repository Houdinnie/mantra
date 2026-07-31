import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats database helper", () => {
  beforeEach(() => {
    // Prevent the getDb helper from attempting automatic connection to real database if DATABASE_URL is somehow set
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should return correct aggregated stats for a user with sessions", async () => {
    const mockDate = new Date("2026-03-31T12:00:00.000Z");

    // Setup a mock query result matching what count, sum, max would return in MySQL
    const mockResult = [
      {
        totalSessions: 5,
        totalMessages: "125", // aggregates can be strings depending on the DB driver
        lastActive: mockDate.toISOString(), // date could be returned as ISO string or Date
      }
    ];

    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockResult),
    });

    const mockDb = {
      select: selectMock,
    } as any;

    mockDb.then = undefined;
    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 125,
      lastActive: mockDate,
    });
  });

  it("should return zero stats if user has no sessions", async () => {
    // empty aggregate response or totalSessions is 0
    const mockResult = [
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      }
    ];

    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockResult),
    });

    const mockDb = {
      select: selectMock,
    } as any;

    mockDb.then = undefined;
    setDb(mockDb);

    const stats = await getUserStats(2);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return zeros if result array is empty", async () => {
    const mockResult: any[] = [];

    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockResult),
    });

    const mockDb = {
      select: selectMock,
    } as any;

    mockDb.then = undefined;
    setDb(mockDb);

    const stats = await getUserStats(3);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
