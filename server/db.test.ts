import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.getUserStats", () => {
  beforeEach(() => {
    setDb(null); // Reset DB before each test
  });

  it("should return zeros when database is not available", async () => {
    // Ensure getDb returns null
    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return aggregated stats correctly", async () => {
    const mockLastActive = new Date("2023-01-01T12:00:00Z");
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            totalSessions: 5,
            totalMessages: 42,
            lastActive: mockLastActive,
          }]),
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockLastActive,
    });

    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should handle empty results gracefully", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([undefined]),
        }),
      }),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
