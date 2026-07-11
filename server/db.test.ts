import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("db.getUserStats", () => {
  beforeEach(() => {
    setDb(null);
  });

  it("should return zeros when no sessions exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            totalSessions: 0,
            totalMessages: null,
            lastActive: null,
          }]),
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

  it("should calculate stats from sessions", async () => {
    const date1 = new Date("2024-01-01T10:00:00Z");
    const date2 = new Date("2024-01-02T10:00:00Z");

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            totalSessions: 2,
            totalMessages: "15", // sum might return string in some drivers
            lastActive: date2.toISOString(), // max might return string in some drivers
          }]),
        }),
      }),
    } as any;

    setDb(mockDb);
    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalMessages).toBe(15);
    expect(stats.lastActive?.getTime()).toBe(date2.getTime());
  });
});
