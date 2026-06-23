import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserStats, setDb } from './db';
import { chatSessions } from '../drizzle/schema';

describe('getUserStats', () => {
  beforeEach(() => {
    setDb(null);
    vi.clearAllMocks();
  });

  it('should return zeros when no database is available', async () => {
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = ""; // Ensure getDb doesn't auto-init
    try {
      setDb(null);
      const stats = await getUserStats(1);
      expect(stats).toEqual({ totalSessions: 0, totalMessages: 0, lastActive: null });
    } finally {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it('should use SQL aggregates to fetch user stats', async () => {
    const mockLastActive = new Date('2024-01-01T00:00:00Z');
    const mockResult = {
      totalSessions: 5,
      totalMessages: 25,
      lastActive: mockLastActive,
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(chatSessions);
    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 25,
      lastActive: mockLastActive,
    });
  });

  it('should handle null results from the database', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([undefined]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it('should handle string results from MySQL aggregates', async () => {
    const mockLastActive = '2024-01-01 12:00:00';
    const mockResult = {
      totalSessions: '10',
      totalMessages: '100',
      lastActive: mockLastActive,
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockResult]),
    } as any;

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats.totalSessions).toBe(10);
    expect(stats.totalMessages).toBe(100);
    expect(stats.lastActive).toBeInstanceOf(Date);
    expect(stats.lastActive?.toISOString()).toContain('2024-01-01');
  });
});
