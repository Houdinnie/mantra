import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

const mockQueryBuilder = {
  select: () => mockQueryBuilder,
  from: () => mockQueryBuilder,
  where: () => mockQueryBuilder,
  resolvedValue: [] as any,
  then(onFulfilled: any) {
    return Promise.resolve(this.resolvedValue).then(onFulfilled);
  },
};

const mockDb = {
  select: () => mockQueryBuilder,
};

describe("db getUserStats", () => {
  beforeEach(() => {
    setDb(mockDb as any);
  });

  afterEach(() => {
    setDb(null);
  });

  it("returns zero stats when result is empty", async () => {
    mockQueryBuilder.resolvedValue = [];
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("correctly aggregates stats and parses values", async () => {
    const mockRow = {
      totalSessions: "5",
      totalMessages: "42",
      lastActive: "2026-05-02T15:47:13.000Z",
    };
    mockQueryBuilder.resolvedValue = [mockRow];

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe("2026-05-02T15:47:13.000Z");
  });
});
