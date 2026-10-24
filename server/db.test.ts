import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("getUserStats", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    setDb(mockDb);
  });

  it("should return correct stats when sessions exist", async () => {
    const mockStats = {
      totalSessions: "5",
      totalMessages: "100",
      lastActive: new Date("2024-01-01T12:00:00Z"),
    };

    mockDb.where.mockResolvedValue([mockStats]);

    const result = await getUserStats(1);

    expect(result).toEqual({
      totalSessions: 5,
      totalMessages: 100,
      lastActive: new Date("2024-01-01T12:00:00Z"),
    });

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(chatSessions);
  });

  it("should handle empty results", async () => {
    mockDb.where.mockResolvedValue([]);

    const result = await getUserStats(1);

    expect(result).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should handle null values in aggregates", async () => {
    mockDb.where.mockResolvedValue([{
      totalSessions: null,
      totalMessages: null,
      lastActive: null,
    }]);

    const result = await getUserStats(1);

    expect(result).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
