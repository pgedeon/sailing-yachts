import type { Metadata } from "next";
import { generateCompareMetadata } from "@/lib/seo";
import { CompareClient } from "./CompareClient";

// Removed force-dynamic - this page is a client component shell
// No need for ISR since it's entirely client-rendered

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}): Promise<Metadata> {
  const { ids } = await searchParams;
  const initialIds = ids
    ? ids
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))
    : [];
  return generateCompareMetadata(initialIds);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const initialIds = ids
    ? ids
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))
    : [];
  return <CompareClient initialIds={initialIds} />;
}
