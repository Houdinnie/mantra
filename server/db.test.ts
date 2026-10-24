import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("db.getUserStats", () => {
  const mockDb = {
    select: vi.fn(),
  };

  beforeEach(() => {
    setDb(mockDb as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    setDb(null);
  });

  it("should return aggregated stats for a user", async () => {
    const lastActiveDate = new Date();
    const mockResult = [
      {
        totalSessions: 5,
        totalMessages: "150", // MySQL aggregates often return strings
        lastActive: lastActiveDate.toISOString(),
      },
    ];

    const mockFrom = {
      where: vi.fn().mockResolvedValue(mockResult),
    };
    const mockSelect = {
      from: vi.fn().mockReturnValue(mockFrom),
    };

    mockDb.select.mockReturnValue(mockSelect);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: lastActiveDate,
    });

    expect(mockDb.select).toHaveBeenCalledWith(
      expect.objectContaining({
        totalSessions: expect.anything(),
        totalMessages: expect.anything(),
        lastActive: expect.anything(),
      })
    );
  });

  it("should handle empty results", async () => {
    const mockFrom = {
      where: vi.fn().mockResolvedValue([]),
    };
    const mockSelect = {
      from: vi.fn().mockReturnValue(mockFrom),
    };

    mockDb.select.mockReturnValue(mockSelect);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should return zeros when results contain nulls", async () => {
    const mockResult = [
      {
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      },
    ];

    const mockFrom = {
      where: vi.fn().mockResolvedValue(mockResult),
    };
    const mockSelect = {
      from: vi.fn().mockReturnValue(mockFrom),
    };

    mockDb.select.mockReturnValue(mockSelect);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
