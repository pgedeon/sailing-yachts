"use client";

import type { YachtComparisonData } from "@/lib/compare-canonical";
import { CompareMonetization } from "@/app/components/CompareMonetization";

interface CanonicalCompareClientProps {
  yachtA: YachtComparisonData;
  yachtB: YachtComparisonData;
}

export function CanonicalCompareClient({ yachtA, yachtB }: CanonicalCompareClientProps) {
  const yachts = [
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

  return <CompareMonetization yachts={yachts} />;
}
