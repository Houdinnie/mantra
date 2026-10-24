import { describe, it, expect, afterEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("database functions", () => {
  afterEach(() => {
    setDb(null);
  });

  it("should retrieve aggregated user stats correctly", async () => {
    const mockDate = new Date("2026-03-01T00:00:00.000Z");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        return {
          then: (resolve: any) =>
            resolve([
              {
                totalSessions: 5,
                totalMessages: 25,
                lastActive: mockDate,
              },
            ]),
        };
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(25);
    expect(stats.lastActive).toEqual(mockDate);
  });

  it("should handle empty stats correctly", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        return {
          then: (resolve: any) => resolve([undefined]),
        };
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
