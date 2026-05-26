"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Info } from "lucide-react";

/**
 * Mapping from spec category labels (as they appear in the UI) to glossary slugs.
 * The tooltip shows the glossary definition; clicking navigates to the full page.
 */
const SPEC_TO_GLOSSARY: Record<string, string> = {
  LOA: "loa",
  "Length Overall": "loa",
  Beam: "beam",
  Draft: "draft",
  Displacement: "displacement",
  Ballast: "ballast",
  "Ballast Ratio": "ballast-ratio",
  "Sail Area": "sail-area",
  "Sail Area / Displacement": "sa-disp-ratio",
  "SA/D Ratio": "sa-disp-ratio",
  "Displacement / Length": "disp-len-ratio",
  "D/L Ratio": "disp-len-ratio",
  LWL: "lwl",
  "Waterline Length": "lwl",
  "Hull Speed": "hull-speed",
  "Keel Type": "keel-type",
  "Rig Type": "rig-type",
  "Fin Keel": "fin-keel",
  "Wing Keel": "wing-keel",
  "Sloop Rig": "sloop-rig",
  "Cutter Rig": "cutter-rig",
  "Ketch Rig": "ketch-rig",
  "Shoal Draft": "shoal-draft",
  Cabin: "cabin",
  Cabins: "cabin",
  Berth: "berth",
  Berths: "berth",
  Head: "head",
  Heads: "head",
  "Hull Material": "hull-material",
  Engine: "engine",
  "Engine HP": "engine",
  "Fuel Capacity": "fuel-capacity",
  "Water Capacity": "water-capacity",
};

/**
 * Brief tooltip definitions for common spec labels.
 * These are short versions; clicking leads to the full glossary page.
 */
const TOOLTIP_DEFS: Record<string, { en: string; fr: string }> = {
  LOA: {
    en: "Maximum length from bow to stern",
    fr: "Longueur maximale de la proue à la poupe",
  },
  Beam: {
    en: "Maximum width of the yacht",
    fr: "Largeur maximale du yacht",
  },
  Draft: {
    en: "Depth from waterline to keel bottom",
    fr: "Profondeur de la ligne de flottaison au bas de la quille",
  },
  Displacement: {
    en: "Total weight of the yacht in water",
    fr: "Poids total du yacht dans l'eau",
  },
  Ballast: {
    en: "Weight in the keel for stability",
    fr: "Poids dans la quille pour la stabilité",
  },
  "Ballast Ratio": {
    en: "Ballast ÷ Displacement — stability indicator",
    fr: "Lest ÷ Déplacement — indicateur de stabilité",
  },
  "Sail Area": {
    en: "Total sail area (mainsail + headsail)",
    fr: "Surface totale de la voilure",
  },
  "SA/D Ratio": {
    en: "Sail power relative to displacement",
    fr: "Puissance de voilure par rapport au déplacement",
  },
  "D/L Ratio": {
    en: "Weight relative to waterline length",
    fr: "Poids par rapport à la longueur de flottaison",
  },
  LWL: {
    en: "Length at the waterline",
    fr: "Longueur à la ligne de flottaison",
  },
  "Hull Speed": {
    en: "Theoretical max speed for this hull",
    fr: "Vitesse maximale théorique de la coque",
  },
  "Keel Type": {
    en: "Shape and configuration of the keel",
    fr: "Forme et configuration de la quille",
  },
  "Rig Type": {
    en: "Mast and sail configuration",
    fr: "Configuration du mât et de la voilure",
  },
  Cabins: {
    en: "Number of enclosed sleeping compartments",
    fr: "Nombre de cabines fermées",
  },
  Berths: {
    en: "Number of sleeping positions",
    fr: "Nombre de places couchage",
  },
  Heads: {
    en: "Number of marine toilets/bathrooms",
    fr: "Nombre de toilettes/salles de bain",
  },
  "Hull Material": {
    en: "Primary construction material",
    fr: "Matériau principal de construction",
  },
  "Engine HP": {
    en: "Auxiliary engine horsepower",
    fr: "Puissance du moteur auxiliaire",
  },
  "Fuel Capacity": {
    en: "Total fuel tank capacity",
    fr: "Capacité totale du réservoir de carburant",
  },
  "Water Capacity": {
    en: "Total fresh water tank capacity",
    fr: "Capacité totale du réservoir d'eau douce",
  },
};

interface SpecTooltipProps {
  label: string;
}

export function SpecTooltip({ label }: SpecTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const glossarySlug = SPEC_TO_GLOSSARY[label];
  const def = TOOLTIP_DEFS[label];

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

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
            type="button"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label={`Definition of ${label}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          {open && (
            <span
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
