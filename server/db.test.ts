import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db helper functions", () => {
  beforeEach(() => {
    // Prevent real connection attempts
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    setDb(null);
  });

  it("should retrieve user stats using aggregate queries and convert types correctly", async () => {
    // Mock database output: 5 sessions, 12 messages, and a specific date for last active
    const mockDate = new Date("2026-03-15T12:00:00.000Z");

    const mockResult = [{
      totalSessions: 5,
      totalMessages: "12", // Driver might return strings for SUM
      lastActive: mockDate.toISOString(), // Driver might return ISO string
    }];

    // Setup builder mock
    const builderMock: any = {
      from: vi.fn().mockImplementation(() => builderMock),
      where: vi.fn().mockImplementation(() => builderMock),
      then: vi.fn().mockImplementation((onfulfilled) => {
        return Promise.resolve(mockResult).then(onfulfilled);
      })
    };

    const selectSpy = vi.fn().mockImplementation(() => builderMock);

    const dbMock: any = {
      select: selectSpy,
    };

    setDb(dbMock as any);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(12);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe(mockDate.toISOString());
    expect(selectSpy).toHaveBeenCalled();
  });

  it("should handle empty stats gracefully if no records are found", async () => {
    const mockResult: any[] = [];

    const builderMock: any = {
      from: vi.fn().mockImplementation(() => builderMock),
      where: vi.fn().mockImplementation(() => builderMock),
      then: vi.fn().mockImplementation((onfulfilled) => {
        return Promise.resolve(mockResult).then(onfulfilled);
      })
    };

    const selectSpy = vi.fn().mockImplementation(() => builderMock);

    const dbMock: any = {
      select: selectSpy,
    };

    setDb(dbMock as any);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
