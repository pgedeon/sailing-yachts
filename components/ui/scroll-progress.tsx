"use client";

import { useEffect, useState, useCallback } from "react";

interface ScrollProgressProps {
  /** Color class for the progress bar (default: bg-primary) */
  colorClass?: string;
  /** Height of the bar in pixels (default: 2) */
  height?: number;
  /** z-index for the fixed bar (default: 50) */
  zIndex?: number;
}

/**
 * A thin progress bar fixed to the top of the viewport that fills
 * based on how far the user has scrolled down the page.
 * Respects prefers-reduced-motion.
 */
export default function ScrollProgress({
  colorClass = "bg-primary",
  height = 2,
  zIndex = 50,
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const updateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      setProgress(0);
      return;
    }
    setProgress(Math.min(scrollTop / docHeight, 1));
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress(); // Initial calculation

    return () => window.removeEventListener("scroll", onScroll);
  }, [updateProgress]);

  // In reduced-motion mode, show a static full-width bar (indicates "scrollable content")
  if (reducedMotion) {
    return null;
  }

  const widthPercent = (progress * 100).toFixed(2);

  return (
    <div
      className="fixed top-0 left-0 w-full pointer-events-none"
      style={{ height: `${height}px`, zIndex }}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div
        className={`${colorClass} h-full transition-[width] duration-150 ease-out`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}
