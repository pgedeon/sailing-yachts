"use client";

import { useState, useEffect, useCallback } from "react";

// --- Types ---

interface Variant {
  id: number;
  variant_key: string;
  partner_name: string;
  link_text: string;
  link_url: string;
  affiliate_tag: string | null;
  display_order: number;
  traffic_weight: number;
  is_active: boolean;
  is_winner: boolean;
  clicks: number;
  conversions: number;
  estimated_revenue: string;
  impressions: number;
}

interface Placement {
  id: number;
  placement_key: string;
  label: string;
  page_pattern: string;
  position: string;
  is_active: boolean;
  rotation_strategy: string;
  auto_optimize: boolean;
  min_sample_size: number;
  confidence_threshold: string;
  variants: Variant[];
}

interface Summary {
  totalPlacements: number;
  activePlacements: number;
  totalVariants: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  overallCtr: number;
  overallConversionRate: number;
  topPerformingPlacement: string | null;
  topPerformingPartner: string | null;
}

interface TrendPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export default function AffiliateTrackingDashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "placements" | "trends">("overview");
  const [expandedPlacement, setExpandedPlacement] = useState<number | null>(null);
  const [showCreatePlacement, setShowCreatePlacement] = useState(false);
  const [showCreateVariant, setShowCreateVariant] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, placementsRes, trendsRes] = await Promise.all([
        fetch("/api/admin/affiliate-tracking?action=summary"),
        fetch("/api/admin/affiliate-tracking?action=placements"),
        fetch("/api/admin/affiliate-tracking?action=trends&days=30"),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }
      if (placementsRes.ok) {
        const data = await placementsRes.json();
        setPlacements(data.placements || []);
      }
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.trends || []);
      }
    } catch (err) {
      console.error("Failed to fetch affiliate data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const adminPost = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/affiliate-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Operation failed");
      return null;
    }
    return res.json();
  };

  const togglePlacementActive = async (id: number, isActive: boolean) => {
    await adminPost({ action: "update_placement", id, isActive });
    fetchData();
  };

  const resetPlacementStats = async (placementId: number) => {
    if (!confirm("Reset all stats for this placement? This cannot be undone.")) return;
    await adminPost({ action: "reset_stats", placementId });
    fetchData();
  };

  const deleteVariant = async (id: number) => {
    if (!confirm("Delete this variant?")) return;
    await adminPost({ action: "delete_variant", id });
    fetchData();
  };

  const deletePlacement = async (id: number) => {
    if (!confirm("Delete this placement and all its variants?")) return;
    await adminPost({ action: "delete_placement", id });
    fetchData();
  };

  const formatPct = (v: number) => (v * 100).toFixed(2) + "%";
  const formatCurrency = (v: number) => "€" + v.toFixed(2);

  // --- Summary Cards ---
  const SummaryCards = () => {
    if (!summary) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Overall CTR</div>
          <div className="text-2xl font-bold">{formatPct(summary.overallCtr)}</div>
          <div className="text-xs text-gray-400">{summary.totalClicks} clicks / {summary.totalImpressions} impressions</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Conversions</div>
          <div className="text-2xl font-bold">{summary.totalConversions}</div>
          <div className="text-xs text-gray-400">{formatPct(summary.overallConversionRate)} rate</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Active Placements</div>
          <div className="text-2xl font-bold">{summary.activePlacements} / {summary.totalPlacements}</div>
          <div className="text-xs text-gray-400">{summary.totalVariants} variants</div>
        </div>
      </div>
    );
  };

  // --- Trends Chart (simple bar chart using CSS) ---
  const TrendsChart = () => {
    if (trends.length === 0) {
      return <div className="text-gray-400 text-center py-8">No trend data yet</div>;
    }

    const maxClicks = Math.max(...trends.map((t) => t.clicks), 1);

    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Daily Clicks (Last 30 Days)</h3>
        <div className="flex items-end gap-1 h-40">
          {trends.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full bg-blue-500 rounded-t min-h-[2px]"
                style={{ height: `${(t.clicks / maxClicks) * 100}%` }}
                title={`${t.date}: ${t.clicks} clicks, ${t.conversions} conversions, €${t.revenue.toFixed(2)}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{trends[0]?.date}</span>
          <span>{trends[trends.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  // --- Placement Card ---
  const PlacementCard = ({ placement }: { placement: Placement }) => {
    const isExpanded = expandedPlacement === placement.id;
    const totalClicks = placement.variants.reduce((sum, v) => sum + v.clicks, 0);
    const totalRevenue = placement.variants.reduce((sum, v) => sum + parseFloat(v.estimated_revenue || "0"), 0);
    const totalImpressions = placement.variants.reduce((sum, v) => sum + v.impressions, 0);
    const winner = placement.variants.find((v) => v.is_winner);

    return (
      <div className={`border rounded-lg mb-4 ${placement.is_active ? "bg-white" : "bg-gray-50 opacity-75"}`}>
        <div
          className="p-4 cursor-pointer flex items-center justify-between"
          onClick={() => setExpandedPlacement(isExpanded ? null : placement.id)}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{placement.label}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{placement.position}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{placement.rotation_strategy}</span>
              {winner && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">🏆 Winner: {winner.variant_key}</span>}
              {!placement.is_active && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Inactive</span>}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Key: <code className="bg-gray-100 px-1 rounded">{placement.placement_key}</code> · Pattern: <code className="bg-gray-100 px-1 rounded">{placement.page_pattern}</code>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{totalClicks} clicks · {formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-gray-400">{totalImpressions} impressions · {placement.variants.length} variants</div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t p-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => togglePlacementActive(placement.id, !placement.is_active)}
                className={`px-3 py-1 text-sm rounded ${placement.is_active ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
              >
                {placement.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => resetPlacementStats(placement.id)}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              >
                Reset Stats
              </button>
              <button
                onClick={() => deletePlacement(placement.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Delete
              </button>
              <button
                onClick={() => setShowCreateVariant(placement.id)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                + Add Variant
              </button>
            </div>

            {/* Auto-optimize settings */}
            <div className="text-xs text-gray-500 mb-3">
              Auto-optimize: {placement.auto_optimize ? "✅ ON" : "❌ OFF"} · Min sample: {placement.min_sample_size} · Confidence: {(parseFloat(placement.confidence_threshold) * 100).toFixed(0)}%
            </div>

            {/* Variants table */}
            {placement.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-3">Variant</th>
                      <th className="pb-2 pr-3">Partner</th>
                      <th className="pb-2 pr-3">Weight</th>
                      <th className="pb-2 pr-3">Impressions</th>
                      <th className="pb-2 pr-3">Clicks</th>
                      <th className="pb-2 pr-3">CTR</th>
                      <th className="pb-2 pr-3">Conversions</th>
                      <th className="pb-2 pr-3">Revenue</th>
                      <th className="pb-2 pr-3">RPC</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placement.variants.map((v) => {
                      const ctr = v.impressions > 0 ? v.clicks / v.impressions : 0;
                      const rpc = v.clicks > 0 ? parseFloat(v.estimated_revenue || "0") / v.clicks : 0;
                      return (
                        <tr key={v.id} className={`border-b ${v.is_winner ? "bg-green-50" : ""} ${!v.is_active ? "opacity-50" : ""}`}>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-1">
                              {v.is_winner && <span>🏆</span>}
                              <span className="font-medium">{v.variant_key}</span>
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[200px]" title={v.link_url}>{v.link_text}</div>
                          </td>
                          <td className="py-2 pr-3">{v.partner_name}</td>
                          <td className="py-2 pr-3">{v.traffic_weight}%</td>
                          <td className="py-2 pr-3">{v.impressions.toLocaleString()}</td>
                          <td className="py-2 pr-3">{v.clicks.toLocaleString()}</td>
                          <td className="py-2 pr-3">{formatPct(ctr)}</td>
                          <td className="py-2 pr-3">{v.conversions}</td>
                          <td className="py-2 pr-3">{formatCurrency(parseFloat(v.estimated_revenue || "0"))}</td>
                          <td className="py-2 pr-3">{formatCurrency(rpc)}</td>
                          <td className="py-2">
                            <button
                              onClick={() => deleteVariant(v.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No variants yet. Add one to start testing.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- Create Placement Form ---
  const CreatePlacementForm = () => {
    const [key, setKey] = useState("");
    const [label, setLabel] = useState("");
    const [pattern, setPattern] = useState("");
    const [position, setPosition] = useState("sidebar");
    const [strategy, setStrategy] = useState("ab_test");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await adminPost({
        action: "create_placement",
        placementKey: key,
        label,
        pagePattern: pattern,
        position,
        rotationStrategy: strategy,
      });
      setShowCreatePlacement(false);
      fetchData();
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreatePlacement(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-semibold text-lg mb-4">Create Placement</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Key *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g., yacht_detail_top" required />
            </div>
            <div>
              <label className="text-sm font-medium">Label *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., Yacht Detail — Top Banner" required />
            </div>
            <div>
              <label className="text-sm font-medium">Page Pattern *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="e.g., /yachts/[slug]" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Position</label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={position} onChange={(e) => setPosition(e.target.value)}>
                  <option value="sidebar">Sidebar</option>
                  <option value="footer">Footer</option>
                  <option value="inline">Inline</option>
                  <option value="modal">Modal</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Strategy</label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="ab_test">A/B Test</option>
                  <option value="best_performer">Best Performer</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreatePlacement(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- Create Variant Form ---
  const CreateVariantForm = ({ placementId }: { placementId: number }) => {
    const [variantKey, setVariantKey] = useState("");
    const [partnerName, setPartnerName] = useState("amazon");
    const [linkText, setLinkText] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [affiliateTag, setAffiliateTag] = useState("");
    const [trafficWeight, setTrafficWeight] = useState(50);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await adminPost({
        action: "create_variant",
        placementId,
        variantKey,
        partnerName,
        linkText,
        linkUrl,
        affiliateTag: affiliateTag || undefined,
        trafficWeight,
      });
      setShowCreateVariant(null);
      fetchData();
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateVariant(null)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-semibold text-lg mb-4">Add Variant</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Variant Key *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={variantKey} onChange={(e) => setVariantKey(e.target.value)} placeholder="e.g., amazon_safety_gear" required />
            </div>
            <div>
              <label className="text-sm font-medium">Partner</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Link Text *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="e.g., Shop Safety Gear on Amazon" required />
            </div>
            <div>
              <label className="text-sm font-medium">Link URL *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://www.amazon.com/s?k=..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Affiliate Tag</label>
                <input className="w-full border rounded px-3 py-2 text-sm" value={affiliateTag} onChange={(e) => setAffiliateTag(e.target.value)} placeholder="pgedeon-20" />
              </div>
              <div>
                <label className="text-sm font-medium">Traffic Weight (%)</label>
                <input type="number" min={1} max={100} className="w-full border rounded px-3 py-2 text-sm" value={trafficWeight} onChange={(e) => setTrafficWeight(parseInt(e.target.value))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreateVariant(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Add Variant</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading affiliate data...</div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Affiliate Link Optimization</h1>
          <p className="text-gray-500 text-sm">A/B test affiliate placements. Track revenue. Auto-optimize.</p>
        </div>
        <button
          onClick={() => setShowCreatePlacement(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          + New Placement
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b mb-6">
        {(["overview", "placements", "trends"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-medium ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <SummaryCards />
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Quick Stats</h3>
            {summary?.topPerformingPlacement && (
              <div className="text-sm text-gray-600">
                🏆 Top Placement: <span className="font-medium">{summary.topPerformingPlacement}</span>
              </div>
            )}
            {summary?.topPerformingPartner && (
              <div className="text-sm text-gray-600">
                💰 Top Partner: <span className="font-medium">{summary.topPerformingPartner}</span>
              </div>
            )}
          </div>
          <TrendsChart />
        </>
      )}

      {activeTab === "placements" && (
        <>
          {placements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No placements yet. Create one to start testing affiliate links.
            </div>
          ) : (
            placements.map((p) => <PlacementCard key={p.id} placement={p} />)
          )}
        </>
      )}

      {activeTab === "trends" && <TrendsChart />}

      {/* Modals */}
      {showCreatePlacement && <CreatePlacementForm />}
      {showCreateVariant !== null && <CreateVariantForm placementId={showCreateVariant} />}
    </div>
  );
}
