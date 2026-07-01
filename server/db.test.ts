import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts - getUserStats", () => {
  beforeEach(() => {
    setDb(null);
    vi.clearAllMocks();
  });

  it("should return zeros when no sessions exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            totalSessions: 0,
            totalMessages: null,
            lastActive: null,
          }]),
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

  it("should aggregate session data correctly", async () => {
    const lastActiveDate = new Date("2024-01-10T12:00:00Z");

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            totalSessions: 2,
            totalMessages: "15",
            lastActive: lastActiveDate.toISOString(),
          }]),
        }),
      }),
    } as any;

    setDb(mockDb);
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive).toEqual(lastActiveDate);
  });
});
