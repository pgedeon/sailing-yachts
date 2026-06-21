"use client";

import dynamic from "next/dynamic";

const SearchClient = dynamic(
  () => import("./SearchClient").then(m => ({ default: m.SearchClient })),
  { ssr: false, loading: () => null }
);

export default SearchClient;
