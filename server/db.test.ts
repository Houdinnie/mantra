import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserStats, setDb } from './db';

describe('getUserStats', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return aggregated stats for a user', async () => {
    const mockLastActive = new Date('2023-01-01T12:00:00Z');
    const mockStats = {
      totalSessions: '5',
      totalMessages: '25',
      lastActive: mockLastActive.toISOString(),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStats]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 5,
      totalMessages: 25,
      lastActive: mockLastActive,
    });

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
  });

  it('should handle empty results', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });

  it('should return zeros if stats are null', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ totalSessions: null, totalMessages: null, lastActive: null }]),
    };

    setDb(mockDb);

    const stats = await getUserStats(1);

    expect(stats).toEqual({
      totalSessions: 0,
      totalMessages: 0,
      lastActive: null,
    });
  });
});
