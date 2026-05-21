/**
 * P21.4 — Yacht Description Templates
 *
 * Generates rich, human-readable yacht descriptions from specification data.
 * Supports multiple styles: technical, marketing, and balanced (default).
 * Falls back gracefully when specs are sparse.
 */

export type DescriptionStyle = "technical" | "marketing" | "balanced";

export interface YachtSpecsForDescription {
  manufacturer: string;
  modelName: string;
  year: number;
  lengthOverall: number | string | null;
  beam: number | string | null;
  draft: number | string | null;
  displacement: number | string | null;
  ballast: number | string | null;
  sailAreaMain: number | string | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | string | null;
  berths: number | string | null;
  heads: number | string | null;
  maxOccupancy: number | string | null;
  engineHp: number | string | null;
  engineType: string | null;
  fuelCapacity: number | string | null;
  waterCapacity: number | string | null;
  designNotes: string | null;
}

interface DescriptionSentence {
  text: string;
  relevance: number; // 0-1, used to pick best sentences when trimming
}

function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function feetAndMeters(meters: number): string {
  const ft = meters * 3.28084;
  return `${meters.toFixed(1)}m (${ft.toFixed(1)}ft)`;
}

function tonnes(kg: number): string {
  const t = kg / 1000;
  return `${t.toFixed(1)} tonnes`;
}

// ──────────────────────────────────────────
// Sentence builders
// ──────────────────────────────────────────

function introSentence(specs: YachtSpecsForDescription, style: DescriptionStyle): DescriptionSentence {
  const { manufacturer, modelName, year } = specs;
  const loa = num(specs.lengthOverall);

  if (style === "technical") {
    return {
      text: `The ${manufacturer} ${modelName} (${year}) is a ${loa ? feetAndMeters(loa) + " " : ""}sailing yacht designed for ${getPrimaryUseCase(specs)}.`,
      relevance: 1.0,
    };
  }
  if (style === "marketing") {
    return {
      text: `Introducing the ${manufacturer} ${modelName} — a ${year} ${loa ? feetAndMeters(loa) + " " : ""}sailing yacht that ${loa && loa >= 12 ? "is built for serious offshore adventures" : loa && loa >= 9 ? "combines performance with comfort" : "is perfect for day sailing and weekend getaways"}.`,
      relevance: 1.0,
    };
  }
  // balanced
  return {
    text: `The ${manufacturer} ${modelName} is a ${year} ${loa ? feetAndMeters(loa) + " " : ""}sailing yacht from ${manufacturer}.`,
    relevance: 1.0,
  };
}

function dimensionsSentence(specs: YachtSpecsForDescription, style: DescriptionStyle): DescriptionSentence | null {
  const loa = num(specs.lengthOverall);
  const beam = num(specs.beam);
  const draft = num(specs.draft);

  if (!loa && !beam && !draft) return null;

  const parts: string[] = [];
  if (loa) parts.push(`an overall length of ${feetAndMeters(loa)}`);
  if (beam) parts.push(`a beam of ${feetAndMeters(beam)}`);
  if (draft) parts.push(`a draft of ${feetAndMeters(draft)}`);

  if (style === "technical") {
    return { text: `Dimensional specifications include ${parts.join(", ")}.`, relevance: 0.9 };
  }
  return { text: `She measures ${parts.join(", ")}.`, relevance: 0.8 };
}

function displacementSentence(specs: YachtSpecsForDescription, style: DescriptionStyle): DescriptionSentence | null {
  const disp = num(specs.displacement);
  const loa = num(specs.lengthOverall);
  if (!disp) return null;

  if (style === "technical") {
    return {
      text: `Displacement is ${tonnes(disp)}${loa ? ` (D/L ratio: ${((disp / 2240) / Math.pow(loa / 100, 3)).toFixed(0)})` : ""}.`,
      relevance: 0.7,
    };
  }
  if (style === "marketing") {
    const weight = disp > 8000 ? "substantial" : disp > 4000 ? "well-proportioned" : "light";
    return {
      text: `With a ${weight} displacement of ${tonnes(disp)}, she offers ${disp > 6000 ? "excellent stability and seaworthiness" : "lively performance and easy handling"}.`,
      relevance: 0.75,
    };
  }
  return { text: `Displacement is ${tonnes(disp)}.`, relevance: 0.6 };
}

function accommodationSentence(specs: YachtSpecsForDescription, style: DescriptionStyle): DescriptionSentence | null {
  const cabins = num(specs.cabins);
  const berths = num(specs.berths);
  const heads = num(specs.heads);

  if (!cabins && !berths && !heads) return null;

  const parts: string[] = [];
  if (cabins) parts.push(`${cabins} cabin${cabins > 1 ? "s" : ""}`);
  if (berths) parts.push(`${berths} berth${berths > 1 ? "s" : ""}`);
  if (heads) parts.push(`${heads} head${heads > 1 ? "s" : ""}`);

  if (style === "technical") {
    return { text: `Accommodation comprises ${parts.join(", ")}.`, relevance: 0.85 };
  }
  if (style === "marketing") {
    const comfort = (berths || 0) >= 6 ? "spacious" : (berths || 0) >= 4 ? "comfortable" : "cozy";
    return {
      text: `Below deck, you'll find a ${comfort} layout with ${parts.join(", ")} — ${berths && berths >= 4 ? "perfect for family cruising" : "ideal for couples or small crews"}.`,
      relevance: 0.85,
    };
  }
  return { text: `The interior offers ${parts.join(", ")}.`, relevance: 0.8 };
}

function sailplanSentence(specs: YachtSpecsForDescription, style: DescriptionStyle): DescriptionSentence | null {
  const rig = specs.rigType;
  const sailArea = num(specs.sailAreaMain);

  if (!rig && !sailArea) return null;

  const parts: string[] = [];
  if (rig) parts.push(`a ${rig.toLowerCase()} rig`);
  if (sailArea) parts.push(`a sail area of ${sailArea.toFixed(1)} m²`);

  if (style === "technical") {
    return { text: `The sailplan features ${parts.join(" with ")}.`, relevance: 0.75 };
  }
  if (style === "marketing") {
    return {
      text: `${sailArea && sailArea > 80 ? "Her generous sail area ensures exhilarating performance" : sailArea && sailArea > 50 ? "Her sail plan balances power and control" : "Her sail plan is designed for easy handling"}, with ${parts.join(" featuring ")}.`,
      relevance: 0.7,
    };
  }
  return { text: `Sail configuration: ${parts.join(", ")}.`, relevance: 0.65 };
}

function constructionSentence(specs: YachtSpecsForDescription, style: DescriptionStyle): DescriptionSentence | null {
  const hull = specs.hullMaterial;
  const keel = specs.keelType;
  const ballast = num(specs.ballast);
  const disp = num(specs.displacement);

  if (!hull && !keel) return null;

  const parts: string[] = [];
  if (hull) parts.push(`${hull.toLowerCase()} hull construction`);
  if (keel) parts.push(`a ${keel.toLowerCase()} keel`);

  let sentence = `Built with ${parts.join(" and ")}`;
  if (ballast && disp) {
    const ratio = ((ballast / disp) * 100).toFixed(0);
    sentence += ` with a ${ratio}% ballast ratio`;
  }
  sentence += ".";

  return { text: sentence, relevance: 0.65 };
}

function engineSentence(specs: YachtSpecsForDescription, _style: DescriptionStyle): DescriptionSentence | null {
  const hp = num(specs.engineHp);
  const engineType = specs.engineType;
  if (!hp && !engineType) return null;

  const parts: string[] = [];
  if (engineType) parts.push(engineType);
  if (hp) parts.push(`${hp} HP`);

  return {
    text: `Powered by ${parts.join(" producing ") || "an auxiliary engine"}.`,
    relevance: 0.5,
  };
}

function designNotesSentence(specs: YachtSpecsForDescription, _style: DescriptionStyle): DescriptionSentence | null {
  if (!specs.designNotes) return null;
  return { text: specs.designNotes, relevance: 0.9 };
}

function rangeSentence(specs: YachtSpecsForDescription, style: DescriptionStyle): DescriptionSentence | null {
  const fuel = num(specs.fuelCapacity);
  const water = num(specs.waterCapacity);
  if (!fuel && !water) return null;

  const parts: string[] = [];
  if (fuel) parts.push(`${fuel}L fuel`);
  if (water) parts.push(`${water}L water`);

  if (style === "marketing") {
    return {
      text: `Tank capacities of ${parts.join(" and ")} ${fuel && fuel > 100 ? "enable extended cruising" : "support weekend adventures"}.`,
      relevance: 0.45,
    };
  }
  return { text: `Tankage: ${parts.join(", ")}.`, relevance: 0.4 };
}

// ──────────────────────────────────────────
// Use case determination
// ──────────────────────────────────────────

function getPrimaryUseCase(specs: YachtSpecsForDescription): string {
  const loa = num(specs.lengthOverall) || 0;
  const berths = num(specs.berths) || 0;

  if (loa < 8) return "day sailing and club racing";
  if (loa < 10) return "weekend cruising and coastal sailing";
  if (loa < 12) return "coastal cruising and island hopping";
  if (loa < 15) {
    return berths >= 6 ? "family cruising and charter" : "performance cruising and offshore sailing";
  }
  return "bluewater cruising and long-distance passage making";
}

// ──────────────────────────────────────────
// Main generator
// ──────────────────────────────────────────

export function generateDescription(
  specs: YachtSpecsForDescription,
  style: DescriptionStyle = "balanced",
  maxSentences: number = 6,
): string {
  const sentenceBuilders = [
    introSentence,
    dimensionsSentence,
    displacementSentence,
    accommodationSentence,
    sailplanSentence,
    constructionSentence,
    engineSentence,
    rangeSentence,
    designNotesSentence,
  ];

  const sentences: DescriptionSentence[] = [];

  for (const builder of sentenceBuilders) {
    const result = builder(specs, style);
    if (result) {
      sentences.push(result);
    }
  }

  // Sort by relevance (highest first), then trim to maxSentences
  sentences.sort((a, b) => b.relevance - a.relevance);
  const selected = sentences.slice(0, maxSentences);

  // Re-order: keep intro first, then follow relevance
  const intro = selected.find((s) => s.relevance === 1.0);
  const rest = selected.filter((s) => s.relevance < 1.0);
  const ordered = intro ? [intro, ...rest] : rest;

  return ordered.map((s) => s.text).join(" ");
}

/**
 * Generate all three style variants for a yacht.
 * Useful for admin preview and A/B test setup.
 */
export function generateAllStyles(
  specs: YachtSpecsForDescription,
): Record<DescriptionStyle, string> {
  return {
    technical: generateDescription(specs, "technical"),
    marketing: generateDescription(specs, "marketing"),
    balanced: generateDescription(specs, "balanced"),
  };
}

/**
 * Assess whether a yacht would benefit from an auto-generated description.
 * Returns true if the current description is missing or very short.
 */
export function needsGeneratedDescription(
  currentDescription: string | null,
): boolean {
  if (!currentDescription) return true;
  const trimmed = currentDescription.trim();
  return trimmed.length < 50;
}

/**
 * Score a description's quality (0-100) based on length and content richness.
 */
export function scoreDescription(description: string | null): number {
  if (!description) return 0;
  const trimmed = description.trim();
  if (trimmed.length < 20) return 10;
  if (trimmed.length < 50) return 25;

  let score = 40; // base score for having a description

  // Length bonus
  if (trimmed.length >= 100) score += 10;
  if (trimmed.length >= 200) score += 10;
  if (trimmed.length >= 400) score += 10;

  // Content richness: check for key sailing terms
  const terms = [
    /\b(cabin|berth|head)\b/i,
    /\b(sail|rig|sloop|ketch|cutter)\b/i,
    /\b(hull|keel|draft|beam)\b/i,
    /\b(displacement|weight|tonnes?)\b/i,
    /\b(engine|HP|diesel)\b/i,
    /\b(cruising|racing|offshore|bluewater)\b/i,
  ];
  for (const term of terms) {
    if (term.test(trimmed)) score += 5;
  }

  return Math.min(100, score);
}
