import { describe, it, expect, vi } from "vitest";
import { getUserStats, setDb } from "./db";

describe("getUserStats performance", () => {
  it("should be efficient and use SQL aggregates", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "2",
          totalMessages: "15",
          lastActive: "2023-01-02T00:00:00.000Z",
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    // Verify results
    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.toISOString()).toBe("2023-01-02T00:00:00.000Z");

    // Verify select was called with aggregates
    expect(mockDb.select).toHaveBeenCalledWith(expect.objectContaining({
      totalSessions: expect.anything(),
      totalMessages: expect.anything(),
      lastActive: expect.anything(),
    }));
  });

  it("should handle no sessions correctly", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          totalSessions: "0",
          totalMessages: null,
          lastActive: null,
        },
      ]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
