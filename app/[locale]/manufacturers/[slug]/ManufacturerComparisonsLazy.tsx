"use client";

import dynamic from "next/dynamic";

const ManufacturerComparisons = dynamic(
  () => import("./ManufacturerComparisons").then(m => ({ default: m.ManufacturerComparisons })),
  { ssr: false, loading: () => <div className="h-32 animate-pulse bg-muted rounded-xl" /> }
);

export default ManufacturerComparisons;
