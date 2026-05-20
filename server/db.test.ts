import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db functions", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            totalSessions: 5,
            totalMessages: 42,
            lastActive: new Date("2023-10-27T10:00:00Z"),
          },
        ]);
      }),
    };
    setDb(mockDb);
  });

  it("getUserStats should return correct aggregated data", async () => {
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(42);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toBe("2023-10-27T10:00:00.000Z");
  });

  it("getUserStats should handle null results", async () => {
    mockDb.where.mockImplementationOnce(() => Promise.resolve([]));
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
