import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("db.getUserStats", () => {
  beforeEach(() => {
    setDb(null);
  });

  it("should return correct stats using SQL aggregates", async () => {
    const mockLastActive = new Date("2023-10-27T10:00:00Z");

    // Mocking the database and the aggregate result
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 5,
              totalMessages: 42,
              lastActive: mockLastActive.toISOString(),
            },
          ]),
        }),
      }),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 42,
      lastActive: mockLastActive,
    });

    expect(mockDb.select).toHaveBeenCalledWith({
      totalSessions: expect.anything(),
      totalMessages: expect.anything(),
      lastActive: expect.anything(),
    });
  });

  it("should handle empty results", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSessions: 0,
              totalMessages: null,
              lastActive: null,
            },
          ]),
        }),
      }),
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
