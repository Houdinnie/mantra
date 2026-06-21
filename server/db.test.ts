import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("db.getUserStats", () => {
  beforeEach(() => {
    setDb(null); // Reset DB
  });

  it("should calculate stats correctly from sessions", async () => {
    const mockData = [
      { id: 1, userId: 1, messageCount: 5, updatedAt: new Date("2023-01-01") },
      { id: 2, userId: 1, messageCount: 10, updatedAt: new Date("2023-01-02") },
    ];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 2,
        totalMessages: 15,
        lastActive: new Date("2023-01-02"),
      }]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.toISOString()).toBe(new Date("2023-01-02").toISOString());
  });

  it("should handle no sessions", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 0,
        totalMessages: 0,
        lastActive: null,
      }]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
