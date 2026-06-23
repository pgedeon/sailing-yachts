"use client";

import { useTranslations } from "next-intl";
import {
  Ruler,
  Anchor,
  Waves,
  Weight,
  Sailboat,
  Bed,
  DoorOpen,
  Fuel,
  Droplets,
  Gauge,
} from "lucide-react";

interface QuickFact {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

interface QuickFactsProps {
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  engineHp: number | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
  rigType: string | null;
  hullMaterial: string | null;
  keelType: string | null;
}

function formatNum(n: number | null, decimals = 1): string {
  if (n === null) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function QuickFacts(props: QuickFactsProps) {
  const t = useTranslations("QuickFacts");

  const facts: QuickFact[] = [
    {
      icon: <Ruler className="h-4 w-4 text-blue-500" aria-hidden="true" />,
      label: t("lengthOverall"),
      value: props.lengthOverall ? `${formatNum(props.lengthOverall)} m` : "—",
      highlight: true,
    },
    {
      icon: <Anchor className="h-4 w-4 text-cyan-500" aria-hidden="true" />,
      label: t("beam"),
      value: props.beam ? `${formatNum(props.beam)} m` : "—",
    },
    {
      icon: <Waves className="h-4 w-4 text-indigo-500" aria-hidden="true" />,
      label: t("draft"),
      value: props.draft ? `${formatNum(props.draft)} m` : "—",
    },
    {
      icon: <Weight className="h-4 w-4 text-slate-500" aria-hidden="true" />,
      label: t("displacement"),
      value: props.displacement
        ? `${(props.displacement / 1000).toFixed(1)} t`
        : "—",
    },
    {
      icon: <Sailboat className="h-4 w-4 text-sky-500" aria-hidden="true" />,
      label: t("rigType"),
      value: props.rigType || "—",
    },
    {
      icon: <Bed className="h-4 w-4 text-purple-500" aria-hidden="true" />,
      label: t("cabins"),
      value: props.cabins !== null ? String(props.cabins) : "—",
    },
    {
      icon: <DoorOpen className="h-4 w-4 text-pink-500" aria-hidden="true" />,
      label: t("berths"),
      value: props.berths !== null ? String(props.berths) : "—",
    },
    {
      icon: <Gauge className="h-4 w-4 text-amber-500" aria-hidden="true" />,
      label: t("engineHp"),
      value: props.engineHp ? `${formatNum(props.engineHp, 0)} hp` : "—",
    },
    {
      icon: <Droplets className="h-4 w-4 text-teal-500" aria-hidden="true" />,
      label: t("waterCapacity"),
      value: props.waterCapacity
        ? `${formatNum(props.waterCapacity, 0)} L`
        : "—",
    },
    {
      icon: <Fuel className="h-4 w-4 text-orange-500" aria-hidden="true" />,
      label: t("fuelCapacity"),
      value: props.fuelCapacity
        ? `${formatNum(props.fuelCapacity, 0)} L`
        : "—",
    },
  ].filter((f) => f.value !== "—");

  if (facts.length === 0) return null;

  return (
    <section
      className="quick-facts-section mb-8 sm:mb-10"
      aria-label={t("sectionLabel")}
      data-testid="quick-facts-section"
    >
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
        {t("heading")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {facts.map((fact, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              fact.highlight
                ? "border-blue-200 bg-blue-50/50"
                : "border-border bg-card"
            }`}
          >
            <div className="shrink-0">{fact.icon}</div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground truncate">
                {fact.label}
              </div>
              <div className="text-sm font-semibold truncate">{fact.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
