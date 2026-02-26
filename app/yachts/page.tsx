import { Suspense } from "react";
import YachtsClient from "./YachtsClient";

export default function YachtsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <YachtsClient />
    </Suspense>
  );
}
