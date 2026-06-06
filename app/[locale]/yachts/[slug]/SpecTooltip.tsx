"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Info } from "lucide-react";
import { SPEC_TO_GLOSSARY, TOOLTIP_DEFS } from "@/lib/spec-tooltip-data";

interface SpecTooltipProps {
  label: string;
}

export function SpecTooltip({ label }: SpecTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const locale = useLocale();
  const glossarySlug = SPEC_TO_GLOSSARY[label];
  const def = TOOLTIP_DEFS[label];

  // Close on outside click or Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    }
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, handleClickOutside, handleKeyDown]);

  // No glossary entry — just render the label
  if (!glossarySlug && !def) {
    return <span>{label}</span>;
  }

  const tooltipText = def
    ? def[locale as "en" | "fr"] || def.en
    : undefined;

  return (
    <span className="relative inline-flex items-center gap-1" ref={ref}>
      {glossarySlug ? (
        <Link
          href={`/${locale}/glossary/${glossarySlug}`}
          className="hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </Link>
      ) : (
        <span>{label}</span>
      )}
      {tooltipText && (
        <>
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={(e) => {
              // Keep open if focus moves to tooltip content (e.g., "Learn more" link)
              if (!ref.current?.contains(e.relatedTarget as Node)) {
                setOpen(false);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label={`Definition of ${label}`}
            aria-describedby={open ? tooltipId : undefined}
            aria-expanded={open}
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          {open && (
            <span
              id={tooltipId}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs leading-relaxed rounded-lg bg-popover text-popover-foreground border border-border shadow-lg whitespace-normal z-50 w-56"
              role="tooltip"
            >
              {tooltipText}
              {glossarySlug && (
                <Link
                  href={`/${locale}/glossary/${glossarySlug}`}
                  className="block mt-1 text-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {locale === "fr" ? "En savoir plus →" : "Learn more →"}
                </Link>
              )}
            </span>
          )}
        </>
      )}
    </span>
  );
}
