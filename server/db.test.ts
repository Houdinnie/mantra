import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db getUserStats", () => {
  beforeEach(() => {
    // Reset DB before each test
    setDb(null);
    // Ensure DATABASE_URL is not set to avoid real connection attempts
    process.env.DATABASE_URL = "";
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
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should correctly aggregate session data", async () => {
    const lastActiveDate = new Date("2024-01-01T12:00:00Z");
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            totalSessions: 5,
            totalMessages: "150", // Aggregates might return strings in some drivers
            lastActive: lastActiveDate.toISOString(),
          }]),
        }),
      }),
    };

    setDb(mockDb as any);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: lastActiveDate,
    });

    expect(stats.lastActive).toBeInstanceOf(Date);
  });
});
