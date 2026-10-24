import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("getUserStats", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
          return Promise.resolve([
            {
              totalSessions: "5",
              totalMessages: "150",
              lastActive: "2023-10-27T10:00:00.000Z"
            }
          ]);
      }),
    };
    setDb(mockDb);
  });

  it("should return correctly formatted stats from aggregate query", async () => {
    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: new Date("2023-10-27T10:00:00.000Z"),
    });
  });

  it("should handle null results gracefully", async () => {
      mockDb.where = vi.fn().mockResolvedValue([
          {
              totalSessions: null,
              totalMessages: null,
              lastActive: null
          }
      ]);

      const stats = await getUserStats(1);

      expect(stats).toEqual({
          totalSessions: 0,
          totalMessages: 0,
          lastActive: null,
      });
  });
});
