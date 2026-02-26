export const dynamic = "force-dynamic";

import { Suspense } from "react";
import CompareClient from "./CompareClient";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
