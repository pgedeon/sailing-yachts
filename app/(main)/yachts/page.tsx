import type { Metadata } from "next";
import { generateYachtsListMetadata } from "@/lib/seo";
import { Suspense } from "react";
import YachtsClient from "./YachtsClient";

// Removed force-dynamic - this page is a client component shell
// No need for ISR since it's entirely client-rendered

export const metadata: Metadata = generateYachtsListMetadata();

export default function YachtsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10">Loading...</div>}>
      <YachtsClient />
    </Suspense>
  );
}
