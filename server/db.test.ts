import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

function createMockDb(selectResult: any[]) {
  const queryMock: any = {
    from: vi.fn().mockImplementation(() => queryMock),
    where: vi.fn().mockImplementation(() => queryMock),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(selectResult).then(onFulfilled);
    }),
  };

  const dbMock = {
    select: vi.fn().mockImplementation(() => queryMock),
  };

  return dbMock as any;
}

describe("database getUserStats", () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    // Prevent getDb from attempting auto connection
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalUrl;
    setDb(null);
  });

  it("should return correct aggregated stats when database returns records", async () => {
    const mockDate = new Date();
    const mockDb = createMockDb([
      {
        totalSessions: "2",
        totalMessages: "12",
        lastActive: mockDate.toISOString(),
      },
    ]);
    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(12);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(mockDate.toISOString());
  });

  it("should handle null and string representations from SQL aggregation correctly", async () => {
    const mockDb = createMockDb([
      {
        totalSessions: null,
        totalMessages: null,
        lastActive: null,
      },
    ]);
    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });

  it("should return fallback values if the database returns an empty array", async () => {
    const mockDb = createMockDb([]);
    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });

  it("should return fallback values if the database is not available", async () => {
    setDb(null);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
