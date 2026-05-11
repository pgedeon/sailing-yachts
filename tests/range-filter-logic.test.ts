import { describe, it, expect } from 'vitest';

/**
 * Pure logic tests for the range filter URL parameter parsing
 * (mirrors the logic in app/api/yachts/route.ts)
 */
describe('Range filter parameter parsing', () => {
  function parseRangeParams(params: Record<string, string>) {
    const result: { column: string; min?: number; max?: number }[] = [];

    const ranges = [
      { key: 'length', minParam: 'filters[lengthMin]', maxParam: 'filters[lengthMax]', column: 'length_overall' },
      { key: 'beam', minParam: 'filters[beamMin]', maxParam: 'filters[beamMax]', column: 'beam' },
      { key: 'draft', minParam: 'filters[draftMin]', maxParam: 'filters[draftMax]', column: 'draft' },
      { key: 'displacement', minParam: 'filters[displacementMin]', maxParam: 'filters[displacementMax]', column: 'displacement' },
      { key: 'sailArea', minParam: 'filters[sailAreaMin]', maxParam: 'filters[sailAreaMax]', column: 'sail_area_main' },
      { key: 'cabins', minParam: 'filters[cabinsMin]', maxParam: 'filters[cabinsMax]', column: 'cabins', int: true },
      { key: 'berths', minParam: 'filters[berthsMin]', maxParam: 'filters[berthsMax]', column: 'berths', int: true },
    ];

    for (const r of ranges) {
      const entry: { column: string; min?: number; max?: number } = { column: r.column };
      const parse = r.int ? (v: string) => parseInt(v, 10) : parseFloat;

      const minVal = parse(params[r.minParam] || '');
      if (!isNaN(minVal as number)) entry.min = minVal;

      const maxVal = parse(params[r.maxParam] || '');
      if (!isNaN(maxVal as number)) entry.max = maxVal;

      if (entry.min !== undefined || entry.max !== undefined) {
        result.push(entry);
      }
    }

    return result;
  }

  it('parses length range filter', () => {
    const result = parseRangeParams({
      'filters[lengthMin]': '8',
      'filters[lengthMax]': '12',
    });
    expect(result).toEqual([{ column: 'length_overall', min: 8, max: 12 }]);
  });

  it('parses min-only range filter', () => {
    const result = parseRangeParams({
      'filters[displacementMin]': '5000',
    });
    expect(result).toEqual([{ column: 'displacement', min: 5000 }]);
  });

  it('parses max-only range filter', () => {
    const result = parseRangeParams({
      'filters[draftMax]': '2.0',
    });
    expect(result).toEqual([{ column: 'draft', max: 2.0 }]);
  });

  it('parses integer range filter', () => {
    const result = parseRangeParams({
      'filters[cabinsMin]': '2',
      'filters[cabinsMax]': '4',
    });
    expect(result).toEqual([{ column: 'cabins', min: 2, max: 4 }]);
  });

  it('handles empty params', () => {
    const result = parseRangeParams({});
    expect(result).toEqual([]);
  });

  it('handles invalid params gracefully', () => {
    const result = parseRangeParams({
      'filters[lengthMin]': 'abc',
    });
    expect(result).toEqual([]);
  });

  it('parses multiple range filters simultaneously', () => {
    const result = parseRangeParams({
      'filters[lengthMin]': '9',
      'filters[lengthMax]': '12',
      'filters[cabinsMin]': '2',
      'filters[berthsMax]': '8',
    });
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ column: 'length_overall', min: 9, max: 12 });
    expect(result[1]).toEqual({ column: 'cabins', min: 2 });
    expect(result[2]).toEqual({ column: 'berths', max: 8 });
  });

  it('parses decimal sail area values', () => {
    const result = parseRangeParams({
      'filters[sailAreaMin]': '45.5',
      'filters[sailAreaMax]': '120.0',
    });
    expect(result).toEqual([{ column: 'sail_area_main', min: 45.5, max: 120.0 }]);
  });
});

describe('Range filter URL serialization', () => {
  function serializeRangeFilter(
    minParam: string,
    maxParam: string,
    minVal: number,
    maxVal: number,
    dbMin: number,
    dbMax: number,
  ): Record<string, string> {
    const params: Record<string, string> = {};
    if (minVal > dbMin) params[minParam] = String(minVal);
    if (maxVal < dbMax) params[maxParam] = String(maxVal);
    return params;
  }

  it('omits params when at full range', () => {
    const result = serializeRangeFilter('filters[lengthMin]', 'filters[lengthMax]', 4, 30, 4, 30);
    expect(result).toEqual({});
  });

  it('includes only min when max is at full range', () => {
    const result = serializeRangeFilter('filters[lengthMin]', 'filters[lengthMax]', 10, 30, 4, 30);
    expect(result).toEqual({ 'filters[lengthMin]': '10' });
  });

  it('includes only max when min is at full range', () => {
    const result = serializeRangeFilter('filters[lengthMin]', 'filters[lengthMax]', 4, 15, 4, 30);
    expect(result).toEqual({ 'filters[lengthMax]': '15' });
  });

  it('includes both when in narrow range', () => {
    const result = serializeRangeFilter('filters[lengthMin]', 'filters[lengthMax]', 8, 12, 4, 30);
    expect(result).toEqual({
      'filters[lengthMin]': '8',
      'filters[lengthMax]': '12',
    });
  });

  it('handles displacement range', () => {
    const result = serializeRangeFilter('filters[displacementMin]', 'filters[displacementMax]', 3000, 8000, 0, 50000);
    expect(result).toEqual({
      'filters[displacementMin]': '3000',
      'filters[displacementMax]': '8000',
    });
  });
});
