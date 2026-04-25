"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * useFocusTrap — traps keyboard focus within a container element.
 *
 * When active, Tab and Shift+Tab cycle only through focusable elements
 * inside the container. Escape calls onEscape if provided.
 *
 * Returns a ref to attach to the container element.
 */
export function useFocusTrap(
  active: boolean,
  onEscape?: () => void,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active || !containerRef.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }

      if (e.key !== "Tab") return;

      const container = containerRef.current;
      const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
        '[role="tab"]:not([disabled])',
      ].join(", ");

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors),
      ).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex >= 0,
      );

      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [active, onEscape],
  );

  useEffect(() => {
    if (!active) return;

    document.addEventListener("keydown", handleKeyDown);
    // Focus the first focusable element when trap activates
    const container = containerRef.current;
    if (container) {
      const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");

      // Delay to allow rendering
      requestAnimationFrame(() => {
        const first = container.querySelector<HTMLElement>(focusableSelectors);
        if (first) first.focus();
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, handleKeyDown]);

  return containerRef;
}

/**
 * useArrowNavigation — enables arrow key navigation within a group of elements.
 *
 * Given a selector for navigable items, ArrowDown/ArrowRight move to the next
 * item, ArrowUp/ArrowLeft move to the previous item. Home/End go to
 * first/last. Enter/Space activate the current item.
 */
export function useArrowNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  itemSelector: string,
  options?: {
    orientation?: "horizontal" | "vertical" | "both";
    onActivate?: (index: number) => void;
    loop?: boolean;
  },
) {
  const { orientation = "vertical", onActivate, loop = true } = options || {};

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: KeyboardEvent) => {
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(itemSelector),
      );
      if (items.length === 0) return;

      const currentIndex = items.indexOf(
        document.activeElement as HTMLElement,
      );
      if (currentIndex === -1) return;

      const isNext =
        (orientation !== "horizontal" && e.key === "ArrowDown") ||
        (orientation !== "vertical" && e.key === "ArrowRight");
      const isPrev =
        (orientation !== "horizontal" && e.key === "ArrowUp") ||
        (orientation !== "vertical" && e.key === "ArrowLeft");

      if (isNext || isPrev) {
        e.preventDefault();
        let nextIndex: number;
        if (isNext) {
          nextIndex = loop
            ? (currentIndex + 1) % items.length
            : Math.min(currentIndex + 1, items.length - 1);
        } else {
          nextIndex = loop
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(currentIndex - 1, 0);
        }
        items[nextIndex].focus();
        return;
      }

      if (e.key === "Home") {
        e.preventDefault();
        items[0].focus();
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1].focus();
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate?.(currentIndex);
      }
    };

    container.addEventListener("keydown", handler);
    return () => container.removeEventListener("keydown", handler);
  }, [containerRef, itemSelector, orientation, onActivate, loop]);
}
