"use client";

import dynamic from "next/dynamic";

const CompareClient = dynamic(
  () => import("./CompareClient").then(m => ({ default: m.CompareClient })),
  { ssr: false, loading: () => null }
);

export default CompareClient;
