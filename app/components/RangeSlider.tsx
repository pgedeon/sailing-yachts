"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatLabel?: (value: number) => string;
  ariaLabelMin?: string;
  ariaLabelMax?: string;
  debounceMs?: number;
}

export default function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  formatLabel,
  ariaLabelMin,
  ariaLabelMax,
  debounceMs = 300,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isDragging = dragging !== null;

  // Sync from props when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalMin(valueMin);
      setLocalMax(valueMax);
    }
  }, [valueMin, valueMax, isDragging]);

  const range = max - min;

  const getPercent = useCallback(
    (value: number) => {
      if (range === 0) return 0;
      return ((value - min) / range) * 100;
    },
    [min, range],
  );

  const snapValue = useCallback(
    (raw: number) => {
      const snapped = Math.round(raw / step) * step;
      return Math.max(min, Math.min(max, snapped));
    },
    [min, max, step],
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return snapValue(min + percent * range);
    },
    [min, range, snapValue],
  );

  const debouncedOnChange = useCallback(
    (newMin: number, newMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(newMin, newMax);
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  const handlePointerDown = useCallback(
    (handle: "min" | "max", e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(handle);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const value = getValueFromPosition(e.clientX);

      if (dragging === "min") {
        const newMin = Math.min(value, localMax - step);
        setLocalMin(newMin);
        debouncedOnChange(newMin, localMax);
      } else {
        const newMax = Math.max(value, localMin + step);
        setLocalMax(newMax);
        debouncedOnChange(localMin, newMax);
      }
    },
    [dragging, getValueFromPosition, localMin, localMax, step, debouncedOnChange],
  );

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      setDragging(null);
      // Flush immediately on release
      if (debounceRef.current) clearTimeout(debounceRef.current);
      onChange(localMin, localMax);
    }
  }, [dragging, localMin, localMax, onChange]);

  const minPercent = getPercent(localMin);
  const maxPercent = getPercent(localMax);

  const format = formatLabel || ((v: number) => String(v));

  return (
    <div className="range-slider w-full select-none">
      {/* Value display */}
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{format(localMin)}</span>
        <span>{format(localMax)}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer mx-2"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="group"
      >
        {/* Filled range */}
        <div
          className="absolute h-full bg-blue-500 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 transition-colors"
          style={{ left: `${minPercent}%` }}
          onPointerDown={(e) => handlePointerDown("min", e)}
          tabIndex={0}
          role="slider"
          aria-label={ariaLabelMin || "Minimum value"}
          aria-valuemin={min}
          aria-valuemax={localMax - step}
          aria-valuenow={localMin}
          aria-valuetext={format(localMin)}
          onKeyDown={(e) => {
            const newVal = snapValue(localMin + (e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : 0));
            if (newVal !== localMin && newVal < localMax) {
              setLocalMin(newVal);
              onChange(newVal, localMax);
            }
          }}
        />

        {/* Max handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 transition-colors"
          style={{ left: `${maxPercent}%` }}
          onPointerDown={(e) => handlePointerDown("max", e)}
          tabIndex={0}
          role="slider"
          aria-label={ariaLabelMax || "Maximum value"}
          aria-valuemin={localMin + step}
          aria-valuemax={max}
          aria-valuenow={localMax}
          aria-valuetext={format(localMax)}
          onKeyDown={(e) => {
            const newVal = snapValue(localMax + (e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : 0));
            if (newVal !== localMax && newVal > localMin) {
              setLocalMax(newVal);
              onChange(localMin, newVal);
            }
          }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 mx-2">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
