/**
 * Shared data for SpecTooltip component.
 * Extracted for testability — tests can import from here instead of duplicating.
 */

/**
 * Mapping from spec category labels (as they appear in the UI) to glossary slugs.
 */
export const SPEC_TO_GLOSSARY: Record<string, string> = {
  LOA: "loa",
  "Length Overall": "loa",
  Beam: "beam",
  Draft: "draft",
  Displacement: "displacement",
  Ballast: "ballast",
  "Ballast Ratio": "ballast-ratio",
  "Sail Area": "sail-area",
  "Sail Area Main": "sail-area",
  "Sail Area Jib": "sail-area",
  "Sail Area / Displacement": "sa-disp-ratio",
  "SA/D Ratio": "sa-disp-ratio",
  "Displacement / Length": "disp-len-ratio",
  "D/L Ratio": "disp-len-ratio",
  LWL: "lwl",
  "Waterline Length": "lwl",
  "Hull Speed": "hull-speed",
  "Keel Type": "keel-type",
  "Rig Type": "rig-type",
  "Fin Keel": "fin-keel",
  "Wing Keel": "wing-keel",
  "Sloop Rig": "sloop-rig",
  "Cutter Rig": "cutter-rig",
  "Ketch Rig": "ketch-rig",
  "Shoal Draft": "shoal-draft",
  Cabin: "cabin",
  Cabins: "cabin",
  Berth: "berth",
  Berths: "berth",
  Head: "head",
  Heads: "head",
  "Hull Material": "hull-material",
  Engine: "engine",
  "Engine Type": "engine",
  "Engine HP": "engine",
  "Fuel Capacity": "fuel-capacity",
  "Water Capacity": "water-capacity",
  "Max Occupancy": "max-occupancy",
};

/**
 * Brief tooltip definitions for common spec labels.
 * These are short versions; clicking leads to the full glossary page.
 */
export const TOOLTIP_DEFS: Record<string, { en: string; fr: string }> = {
  LOA: {
    en: "Maximum length from bow to stern",
    fr: "Longueur maximale de la proue à la poupe",
  },
  Beam: {
    en: "Maximum width of the yacht",
    fr: "Largeur maximale du yacht",
  },
  Draft: {
    en: "Depth from waterline to keel bottom",
    fr: "Profondeur de la ligne de flottaison au bas de la quille",
  },
  Displacement: {
    en: "Total weight of the yacht in water",
    fr: "Poids total du yacht dans l'eau",
  },
  Ballast: {
    en: "Weight in the keel for stability",
    fr: "Poids dans la quille pour la stabilité",
  },
  "Ballast Ratio": {
    en: "Ballast ÷ Displacement — stability indicator",
    fr: "Lest ÷ Déplacement — indicateur de stabilité",
  },
  "Sail Area": {
    en: "Total sail area (mainsail + headsail)",
    fr: "Surface totale de la voilure",
  },
  "Sail Area Main": {
    en: "Area of the mainsail alone",
    fr: "Surface de la grand-voile seule",
  },
  "Sail Area Jib": {
    en: "Area of the jib or genoa",
    fr: "Surface du foc ou du génois",
  },
  "SA/D Ratio": {
    en: "Sail power relative to displacement",
    fr: "Puissance de voilure par rapport au déplacement",
  },
  "D/L Ratio": {
    en: "Weight relative to waterline length",
    fr: "Poids par rapport à la longueur de flottaison",
  },
  LWL: {
    en: "Length at the waterline",
    fr: "Longueur à la ligne de flottaison",
  },
  "Hull Speed": {
    en: "Theoretical max speed for this hull",
    fr: "Vitesse maximale théorique de la coque",
  },
  "Keel Type": {
    en: "Shape and configuration of the keel",
    fr: "Forme et configuration de la quille",
  },
  "Rig Type": {
    en: "Mast and sail configuration",
    fr: "Configuration du mât et de la voilure",
  },
  Cabins: {
    en: "Number of enclosed sleeping compartments",
    fr: "Nombre de cabines fermées",
  },
  Berths: {
    en: "Number of sleeping positions",
    fr: "Nombre de places couchage",
  },
  Heads: {
    en: "Number of marine toilets/bathrooms",
    fr: "Nombre de toilettes/salles de bain",
  },
  "Hull Material": {
    en: "Primary construction material",
    fr: "Matériau principal de construction",
  },
  Engine: {
    en: "Auxiliary engine details",
    fr: "Détails du moteur auxiliaire",
  },
  "Engine Type": {
    en: "Type of auxiliary engine (diesel, electric, etc.)",
    fr: "Type de moteur auxiliaire (diesel, électrique, etc.)",
  },
  "Engine HP": {
    en: "Auxiliary engine horsepower",
    fr: "Puissance du moteur auxiliaire",
  },
  "Fuel Capacity": {
    en: "Total fuel tank capacity",
    fr: "Capacité totale du réservoir de carburant",
  },
  "Water Capacity": {
    en: "Total fresh water tank capacity",
    fr: "Capacité totale du réservoir d'eau douce",
  },
  "Max Occupancy": {
    en: "Maximum recommended number of people aboard",
    fr: "Nombre maximal recommandé de personnes à bord",
  },
};
