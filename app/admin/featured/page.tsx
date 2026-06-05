"use client";

import { useState, useEffect, useCallback } from "react";

interface FeaturedItem {
  id: number;
  yachtModelId: number;
  weekStart: string;
  weekEnd: string;
  headline: string | null;
  editorialText: string | null;
  newsletterSent: boolean;
  isManualOverride: boolean;
  isActive: boolean;
  createdAt: string;
  modelName: string;
  manufacturerName: string | null;
}

interface YachtOption {
  id: number;
  modelName: string;
  manufacturerName: string | null;
  year: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FeaturedAdminPage() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [yachtSearch, setYachtSearch] = useState("");
  const [yachtOptions, setYachtOptions] = useState<YachtOption[]>([]);
  const [selectedYachtId, setSelectedYachtId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [headline, setHeadline] = useState("");
  const [editorialText, setEditorialText] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/featured?page=${page}&limit=20`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load featured yachts");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const searchYachts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setYachtOptions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setYachtOptions(
        (data.yachts || []).map((y: Record<string, unknown>) => ({
          id: y.id as number,
          modelName: y.model_name as string || y.modelName as string || "",
          manufacturerName: (y.manufacturer as string) || null,
          year: (y.year as number) || 0,
        }))
      );
    } catch {
      // Ignore search errors
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchYachts(yachtSearch), 300);
    return () => clearTimeout(timer);
  }, [yachtSearch, searchYachts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYachtId || !weekStart || !weekEnd) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yachtModelId: selectedYachtId,
          weekStart,
          weekEnd,
          headline: headline || undefined,
          editorialText: editorialText || undefined,
          isManualOverride: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      setSuccess("Featured yacht created successfully");
      setSelectedYachtId(null);
      setYachtSearch("");
      setWeekStart("");
      setWeekEnd("");
      setHeadline("");
      setEditorialText("");
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create featured yacht");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await fetch("/api/admin/featured", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      fetchItems();
    } catch {
      setError("Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this featured yacht entry?")) return;
    try {
      await fetch(`/api/admin/featured?id=${id}`, { method: "DELETE" });
      setSuccess("Featured yacht deleted");
      fetchItems();
    } catch {
      setError("Failed to delete");
    }
  };

  const handleMarkNewsletterSent = async (id: number) => {
    try {
      await fetch("/api/admin/featured", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "mark-newsletter-sent" }),
      });
      setSuccess("Newsletter marked as sent");
      fetchItems();
    } catch {
      setError("Failed to update newsletter status");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Featured Yachts — Yacht of the Week</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Create Form */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Featured Yacht</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search & Select Yacht *
            </label>
            <input
              type="text"
              value={yachtSearch}
              onChange={(e) => setYachtSearch(e.target.value)}
              placeholder="Type to search yachts..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
            {yachtOptions.length > 0 && (
              <div className="mt-1 border rounded bg-white shadow-lg max-h-48 overflow-y-auto">
                {yachtOptions.map((y) => (
                  <button
                    key={y.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                      selectedYachtId === y.id ? "bg-blue-100" : ""
                    }`}
                    onClick={() => {
                      setSelectedYachtId(y.id);
                      setYachtSearch(`${y.manufacturerName ?? ""} ${y.modelName} (${y.year})`);
                      setYachtOptions([]);
                    }}
                  >
                    {y.manufacturerName} {y.modelName} ({y.year})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Start *</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week End *</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., This Week's Pick: The Perfect Bluewater Cruiser"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Editorial Text</label>
            <textarea
              value={editorialText}
              onChange={(e) => setEditorialText(e.target.value)}
              placeholder="Why this yacht is featured this week..."
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !selectedYachtId}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Featured Yacht"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">All Featured Yachts ({total})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No featured yachts yet</div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {item.manufacturerName} {item.modelName}
                    </span>
                    {item.isManualOverride && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        Manual
                      </span>
                    )}
                    {!item.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                    {item.newsletterSent && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        Newsletter Sent
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(item.weekStart)} — {formatDate(item.weekEnd)}
                  </div>
                  {item.headline && (
                    <div className="text-sm text-gray-600 mt-1 truncate">{item.headline}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(item.id, item.isActive)}
                    className={`px-3 py-1 text-xs rounded font-medium ${
                      item.isActive
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {!item.newsletterSent && (
                    <button
                      onClick={() => handleMarkNewsletterSent(item.id)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200"
                    >
                      Mark Newsletter Sent
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded text-sm ${
                  p === page ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
