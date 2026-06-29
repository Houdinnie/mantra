import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserStats, setDb } from "./db";
import { chatSessions } from "../drizzle/schema";

describe("db.ts unit tests", () => {
  const mockDb = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    setDb(mockDb);
    process.env.DATABASE_URL = "mysql://mock";
  });

  it("getUserStats should return aggregated metrics using SQL aggregates", async () => {
    const lastActiveDate = new Date("2025-01-01T12:00:00Z");

    // Mock the chained Drizzle query:
    // db.select({ ... }).from(chatSessions).where(eq(chatSessions.userId, userId))
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            totalSessions: 5,
            totalMessages: 150,
            lastActive: lastActiveDate.toISOString(),
          },
        ]),
      }),
    });

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 150,
      lastActive: lastActiveDate,
    });

    expect(mockDb.select).toHaveBeenCalled();
  });

  it("getUserStats should handle zero values correctly", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            totalSessions: 0,
            totalMessages: null,
            lastActive: null,
          },
        ]),
      }),
    });

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it("getUserStats should return default stats if database is not available", async () => {
    setDb(null);
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });

    process.env.DATABASE_URL = originalUrl;
  });
});
