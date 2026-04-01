/**
 * Filter Presets
 *
 * Pre-defined filter combinations for common yacht categories.
 * Each preset maps to URL search params that the /api/yachts endpoint understands.
 */

export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  icon: string;
  /** URL search params to apply */
  params: Record<string, string>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'bluewater',
    label: 'Bluewater Cruisers',
    description: 'Ocean-ready yachts 35–55ft with heavy displacement and proven keel designs',
    icon: '🌊',
    params: {
      'filters[lengthMin]': '10.5',
      'filters[lengthMax]': '17',
      'filters[keelType]': 'Fin keel',
    },
  },
  {
    id: 'racing',
    label: 'Racing Yachts',
    description: 'Light, fast yachts with performance rigs and fin/bulb keels',
    icon: '🏆',
    params: {
      'filters[rigType]': 'Sloop',
      'filters[keelType]': 'Fin and bulb',
    },
  },
  {
    id: 'budget',
    label: 'Budget Friendly',
    description: 'Affordable compact cruisers under 30ft, great for first-time buyers',
    icon: '💰',
    params: {
      'filters[lengthMax]': '9',
      'filters[hullMaterial]': 'GRP',
    },
  },
  {
    id: 'family',
    label: 'Family Cruisers',
    description: 'Comfortable cruising yachts with 3+ cabins, 30–45ft',
    icon: '👨‍👩‍👧‍👦',
    params: {
      'filters[lengthMin]': '9',
      'filters[lengthMax]': '14',
      'filters[cabinsMin]': '3',
    },
  },
];

/**
 * Get a preset by its ID
 */
export function getPresetById(id: string): FilterPreset | undefined {
  return FILTER_PRESETS.find(p => p.id === id);
}

/**
 * Detect which preset (if any) matches the current URL params
 */
export function detectActivePreset(searchParams: URLSearchParams): string | null {
  for (const preset of FILTER_PRESETS) {
    const presetEntries = Object.entries(preset.params);
    if (presetEntries.length === 0) continue;
    
    let allMatch = true;
    for (const [key, value] of presetEntries) {
      if (searchParams.get(key) !== value) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return preset.id;
  }
  return null;
}
