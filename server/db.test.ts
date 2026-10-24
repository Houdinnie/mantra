import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("database functions", () => {
  beforeEach(() => {
    setDb(null);
    vi.clearAllMocks();
  });

  it("should calculate user stats correctly with SQL aggregates", async () => {
    const mockResult = [
      {
        totalSessions: 2,
        totalMessages: "15", // sum() can return string in some drivers
        lastActive: "2024-01-02T12:00:00Z",
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockResult),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.toISOString()).toBe(new Date("2024-01-02T12:00:00Z").toISOString());
  });

  it("should handle no sessions in stats with SQL aggregates", async () => {
    const mockResult = [
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockResult),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
