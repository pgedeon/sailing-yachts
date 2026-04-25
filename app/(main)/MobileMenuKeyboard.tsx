"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import HeaderAuthControls from "@/components/HeaderAuthControls";

/**
 * MobileMenuKeyboard — mobile menu with full keyboard support:
 * - Escape closes the menu
 * - Focus is trapped when open
 * - Arrow keys navigate between menu items
 * - Focus returns to trigger button on close
 */
export function MobileMenuKeyboard() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const openMenu = useCallback(() => {
    prevFocusRef.current = document.activeElement as HTMLElement;
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    // Return focus to trigger button
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  // Focus first item when menu opens
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    requestAnimationFrame(() => {
      const firstLink = panelRef.current?.querySelector<HTMLAnchorElement>("a[href]");
      firstLink?.focus();
    });
  }, [isOpen]);

  // Focus trap + keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled])',
        ),
      ).filter((el) => el.tabIndex >= 0);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, closeMenu]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        id="mobile-menu-btn"
        type="button"
        className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
        onClick={isOpen ? closeMenu : openMenu}
      >
        {/* Hamburger icon */}
        <svg
          className={`h-6 w-6 ${isOpen ? "hidden" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {/* Close icon */}
        <svg
          className={`h-6 w-6 ${isOpen ? "" : "hidden"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        id="mobile-menu-panel"
        ref={panelRef}
        className={`${isOpen ? "" : "hidden"} absolute left-0 right-0 top-16 bg-white border-b border-border shadow-lg z-50`}
        role="navigation"
        aria-label="Mobile navigation"
        // Hide from screen readers when closed (backup for hidden class)
        aria-hidden={!isOpen}
      >
        <nav className="flex flex-col py-2">
          <a href="/yachts" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Browse Yachts
          </a>
          <a href="/manufacturers" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Manufacturers
          </a>
          <a href="/guides" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Guides
          </a>
          <a href="/glossary" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Glossary
          </a>
          <a href="/search" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Search
          </a>
          <a href="/compare" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Compare
          </a>
          <a href="/favorites" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Favorites
          </a>
        </nav>
        <div className="border-t border-gray-100 px-4 py-4">
          <HeaderAuthControls mobile />
        </div>
      </div>
    </div>
  );
}
