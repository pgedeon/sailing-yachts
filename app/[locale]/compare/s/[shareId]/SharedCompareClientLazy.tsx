"use client";

import dynamic from "next/dynamic";

const SharedCompareClient = dynamic(
  () => import("./SharedCompareClient").then((m) => ({ default: m.SharedCompareClient })),
  { ssr: false, loading: () => null }
);

export default SharedCompareClient;
