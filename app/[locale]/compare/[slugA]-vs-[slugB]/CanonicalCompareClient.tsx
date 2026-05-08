"use client";

import dynamic from "next/dynamic";
import type { YachtComparisonData } from "@/lib/compare-canonical";
import { CompareMonetization } from "@/app/components/CompareMonetization";

const ComparisonRadarChart = dynamic(
  () => import("@/components/comparison-radar-chart").then(m => ({ default: m.ComparisonRadarChart })),
  { ssr: false, loading: () => null },
);

const ComparisonBarCharts = dynamic(
  () => import("@/components/comparison-bar-charts").then(m => ({ default: m.ComparisonBarCharts })),
  { ssr: false, loading: () => null },
);

interface CanonicalCompareClientProps {
  yachtA: YachtComparisonData;
  yachtB: YachtComparisonData;
}

export function CanonicalCompareClient({ yachtA, yachtB }: CanonicalCompareClientProps) {
  const specYachts = [
    {
      id: yachtA.id,
      manufacturer: yachtA.manufacturer,
      modelName: yachtA.modelName,
      lengthOverall: yachtA.lengthOverall,
      displacement: yachtA.displacement,
      beam: yachtA.beam,
      draft: yachtA.draft,
      ballast: yachtA.ballast,
      sailAreaMain: yachtA.sailAreaMain,
      engineHp: yachtA.engineHp,
    },
    {
      id: yachtB.id,
      manufacturer: yachtB.manufacturer,
      modelName: yachtB.modelName,
      lengthOverall: yachtB.lengthOverall,
      displacement: yachtB.displacement,
      beam: yachtB.beam,
      draft: yachtB.draft,
      ballast: yachtB.ballast,
      sailAreaMain: yachtB.sailAreaMain,
      engineHp: yachtB.engineHp,
    },
  ];

  const monetizationYachts = [
    {
      id: yachtA.id,
      manufacturer: yachtA.manufacturer,
      modelName: yachtA.modelName,
      lengthOverall: yachtA.lengthOverall,
      displacement: yachtA.displacement,
      beam: yachtA.beam,
      cabins: yachtA.cabins,
      hullMaterial: yachtA.hullMaterial,
      keelType: yachtA.keelType,
      rigType: yachtA.rigType,
    },
    {
      id: yachtB.id,
      manufacturer: yachtB.manufacturer,
      modelName: yachtB.modelName,
      lengthOverall: yachtB.lengthOverall,
      displacement: yachtB.displacement,
      beam: yachtB.beam,
      cabins: yachtB.cabins,
      hullMaterial: yachtB.hullMaterial,
      keelType: yachtB.keelType,
      rigType: yachtB.rigType,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto mt-12">
      <ComparisonRadarChart yachts={specYachts} />
      <div className="mt-8">
        <ComparisonBarCharts yachts={specYachts} />
      </div>
      <div className="mt-8">
        <CompareMonetization yachts={monetizationYachts} />
      </div>
    </div>
  );
}
