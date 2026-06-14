"use client";

import { useState, useEffect, useCallback } from "react";

interface Campaign {
  id: number;
  subject: string;
  preheader: string | null;
  status: string;
  targetSegment: string | null;
  scheduledFor: string | null;
  sentAt: string | null;
  recipientCount: number | null;
  openCount: number | null;
  clickCount: number | null;
  revenue: string | null;
  createdAt: string;
}

interface CampaignStats {
  totalCampaigns: number;
  totalSent: number;
  totalRecipients: number;
  totalOpens: number;
  totalClicks: number;
  totalRevenue: number;
  totalSubscribers: number;
  confirmedSubscribers: number;
  availableTags: string[];
}

export default function NewsletterCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/newsletter/campaigns");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setStats(data.stats || null);
    } catch {
      setError("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSend = async (id: number) => {
    if (!confirm("Mark this campaign as sent? This will record recipient count.")) return;
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      fetchCampaigns();
    } catch (e: any) {
      alert(e.message || "Failed to send campaign");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/newsletter/campaigns/${id}`, { method: "DELETE" });
      fetchCampaigns();
    } catch {
      alert("Failed to delete campaign");
    }
  };

  if (selectedCampaign) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        onBack={() => {
          setSelectedCampaign(null);
          fetchCampaigns();
        }}
      />
    );
  }

  if (showCreate) {
    return (
      <CreateCampaignForm
        availableTags={stats?.availableTags || []}
        onCancel={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          fetchCampaigns();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Campaigns</h1>
          <p className="text-gray-600 mt-1">
            {stats ? `${stats.totalSubscribers} subscribers (${stats.confirmedSubscribers} confirmed)` : "Loading..."}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New Campaign
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Campaigns" value={stats.totalCampaigns} />
          <StatCard label="Sent" value={stats.totalSent} />
          <StatCard label="Recipients" value={stats.totalRecipients} />
          <StatCard label="Opens" value={stats.totalOpens} />
          <StatCard label="Clicks" value={stats.totalClicks} />
          <StatCard label="Revenue" value={`€${stats.totalRevenue.toFixed(0)}`} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No campaigns yet. Create your first campaign.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Segment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sent</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Recipients</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Opens</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Clicks</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Revenue</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const openRate = c.recipientCount && c.recipientCount > 0
                  ? ((c.openCount ?? 0) / c.recipientCount * 100).toFixed(0)
                  : "—";
                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCampaign(c)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{c.subject}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.targetSegment || "All"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.recipientCount ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {c.openCount ?? 0}
                      {c.recipientCount ? ` (${openRate}%)` : ""}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.clickCount ?? 0}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {Number(c.revenue || 0) > 0 ? `€${Number(c.revenue).toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        {c.status === "draft" && (
                          <button
                            onClick={() => handleSend(c.id)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Send
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    sent: "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Create Campaign Form ───────────────────────────────────────────

interface SponsorSlotInput {
  sponsorName: string;
  headline: string;
  bodyText: string;
  ctaText: string;
  ctaUrl: string;
  slotPosition: string;
  revenue: string;
}

function CreateCampaignForm({
  availableTags,
  onCancel,
  onCreated,
}: {
  availableTags: string[];
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [targetSegment, setTargetSegment] = useState("all");
  const [scheduledFor, setScheduledFor] = useState("");
  const [sponsors, setSponsors] = useState<SponsorSlotInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addSponsor = () => {
    setSponsors([
      ...sponsors,
      { sponsorName: "", headline: "", bodyText: "", ctaText: "Learn More", ctaUrl: "", slotPosition: "middle", revenue: "" },
    ]);
  };

  const updateSponsor = (idx: number, field: keyof SponsorSlotInput, value: string) => {
    setSponsors(sponsors.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSponsor = (idx: number) => {
    setSponsors(sponsors.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !bodyMarkdown.trim()) {
      setError("Subject and body are required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          preheader,
          bodyMarkdown,
          targetSegment: targetSegment === "all" ? null : targetSegment,
          scheduledFor: scheduledFor || null,
          sponsorSlots: sponsors.filter((s) => s.sponsorName && s.headline && s.ctaUrl),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      onCreated();
    } catch (e: any) {
      setError(e.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
        <button onClick={onCancel} className="text-gray-600 hover:text-gray-800">
          ← Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Newsletter subject line"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preheader</label>
          <input
            type="text"
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Preview text shown in email client"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body (Markdown) *</label>
          <textarea
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            required
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="## Welcome to this week's newsletter&#10;&#10;Your content here..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Segment</label>
            <select
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subscribers</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule For</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sponsored Content Slots */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Sponsored Content Slots
            </label>
            <button
              type="button"
              onClick={addSponsor}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Sponsor
            </button>
          </div>
          {sponsors.map((sponsor, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4 mb-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Sponsor #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSponsor(idx)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Sponsor name"
                  value={sponsor.sponsorName}
                  onChange={(e) => updateSponsor(idx, "sponsorName", e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Revenue (€)"
                  value={sponsor.revenue}
                  onChange={(e) => updateSponsor(idx, "revenue", e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Headline"
                value={sponsor.headline}
                onChange={(e) => updateSponsor(idx, "headline", e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <textarea
                placeholder="Body text (optional)"
                value={sponsor.bodyText}
                onChange={(e) => updateSponsor(idx, "bodyText", e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="CTA text"
                  value={sponsor.ctaText}
                  onChange={(e) => updateSponsor(idx, "ctaText", e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="CTA URL"
                  value={sponsor.ctaUrl}
                  onChange={(e) => updateSponsor(idx, "ctaUrl", e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
                <select
                  value={sponsor.slotPosition}
                  onChange={(e) => updateSponsor(idx, "slotPosition", e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Campaign"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Campaign Detail View ───────────────────────────────────────────

function CampaignDetail({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/newsletter/campaigns/${campaign.id}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [campaign.id]);

  const openRate = campaign.recipientCount && campaign.recipientCount > 0
    ? ((campaign.openCount ?? 0) / campaign.recipientCount * 100).toFixed(1)
    : "0";
  const clickRate = campaign.recipientCount && campaign.recipientCount > 0
    ? ((campaign.clickCount ?? 0) / campaign.recipientCount * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800 mb-2">
            ← Back to campaigns
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.subject}</h1>
          <p className="text-gray-600 mt-1">
            Status: <StatusBadge status={campaign.status} />
            {campaign.sentAt && ` • Sent ${new Date(campaign.sentAt).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Recipients" value={campaign.recipientCount ?? "—"} />
        <StatCard label="Opens" value={`${campaign.openCount ?? 0} (${openRate}%)`} />
        <StatCard label="Clicks" value={`${campaign.clickCount ?? 0} (${clickRate}%)`} />
        <StatCard label="Revenue" value={`€${Number(campaign.revenue || 0).toFixed(0)}`} />
        <StatCard label="Segment" value={campaign.targetSegment || "All"} />
      </div>

      {/* Sponsors */}
      {detail?.sponsors?.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">Sponsored Content ({detail.sponsors.length})</h2>
          <div className="space-y-3">
            {detail.sponsors.map((s: any) => (
              <div key={s.id} className="border-l-4 border-amber-400 pl-3">
                <div className="font-medium text-gray-900">{s.sponsorName}</div>
                <div className="text-sm text-gray-700">{s.headline}</div>
                {s.bodyText && <div className="text-sm text-gray-500 mt-1">{s.bodyText}</div>}
                <div className="text-xs text-gray-400 mt-1">
                  Position: {s.slotPosition} • Revenue: €{Number(s.revenue).toFixed(0)} • CTA: {s.ctaText}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {detail?.campaign?.bodyMarkdown && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">Content Preview</h2>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">
            {detail.campaign.bodyMarkdown}
          </pre>
        </div>
      )}

      {loading && <div className="text-center py-4 text-gray-500">Loading details...</div>}
    </div>
  );
}
