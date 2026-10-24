import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getUserStats, setDb, getDb } from "./db";

function createMockDb(mockResolvedValue: any) {
  const handler = {
    get(target: any, prop: string): any {
      if (prop === "then") {
        return (resolve: any) => resolve(mockResolvedValue);
      }
      return () => new Proxy({}, handler);
    }
  };

  const mockDb = {
    select: () => new Proxy({}, handler),
    insert: () => new Proxy({}, handler),
    update: () => new Proxy({}, handler),
    delete: () => new Proxy({}, handler),
  };

  return mockDb as any;
}

describe("Database functions", () => {
  const originalEnvUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    // Reset database URL by default to prevent automatic connections
    process.env.DATABASE_URL = "";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnvUrl;
    setDb(null); // Reset database state to avoid state leaks
  });

  describe("getUserStats", () => {
    it("should return correct aggregated stats when database returns results", async () => {
      const mockResult = [
        {
          totalSessions: 5,
          totalMessages: 42,
          lastActive: "2023-11-20T15:30:00.000Z",
        },
      ];

      const mockDb = createMockDb(mockResult);
      setDb(mockDb);

      const stats = await getUserStats(1);

      expect(stats.totalSessions).toBe(5);
      expect(stats.totalMessages).toBe(42);
      expect(stats.lastActive).toBeInstanceOf(Date);
      expect(stats.lastActive?.toISOString()).toBe("2023-11-20T15:30:00.000Z");
    });

    it("should handle empty or null values correctly", async () => {
      const mockResult = [
        {
          totalSessions: 0,
          totalMessages: null,
          lastActive: null,
        },
      ];

      const mockDb = createMockDb(mockResult);
      setDb(mockDb);

      const stats = await getUserStats(1);

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.lastActive).toBeNull();
    });

    it("should return default fallback if database is not available", async () => {
      setDb(null);

      const stats = await getUserStats(1);

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.lastActive).toBeNull();
    });
  });
});
