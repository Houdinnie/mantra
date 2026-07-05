import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("db.ts unit tests", () => {
  beforeEach(() => {
    // Reset DB before each test
    setDb(null);
    process.env.DATABASE_URL = "";
  });

  it("getUserStats should return aggregated results using SQL aggregates", async () => {
    const mockLastActive = new Date();
    const mockResult = {
      totalSessions: 5,
      totalMessages: 100,
      lastActive: mockLastActive.toISOString(),
    };

    const mockWhere = vi.fn().mockResolvedValue([mockResult]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 100,
      lastActive: mockLastActive,
    });
  });

  it("getUserStats should handle null results correctly", async () => {
    const mockResult = {
      totalSessions: 0,
      totalMessages: null,
      lastActive: null,
    };

    const mockWhere = vi.fn().mockResolvedValue([mockResult]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    const mockDb = {
      select: mockSelect,
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
