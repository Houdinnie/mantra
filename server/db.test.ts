import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("getUserStats optimization", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            totalSessions: 5,
            totalMessages: 100,
            lastActive: new Date("2024-01-01"),
          },
        ]);
      }),
    };
    setDb(mockDb);
  });

  it("should return correct stats using aggregate functions", async () => {
    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 100,
      lastActive: new Date("2024-01-01"),
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
    mockDb.where = vi.fn().mockResolvedValue([null]);
    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
