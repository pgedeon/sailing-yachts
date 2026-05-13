"use client";

import dynamic from "next/dynamic";

// Dynamic imports to avoid adding to initial JS bundle
const ScrollProgress = dynamic(() => import("@/components/ui/scroll-progress"), {
  ssr: false,
});

const BackToTop = dynamic(() => import("@/components/ui/back-to-top"), {
  ssr: false,
});

/**
 * Client-side UX polish components that mount on every page.
 * Uses dynamic imports to avoid SSR issues and reduce initial bundle.
 */
export default function UXPolish() {
  return (
    <>
      <ScrollProgress />
      <BackToTop />
    </>
  );
}
