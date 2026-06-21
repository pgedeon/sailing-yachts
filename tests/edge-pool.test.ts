import { describe, it, expect, vi } from 'vitest';

describe('edge-pool', () => {
  it('should export edgePool proxy with query method', async () => {
    // Mock DATABASE_URL (standard PostgreSQL connection string)
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

    // Dynamic import to get fresh module with mocked env
    vi.resetModules();
    const { edgePool } = await import('@/lib/edge-pool');
    expect(edgePool).toBeDefined();
    expect(typeof edgePool.query).toBe('function');
  });

  it('should throw when DATABASE_URL is not set', async () => {
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    // Reset module cache to clear singleton poolInstance
    vi.resetModules();

    try {
      const { edgePool } = await import('@/lib/edge-pool');
      await expect(edgePool.query('SELECT 1')).rejects.toThrow('DATABASE_URL is not set');
    } finally {
      process.env.DATABASE_URL = originalUrl;
      vi.resetModules();
    }
  });
});

describe('db-edge', () => {
  it('should export db proxy with Drizzle methods', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    vi.resetModules();

    const { db } = await import('@/lib/db-edge');
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
    expect(typeof db.insert).toBe('function');
    expect(typeof db.update).toBe('function');
    expect(typeof db.delete).toBe('function');
  });

  it('should re-export schema tables', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    vi.resetModules();

    const mod = await import('@/lib/db-edge');
    expect(mod.manufacturers).toBeDefined();
    expect(mod.yachtModels).toBeDefined();
    expect(mod.images).toBeDefined();
  });
});
