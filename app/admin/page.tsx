"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";

type AdminLink = { label: string; url: string };

interface Yacht {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  maxOccupancy: number | null;
  engineHp: number | null;
  engineType: string | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
  designNotes: string | null;
  description: string | null;
  adminLinks: AdminLink[] | null;
  sourceUrl: string | null;
  sourceAttribution: string | null;
}

interface Manufacturer {
  id: number;
  name: string;
}

export default function AdminPage() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedYacht, setSelectedYacht] = useState<Yacht | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load yachts on mount
  useEffect(() => {
    loadYachts();
    loadManufacturers();
  }, []);

  const loadYachts = async () => {
    setLoading(true);
    try {
      // For admin, we need all yachts. We'll fetch from yacht list with no filters, high limit.
      const res = await fetch("/api/yachts?page=1&limit=100");
      const data = await res.json();
      setYachts(data.yachts || []);
    } catch (e) {
      console.error("Failed to load yachts:", e);
      setMessage({ type: "error", text: "Failed to load yachts" });
    } finally {
      setLoading(false);
    }
  };

  const loadManufacturers = async () => {
    const res = await fetch("/api/manufacturers");
    const data = await res.json();
    setManufacturers(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYacht) return;

    setSaving(true);
    try {
      // We'll need to create an admin API route for updates. For now placeholder.
      setMessage({
        type: "success",
        text: "Yacht saved successfully (not yet implemented)",
      });
    } catch (e) {
      setMessage({ type: "error", text: "Failed to save yacht" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      {message && (
        <div
          className={`p-4 rounded-md mb-6 ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Yacht list */}
        <div className="md:col-span-1 border rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Yachts ({yachts.length})</h2>
            <Button size="sm" variant="outline" onClick={loadYachts}>
              Refresh
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading…</div>
          ) : (
            <ul className="space-y-2">
              {yachts.map((y) => (
                <li key={y.id}>
                  <Button
                    variant={selectedYacht?.id === y.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedYacht(y)}
                  >
                    {y.manufacturer} {y.modelName} ({y.year})
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editor */}
        <div className="md:col-span-2 border rounded-lg p-6">
          {selectedYacht ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Select
                    value={
                      manufacturers
                        .find((m) => m.name === selectedYacht.manufacturer)
                        ?.id.toString() || ""
                    }
                    onValueChange={(value) => {
                      const mfg = manufacturers.find(
                        (m) => m.id === parseInt(value),
                      );
                      if (mfg)
                        setSelectedYacht({
                          ...selectedYacht,
                          manufacturer: mfg.name,
                        });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    value={selectedYacht.modelName}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        modelName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={selectedYacht.year ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        year: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>

                {/* Core numeric specs */}
                <div>
                  <Label>Length Overall (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedYacht.lengthOverall ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        lengthOverall: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Beam (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedYacht.beam ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        beam: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Draft (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedYacht.draft ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        draft: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Displacement (kg)</Label>
                  <Input
                    type="number"
                    value={selectedYacht.displacement ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        displacement: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Ballast (kg)</Label>
                  <Input
                    type="number"
                    value={selectedYacht.ballast ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        ballast: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Sail Area Main (m²)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedYacht.sailAreaMain ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        sailAreaMain: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>

                {/* Categorical */}
                <div>
                  <Label>Rig Type</Label>
                  <Input
                    value={selectedYacht.rigType ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        rigType: e.target.value || null,
                      })
                    }
                    placeholder="e.g., sloop, cutter"
                  />
                </div>
                <div>
                  <Label>Keel Type</Label>
                  <Input
                    value={selectedYacht.keelType ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        keelType: e.target.value || null,
                      })
                    }
                    placeholder="e.g., fin, wing"
                  />
                </div>
                <div>
                  <Label>Hull Material</Label>
                  <Input
                    value={selectedYacht.hullMaterial ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        hullMaterial: e.target.value || null,
                      })
                    }
                  />
                </div>

                {/* Accommodation */}
                <div>
                  <Label>Cabins</Label>
                  <Input
                    type="number"
                    value={selectedYacht.cabins ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        cabins: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Berths</Label>
                  <Input
                    type="number"
                    value={selectedYacht.berths ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        berths: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Heads</Label>
                  <Input
                    type="number"
                    value={selectedYacht.heads ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        heads: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Max Occupancy</Label>
                  <Input
                    type="number"
                    value={selectedYacht.maxOccupancy ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        maxOccupancy: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>

                {/* Technical */}
                <div>
                  <Label>Engine HP</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selectedYacht.engineHp ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        engineHp: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Engine Type</Label>
                  <Input
                    value={selectedYacht.engineType ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        engineType: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Fuel Capacity (liters)</Label>
                  <Input
                    type="number"
                    value={selectedYacht.fuelCapacity ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        fuelCapacity: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Water Capacity (liters)</Label>
                  <Input
                    type="number"
                    value={selectedYacht.waterCapacity ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        waterCapacity: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedYacht.description ?? ""}
                  onChange={(e) =>
                    setSelectedYacht({
                      ...selectedYacht,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="designNotes">Design Notes</Label>
                <Textarea
                  id="designNotes"
                  value={selectedYacht.designNotes ?? ""}
                  onChange={(e) =>
                    setSelectedYacht({
                      ...selectedYacht,
                      designNotes: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sourceUrl">Source URL</Label>
                  <Input
                    id="sourceUrl"
                    value={selectedYacht.sourceUrl ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        sourceUrl: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="sourceAttribution">Source Attribution</Label>
                  <Input
                    id="sourceAttribution"
                    value={selectedYacht.sourceAttribution ?? ""}
                    onChange={(e) =>
                      setSelectedYacht({
                        ...selectedYacht,
                        sourceAttribution: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              {/* Admin Links */}
              <div>
                <Label>Admin Links (custom buttons)</Label>
                <div className="space-y-2 mt-2">
                  {(selectedYacht.adminLinks || []).map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const newLinks = [
                            ...(selectedYacht.adminLinks || []),
                          ];
                          newLinks[idx] = {
                            ...newLinks[idx],
                            label: e.target.value,
                          };
                          setSelectedYacht({
                            ...selectedYacht,
                            adminLinks: newLinks,
                          });
                        }}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [
                            ...(selectedYacht.adminLinks || []),
                          ];
                          newLinks[idx] = {
                            ...newLinks[idx],
                            url: e.target.value,
                          };
                          setSelectedYacht({
                            ...selectedYacht,
                            adminLinks: newLinks,
                          });
                        }}
                        placeholder="URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newLinks = (
                            selectedYacht.adminLinks || []
                          ).filter((_, i) => i !== idx);
                          setSelectedYacht({
                            ...selectedYacht,
                            adminLinks: newLinks,
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedYacht({
                        ...selectedYacht,
                        adminLinks: [
                          ...(selectedYacht.adminLinks || []),
                          { label: "", url: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Link
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedYacht(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a yacht from the list to edit its details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
