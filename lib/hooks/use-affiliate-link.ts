/**
 * P26.3: React hook for affiliate link optimization.
 *
 * Usage:
 *   const { variant, trackClick } = useAffiliateLink("yacht_detail_sidebar", { yachtId: 123 });
 *   // Then render variant.linkText / variant.linkUrl
 *   // On click: trackClick()
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface AffiliateVariant {
  id: number;
  placementId: number;
  variantKey: string;
  partnerName: string;
  linkText: string;
  linkUrl: string;
  affiliateTag: string | null;
}

interface UseAffiliateLinkOptions {
  yachtId?: number;
  page?: string;
}

interface UseAffiliateLinkReturn {
  variant: AffiliateVariant | null;
  loading: boolean;
  trackClick: () => void;
  trackConversion: (revenue?: number) => void;
}

/**
 * Generate or retrieve a session ID for tracking.
 */
function getTrackingSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "_aff_sid";
  const stored = sessionStorage.getItem(key);
  if (stored) return stored;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try { sessionStorage.setItem(key, id); } catch {}
  return id;
}

/**
 * Hook to fetch and track affiliate links for a placement.
 */
export function useAffiliateLink(
  placementKey: string,
  options?: UseAffiliateLinkOptions
): UseAffiliateLinkReturn {
  const [variant, setVariant] = useState<AffiliateVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placementKey) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      action: "serve",
      placement: placementKey,
      sid: getTrackingSessionId(),
    });
    if (options?.yachtId) params.set("yachtId", String(options.yachtId));
    if (options?.page) params.set("page", options.page);

    fetch(`/api/affiliate?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setVariant(data.variant || null);
      })
      .catch(() => {
        setVariant(null);
      })
      .finally(() => setLoading(false));
  }, [placementKey, options?.yachtId, options?.page]);

  const trackClick = useCallback(() => {
    if (!variant) return;
    fetch("/api/affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "click",
        variantId: variant.id,
        placementId: variant.placementId,
        sessionId: getTrackingSessionId(),
        page: options?.page || (typeof window !== "undefined" ? window.location.pathname : ""),
        yachtId: options?.yachtId,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [variant, options?.yachtId, options?.page]);

  const trackConversion = useCallback(
    (revenue?: number) => {
      if (!variant) return;
      fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "conversion",
          variantId: variant.id,
          placementId: variant.placementId,
          sessionId: getTrackingSessionId(),
          page: options?.page || (typeof window !== "undefined" ? window.location.pathname : ""),
          yachtId: options?.yachtId,
          revenue,
        }),
        keepalive: true,
      }).catch(() => {});
    },
    [variant, options?.yachtId, options?.page]
  );

  return { variant, loading, trackClick, trackConversion };
}
