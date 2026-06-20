import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats", () => {
  const mockUserId = 1;
  const mockUpdatedAt = new Date("2024-01-02T12:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct stats from database aggregation", async () => {
    const mockResult = {
      totalSessions: 2,
      totalMessages: 15,
      lastActive: mockUpdatedAt,
    };

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockResult]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(mockUserId);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive).toEqual(mockUpdatedAt);

    expect(mockDb.select).toHaveBeenCalledWith(expect.objectContaining({
      totalSessions: expect.anything(),
      totalMessages: expect.anything(),
      lastActive: expect.anything(),
    }));
  });

  it("should handle empty results", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(mockUserId);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });

  it("should return zeros when database is unavailable", async () => {
    setDb(null);
    const stats = await getUserStats(mockUserId);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
