"use client";

import { useState, useEffect } from "react";

interface Subscriber {
  id: number;
  email: string;
  confirmed: boolean;
  source: string;
  createdAt: string;
  confirmedAt: string | null;
  tags: string[] | null;
  engagementScore: number | null;
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [editingTags, setEditingTags] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState("");

  const fetchSubscribers = async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/newsletter?page=${p}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubscribers(data.subscribers);
      setTotal(data.total);
      setPage(p);
    } catch {
      setError("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers(1);
    // Fetch available tags
    fetch("/api/admin/newsletter/analytics")
      .then((r) => r.json())
      .then((data) => {
        setAvailableTags(data.tagDistribution?.map((t: any) => t.tag) || []);
      })
      .catch(() => {});
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this subscriber?")) return;
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchSubscribers(page);
    } catch {
      alert("Failed to remove subscriber");
    }
  };

  const handleAddTag = async (subscriberId: number, tag: string) => {
    if (!tag.trim()) return;
    try {
      await fetch(`/api/admin/newsletter/subscribers/${subscriberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: tag.trim() }),
      });
      setTagInput("");
      setEditingTags(null);
      fetchSubscribers(page);
    } catch {
      alert("Failed to add tag");
    }
  };

  const handleRemoveTag = async (subscriberId: number, tag: string) => {
    try {
      await fetch(`/api/admin/newsletter/subscribers/${subscriberId}?tag=${encodeURIComponent(tag)}`, {
        method: "DELETE",
      });
      fetchSubscribers(page);
    } catch {
      alert("Failed to remove tag");
    }
  };

  const handleSetTags = async (subscriberId: number, tags: string[]) => {
    try {
      await fetch(`/api/admin/newsletter/subscribers/${subscriberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      setEditingTags(null);
      fetchSubscribers(page);
    } catch {
      alert("Failed to update tags");
    }
  };

  const filtered = tagFilter
    ? subscribers.filter((s) => s.tags?.includes(tagFilter))
    : subscribers;

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Newsletter Subscribers
          </h1>
          <p className="text-gray-600 mt-1">
            {total} subscriber{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/newsletter/campaigns"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            📧 Campaigns
          </a>
        </div>
      </div>

      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Filter by tag:</span>
          <button
            onClick={() => setTagFilter("")}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              !tagFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                tagFilter === tag ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No subscribers {tagFilter && `with tag "${tagFilter}"`}.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subscribed</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tags</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{sub.email}</td>
                  <td className="px-4 py-3 text-gray-600">{sub.source}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.confirmed
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {sub.confirmed ? "Confirmed" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 items-center">
                      {sub.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(sub.id, tag)}
                            className="text-purple-400 hover:text-purple-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {editingTags === sub.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddTag(sub.id, tagInput);
                              } else if (e.key === "Escape") {
                                setEditingTags(null);
                                setTagInput("");
                              }
                            }}
                            placeholder="tag name"
                            className="w-24 px-2 py-0.5 border border-gray-300 rounded text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddTag(sub.id, tagInput)}
                            className="text-xs text-blue-600"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTags(sub.id);
                            setTagInput("");
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          + tag
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {sub.engagementScore ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
              <button
                onClick={() => fetchSubscribers(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchSubscribers(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
