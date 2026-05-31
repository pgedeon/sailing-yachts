import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

// Mock Edge-compatible pool (used by migrated routes)
const mockQuery = vi.fn();
vi.mock('@/lib/edge-pool', () => ({
  edgePool: { query: (...args: any[]) => mockQuery(...args) },
}));

// Mock api-cache to bypass caching layer in tests
vi.mock('@/lib/api-cache', () => ({
  cached: (fn: any) => fn,
  CACHE_TTL: { FILTER_OPTIONS: 300 },
  CACHE_TAGS: { FILTER_OPTIONS: 'filter-options', YACHTS: 'yachts' },
}));

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
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })       // count
      .mockResolvedValueOnce({                                 // data (list fields only)
        rows: [{
          id: 1, model_name: 'Test', slug: 'test', manufacturer_name: 'Mfg',
          length_overall: 10, beam: 3, draft: 1.5, displacement: 5000,
          rig_type: 'Sloop', keel_type: 'Fin', hull_material: 'FG', cabins: 2,
          year: 2024,
        }],
      })
      .mockResolvedValueOnce({ rows: [{ rig_type: 'Sloop', keel_type: null, hull_material: 'FG' }] }); // distinct

    const res = await yachtsGET(createRequest('/api/yachts?view=list'));
    const data = await res.json();

    expect(data.yachts).toHaveLength(1);
    const yacht = data.yachts[0];
    expect(yacht).toHaveProperty('modelName');
    expect(yacht).not.toHaveProperty('description');
    expect(yacht).not.toHaveProperty('designNotes');
    expect(yacht).not.toHaveProperty('fuelCapacity');
    expect(yacht).not.toHaveProperty('adminLinks');
  });

  it('should include Cache-Control header', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await yachtsGET(createRequest('/api/yachts'));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage');
  });

  it('should run count, data, and distinct queries in parallel', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, model_name: 'A', slug: 'a', manufacturer_name: 'M' }] })
      .mockResolvedValueOnce({ rows: [{ rig_type: 'Sloop', keel_type: 'Fin', hull_material: 'FG' }] });

    const res = await yachtsGET(createRequest('/api/yachts?page=1&limit=10'));
    const data = await res.json();

    expect(data.total).toBe(5);
    expect(data.distinct.rigTypes).toEqual(['Sloop']);
    expect(data.distinct.keelTypes).toEqual(['Fin']);
    expect(mockQuery).toHaveBeenCalledTimes(3);
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
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should include Cache-Control header', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, model_name: 'Test', slug: 'test', manufacturer_name: 'M' }] });

    const res = await searchGET(createRequest('/api/search?q=test'));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage');
  });

  it('autocomplete mode returns suggestions with single query', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, model_name: 'TestYacht', slug: 'testyacht', manufacturer_name: 'Acme', year: 2024, length_overall: 12 }],
    });

    const res = await searchGET(createRequest('/api/search?q=test&mode=autocomplete'));
    const data = await res.json();
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].display).toBe('Acme TestYacht');
    // autocomplete should only make 1 query, not 2
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('full search runs count and data queries in parallel', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [
        { id: 1, model_name: 'A', slug: 'a', manufacturer_name: 'M' },
        { id: 2, model_name: 'B', slug: 'b', manufacturer_name: 'N' },
      ]});

    const res = await searchGET(createRequest('/api/search?q=test'));
    const data = await res.json();
    expect(data.total).toBe(2);
    expect(data.yachts).toHaveLength(2);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
