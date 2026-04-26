"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import HeaderAuthControls from "@/components/HeaderAuthControls";

interface ClientNavProps {
  locale: string;
  navItems: { nameKey: string; path: string }[];
}

/**
 * ClientNav — mobile menu with full keyboard support.
 * Uses useTranslations for runtime locale switching.
 */
export function ClientNav({ locale, navItems }: ClientNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("Layout");

  const closeMenu = useCallback(() => {
    setIsOpen(false);
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

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      ).filter((el) => el.tabIndex >= 0);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, closeMenu]);

  const mobileNavItems = [
    { key: "browseYachts", href: `/${locale}/yachts` },
    { key: "manufacturers", href: `/${locale}/manufacturers` },
    { key: "guides", href: `/${locale}/guides` },
    { key: "glossary", href: `/${locale}/glossary` },
    { key: "search", href: `/${locale}/search` },
    { key: "compare", href: `/${locale}/compare` },
    { key: "favorites", href: `/${locale}/favorites` },
  ];

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
        aria-label={isOpen ? t("mobileNav.closeMenu") : t("mobileNav.openMenu")}
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <svg className={`h-6 w-6 ${isOpen ? "hidden" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg className={`h-6 w-6 ${isOpen ? "" : "hidden"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        id="mobile-menu-panel"
        ref={panelRef}
        className={`${isOpen ? "" : "hidden"} absolute left-0 right-0 top-16 bg-white border-b border-border shadow-lg z-50`}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
      >
        <nav className="flex flex-col py-2">
          {mobileNavItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
            >
              {t(`mobileNav.${item.key}`)}
            </a>
          ))}
        </nav>
        <div className="border-t border-gray-100 px-4 py-4">
          <HeaderAuthControls mobile />
        </div>
      </div>
    </div>
  );
}
