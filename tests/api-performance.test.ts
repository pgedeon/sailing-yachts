import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

// Mock pg Pool
const mockQuery = vi.fn();
vi.mock('@/lib/db', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

// Import after mocks
import { GET as yachtsGET } from '../app/api/yachts/route';
import { GET as searchGET } from '../app/api/search/route';

function createRequest(url: string) {
  return new Request(new URL(url, 'https://test.local'));
}

describe('Yachts API - Performance optimizations', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('should return list view with fewer fields', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 1,
          model_name: 'Test',
          slug: 'test',
          manufacturer_name: 'Mfg',
          length_overall: 10,
        }],
      })
      .mockResolvedValueOnce({ rows: [{ rig_type: 'Sloop', keel_type: null, hull_material: 'FG' }] });

    const res = await yachtsGET(createRequest('/api/yachts?view=list'));
    const data = await res.json();

    expect(data.yachts).toHaveLength(1);
    expect(data.yachts[0]).toHaveProperty('modelName');
    // list view should not include description, designNotes, etc.
    expect(data.yachts[0]).not.toHaveProperty('description');
    expect(data.yachts[0]).not.toHaveProperty('designNotes');
    expect(data.yachts[0]).not.toHaveProperty('fuelCapacity');
  });

  it('should include Cache-Control header', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await yachtsGET(createRequest('/api/yachts'));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage');
  });

  it('should run count and data queries in parallel with filter options', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, model_name: 'A', slug: 'a', manufacturer_name: 'M' }] })
      .mockResolvedValueOnce({ rows: [{ rig_type: 'Sloop', keel_type: 'Fin', hull_material: 'FG' }] });

    const res = await yachtsGET(createRequest('/api/yachts?page=1&limit=10'));
    const data = await res.json();

    expect(data.total).toBe(5);
    expect(data.distinct.rigTypes).toEqual(['Sloop']);
    expect(data.distinct.keelTypes).toEqual(['Fin']);
  });
});

describe('Search API - Performance optimizations', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('should return empty for short queries', async () => {
    const res = await searchGET(createRequest('/api/search?q=a'));
    const data = await res.json();
    expect(data.yachts).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('should include Cache-Control header', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, model_name: 'Test', slug: 'test', manufacturer_name: 'M' }] });

    const res = await searchGET(createRequest('/api/search?q=test'));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage');
  });

  it('autocomplete mode returns suggestions', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, model_name: 'TestYacht', slug: 'testyacht', manufacturer_name: 'Acme', year: 2024, length_overall: 12 }],
    });

    const res = await searchGET(createRequest('/api/search?q=test&mode=autocomplete'));
    const data = await res.json();
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].display).toBe('Acme TestYacht');
  });
});
