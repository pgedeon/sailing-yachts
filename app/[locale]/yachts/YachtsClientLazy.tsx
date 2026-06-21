"use client";

import dynamic from "next/dynamic";

const YachtsClient = dynamic(
  () => import("./YachtsClient"),
  { ssr: false, loading: () => null }
);

export default YachtsClient;
