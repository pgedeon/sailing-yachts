/**
 * Client component for JSON-LD structured data injection.
 */
"use client";

import { useEffect } from "react";

interface FaqStructuredDataProps {
  jsonLd: object;
}

export default function FaqStructuredData({ jsonLd }: FaqStructuredDataProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [jsonLd]);

  return null;
}
