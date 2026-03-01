export const dynamic = "force-dynamic";

import { Suspense } from "react";
import YachtsClient from "./YachtsClient";

// Fetch initial data on server to avoid client waterfalls
async function getInitialData() {
  try {
    const [catRes, mfgRes] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/spec-categories`,
        { next: { revalidate: 0 } },
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/manufacturers`,
        { next: { revalidate: 0 } },
      ),
    ]);

    const categories = catRes.ok ? (await catRes.json()).categories : [];
    const manufacturers = mfgRes.ok ? (await mfgRes.json()).manufacturers : [];

    return { categories, manufacturers };
  } catch (error) {
    console.error("Failed to fetch initial data:", error);
    return { categories: [], manufacturers: [] };
  }
}

export default async function YachtsPage() {
  const { categories, manufacturers } = await getInitialData();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <YachtsClient
        initialCategories={categories}
        initialManufacturers={manufacturers}
      />
    </Suspense>
  );
}
