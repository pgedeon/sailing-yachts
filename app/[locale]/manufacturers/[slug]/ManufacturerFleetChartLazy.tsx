"use client";

import dynamic from "next/dynamic";

const ManufacturerFleetChart = dynamic(
  () => import("@/components/manufacturer-fleet-chart"),
  { ssr: false }
);

export default ManufacturerFleetChart;
