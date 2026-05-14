"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Triggers a cross-fade page transition using the View Transitions API
 * on route changes. Falls back gracefully (no animation) in unsupported browsers.
 * Respects prefers-reduced-motion.
 */
export default function PageTransition() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if View Transitions API is supported
    if (!("startViewTransition" in document)) return;

    // Check reduced motion preference
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    // Add transition class to main content
    const main = document.getElementById("main-content");
    if (main) {
      main.classList.add("page-transition-enter");
      // Remove class after animation completes
      const handleEnd = () => {
        main.classList.remove("page-transition-enter");
        main.removeEventListener("animationend", handleEnd);
      };
      main.addEventListener("animationend", handleEnd);
    }
  }, [pathname]);

  return null;
}
