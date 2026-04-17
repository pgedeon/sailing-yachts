"use client";
import React from "react";

import { useEffect } from "react";

interface YachtDTO {
  id: number;
  manufacturer: string;
  modelName: string;
  slug: string | null;
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
  specsByGroup: Record<string, { name: string; value: string; unit: string | null }[]>;
  priceTier: {
    tier: string;
    label: string;
    range: string;
    color: string;
    bgColor: string;
  };
}

interface FieldDef {
  key: keyof YachtDTO;
  label: string;
  unit?: string;
}

interface SpecFieldGroup {
  group: string;
  fields: FieldDef[];
}

const COLORS = [
  { bg: "#EFF6FF", border: "#93C5FD", text: "#1E40AF", dot: "#3B82F6" },
  { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", dot: "#10B981" },
  { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B" },
  { bg: "#FAF5FF", border: "#C4B5FD", text: "#6B21A8", dot: "#8B5CF6" },
];

export default function EmbedCompareClient({
  yachts,
  specFields,
  siteUrl,
}: {
  yachts: YachtDTO[];
  specFields: SpecFieldGroup[];
  siteUrl: string;
}) {
  // Post height to parent for auto-resize
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      if (window.parent !== window) {
        window.parent.postMessage({ type: "sailing-yachts-embed", height }, "*");
      }
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const formatVal = (value: number | string | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return "—";
    const suffix = unit ? ` ${unit}` : "";
    if (typeof value === "number") {
      return `${Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    }
    return String(value) + suffix;
  };

  // Collect extra spec rows
  const allExtraKeys = new Set<string>();
  const extraData: Record<string, { name: string; unit: string | null; values: (string | null)[] }> = {};
  const builtinLabels = new Set(specFields.flatMap((g) => g.fields.map((f) => f.label.toLowerCase())));

  for (const y of yachts) {
    for (const [group, entries] of Object.entries(y.specsByGroup || {})) {
      for (const e of entries) {
        const key = `${group}|${e.name}`;
        if (!allExtraKeys.has(key)) {
          allExtraKeys.add(key);
          extraData[key] = { name: e.name, unit: e.unit, values: [] };
        }
      }
    }
  }
  // Fill values
  for (const key of [...allExtraKeys].sort()) {
    const [group, name] = key.split("|");
    const values = yachts.map((y) => {
      const entries = y.specsByGroup?.[group] || [];
      const entry = entries.find((e) => e.name === name);
      return entry?.value ?? null;
    });
    extraData[key].values = values;
  }

  // Group extra specs
  const extraByGroup: Record<string, { name: string; unit: string | null; values: (string | null)[] }[]> = {};
  for (const key of [...allExtraKeys].sort()) {
    const [group] = key.split("|");
    const data = extraData[key];
    if (builtinLabels.has(data.name.toLowerCase())) continue;
    if (!extraByGroup[group]) extraByGroup[group] = [];
    extraByGroup[group].push(data);
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', maxWidth: 900, margin: "0 auto", padding: "16px", color: "#1f2937", fontSize: 14 }}>
      {/* Branding Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>
            ⛵
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", lineHeight: 1.2 }}>Yacht Comparison</div>
            <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.2 }}>
              {yachts.length} yachts · {yachts[0]?.year ?? "—"}
            </div>
          </div>
        </div>
        <a
          href={`${siteUrl}/compare?ids=${yachts.map((y) => y.id).join(",")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: "#3B82F6", textDecoration: "none", fontWeight: 500 }}
        >
          Full comparison →
        </a>
      </div>

      {/* Yacht Name Headers */}
      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${yachts.length}, 1fr)`, gap: 8, marginBottom: 12 }}>
        <div />
        {yachts.map((y, i) => {
          const c = COLORS[i];
          return (
            <div key={y.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
              <a
                href={`${siteUrl}/yachts/${y.slug || y.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: c.text }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{y.manufacturer}</div>
                <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85, lineHeight: 1.3 }}>{y.modelName}</div>
              </a>
              {y.year && (
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{y.year}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Price Tier Row */}
      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${yachts.length}, 1fr)`, gap: 8, marginBottom: 4, background: "#f9fafb", borderRadius: 6, padding: "6px 0" }}>
        <div style={{ paddingLeft: 10, display: "flex", alignItems: "center", fontWeight: 600, fontSize: 12, color: "#6b7280" }}>Est. Price</div>
        {yachts.map((y) => (
          <div key={y.id} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600,
                background: y.priceTier.bgColor.replace("bg-", "").includes("green") ? "#dcfce7" : y.priceTier.tier === "mid-range" ? "#dbeafe" : y.priceTier.tier === "premium" ? "#f3e8ff" : y.priceTier.tier === "luxury" ? "#fef3c7" : "#f3f4f6",
                color: y.priceTier.tier === "budget" ? "#15803d" : y.priceTier.tier === "mid-range" ? "#1d4ed8" : y.priceTier.tier === "premium" ? "#7c3aed" : y.priceTier.tier === "luxury" ? "#b45309" : "#6b7280",
              }}
            >
              {y.priceTier.label}
            </span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>{y.priceTier.range}</span>
          </div>
        ))}
      </div>

      {/* Spec Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {specFields.map((sg) => (
            <SpecGroupRow
              key={sg.group}
              group={sg.group}
              fields={sg.fields}
              yachts={yachts}
              formatVal={formatVal}
            />
          ))}
          {/* Extra specs from database */}
          {Object.entries(extraByGroup).map(([group, rows]) => (
            <React.Fragment key={`extra-${group}`}>
              <GroupHeaderRow label={group} colSpan={yachts.length + 1} />
              {rows.map((row) => (
                <tr key={`extra-${group}-${row.name}`}>
                  <LabelCell>{row.name}{row.unit ? ` (${row.unit})` : ""}</LabelCell>
                  {row.values.map((v, vi) => (
                    <ValueCell key={vi}>{v ?? "—"}</ValueCell>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 16, paddingTop: 10, borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          Data from manufacturer specifications
        </span>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "#6b7280", textDecoration: "none" }}
        >
          Powered by Sailing Yacht Info
        </a>
      </div>
    </div>
  );
}

function SpecGroupRow({
  group,
  fields,
  yachts,
  formatVal,
}: {
  group: string;
  fields: FieldDef[];
  yachts: YachtDTO[];
  formatVal: (v: any, u?: string) => string;
}) {
  return (
    <>
      <GroupHeaderRow label={group} colSpan={yachts.length + 1} />
      {fields.map((f) => (
        <tr key={f.key}>
          <LabelCell>{f.label}</LabelCell>
          {yachts.map((y) => (
            <ValueCell key={y.id}>{formatVal(y[f.key], f.unit)}</ValueCell>
          ))}
        </tr>
      ))}
    </>
  );
}

function GroupHeaderRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          fontWeight: 700,
          fontSize: 11,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: "#64748b",
          padding: "10px 10px 4px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {label}
      </td>
    </tr>
  );
}

function LabelCell({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        fontWeight: 500,
        color: "#4b5563",
        padding: "5px 10px",
        whiteSpace: "nowrap",
        borderBottom: "1px solid #f3f4f6",
        fontSize: 12,
      }}
    >
      {children}
    </td>
  );
}

function ValueCell({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        textAlign: "center",
        padding: "5px 8px",
        borderBottom: "1px solid #f3f4f6",
        fontSize: 12,
        color: "#1f2937",
      }}
    >
      {children}
    </td>
  );
}
