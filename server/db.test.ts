import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("getUserStats", () => {
  beforeEach(() => {
    setDb(null);
    vi.stubEnv("DATABASE_URL", "mysql://root:password@localhost:3306/test");
  });

  it("should return zeros when no sessions exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("should calculate stats from multiple sessions", async () => {
    const now = new Date();
    const mockResult = {
      totalSessions: 2,
      totalMessages: 15,
      lastActive: now,
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    };
    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.getTime()).toBe(now.getTime());
  });

  it("should handle null messageCount as 0", async () => {
    const now = new Date();
    const mockResult = {
      totalSessions: 1,
      totalMessages: null,
      lastActive: now,
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    };
    setDb(mockDb as any);

    const stats = await getUserStats(1);
    expect(stats.totalMessages).toBe(0);
  });
});
