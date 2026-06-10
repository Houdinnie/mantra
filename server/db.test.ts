import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.getUserStats", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("should return correct stats when data is present", async () => {
    const lastActiveDate = new Date();
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            totalSessions: 5,
            totalMessages: 100,
            lastActive: lastActiveDate.toISOString(),
          },
        ]),
      }),
    });

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(5);
    expect(stats.totalMessages).toBe(100);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.getTime()).toBe(lastActiveDate.getTime());
  });

  it("should return default stats when no data is found", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
