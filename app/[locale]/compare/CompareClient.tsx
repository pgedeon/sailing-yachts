"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslations, useLocale} from "next-intl";
import { PriceTierBadge } from "@/app/components/PriceTierBadge";
import { calculatePriceTier } from "@/lib/price-tier";
import Link from "next/link";
// Lazy-loaded for bundle optimization (P22.4)
// Lazy-loaded for bundle optimization (P22.4)
// Lazy-loaded for bundle optimization (P22.4)
// Lazy-loaded for bundle optimization (P22.4)
import dynamic from "next/dynamic";
const ComparisonRadarChart = dynamic(
  () => import("@/components/comparison-radar-chart").then(m => ({ default: m.ComparisonRadarChart })),
  { ssr: false, loading: () => null },
);
const ComparisonBarCharts = dynamic(
  () => import("@/components/comparison-bar-charts").then(m => ({ default: m.ComparisonBarCharts })),
  { ssr: false, loading: () => null },
);
const CompareMonetization = dynamic(() => import("@/app/components/CompareMonetization").then(m => ({ default: m.CompareMonetization })), {
  ssr: false, loading: () => null,
});
const LeadForm = dynamic(() => import("@/app/components/LeadForm").then(m => ({ default: m.LeadForm })), {
  ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
});
const CompareExport = dynamic(() => import("@/app/components/CompareExport").then(m => ({ default: m.CompareExport })), {
  ssr: false, loading: () => null,
});
const BuyerChecklist = dynamic(() => import("@/app/components/BuyerChecklist").then(m => ({ default: m.BuyerChecklist })), {
  ssr: false, loading: () => null,
});
import { localePath } from "@/lib/i18n-paths";
import {
  getSavedComparisons,
  saveComparison,
  deleteComparison,
  getShareUrl,
  type SavedComparison,
} from "@/lib/savedComparisons";

interface Yacht {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  slug: string | null;
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
  specsByGroup: Record<string, { name: string; value: string; unit: string | null }[]>;
}

interface YachtOption {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  lengthOverall: number | null;
  rigType: string | null;
  cabins: number | null;
}

interface CompareClientProps {
  initialIds: number[];
}

const MAX_COMPARE = 4;

interface FieldDef {
  key: keyof Yacht;
  labelKey: string;
  unit?: string;
  lowerBetter?: boolean;
}

// Spec groups with translation keys instead of hardcoded labels
const SPEC_GROUP_KEYS = ["dimensions", "riggingSails", "construction", "accommodation", "technical"] as const;

const SPEC_GROUPS_CONFIG: { groupKey: typeof SPEC_GROUP_KEYS[number]; fieldKeys: FieldDef[] }[] = [
  {
    groupKey: "dimensions",
    fieldKeys: [
      { key: 'lengthOverall', labelKey: 'lengthOverall', unit: 'm' },
      { key: 'beam', labelKey: 'beam', unit: 'm' },
      { key: 'draft', labelKey: 'draft', unit: 'm', lowerBetter: true },
      { key: 'displacement', labelKey: 'displacement', unit: 'kg', lowerBetter: true },
      { key: 'ballast', labelKey: 'ballast', unit: 'kg' },
    ],
  },
  {
    groupKey: "riggingSails",
    fieldKeys: [
      { key: 'sailAreaMain', labelKey: 'sailAreaMain', unit: 'm²' },
      { key: 'rigType', labelKey: 'rigType' },
    ],
  },
  {
    groupKey: "construction",
    fieldKeys: [
      { key: 'keelType', labelKey: 'keelType' },
      { key: 'hullMaterial', labelKey: 'hullMaterial' },
    ],
  },
  {
    groupKey: "accommodation",
    fieldKeys: [
      { key: 'cabins', labelKey: 'cabins' },
      { key: 'berths', labelKey: 'berths' },
      { key: 'heads', labelKey: 'heads' },
      { key: 'maxOccupancy', labelKey: 'maxOccupancy' },
    ],
  },
  {
    groupKey: "technical",
    fieldKeys: [
      { key: 'engineHp', labelKey: 'engineHp' },
      { key: 'engineType', labelKey: 'engineType' },
      { key: 'fuelCapacity', labelKey: 'fuel', unit: 'L' },
      { key: 'waterCapacity', labelKey: 'water', unit: 'L' },
    ],
  },
];

const YACHT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-400', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-400', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400', ring: 'ring-purple-200', dot: 'bg-purple-500' },
];

export function CompareClient({ initialIds }: CompareClientProps) {
  const locale = useLocale();
  const t = useTranslations("Compare");

  // Build SPEC_GROUPS with translated labels at render time
  const SPEC_GROUPS: { group: string; fields: { key: keyof Yacht; label: string; unit?: string; lowerBetter?: boolean }[] }[] = useMemo(() =>
    SPEC_GROUPS_CONFIG.map(cfg => ({
      group: t(`groups.${cfg.groupKey}`),
      fields: cfg.fieldKeys.map(f => ({
        key: f.key,
        label: t(`fields.${f.labelKey}`),
        unit: f.unit,
        lowerBetter: f.lowerBetter,
      })),
    })),
    [t]
  );

  // Flatten for convenience
  const ALL_COMPARE_FIELDS = useMemo(() => SPEC_GROUPS.flatMap(g => g.fields), [SPEC_GROUPS]);

  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds.slice(0, MAX_COMPARE));
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [allYachts, setAllYachts] = useState<YachtOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Saved comparisons state
  const [savedList, setSavedList] = useState<SavedComparison[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);

  // Load saved comparisons from localStorage on mount
  useEffect(() => {
    setSavedList(getSavedComparisons());
  }, []);

  const refreshSavedList = useCallback(() => {
    setSavedList(getSavedComparisons());
  }, []);

  const handleSave = () => {
    if (!saveName.trim() || selectedIds.length < 2) return;
    const result = saveComparison(saveName, selectedIds);
    if (result) {
      setSaveName('');
      setShowSaveInput(false);
      refreshSavedList();
    }
  };

  const handleDelete = (id: string) => {
    deleteComparison(id);
    refreshSavedList();
  };

  const handleLoadComparison = (ids: number[]) => {
    setSelectedIds(ids.slice(0, MAX_COMPARE));
    lastFetchKey.current = '';
    updateUrl(ids.slice(0, MAX_COMPARE));
    setSavedPanelOpen(false);
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      // Already have a share URL, just copy it
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      return;
    }

    setSharing(true);
    try {
      const res = await fetch('/api/compare/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yachtIds: selectedIds }),
      });
      if (!res.ok) throw new Error('Failed to create share link');
      const data = await res.json();
      const url = new URL(window.location.origin + data.url);
      const fullUrl = url.toString();
      setShareUrl(fullUrl);
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const input = document.createElement('input');
        input.value = fullUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to share:', err);
    } finally {
      setSharing(false);
    }
  };

  // Fetch all yachts for the picker
  useEffect(() => {
    fetch('/api/yachts?limit=200')
      .then(r => r.json())
      .then(data => {
        const opts: YachtOption[] = (data.yachts || []).map((y: any) => ({
          id: y.id,
          manufacturer: y.manufacturer || '',
          modelName: y.modelName || '',
          year: y.year ?? null,
          lengthOverall: y.lengthOverall ?? null,
          rigType: y.rigType ?? null,
          cabins: y.cabins ?? null,
        }));
        setAllYachts(opts);
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, []);

  // Fetch compared yachts when selection changes
  const lastFetchKey = useRef('');
  useEffect(() => {
    const key = [...selectedIds].sort().join(',');
    if (!key || key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    if (selectedIds.length === 0) {
      setYachts([]);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/compare?ids=${selectedIds.join(',')}`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch')))
      .then(data => { setYachts(data.yachts || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [selectedIds]);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close picker on Escape key (P13.3 keyboard navigation)
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPickerOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [pickerOpen]);

  const toggleYacht = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        updateUrl(next);
        return next;
      }
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, id];
      updateUrl(next);
      return next;
    });
    lastFetchKey.current = '';
    setShareUrl(null);
  };

  const removeYacht = (id: number) => {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id);
      updateUrl(next);
      return next;
    });
    lastFetchKey.current = '';
  };

  const updateUrl = (ids: number[]) => {
    const url = new URL(window.location.href);
    if (ids.length) url.searchParams.set('ids', ids.join(','));
    else url.searchParams.delete('ids');
    window.history.replaceState({}, '', url.toString());
  };

  // Group yachts by manufacturer for the dropdown
  const filteredYachts = useMemo(() => {
    if (!search.trim()) return allYachts;
    const q = search.toLowerCase();
    return allYachts.filter(y =>
      y.manufacturer.toLowerCase().includes(q) ||
      y.modelName.toLowerCase().includes(q) ||
      `${y.manufacturer} ${y.modelName}`.toLowerCase().includes(q)
    );
  }, [allYachts, search]);

  const groupedYachts = useMemo(() => {
    const groups: Record<string, YachtOption[]> = {};
    for (const y of filteredYachts) {
      const key = y.manufacturer || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(y);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredYachts]);

  const getSlotIndex = (id: number) => selectedIds.indexOf(id);

  const formatValue = (value: number | string | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return '—';
    const suffix = unit ? ` ${unit}` : '';
    if (typeof value === 'number') {
      return `${Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    }
    return String(value);
  };

  const highlightBest = (field: keyof Yacht, value: any, fieldDef: { lowerBetter?: boolean }) => {
    if (yachts.length < 2 || value === null || value === undefined || typeof value !== 'number') return '';
    const numVals = yachts.map(y => y[field] as number | null).filter((v): v is number => v !== null && v !== undefined);
    if (numVals.length < 2) return '';
    const best = fieldDef.lowerBetter ? Math.min(...numVals) : Math.max(...numVals);
    return value === best ? 'font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded' : '';
  };

  // Collect extra spec rows from specsByGroup, deduped across all yachts
  const extraSpecRows = useMemo(() => {
    const allSpecs: Record<string, Record<string, { name: string; value: string; unit: string | null }>> = {};
    const keys = new Set<string>();
    for (const y of yachts) {
      for (const [group, entries] of Object.entries(y.specsByGroup || {})) {
        for (const e of entries) {
          keys.add(`${group}|${e.name}`);
          if (!allSpecs[group]) allSpecs[group] = {};
        }
      }
    }
    const rows: { group: string; name: string; unit: string | null; values: (string | null)[] }[] = [];
    const sortedKeys = [...keys].sort();
    for (const k of sortedKeys) {
      const [group, name] = k.split('|');
      let unit: string | null = null;
      const values = yachts.map(y => {
        const entries = y.specsByGroup?.[group] || [];
        const entry = entries.find(e => e.name === name);
        if (entry) {
          unit = entry.unit;
          return entry.value;
        }
        return null;
      });
      rows.push({ group, name, unit, values });
    }
    const grouped: Record<string, typeof rows> = {};
    for (const r of rows) {
      if (!grouped[r.group]) grouped[r.group] = [];
      grouped[r.group].push(r);
    }
    return grouped;
  }, [yachts]);

  const builtInFieldKeys = useMemo(() => new Set(ALL_COMPARE_FIELDS.map(f => f.label.toLowerCase())), [ALL_COMPARE_FIELDS]);
  const displayGroups = useMemo(() => {
    const result: { group: string; type: 'builtin' | 'extra' }[] = SPEC_GROUPS.map(g => ({ group: g.group, type: 'builtin' as const }));
    for (const group of Object.keys(extraSpecRows)) {
      const hasUndupedSpecs = extraSpecRows[group]?.some(r => !builtInFieldKeys.has(r.name.toLowerCase()));
      if (hasUndupedSpecs) {
        if (!result.find(r => r.group === group)) {
          result.push({ group, type: 'extra' as const });
        }
      }
    }
    return result;
  }, [extraSpecRows, builtInFieldKeys, SPEC_GROUPS]);

  const colCount = Math.max(yachts.length, 1);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
        {/* Print-only header */}
        <div className="hidden printing-compare:block compare-print-header">
          <h1>{t("printHeader")}</h1>
          <p>{t("printDate", { date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) })}</p>
        </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("heading")}</h1>
          <p className="mt-1 text-gray-500">{t("subtitle", { max: MAX_COMPARE })}</p>
        </div>
        {/* Share + Save actions */}
        {selectedIds.length >= 2 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyLink}
              disabled={sharing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Copy share link"
            >
              {sharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span>{t("sharedComparison.creating")}</span>
                </>
              ) : copied ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">{t("copied")}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{t("share")}</span>
                </>
              )}
            </button>
            <button
              onClick={() => { setShowSaveInput(!showSaveInput); setSaveName(''); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{t("save")}</span>
            </button>
            <button
              onClick={() => setSavedPanelOpen(!savedPanelOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors relative"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{t("saved")}</span>
              {savedList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {savedList.length}
                </span>
              )}
            </button>
            <CompareExport yachtIds={selectedIds} yachtNames={yachts.map(y => `${y.manufacturer} ${y.modelName}`)} />
          </div>
        )}
      </div>

      {/* Save comparison input */}
      {showSaveInput && selectedIds.length >= 2 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t("nameComparison")}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Family cruisers under 40ft"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              maxLength={80}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("saveButton")}
            </button>
            <button
              onClick={() => { setShowSaveInput(false); setSaveName(''); }}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Saved comparisons panel */}
      {savedPanelOpen && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">{t("savedComparisons.heading")}</h3>
            <button
              onClick={() => setSavedPanelOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {savedList.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              {t("savedComparisons.noSaved")}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {savedList.map(sc => (
                <li key={sc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <button
                    onClick={() => handleLoadComparison(sc.yachtIds)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="text-sm font-medium text-gray-800 truncate">{sc.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {t("savedComparisons.yachtCount", { count: sc.yachtIds.length, date: new Date(sc.createdAt).toLocaleDateString() })}
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/compare/share', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ yachtIds: sc.yachtIds }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          const url = window.location.origin + data.url;
                          await navigator.clipboard.writeText(url);
                        }
                      } catch {}
                    }}
                    className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                    title="Copy share link"
                    aria-label="Copy share link"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(sc.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Delete"
                    aria-label="Delete saved comparison"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Selection Area */}
      <div className="mb-8">
        {/* Selected Yacht Slots */}
        <div className={`grid gap-3 mb-4 ${colCount <= 2 ? 'grid-cols-1 md:grid-cols-2' : colCount === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {Array.from({ length: MAX_COMPARE }).map((_, i) => {
            const id = selectedIds[i];
            const yacht = id ? allYachts.find(y => y.id === id) : null;
            const color = YACHT_COLORS[i];
            return (
              <div
                key={i}
                className={`relative rounded-xl border-2 border-dashed p-4 transition-all ${
                  yacht ? `${color.border} ${color.bg} border-solid` : 'border-gray-300 bg-white'
                }`}
              >
                {yacht ? (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${color.dot} flex-shrink-0 mt-1`} />
                      <div>
                        <div className={`font-semibold ${color.text}`}>{yacht.manufacturer}</div>
                        <div className="text-gray-800 font-medium">{yacht.modelName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {yacht.year ?? '—'} · {yacht.lengthOverall ? `${yacht.lengthOverall}m` : '—'} LOA
                          {yacht.cabins ? ` · ${yacht.cabins} cabins` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeYacht(id)}
                      className="text-gray-500 hover:text-red-600 transition-colors p-1"
                      title="Remove"
                      aria-label="Remove yacht from comparison"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="w-full text-center py-3 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-sm">{t("slot.addYacht")}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Button */}
        {selectedIds.length < MAX_COMPARE && (
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {selectedIds.length === 0 ? t("slot.chooseYachts") : t("slot.addAnother")}
          </button>
        )}
      </div>

      {/* Yacht Picker Dropdown */}
      {pickerOpen && (
        <div ref={pickerRef} className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder={t("picker.searchPlaceholder")}
                aria-label="Search yachts to add to comparison"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable List */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {loadingOptions ? (
              <div className="p-6 text-center text-gray-500 text-sm">{t("picker.loading")}</div>
            ) : groupedYachts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">{t("picker.noMatch")}</div>
            ) : (
              groupedYachts.map(([manufacturer, yachtsList]) => (
                <div key={manufacturer}>
                  <div className="sticky top-0 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    {manufacturer}
                  </div>
                  {yachtsList.map(y => {
                    const isSelected = selectedIds.includes(y.id);
                    const slotIdx = getSlotIndex(y.id);
                    const color = slotIdx >= 0 ? YACHT_COLORS[slotIdx] : null;
                    return (
                      <button
                        key={y.id}
                        onClick={() => toggleYacht(y.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors border-b border-gray-50 last:border-0 ${
                          isSelected
                            ? `${color?.bg || 'bg-blue-50'} ${color?.text || 'text-blue-800'}`
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${
                          isSelected
                            ? `${color?.dot || 'bg-blue-500'}`
                            : 'border border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{y.modelName}</span>
                          <span className="text-gray-500 ml-2">
                            {y.year ?? '—'} · {y.lengthOverall ? `${y.lengthOverall}m` : '—'}
                          </span>
                        </div>
                        {isSelected && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${color?.bg} ${color?.text} font-medium`}>
                            {t("slot.slotN", { n: slotIdx + 1 })}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500" aria-live="polite">{t("picker.selected", { count: selectedIds.length, max: MAX_COMPARE })}</span>
            <button
              onClick={() => setPickerOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {t("picker.done")}
            </button>
          </div>
        </div>
      )}

      {/* Prompt when nothing selected */}
      {selectedIds.length === 0 && !pickerOpen && (
        <div className="text-center py-16 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <p className="text-lg font-medium text-gray-500">{t("prompt.selectYachts")}</p>
          <p className="text-sm mt-1">{t("prompt.chooseSubtitle", { max: MAX_COMPARE })}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-3 text-gray-500 text-sm">{t("loading")}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 text-center text-red-700 bg-red-50 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* Comparison Table */}
      {yachts.length >= 2 && !loading && (
        <div className="border rounded-xl overflow-hidden shadow-sm relative">
          {/* Mobile scroll hint */}
          <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-200/80 to-transparent z-20 pointer-events-none" id="compare-scroll-hint" />
          <div className="overflow-x-auto" id="compare-table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40 sticky left-0 bg-gray-50 z-10">{t("table.spec")}</th>
                  {yachts.map((yacht, i) => (
                    <th key={yacht.id} className="px-5 py-3 text-left min-w-[160px]">
                      <Link href={localePath(locale, `/yachts/${yacht.slug}`)} className="hover:underline">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${YACHT_COLORS[i]?.dot}`} />
                          <span className="font-semibold text-gray-800">{yacht.manufacturer} {yacht.modelName}</span>
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Price Tier Row */}
                <tr className="bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap sticky left-0 bg-gray-50/50 z-10">
                    {t("table.estPriceRange")}
                  </td>
                  {yachts.map((yacht, i) => {
                    const priceInfo = calculatePriceTier({
                      lengthOverall: yacht.lengthOverall,
                      displacement: yacht.displacement,
                      beam: yacht.beam,
                      cabins: yacht.cabins,
                      hullMaterial: yacht.hullMaterial,
                      keelType: yacht.keelType,
                      rigType: yacht.rigType,
                    });
                    return (
                      <td key={yacht.id} className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <PriceTierBadge info={priceInfo} size="sm" />
                          {priceInfo.tier !== "unknown" && (
                            <span className="text-xs text-gray-500">{priceInfo.range}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {displayGroups.map(dg => {
                  const groupRows: React.ReactNode[] = [];

                  if (dg.type === 'builtin') {
                    const builtinGroup = SPEC_GROUPS.find(g => g.group === dg.group)!;
                    for (const field of builtinGroup.fields) {
                      groupRows.push(
                        <tr key={field.key} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                            {field.label}
                            {field.unit && <span className="text-gray-500 ml-1 text-xs">({field.unit})</span>}
                          </td>
                          {yachts.map((yacht) => {
                            const value = yacht[field.key] as any;
                            const display = formatValue(value, field.unit);
                            const hl = highlightBest(field.key, value, field);
                            return (
                              <td key={yacht.id} className={`px-5 py-3 whitespace-nowrap ${hl || 'text-gray-700'}`}>
                                {display}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }
                  } else {
                    const extraGroup = extraSpecRows[dg.group] || [];
                    for (const row of extraGroup) {
                      if (builtInFieldKeys.has(row.name.toLowerCase())) continue;
                      groupRows.push(
                        <tr key={`extra-${dg.group}-${row.name}`} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                            {row.name}
                            {row.unit && <span className="text-gray-500 ml-1 text-xs">({row.unit})</span>}
                          </td>
                          {yachts.map((yacht, yi) => (
                            <td key={yacht.id} className="px-5 py-3 whitespace-nowrap text-gray-700">
                              {row.values[yi] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                  }

                  return (
                    <React.Fragment key={dg.group}>
                      <tr className="bg-slate-50">
                        <td colSpan={yachts.length + 1} className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {dg.group}
                        </td>
                      </tr>
                      {groupRows}
                    </React.Fragment>
                  );
                })}

                {yachts.some(y => y.designNotes) && (
                  <>
                    <tr className="bg-slate-50">
                      <td colSpan={yachts.length + 1} className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {t("groups.notes")}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                        {t("table.designNotes")}
                      </td>
                      {yachts.map(yacht => (
                        <td key={yacht.id} className="px-5 py-3 text-gray-700 text-sm max-w-xs">
                          {yacht.designNotes || '—'}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
            <span><span className="font-semibold text-green-600">Green</span> = best value in row</span>
            <span className="md:hidden text-gray-500">← Swipe to see more →</span>
          </div>
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              var scroll = document.getElementById('compare-table-scroll');
              var hint = document.getElementById('compare-scroll-hint');
              if (!scroll || !hint) return;
              scroll.addEventListener('scroll', function() {
                if (scroll.scrollLeft > 30) hint.style.opacity = '0';
                else hint.style.opacity = '1';
              });
            })();
          `}} />
        </div>
      )}

      {/* Spec Comparison Radar Chart */}
      {yachts.length >= 2 && !loading && (
        <div className="mt-8">
          <ComparisonRadarChart yachts={yachts} />
        </div>
      )}

      {/* Spec Comparison Bar Charts */}
      {yachts.length >= 2 && !loading && (
        <div className="mt-8">
          <ComparisonBarCharts yachts={yachts} />
        </div>
      )}

      {/* Buyer Checklist */}
      {yachts.length >= 2 && !loading && (
        <div className="mt-8">
          <BuyerChecklist yachtIds={selectedIds} yachtNames={yachts.map(y => `${y.manufacturer} ${y.modelName}`)} />
        </div>
      )}

      {/* Monetization CTAs */}
      {yachts.length >= 2 && !loading && (
        <CompareMonetization yachts={yachts.map(y => ({
          id: y.id,
          manufacturer: y.manufacturer,
          modelName: y.modelName,
          lengthOverall: y.lengthOverall,
          displacement: y.displacement,
          beam: y.beam,
          cabins: y.cabins,
          hullMaterial: y.hullMaterial,
          keelType: y.keelType,
          rigType: y.rigType,
        }))} />
      )}

      <div className="mt-8">

      {/* Find Similar Lead Form */}
      {yachts.length >= 2 && !loading && (
        <div className="mt-6 no-print">
          <LeadForm
            yachtIds={yachts.map(y => y.id)}
            leadType="find_similar"
            yachtName={yachts.map(y => `${y.manufacturer} ${y.modelName}`).join(", ")}
          />
        </div>
      )}
        <Link href={localePath(locale, "/yachts")} className="text-blue-600 hover:underline text-sm">{t("backToBrowse")}</Link>
      </div>
    </div>
  );
}
