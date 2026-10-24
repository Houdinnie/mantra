import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

describe("getUserStats", () => {
  beforeEach(() => {
    // Reset the database between tests
    db.setDb(null);
  });

  it("should return correct stats for a user with sessions", async () => {
    // Mock getDb to return a mock drizzle instance
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 2,
        totalMessages: "15", // Drizzle may return sum as string on some drivers
        lastActive: new Date("2023-01-02T10:00:00Z"),
      }]),
    };

    db.setDb(mockDb);

    const stats = await db.getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.toISOString()).toBe(new Date("2023-01-02T10:00:00Z").toISOString());
  });

  it("should return zero stats for a user with no sessions", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        totalSessions: 0,
        totalMessages: null,
        lastActive: null,
      }]),
    };

    db.setDb(mockDb);

    const stats = await db.getUserStats(2);

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.lastActive).toBeNull();
  });
});
