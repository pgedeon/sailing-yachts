"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface BackToTopProps {
  /** Scroll threshold in px before button appears (default: 300) */
  threshold?: number;
  /** Position from bottom in rem (default: 6) */
  bottomRem?: number;
  /** Position from right in rem (default: 6) */
  rightRem?: number;
}

/**
 * A floating "back to top" button that appears after scrolling down.
 * Respects prefers-reduced-motion (instant scroll instead of smooth).
 */
export default function BackToTop({
  threshold = 300,
  bottomRem = 6,
  rightRem = 6,
}: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const t = useTranslations("UI");

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label={t("backToTop")}
      className={`
        fixed z-40 flex items-center justify-center
        h-10 w-10 rounded-full
        bg-primary text-primary-foreground
        shadow-lg hover:bg-primary/90
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        ${visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
        }
      `}
      style={{ bottom: `${bottomRem}rem`, right: `${rightRem}rem` }}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
    </button>
  );
}
