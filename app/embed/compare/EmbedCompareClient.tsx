"use client";
import React from "react";
import { useEffect } from "react";

type LayoutMode = "full" | "compact";
type ThemeMode = "light" | "dark" | "auto";

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

const COLORS_LIGHT = [
  { bg: "#EFF6FF", border: "#93C5FD", text: "#1E40AF", dot: "#3B82F6" },
  { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", dot: "#10B981" },
  { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B" },
  { bg: "#FAF5FF", border: "#C4B5FD", text: "#6B21A8", dot: "#8B5CF6" },
];

const COLORS_DARK = [
  { bg: "#1E3A5F", border: "#2563EB", text: "#93C5FD", dot: "#60A5FA" },
  { bg: "#064E3B", border: "#059669", text: "#6EE7B7", dot: "#34D399" },
  { bg: "#78350F", border: "#D97706", text: "#FCD34D", dot: "#FBBF24" },
  { bg: "#4C1D95", border: "#7C3AED", text: "#C4B5FD", dot: "#A78BFA" },
];

function getColors(theme: ThemeMode, index: number) {
  // Determine if we should use dark colors
  // For 'auto', we use a media query check (client-side only)
  const useDark =
    theme === "dark" ||
    (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const palette = useDark ? COLORS_DARK : COLORS_LIGHT;
  return palette[index % palette.length];
}

export default function EmbedCompareClient({
  yachts,
  specFields,
  siteUrl,
  layout,
  theme,
}: {
  yachts: YachtDTO[];
  specFields: SpecFieldGroup[];
  siteUrl: string;
  layout: LayoutMode;
  theme: ThemeMode;
}) {
  const isDark =
    theme === "dark" ||
    (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const textColor = isDark ? "#e5e7eb" : "#1f2937";
  const bgColor = isDark ? "#111827" : "#ffffff";
  const mutedText = isDark ? "#9ca3af" : "#6b7280";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const rowBg = isDark ? "#1f2937" : "#f9fafb";
  const labelColor = isDark ? "#d1d5db" : "#4b5563";

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

  // Compact layout: simpler, smaller, single-row style
  if (layout === "compact") {
    return (
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          maxWidth: 640,
          margin: "0 auto",
          padding: "12px",
          color: textColor,
          fontSize: 12,
          background: bgColor,
          borderRadius: 8,
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Compact Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>⛵</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>Yacht Comparison</span>
          </div>
          <a
            href={`${siteUrl}/compare?ids=${yachts.map((y) => y.id).join(",")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: isDark ? "#60A5FA" : "#3B82F6", textDecoration: "none", fontWeight: 500 }}
          >
            Full details →
          </a>
        </div>

        {/* Yacht columns with key specs */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${yachts.length}, 1fr)`, gap: 8 }}>
          {yachts.map((y, i) => {
            const c = getColors(theme, i);
            return (
              <div key={y.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: "8px" }}>
                <a
                  href={`${siteUrl}/yachts/${y.slug || y.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: c.text }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {y.manufacturer}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {y.modelName}
                  </div>
                </a>
                {y.year && <div style={{ fontSize: 10, color: mutedText, marginTop: 1 }}>{y.year}</div>}
                <div style={{ marginTop: 6, fontSize: 11, color: textColor, lineHeight: 1.6 }}>
                  {y.lengthOverall != null && <div><span style={{ color: mutedText }}>LOA:</span> {formatVal(y.lengthOverall, "m")}</div>}
                  {y.beam != null && <div><span style={{ color: mutedText }}>Beam:</span> {formatVal(y.beam, "m")}</div>}
                  {y.draft != null && <div><span style={{ color: mutedText }}>Draft:</span> {formatVal(y.draft, "m")}</div>}
                  {y.displacement != null && <div><span style={{ color: mutedText }}>Weight:</span> {formatVal(y.displacement, "kg")}</div>}
                  {y.cabins != null && <div><span style={{ color: mutedText }}>Cabins:</span> {y.cabins}</div>}
                  {y.berths != null && <div><span style={{ color: mutedText }}>Berths:</span> {y.berths}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact Footer */}
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, color: mutedText, textDecoration: "none" }}
          >
            Powered by Sailing Yacht Info
          </a>
        </div>
      </div>
    );
  }

  // Full layout (existing behavior, enhanced with theme)
  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        maxWidth: 900,
        margin: "0 auto",
        padding: "16px",
        color: textColor,
        fontSize: 14,
        background: bgColor,
      }}
    >
      {/* Branding Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${borderColor}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ⛵
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: textColor, lineHeight: 1.2 }}>Yacht Comparison</div>
            <div style={{ fontSize: 11, color: mutedText, lineHeight: 1.2 }}>
              {yachts.length} yachts · {yachts[0]?.year ?? "—"}
            </div>
          </div>
        </div>
        <a
          href={`${siteUrl}/compare?ids=${yachts.map((y) => y.id).join(",")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: isDark ? "#60A5FA" : "#3B82F6", textDecoration: "none", fontWeight: 500 }}
        >
          Full comparison →
        </a>
      </div>

      {/* Yacht Name Headers */}
      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${yachts.length}, 1fr)`, gap: 8, marginBottom: 12 }}>
        <div />
        {yachts.map((y, i) => {
          const c = getColors(theme, i);
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
              {y.year && <div style={{ fontSize: 10, color: mutedText, marginTop: 2 }}>{y.year}</div>}
            </div>
          );
        })}
      </div>

      {/* Price Tier Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `120px repeat(${yachts.length}, 1fr)`,
          gap: 8,
          marginBottom: 4,
          background: rowBg,
          borderRadius: 6,
          padding: "6px 0",
        }}
      >
        <div style={{ paddingLeft: 10, display: "flex", alignItems: "center", fontWeight: 600, fontSize: 12, color: mutedText }}>
          Est. Price
        </div>
        {yachts.map((y) => (
          <div key={y.id} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600,
                background: isDark
                  ? y.priceTier.tier === "budget" ? "#064E3B" : y.priceTier.tier === "mid-range" ? "#1E3A5F" : y.priceTier.tier === "premium" ? "#4C1D95" : y.priceTier.tier === "luxury" ? "#78350F" : "#374151"
                  : y.priceTier.tier === "budget" ? "#dcfce7" : y.priceTier.tier === "mid-range" ? "#dbeafe" : y.priceTier.tier === "premium" ? "#f3e8ff" : y.priceTier.tier === "luxury" ? "#fef3c7" : "#f3f4f6",
                color: isDark
                  ? y.priceTier.tier === "budget" ? "#6EE7B7" : y.priceTier.tier === "mid-range" ? "#93C5FD" : y.priceTier.tier === "premium" ? "#C4B5FD" : y.priceTier.tier === "luxury" ? "#FCD34D" : "#9ca3af"
                  : y.priceTier.tier === "budget" ? "#15803d" : y.priceTier.tier === "mid-range" ? "#1d4ed8" : y.priceTier.tier === "premium" ? "#7c3aed" : y.priceTier.tier === "luxury" ? "#b45309" : "#6b7280",
              }}
            >
              {y.priceTier.label}
            </span>
            <span style={{ fontSize: 10, color: mutedText }}>{y.priceTier.range}</span>
          </div>
        ))}
      </div>

      {/* Spec Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {specFields.map((sg) => (
            <SpecGroupRow key={sg.group} group={sg.group} fields={sg.fields} yachts={yachts} formatVal={formatVal} labelColor={labelColor} borderColor={borderColor} textColor={textColor} />
          ))}
          {/* Extra specs from database */}
          {Object.entries(extraByGroup).map(([group, rows]) => (
            <React.Fragment key={`extra-${group}`}>
              <GroupHeaderRow label={group} colSpan={yachts.length + 1} color={mutedText} borderColor={borderColor} />
              {rows.map((row) => (
                <tr key={`extra-${group}-${row.name}`}>
                  <LabelCell color={labelColor} borderColor={borderColor}>{row.name}{row.unit ? ` (${row.unit})` : ""}</LabelCell>
                  {row.values.map((v, vi) => (
                    <ValueCell key={vi} color={textColor} borderColor={borderColor}>{v ?? "—"}</ValueCell>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 16, paddingTop: 10, borderTop: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: mutedText }}>Data from manufacturer specifications</span>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: mutedText, textDecoration: "none" }}
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
  labelColor,
  borderColor,
  textColor,
}: {
  group: string;
  fields: FieldDef[];
  yachts: YachtDTO[];
  formatVal: (v: any, u?: string) => string;
  labelColor: string;
  borderColor: string;
  textColor: string;
}) {
  return (
    <>
      <GroupHeaderRow label={group} colSpan={yachts.length + 1} color={labelColor} borderColor={borderColor} />
      {fields.map((f) => (
        <tr key={f.key}>
          <LabelCell color={labelColor} borderColor={borderColor}>{f.label}</LabelCell>
          {yachts.map((y) => (
            <ValueCell key={y.id} color={textColor} borderColor={borderColor}>{formatVal(y[f.key], f.unit)}</ValueCell>
          ))}
        </tr>
      ))}
    </>
  );
}

function GroupHeaderRow({ label, colSpan, color, borderColor }: { label: string; colSpan: number; color: string; borderColor: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          fontWeight: 700,
          fontSize: 11,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: color,
          padding: "10px 10px 4px",
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        {label}
      </td>
    </tr>
  );
}

function LabelCell({ children, color, borderColor }: { children: React.ReactNode; color: string; borderColor: string }) {
  return (
    <td
      style={{
        fontWeight: 500,
        color: color,
        padding: "5px 10px",
        whiteSpace: "nowrap",
        borderBottom: `1px solid ${borderColor}`,
        fontSize: 12,
      }}
    >
      {children}
    </td>
  );
}

function ValueCell({ children, color, borderColor }: { children: React.ReactNode; color: string; borderColor: string }) {
  return (
    <td
      style={{
        textAlign: "center",
        padding: "5px 8px",
        borderBottom: `1px solid ${borderColor}`,
        fontSize: 12,
        color: color,
      }}
    >
      {children}
    </td>
  );
}
