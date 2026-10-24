import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats optimization", () => {
  it("should use SQL aggregate results correctly", async () => {
    const mockLastActive = new Date("2025-01-01T00:00:00Z");

    // Mock Drizzle's chainable interface
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "5",
          totalMessages: "150",
          lastActive: mockLastActive.toISOString(),
        },
      ]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: mockLastActive,
    });

    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should handle empty results", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ]),
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
