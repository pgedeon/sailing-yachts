import { describe, it, expect } from 'vitest';

/**
 * Tests for the RangeSlider snap and keyboard value calculation logic
 * (extracted from the component for testability without jsdom)
 */

function snapValue(raw: number, step: number, min: number, max: number) {
  const snapped = Math.round(raw / step) * step;
  return Math.max(min, Math.min(max, snapped));
}

function handleMinKeyboard(currentMin: number, currentMax: number, step: number, min: number, max: number, key: string) {
  const delta = (key === 'ArrowRight' || key === 'ArrowUp') ? step : (key === 'ArrowLeft' || key === 'ArrowDown') ? -step : 0;
  if (delta === 0) return { min: currentMin, changed: false };
  const newMin = snapValue(currentMin + delta, step, min, max);
  if (newMin === currentMin || newMin >= currentMax) return { min: currentMin, changed: false };
  return { min: newMin, changed: true };
}

function handleMaxKeyboard(currentMin: number, currentMax: number, step: number, min: number, max: number, key: string) {
  const delta = (key === 'ArrowRight' || key === 'ArrowUp') ? step : (key === 'ArrowLeft' || key === 'ArrowDown') ? -step : 0;
  if (delta === 0) return { max: currentMax, changed: false };
  const newMax = snapValue(currentMax + delta, step, min, max);
  if (newMax === currentMax || newMax <= currentMin) return { max: currentMax, changed: false };
  return { max: newMax, changed: true };
}

function getPercent(value: number, min: number, max: number) {
  const range = max - min;
  if (range === 0) return 0;
  return ((value - min) / range) * 100;
}

describe('RangeSlider logic', () => {
  describe('snapValue', () => {
    it('snaps to nearest step', () => {
      expect(snapValue(3.7, 0.5, 0, 10)).toBe(3.5);
      expect(snapValue(3.8, 0.5, 0, 10)).toBe(4.0);
    });

    it('clamps to min', () => {
      expect(snapValue(-5, 1, 0, 100)).toBe(0);
    });

    it('clamps to max', () => {
      expect(snapValue(150, 1, 0, 100)).toBe(100);
    });

    it('works with integer steps', () => {
      expect(snapValue(2.3, 1, 0, 100)).toBe(2);
      expect(snapValue(2.7, 1, 0, 100)).toBe(3);
    });
  });

  describe('handleMinKeyboard', () => {
    it('increments min on ArrowRight', () => {
      const result = handleMinKeyboard(50, 80, 1, 0, 100, 'ArrowRight');
      expect(result.min).toBe(51);
      expect(result.changed).toBe(true);
    });

    it('decrements min on ArrowLeft', () => {
      const result = handleMinKeyboard(50, 80, 1, 0, 100, 'ArrowLeft');
      expect(result.min).toBe(49);
      expect(result.changed).toBe(true);
    });

    it('prevents min from reaching max', () => {
      const result = handleMinKeyboard(79, 80, 1, 0, 100, 'ArrowRight');
      expect(result.changed).toBe(false);
    });

    it('ignores unrelated keys', () => {
      const result = handleMinKeyboard(50, 80, 1, 0, 100, 'Enter');
      expect(result.changed).toBe(false);
    });

    it('works with decimal steps', () => {
      const result = handleMinKeyboard(3, 7, 0.5, 0, 10, 'ArrowUp');
      expect(result.min).toBe(3.5);
      expect(result.changed).toBe(true);
    });
  });

  describe('handleMaxKeyboard', () => {
    it('increments max on ArrowRight', () => {
      const result = handleMaxKeyboard(20, 70, 1, 0, 100, 'ArrowRight');
      expect(result.max).toBe(71);
      expect(result.changed).toBe(true);
    });

    it('decrements max on ArrowLeft', () => {
      const result = handleMaxKeyboard(20, 70, 1, 0, 100, 'ArrowLeft');
      expect(result.max).toBe(69);
      expect(result.changed).toBe(true);
    });

    it('prevents max from reaching min', () => {
      const result = handleMaxKeyboard(20, 21, 1, 0, 100, 'ArrowLeft');
      expect(result.changed).toBe(false);
    });
  });

  describe('getPercent', () => {
    it('returns 0% at min', () => {
      expect(getPercent(0, 0, 100)).toBe(0);
    });

    it('returns 100% at max', () => {
      expect(getPercent(100, 0, 100)).toBe(100);
    });

    it('returns 50% at midpoint', () => {
      expect(getPercent(50, 0, 100)).toBe(50);
    });

    it('handles zero range', () => {
      expect(getPercent(5, 5, 5)).toBe(0);
    });

    it('calculates for non-zero base range', () => {
      expect(getPercent(8, 4, 30)).toBeCloseTo(15.38, 1);
    });
  });
});
