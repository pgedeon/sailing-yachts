"use client";

import { useState } from "react";

export default function AdminPage() {
  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    lengthOverall: "",
    beam: "",
    draft: "",
    displacement: "",
    year: "",
    imageUrl: "",
  });
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const payload = {
      ...form,
      lengthOverall: form.lengthOverall ? parseFloat(form.lengthOverall) : undefined,
      beam: form.beam ? parseFloat(form.beam) : undefined,
      draft: form.draft ? parseFloat(form.draft) : undefined,
      displacement: form.displacement ? parseInt(form.displacement, 10) : undefined,
      year: form.year ? parseInt(form.year, 10) : undefined,
    };
    const res = await fetch("/api/admin/yachts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("Yacht added successfully!");
      setForm({
        name: "",
        manufacturer: "",
        lengthOverall: "",
        beam: "",
        draft: "",
        displacement: "",
        year: "",
        imageUrl: "",
      });
    } else {
      setMessage("Failed to add yacht.");
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Admin - Add Yacht</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            required
            className="w-full border rounded px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Manufacturer</label>
          <input
            required
            className="w-full border rounded px-3 py-2"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Length Overall (ft)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={form.lengthOverall}
              onChange={(e) => setForm({ ...form, lengthOverall: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Beam (ft)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={form.beam}
              onChange={(e) => setForm({ ...form, beam: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Draft (ft)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={form.draft}
              onChange={(e) => setForm({ ...form, draft: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Displacement (lbs)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={form.displacement}
              onChange={(e) => setForm({ ...form, displacement: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Year</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Image URL (optional)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Yacht
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
