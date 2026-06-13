/**
 * P26.4: Server-side PDF comparison report generation
 * Uses pdf-lib for serverless-compatible PDF generation
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
  PDFPage,
} from "pdf-lib";

// Brand colors
const COLORS = {
  primary: rgb(0.08, 0.28, 0.45),     // Deep navy blue
  accent: rgb(0.0, 0.56, 0.51),       // Teal
  light: rgb(0.95, 0.97, 0.98),       // Light gray-blue
  medium: rgb(0.6, 0.65, 0.7),        // Medium gray
  dark: rgb(0.15, 0.18, 0.22),        // Dark gray
  white: rgb(1, 1, 1),
  highlight: rgb(0.92, 0.95, 0.98),   // Very light blue for alternating rows
  border: rgb(0.8, 0.83, 0.86),       // Border gray
  bestValue: rgb(0.85, 1, 0.85),      // Light green for best value highlight
};

const PAGE_WIDTH = 595.28; // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const MARGIN = 50;

export interface ReportYacht {
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
  engineHp: number | null;
  engineType: string | null;
}

export interface ReportLeadInfo {
  email: string;
  name?: string;
}

interface SpecRow {
  label: string;
  values: string[];
  bestIndex?: number; // Index of "best" value for highlighting
}

/**
 * Generate a branded PDF comparison report
 */
export async function generateComparisonReport(
  yachts: ReportYacht[],
  lead: ReportLeadInfo,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  pdfDoc.setTitle("Sailing Yacht Comparison Report");
  pdfDoc.setAuthor("Sailing Yacht Info");
  pdfDoc.setSubject(`Comparison: ${yachts.map((y) => `${y.manufacturer} ${y.modelName}`).join(" vs ")}`);
  pdfDoc.setCreator("sailboats.fr");
  pdfDoc.setProducer("sailboats.fr");
  pdfDoc.setCreationDate(new Date());

  // Page 1: Header + Summary
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page1, helveticaBold, helvetica);
  drawTitle(page1, helveticaBold, helvetica, yachts);
  drawSummaryCards(page1, helveticaBold, helvetica, yachts);
  drawLeadInfo(page1, helvetica, helveticaOblique, lead);

  // Page 2+: Spec comparison table
  const specRows = buildSpecRows(yachts);
  drawSpecTable(pdfDoc, helveticaBold, helvetica, yachts, specRows);

  // Last page: Footer with CTA
  const lastPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawCtaPage(lastPage, helveticaBold, helvetica, helveticaOblique, yachts);

  return pdfDoc.save();
}

function drawHeader(page: PDFPage, bold: PDFFont, regular: PDFFont) {
  // Top brand bar
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 80,
    width: PAGE_WIDTH,
    height: 80,
    color: COLORS.primary,
  });

  // Site name
  page.drawText("Sailing Yacht Info", {
    x: MARGIN,
    y: PAGE_HEIGHT - 40,
    size: 22,
    font: bold,
    color: COLORS.white,
  });

  // URL
  page.drawText("info.sailboats.fr", {
    x: MARGIN,
    y: PAGE_HEIGHT - 58,
    size: 10,
    font: regular,
    color: rgb(0.7, 0.8, 0.9),
  });

  // Date
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dateWidth = regular.widthOfTextAtSize(dateStr, 10);
  page.drawText(dateStr, {
    x: PAGE_WIDTH - MARGIN - dateWidth,
    y: PAGE_HEIGHT - 40,
    size: 10,
    font: regular,
    color: rgb(0.7, 0.8, 0.9),
  });
}

function drawTitle(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  yachts: ReportYacht[],
) {
  const y = PAGE_HEIGHT - 120;
  page.drawText("Comparison Report", {
    x: MARGIN,
    y,
    size: 28,
    font: bold,
    color: COLORS.primary,
  });

  const subtitle = `${yachts.length} yachts compared`;
  page.drawText(subtitle, {
    x: MARGIN,
    y: y - 22,
    size: 12,
    font: regular,
    color: COLORS.medium,
  });
}

function drawSummaryCards(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  yachts: ReportYacht[],
) {
  const cardWidth = (PAGE_WIDTH - MARGIN * 2 - 20) / Math.min(yachts.length, 4);
  const cardHeight = 140;
  const yStart = PAGE_HEIGHT - 190;

  yachts.slice(0, 4).forEach((yacht, i) => {
    const x = MARGIN + i * (cardWidth + 20 / yachts.length);

    // Card background
    page.drawRectangle({
      x,
      y: yStart - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: COLORS.light,
      borderColor: COLORS.border,
      borderWidth: 0.5,
    });

    // Top accent bar
    page.drawRectangle({
      x,
      y: yStart - 4,
      width: cardWidth,
      height: 4,
      color: COLORS.accent,
    });

    // Manufacturer
    const manufText = yacht.manufacturer;
    page.drawText(truncate(manufText, cardWidth - 20, bold, 11), {
      x: x + 10,
      y: yStart - 25,
      size: 11,
      font: bold,
      color: COLORS.primary,
    });

    // Model
    page.drawText(truncate(yacht.modelName, cardWidth - 20, bold, 14), {
      x: x + 10,
      y: yStart - 45,
      size: 14,
      font: bold,
      color: COLORS.dark,
    });

    // Year
    if (yacht.year) {
      page.drawText(String(yacht.year), {
        x: x + 10,
        y: yStart - 60,
        size: 10,
        font: regular,
        color: COLORS.medium,
      });
    }

    // Key specs
    const specs = [
      yacht.lengthOverall ? `${yacht.lengthOverall} m` : "—",
      yacht.cabins ? `${yacht.cabins} cabins` : "—",
      yacht.hullMaterial || "—",
    ];

    specs.forEach((spec, si) => {
      page.drawText(spec, {
        x: x + 10,
        y: yStart - 85 - si * 15,
        size: 9,
        font: regular,
        color: COLORS.dark,
      });
    });
  });
}

function drawLeadInfo(
  page: PDFPage,
  regular: PDFFont,
  oblique: PDFFont,
  lead: ReportLeadInfo,
) {
  const y = PAGE_HEIGHT - 370;
  page.drawRectangle({
    x: MARGIN,
    y: y - 30,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 30,
    color: COLORS.highlight,
    borderColor: COLORS.border,
    borderWidth: 0.5,
  });

  const info = `Prepared for: ${lead.name || lead.email}`;
  page.drawText(info, {
    x: MARGIN + 10,
    y: y - 20,
    size: 10,
    font: regular,
    color: COLORS.dark,
  });

  page.drawText("Confidential — for personal use only", {
    x: PAGE_WIDTH - MARGIN - 200,
    y: y - 20,
    size: 8,
    font: oblique,
    color: COLORS.medium,
  });
}

function buildSpecRows(yachts: ReportYacht[]): SpecRow[] {
  const rows: SpecRow[] = [
    {
      label: "Manufacturer",
      values: yachts.map((y) => y.manufacturer),
    },
    {
      label: "Model",
      values: yachts.map((y) => y.modelName),
    },
    {
      label: "Year",
      values: yachts.map((y) => (y.year ? String(y.year) : "—")),
    },
    {
      label: "Length Overall (m)",
      values: yachts.map((y) => fmt(y.lengthOverall)),
      bestIndex: findMaxIndex(yachts.map((y) => y.lengthOverall)),
    },
    {
      label: "Beam (m)",
      values: yachts.map((y) => fmt(y.beam)),
      bestIndex: findMaxIndex(yachts.map((y) => y.beam)),
    },
    {
      label: "Draft (m)",
      values: yachts.map((y) => fmt(y.draft)),
    },
    {
      label: "Displacement (kg)",
      values: yachts.map((y) => fmt(y.displacement)),
    },
    {
      label: "Ballast (kg)",
      values: yachts.map((y) => fmt(y.ballast)),
    },
    {
      label: "Sail Area — Main (m²)",
      values: yachts.map((y) => fmt(y.sailAreaMain)),
      bestIndex: findMaxIndex(yachts.map((y) => y.sailAreaMain)),
    },
    {
      label: "Rig Type",
      values: yachts.map((y) => y.rigType || "—"),
    },
    {
      label: "Keel Type",
      values: yachts.map((y) => y.keelType || "—"),
    },
    {
      label: "Hull Material",
      values: yachts.map((y) => y.hullMaterial || "—"),
    },
    {
      label: "Cabins",
      values: yachts.map((y) => fmt(y.cabins)),
      bestIndex: findMaxIndex(yachts.map((y) => y.cabins)),
    },
    {
      label: "Berths",
      values: yachts.map((y) => fmt(y.berths)),
      bestIndex: findMaxIndex(yachts.map((y) => y.berths)),
    },
    {
      label: "Heads",
      values: yachts.map((y) => fmt(y.heads)),
      bestIndex: findMaxIndex(yachts.map((y) => y.heads)),
    },
    {
      label: "Engine Power (HP)",
      values: yachts.map((y) => fmt(y.engineHp)),
      bestIndex: findMaxIndex(yachts.map((y) => y.engineHp)),
    },
    {
      label: "Engine Type",
      values: yachts.map((y) => y.engineType || "—"),
    },
  ];

  return rows;
}

function drawSpecTable(
  pdfDoc: PDFDocument,
  bold: PDFFont,
  regular: PDFFont,
  yachts: ReportYacht[],
  rows: SpecRow[],
) {
  const colWidth = (PAGE_WIDTH - MARGIN * 2) / (yachts.length + 1);
  const labelColWidth = colWidth * 1.2;
  const dataColWidth = (PAGE_WIDTH - MARGIN * 2 - labelColWidth) / yachts.length;
  const rowHeight = 24;
  const rowsPerPage = 22;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN - 10;

  // Section header
  page.drawText("Detailed Specification Comparison", {
    x: MARGIN,
    y,
    size: 16,
    font: bold,
    color: COLORS.primary,
  });
  y -= 30;

  // Table header
  drawTableCell(page, "Specification", MARGIN, y, labelColWidth, rowHeight, bold, COLORS.primary, COLORS.white, true);
  yachts.forEach((yacht, i) => {
    const name = truncate(`${yacht.manufacturer} ${yacht.modelName}`, dataColWidth - 10, bold, 9);
    drawTableCell(page, name, MARGIN + labelColWidth + i * dataColWidth, y, dataColWidth, rowHeight, bold, COLORS.primary, COLORS.white, true);
  });
  y -= rowHeight;

  // Data rows
  rows.forEach((row, ri) => {
    // New page if needed
    if (y < MARGIN + rowHeight) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;

      // Repeat header
      drawTableCell(page, "Specification", MARGIN, y, labelColWidth, rowHeight, bold, COLORS.primary, COLORS.white, true);
      yachts.forEach((yacht, i) => {
        const name = truncate(`${yacht.manufacturer} ${yacht.modelName}`, dataColWidth - 10, bold, 9);
        drawTableCell(page, name, MARGIN + labelColWidth + i * dataColWidth, y, dataColWidth, rowHeight, bold, COLORS.primary, COLORS.white, true);
      });
      y -= rowHeight;
    }

    const bgColor = ri % 2 === 0 ? COLORS.white : COLORS.highlight;

    // Label cell
    drawTableCell(page, row.label, MARGIN, y, labelColWidth, rowHeight, regular, COLORS.dark, bgColor, false, true);

    // Data cells
    row.values.forEach((val, vi) => {
      const isBest = row.bestIndex === vi;
      const cellBg = isBest ? COLORS.bestValue : bgColor;
      const cellColor = isBest ? rgb(0, 0.5, 0) : COLORS.dark;
      drawTableCell(page, val, MARGIN + labelColWidth + vi * dataColWidth, y, dataColWidth, rowHeight, isBest ? bold : regular, cellColor, cellBg, false);
    });

    y -= rowHeight;
  });
}

function drawTableCell(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  font: PDFFont,
  textColor: ReturnType<typeof rgb>,
  bgColor: ReturnType<typeof rgb>,
  isHeader: boolean,
  isLabel: boolean = false,
) {
  // Background
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: bgColor,
    borderColor: COLORS.border,
    borderWidth: 0.3,
  });

  // Text
  const fontSize = isHeader ? 9 : (isLabel ? 8 : 8);
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textX = isLabel ? x + 6 : x + (width - textWidth) / 2;
  const textY = y - height / 2 - fontSize / 2 + 2;

  page.drawText(truncate(text, width - 12, font, fontSize), {
    x: textX,
    y: textY,
    size: fontSize,
    font,
    color: textColor,
  });
}

function drawCtaPage(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  oblique: PDFFont,
  yachts: ReportYacht[],
) {
  drawHeader(page, bold, regular);

  const centerY = PAGE_HEIGHT / 2;

  // CTA box
  page.drawRectangle({
    x: MARGIN,
    y: centerY - 100,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 200,
    color: COLORS.light,
    borderColor: COLORS.accent,
    borderWidth: 1,
  });

  page.drawText("Ready to learn more?", {
    x: MARGIN + 30,
    y: centerY + 60,
    size: 22,
    font: bold,
    color: COLORS.primary,
  });

  page.drawText("Visit info.sailboats.fr to:", {
    x: MARGIN + 30,
    y: centerY + 30,
    size: 12,
    font: regular,
    color: COLORS.dark,
  });

  const bullets = [
    "• Read expert and user reviews for these yachts",
    "• Compare additional models side-by-side",
    "• Get price estimates and dealer information",
    "• Access detailed buying guides and checklists",
    "• Save your favorites and set up alerts",
  ];

  bullets.forEach((bullet, i) => {
    page.drawText(bullet, {
      x: MARGIN + 40,
      y: centerY + 5 - i * 20,
      size: 11,
      font: regular,
      color: COLORS.dark,
    });
  });

  // Disclaimer
  page.drawText(
    "Data is aggregated from public sources and manufacturer specifications.",
    {
      x: MARGIN,
      y: 60,
      size: 8,
      font: oblique,
      color: COLORS.medium,
    },
  );
  page.drawText("Verify critical specifications with authorized dealers before purchase.", {
    x: MARGIN,
    y: 48,
    size: 8,
    font: oblique,
    color: COLORS.medium,
  });

  page.drawText("© Sailing Yacht Info — info.sailboats.fr", {
    x: MARGIN,
    y: 30,
    size: 8,
    font: regular,
    color: COLORS.medium,
  });
}

// Helpers
function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function findMaxIndex(values: (number | null | undefined)[]): number | undefined {
  let max = -Infinity;
  let maxIdx: number | undefined;
  values.forEach((v, i) => {
    if (v !== null && v !== undefined && v > max) {
      max = v;
      maxIdx = i;
    }
  });
  return maxIdx;
}

function truncate(text: string, maxWidth: number, font: PDFFont, fontSize: number): string {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(truncated + "…", fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}
