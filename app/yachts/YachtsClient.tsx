"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import YachtDetailModal from "@/components/YachtDetailModal";

interface SpecCategory {
  id: number;
  name: string;
  unit: string | null;
  dataType: "numeric" | "text";
  categoryGroup: string;
  isFilterable: boolean;
}

interface Manufacturer {
  id: number;
  name: string;
}

interface Yacht {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number;
  slug: string;
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
  sourceUrl?: string | null;
  sourceAttribution?: string | null;
  specsByGroup?: Record<string, Array<{ category: string; value: number | string; unit?: string }>>;
  images?: Array<{ url: string; caption?: string; altText?: string; isPrimary: boolean }>;
  reviews?: Array<{ source: string; rating: number | null; summary: string | null; fullText?: string | null; reviewDate?: string | null; authorName?: string | null; sourceUrl?: string | null }>;
}

interface YachtsClientProps {
  initialManufacturers?: Manufacturer[];
  initialCategories?: SpecCategory[];
}

export default function YachtsClient({
  initialManufacturers = [],
  initialCategories = [],
}: YachtsClientProps) {
  const searchParams = useSearchParams();

  // State
  const [categories, setCategories] =
    useState<SpecCategory[]>(initialCategories);
  const [manufacturers, setManufacturers] =
    useState<Manufacturer[]>(initialManufacturers);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [distinct, setDistinct] = useState<{
    rigTypes: string[];
    keelTypes: string[];
    hullMaterials: string[];
  }>({ rigTypes: [], keelTypes: [], hullMaterials: [] });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState("lengthOverall");
  const [sortOrder, setSortOrder] = useState("asc");

  // Derived filter state for UI controls
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    [],
  );
  const [selectedRigTypes, setSelectedRigTypes] = useState<string[]>([]);
  const [selectedKeelTypes, setSelectedKeelTypes] = useState<string[]>([]);
  const [selectedHullMaterials, setSelectedHullMaterials] = useState<string[]>(
    [],
  );
  const [lengthMin, setLengthMin] = useState("");
  const [lengthMax, setLengthMax] = useState("");
  const [beamMin, setBeamMin] = useState("");
  const [beamMax, setBeamMax] = useState("");
  const [draftMin, setDraftMin] = useState("");
  const [draftMax, setDraftMax] = useState("");
  const [displacementMin, setDisplacementMin] = useState("");
  const [displacementMax, setDisplacementMax] = useState("");
  const [sailAreaMin, setSailAreaMin] = useState("");
  const [sailAreaMax, setSailAreaMax] = useState("");

  // Modal state
  const [selectedYacht, setSelectedYacht] = useState<Yacht | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch spec categories for filters (only if not provided)
  useEffect(() => {
    if (initialCategories.length === 0) {
      async function loadCategories() {
        try {
          const res = await fetch("/api/spec-categories", { cache: 'no-store' });
          if (!res.ok) throw new Error("Failed to fetch spec categories");
          const data = await res.json();
          setCategories(data.categories || []);
        } catch (err) {
          console.error("Failed to load spec categories:", err);
        }
      }
      loadCategories();
    }
  }, [initialCategories]);

  // Fetch manufacturers for filter dropdown (only if not provided)
  useEffect(() => {
    if (initialManufacturers.length === 0) {
      async function loadManufacturers() {
        try {
          const url = new URL("/api/manufacturers", window.location.origin);
          url.searchParams.set("_t", Date.now().toString());
          const res = await fetch(url.toString(), { cache: 'no-store' });
          if (!res.ok) throw new Error("Failed to fetch manufacturers");
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.manufacturers ?? []);
          setManufacturers(list);
        } catch (err) {
          console.error("Failed to load manufacturers:", err);
        }
      }
      loadManufacturers();
    }
  }, [initialManufacturers]);

  // Build query object from filter state
  const buildQuery = useCallback(() => {
    const q: Record<string, any> = {
      page: page.toString(),
      limit: "20",
      sort: sortBy,
      order: sortOrder,
    };

    if (
      selectedManufacturers.length > 0 ||
      selectedRigTypes.length > 0 ||
      selectedKeelTypes.length > 0 ||
      selectedHullMaterials.length > 0 ||
      lengthMin ||
      lengthMax ||
      beamMin ||
      beamMax ||
      draftMin ||
      draftMax ||
      displacementMin ||
      displacementMax ||
      sailAreaMin ||
      sailAreaMax
    ) {
      const newFilters: Record<string, any> = {};

      if (selectedManufacturers.length > 0) {
        const mIds = manufacturers
          .filter((m) => selectedManufacturers.includes(m.name))
          .map((m) => m.id);
        newFilters.manufacturers = mIds;
      }
      if (selectedRigTypes.length > 0) {
        newFilters.rigType = selectedRigTypes;
      }
      if (selectedKeelTypes.length > 0) {
        newFilters.keelType = selectedKeelTypes;
      }
      if (selectedHullMaterials.length > 0) {
        newFilters.hullMaterial = selectedHullMaterials;
      }

      // Numeric filters
      if (lengthMin) newFilters.lengthOverall_min = parseFloat(lengthMin);
      if (lengthMax) newFilters.lengthOverall_max = parseFloat(lengthMax);
      if (beamMin) newFilters.beam_min = parseFloat(beamMin);
      if (beamMax) newFilters.beam_max = parseFloat(beamMax);
      if (draftMin) newFilters.draft_min = parseFloat(draftMin);
      if (draftMax) newFilters.draft_max = parseFloat(draftMax);
      if (displacementMin)
        newFilters.displacement_min = parseFloat(displacementMin);
      if (displacementMax)
        newFilters.displacement_max = parseFloat(displacementMax);
      if (sailAreaMin) newFilters.sailAreaMain_min = parseFloat(sailAreaMin);
      if (sailAreaMax) newFilters.sailAreaMain_max = parseFloat(sailAreaMax);

      q.filters = JSON.stringify(newFilters);
    } else {
      q.filters = JSON.stringify({});
    }

    return q;
  }, [
    page,
    sortBy,
    sortOrder,
    selectedManufacturers,
    manufacturers,
    selectedRigTypes,
    selectedKeelTypes,
    selectedHullMaterials,
    lengthMin,
    lengthMax,
    beamMin,
    beamMax,
    draftMin,
    draftMax,
    displacementMin,
    displacementMax,
    sailAreaMin,
    sailAreaMax,
  ]);

  // Fetch yachts
  const fetchYachts = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const url = new URL("/api/yachts", window.location.origin);
      Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
      // Cache bust: ensure fresh fetch always
      url.searchParams.set("_t", Date.now().toString());
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch yachts");
      const data = await res.json();
      // Flatten API response: merge yacht object with manufacturer
      const rawList = data.yachts || []
      const flatYachts: Yacht[] = rawList.map((item: any) => {
        const base = item.yacht || {};
        return {
          ...base,
          manufacturer: item.manufacturer || '',
        };
      });
      setYachts(flatYachts);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setDistinct(data.distinct || { rigTypes: [], keelTypes: [], hullMaterials: [] });
    } catch (err) {
      console.error("Failed to fetch yachts:", err);
      setYachts([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  // Load yachts when query changes
  useEffect(() => {
    fetchYachts();
  }, [fetchYachts]);

  // Apply core filters (reset page to 1)
  const applyCoreFilters = useCallback((newFilters: Record<string, any>) => {
    setPage(1);
    setFilters(newFilters);
  }, []);

  const handleManufacturerChange = (values: string[]) => {
    setSelectedManufacturers(values);
    const mIds = manufacturers
      .filter((m) => values.includes(m.name))
      .map((m) => m.id);
    applyCoreFilters({
      ...filters,
      manufacturers: mIds,
    });
  };

  const handleRigTypeChange = (values: string[]) => {
    setSelectedRigTypes(values);
    applyCoreFilters({
      ...filters,
      rigType: values,
    });
  };

  const handleKeelTypeChange = (values: string[]) => {
    setSelectedKeelTypes(values);
    applyCoreFilters({
      ...filters,
      keelType: values,
    });
  };

  const handleHullMaterialChange = (values: string[]) => {
    setSelectedHullMaterials(values);
    applyCoreFilters({
      ...filters,
      hullMaterial: values,
    });
  };

  const handleNumericChange = (
    min: string,
    max: string,
    setMin: (v: string) => void,
    setMax: (v: string) => void,
    minKey: string,
    maxKey: string,
  ) => {
    setMin(min);
    setMax(max);
    applyCoreFilters({
      ...filters,
      [minKey]: min ? parseFloat(min) : undefined,
      [maxKey]: max ? parseFloat(max) : undefined,
    });
  };

  const clearFilters = () => {
    setSelectedManufacturers([]);
    setSelectedRigTypes([]);
    setSelectedKeelTypes([]);
    setSelectedHullMaterials([]);
    setLengthMin("");
    setLengthMax("");
    setBeamMin("");
    setBeamMax("");
    setDraftMin("");
    setDraftMax("");
    setDisplacementMin("");
    setDisplacementMax("");
    setSailAreaMin("");
    setSailAreaMax("");
    setPage(1);
    setFilters({});
  };

  // Fetch full yacht details for modal
  const fetchFullYacht = useCallback(async (slug: string): Promise<Yacht> => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/yachts/${slug}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch yacht details');
      return await res.json();
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const openYachtDetails = async (slug: string) => {
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const fullYacht = await fetchFullYacht(slug);
      setSelectedYacht(fullYacht);
    } catch (err) {
      console.error(err);
      setSelectedYacht(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedYacht(null);
  };

  // Use distinct values from API (full dataset)
  const rigTypeOptions = distinct.rigTypes;
  const keelTypeOptions = distinct.keelTypes;
  const hullMaterialOptions = distinct.hullMaterials;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="w-full md:w-72 shrink-0">
            <div className="sticky top-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </div>

              {/* Manufacturer */}
              <div>
                <Label className="mb-2 block">Manufacturer</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                  {Array.isArray(manufacturers) && manufacturers.map((m) => (
                    <label key={m.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedManufacturers.includes(m.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleManufacturerChange([
                              ...selectedManufacturers,
                              m.name,
                            ]);
                          } else {
                            handleManufacturerChange(
                              selectedManufacturers.filter((n) => n !== m.name),
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rig Type */}
              <div>
                <Label className="mb-2 block">Rig Type</Label>
                <div className="space-y-2">
                  {rigTypeOptions.map((rig) => (
                    <label key={rig} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedRigTypes.includes(rig)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleRigTypeChange([...selectedRigTypes, rig]);
                          } else {
                            handleRigTypeChange(
                              selectedRigTypes.filter((r) => r !== rig),
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{rig}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Keel Type */}
              <div>
                <Label className="mb-2 block">Keel Type</Label>
                <div className="space-y-2">
                  {keelTypeOptions.map((keel) => (
                    <label key={keel} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedKeelTypes.includes(keel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleKeelTypeChange([...selectedKeelTypes, keel]);
                          } else {
                            handleKeelTypeChange(
                              selectedKeelTypes.filter((k) => k !== keel),
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{keel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hull Material */}
              <div>
                <Label className="mb-2 block">Hull Material</Label>
                <div className="space-y-2">
                  {hullMaterialOptions.map((mat) => (
                    <label key={mat} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedHullMaterials.includes(mat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleHullMaterialChange([
                              ...selectedHullMaterials,
                              mat,
                            ]);
                          } else {
                            handleHullMaterialChange(
                              selectedHullMaterials.filter((m) => m !== mat),
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{mat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Numeric ranges */}
              <div>
                <Label className="mb-2 block">Length (m)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="min"
                    value={lengthMin}
                    onChange={(e) =>
                      handleNumericChange(
                        e.target.value,
                        lengthMax,
                        setLengthMin,
                        setLengthMax,
                        "lengthOverall_min",
                        "lengthOverall_max",
                      )
                    }
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="max"
                    value={lengthMax}
                    onChange={(e) =>
                      handleNumericChange(
                        lengthMin,
                        e.target.value,
                        setLengthMin,
                        setLengthMax,
                        "lengthOverall_min",
                        "lengthOverall_max",
                      )
                    }
                    className="w-20"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Beam (m)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="min"
                    value={beamMin}
                    onChange={(e) =>
                      handleNumericChange(
                        e.target.value,
                        beamMax,
                        setBeamMin,
                        setBeamMax,
                        "beam_min",
                        "beam_max",
                      )
                    }
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="max"
                    value={beamMax}
                    onChange={(e) =>
                      handleNumericChange(
                        beamMin,
                        e.target.value,
                        setBeamMin,
                        setBeamMax,
                        "beam_min",
                        "beam_max",
                      )
                    }
                    className="w-20"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Draft (m)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="min"
                    value={draftMin}
                    onChange={(e) =>
                      handleNumericChange(
                        e.target.value,
                        draftMax,
                        setDraftMin,
                        setDraftMax,
                        "draft_min",
                        "draft_max",
                      )
                    }
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="max"
                    value={draftMax}
                    onChange={(e) =>
                      handleNumericChange(
                        draftMin,
                        e.target.value,
                        setDraftMin,
                        setDraftMax,
                        "draft_min",
                        "draft_max",
                      )
                    }
                    className="w-20"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Displacement (kg)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="min"
                    value={displacementMin}
                    onChange={(e) =>
                      handleNumericChange(
                        e.target.value,
                        displacementMax,
                        setDisplacementMin,
                        setDisplacementMax,
                        "displacement_min",
                        "displacement_max",
                      )
                    }
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="max"
                    value={displacementMax}
                    onChange={(e) =>
                      handleNumericChange(
                        displacementMin,
                        e.target.value,
                        setDisplacementMin,
                        setDisplacementMax,
                        "displacement_min",
                        "displacement_max",
                      )
                    }
                    className="w-24"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Sail Area Main (m²)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="min"
                    value={sailAreaMin}
                    onChange={(e) =>
                      handleNumericChange(
                        e.target.value,
                        sailAreaMax,
                        setSailAreaMin,
                        setSailAreaMax,
                        "sailAreaMain_min",
                        "sailAreaMain_max",
                      )
                    }
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="max"
                    value={sailAreaMax}
                    onChange={(e) =>
                      handleNumericChange(
                        sailAreaMin,
                        e.target.value,
                        setSailAreaMin,
                        setSailAreaMax,
                        "sailAreaMain_min",
                        "sailAreaMain_max",
                      )
                    }
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">Sailing Yachts</h1>
                <p className="text-sm text-muted-foreground">
                  Showing {yachts.length} of {total} yachts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort" className="text-sm">
                  Sort by:
                </Label>
                <Select
                  value={sortBy}
                  onValueChange={(v) => {
                    setSortBy(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="sort" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lengthOverall">Length</SelectItem>
                    <SelectItem value="displacement">Displacement</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="sailAreaMain">Sail Area</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortOrder}
                  onValueChange={(v) => {
                    setSortOrder(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Yacht grid */}
            {loading ? (
              <div className="text-center py-12">
                <p>Loading yachts...</p>
              </div>
            ) : yachts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No yachts match your filters. Try adjusting them.
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.isArray(yachts) && yachts.map((yacht) => (
                    <div
                      key={yacht.id}
                      className="border rounded-lg overflow-hidden bg-card flex flex-col"
                    >
                      {/* Image placeholder */}
                      <div className="h-48 bg-muted flex items-center justify-center">
                        <span className="text-4xl">⛵</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="text-sm text-muted-foreground mb-1">
                          {yacht.manufacturer}
                        </div>
                        <h3 className="font-bold text-lg mb-1">
                          {yacht.modelName}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {yacht.year}
                        </p>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm mb-4">
                          {yacht.lengthOverall != null && (
                            <div>
                              <span className="text-muted-foreground">LOA:</span>{" "}
                              {(() => {
                                const n = Number(yacht.lengthOverall);
                                return isNaN(n) ? String(yacht.lengthOverall) : `${n.toFixed(2)}m`;
                              })()}
                            </div>
                          )}
                          {yacht.beam != null && (
                            <div>
                              <span className="text-muted-foreground">Beam:</span>{" "}
                              {(() => {
                                const n = Number(yacht.beam);
                                return isNaN(n) ? String(yacht.beam) : `${n.toFixed(2)}m`;
                              })()}
                            </div>
                          )}
                          {yacht.draft != null && (
                            <div>
                              <span className="text-muted-foreground">Draft:</span>{" "}
                              {(() => {
                                const n = Number(yacht.draft);
                                return isNaN(n) ? String(yacht.draft) : `${n.toFixed(2)}m`;
                              })()}
                            </div>
                          )}
                          {yacht.displacement != null && (
                            <div>
                              <span className="text-muted-foreground">Disp:</span>{" "}
                              {Number(yacht.displacement).toLocaleString()}kg
                            </div>
                          )}
                          {yacht.sailAreaMain != null && (
                            <div>
                              <span className="text-muted-foreground">Sail:</span>{" "}
                              {(() => {
                                const n = Number(yacht.sailAreaMain);
                                return isNaN(n) ? String(yacht.sailAreaMain) : `${n.toFixed(1)}m²`;
                              })()}
                            </div>
                          )}
                          {yacht.rigType && (
                            <div>
                              <span className="text-muted-foreground">Rig:</span>{" "}
                              {yacht.rigType}
                            </div>
                          )}
                          {yacht.keelType && (
                            <div>
                              <span className="text-muted-foreground">Keel:</span>{" "}
                              {yacht.keelType}
                            </div>
                          )}
                          {yacht.cabins && (
                            <div>
                              <span className="text-muted-foreground">Cab:</span>{" "}
                              {yacht.cabins}
                            </div>
                          )}
                          {yacht.maxOccupancy && (
                            <div>
                              <span className="text-muted-foreground">Max:</span>{" "}
                              {yacht.maxOccupancy}
                            </div>
                          )}
                        </div>
                        <div className="mt-auto">
                          <Button
                            className="w-full"
                            onClick={() => openYachtDetails(yacht.slug)}
                          >
                            View Details
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full mt-2"
                          >
                            <Link href={`/compare?ids=${yacht.id}`}>
                              Compare
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      {/* Modal for full yacht details */}
      <YachtDetailModal
        yacht={selectedYacht}
        open={isModalOpen}
        onOpenChange={closeModal}
      />
    </div>
  );
}
