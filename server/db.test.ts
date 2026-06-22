import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db getUserStats", () => {
  beforeEach(() => {
    setDb(null);
  });

  it("should return zeros when database is not available", async () => {
    const stats = await getUserStats(1);
    expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
  });

  it("should calculate stats using SQL aggregates", async () => {
    const mockResult = [
      {
        totalSessions: 2,
        totalMessages: "15", // sum often returns string in some drivers
        lastActive: "2023-01-02T10:00:00Z",
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockResult),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive).toEqual(new Date("2023-01-02T10:00:00Z"));
  });
});
