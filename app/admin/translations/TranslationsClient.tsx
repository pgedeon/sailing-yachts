"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Languages,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Zap,
  Database,
  FileText,
  Factory,
  BarChart3,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface TranslationStats {
  total: number;
  byStatus: Record<string, number>;
  byContentType: Record<string, number>;
  byMethod: Record<string, number>;
  coverageByType: Record<string, { total: number; translated: number; pct: number }>;
}

interface MemoryStats {
  total: number;
  byCategory: Record<string, number>;
  totalMatchCount: number;
}

interface QueueItem {
  id: number;
  contentType: string;
  contentId: number;
  fieldName: string;
  sourceText: string | null;
  translatedText: string;
  translationMethod: string;
  status: string;
  qualityScore: number | null;
  createdAt: string;
}

// ─── Component ──────────────────────────────────────────────────────

export default function TranslationsClient() {
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterType, setFilterType] = useState<string>("");
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/translations?action=stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setMemoryStats(data.memoryStats);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("contentType", filterType);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));

      const res = await fetch(`/api/admin/translations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch queue");
      const data = await res.json();
      setQueue(data.items ?? []);
      setTotalItems(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (action: string, body: Record<string, unknown> = {}) => {
    setActionLoading(action);
    try {
      const res = await fetch("/api/admin/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (!res.ok) throw new Error("Action failed");
      const data = await res.json();
      await fetchStats();
      await fetchQueue();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    setActionLoading(`status-${id}`);
    try {
      const res = await fetch("/api/admin/translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchQueue();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTextSave = async (id: number) => {
    setActionLoading(`edit-${id}`);
    try {
      const res = await fetch("/api/admin/translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, translatedText: editText }),
      });
      if (!res.ok) throw new Error("Update failed");
      setEditingId(null);
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    auto_translated: "bg-blue-100 text-blue-800",
    in_review: "bg-purple-100 text-purple-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    yacht_description: <Database className="w-4 h-4" />,
    manufacturer_description: <Factory className="w-4 h-4" />,
    article: <FileText className="w-4 h-4" />,
    guide: <FileText className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Languages className="w-7 h-7 text-blue-600" />
              Translation Management
            </h1>
            <p className="text-gray-500 mt-1">Multilingual content pipeline — EN → FR</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-500">Total Translations</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-500">Pending Review</div>
              <div className="text-2xl font-bold text-yellow-600">
                {(stats.byStatus as Record<string, number>)?.pending ?? 0}
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-500">Approved</div>
              <div className="text-2xl font-bold text-green-600">
                {(stats.byStatus as Record<string, number>)?.approved ?? 0}
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-500">Memory Entries</div>
              <div className="text-2xl font-bold text-blue-600">{memoryStats?.total ?? 0}</div>
            </div>
          </div>
        )}

        {/* Coverage */}
        {stats?.coverageByType && (
          <div className="bg-white rounded-lg border p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Translation Coverage
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(stats.coverageByType).map(([type, cov]) => (
                <div key={type} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 capitalize">{type.replace(/_/g, " ")}</span>
                      <span className="text-gray-900 font-medium">{cov.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${cov.pct >= 80 ? "bg-green-500" : cov.pct >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${cov.pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {cov.translated} / {cov.total} items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Auto-Generate Translations
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAction("auto-generate-yachts")}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === "auto-generate-yachts" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Generate Yacht Descriptions
            </button>
            <button
              onClick={() => handleAction("auto-generate-manufacturers")}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === "auto-generate-manufacturers" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Factory className="w-4 h-4" />}
              Generate Manufacturer Descs
            </button>
            <button
              onClick={() => handleAction("auto-generate-articles")}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === "auto-generate-articles" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate Article Translations
            </button>
            <button
              onClick={() => handleAction("bulk-approve")}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === "bulk-approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Bulk Approve Auto-Translated
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="auto_translated">Auto-Translated</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Types</option>
            <option value="yacht_description">Yacht Descriptions</option>
            <option value="manufacturer_description">Manufacturer Descs</option>
            <option value="article">Articles</option>
            <option value="guide">Guides</option>
          </select>
          <button
            onClick={() => fetchQueue()}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <span className="text-sm text-gray-500">{totalItems} items</span>
        </div>

        {/* Queue */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No translations found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {typeIcons[item.contentType] ?? <FileText className="w-4 h-4" />}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {item.contentType.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-400">#{item.contentId}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{item.fieldName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                      {item.translationMethod !== "manual" && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                          {item.translationMethod}
                        </span>
                      )}
                      {item.qualityScore != null && (
                        <span className="text-xs text-gray-400">Score: {item.qualityScore}</span>
                      )}
                    </div>

                    {/* Source text (collapsed) */}
                    {item.sourceText && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="text-xs text-gray-400 mr-1">EN:</span>
                        {expandedId === item.id
                          ? item.sourceText
                          : item.sourceText.slice(0, 150) + (item.sourceText.length > 150 ? "…" : "")}
                      </div>
                    )}

                    {/* Translated text */}
                    {editingId === item.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEditTextSave(item.id)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-800">
                        <span className="text-xs text-blue-400 mr-1">FR:</span>
                        {expandedId === item.id
                          ? item.translatedText
                          : item.translatedText.slice(0, 150) + (item.translatedText.length > 150 ? "…" : "")}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Expand"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingId(item.id); setEditText(item.translatedText); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {(item.status === "pending" || item.status === "auto_translated" || item.status === "in_review") && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(item.id, "approved")}
                          disabled={actionLoading !== null}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(item.id, "rejected")}
                          disabled={actionLoading !== null}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
