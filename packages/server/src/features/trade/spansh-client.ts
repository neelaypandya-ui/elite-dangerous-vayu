/**
 * Spansh API client for live commodity market data.
 * https://spansh.co.uk/api
 */

const SPANSH_BASE = 'https://spansh.co.uk/api';

export interface SpanshCommodityResult {
  stationName: string;
  systemName: string;
  distanceLy: number;
  distanceToArrivalLs: number;
  landingPadSize: string;
  sellPrice: number;
  buyPrice: number;
  demand: number;
  supply: number;
  marketUpdatedAt: string;
  stationType: string;
  isPlanetary: boolean;
}

export interface SpanshCommoditySearch {
  commodity: string;
  results: SpanshCommodityResult[];
  totalCount: number;
}

/** Cached commodity names from Spansh (lowercase → exact name) */
let commodityNameCache: Map<string, string> | null = null;
let commodityNameCacheExpiry = 0;

/**
 * Load all commodity names from Spansh and build a fuzzy lookup map.
 */
async function loadCommodityNames(): Promise<Map<string, string>> {
  if (commodityNameCache && commodityNameCacheExpiry > Date.now()) {
    return commodityNameCache;
  }

  const resp = await fetch(`${SPANSH_BASE}/stations/field_values/market`);
  if (!resp.ok) throw new Error(`Spansh field_values failed: ${resp.status}`);
  const data: any = await resp.json();
  const names: string[] = data.values || [];

  const map = new Map<string, string>();
  for (const name of names) {
    // Exact lowercase
    map.set(name.toLowerCase(), name);
    // Without spaces
    map.set(name.toLowerCase().replace(/\s+/g, ''), name);
    // Without hyphens
    map.set(name.toLowerCase().replace(/-/g, ''), name);
    // Without spaces and hyphens
    map.set(name.toLowerCase().replace(/[\s-]/g, ''), name);
  }

  commodityNameCache = map;
  commodityNameCacheExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6h cache
  return map;
}

/**
 * Resolve a fuzzy commodity name to the exact Spansh commodity name.
 * Handles: "void opals" → "Void Opal", "ltd" → "Low Temperature Diamonds", etc.
 */
export async function resolveCommodityName(query: string): Promise<string | null> {
  const nameMap = await loadCommodityNames();
  const lower = query.toLowerCase().trim();

  // Direct match
  if (nameMap.has(lower)) return nameMap.get(lower)!;

  // Common abbreviations
  const abbreviations: Record<string, string> = {
    'ltd': 'Low Temperature Diamonds',
    'ltds': 'Low Temperature Diamonds',
    'low temp diamonds': 'Low Temperature Diamonds',
    'void opals': 'Void Opal',
    'painite': 'Painite',
    'tritium': 'Tritium',
    'agronomic treatment': 'Agronomic Treatment',
    'agro treatment': 'Agronomic Treatment',
    'imp slaves': 'Imperial Slaves',
    'imperial slave': 'Imperial Slaves',
    'musgravite': 'Musgravite',
    'alexandrite': 'Alexandrite',
    'grandidierite': 'Grandidierite',
    'monazite': 'Monazite',
    'rhodplumsite': 'Rhodplumsite',
    'serendibite': 'Serendibite',
    'benitoite': 'Benitoite',
  };

  if (abbreviations[lower]) {
    const exact = abbreviations[lower];
    // Verify it exists in Spansh
    if (nameMap.has(exact.toLowerCase())) return exact;
  }

  // Fuzzy: find best substring match
  const allNames = [...new Set(nameMap.values())];

  // First try: query is a substring of commodity name
  const substringMatches = allNames.filter(n => n.toLowerCase().includes(lower));
  if (substringMatches.length === 1) return substringMatches[0];

  // Try: commodity name is a substring of query
  const reverseMatches = allNames.filter(n => lower.includes(n.toLowerCase()));
  if (reverseMatches.length === 1) return reverseMatches[0];

  // Partial word match — check if all words in query appear in commodity name
  const queryWords = lower.split(/\s+/);
  const wordMatches = allNames.filter(n => {
    const nameLower = n.toLowerCase();
    return queryWords.every(w => nameLower.includes(w));
  });
  if (wordMatches.length === 1) return wordMatches[0];
  if (wordMatches.length > 1) {
    // Return shortest match (most specific)
    wordMatches.sort((a, b) => a.length - b.length);
    return wordMatches[0];
  }

  // Return first substring match if multiple
  if (substringMatches.length > 0) {
    substringMatches.sort((a, b) => a.length - b.length);
    return substringMatches[0];
  }

  return null;
}

/**
 * Search for the best stations to sell a commodity, sorted by highest sell price.
 */
export async function searchBestSellPrice(
  commodity: string,
  referenceSystem: string,
  maxResults = 5,
  minDemand = 1,
): Promise<SpanshCommoditySearch> {
  const resolvedName = await resolveCommodityName(commodity);
  if (!resolvedName) {
    return { commodity, results: [], totalCount: 0 };
  }

  const body: any = {
    filters: {
      market: [{
        name: resolvedName,
        ...(minDemand > 0 ? { demand: { value: [minDemand], comparison: '>=' } } : {}),
      }],
    },
    sort: [{
      market: { direction: 'desc', name: resolvedName, field: 'sell_price' },
    }],
    size: maxResults,
  };

  if (referenceSystem) {
    body.reference_system = referenceSystem;
  }

  const resp = await fetch(`${SPANSH_BASE}/stations/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`Spansh search failed: ${resp.status} ${resp.statusText}`);
  }

  const data: any = await resp.json();

  const results: SpanshCommodityResult[] = (data.results || []).map((r: any) => {
    const marketEntry = (r.market || []).find((m: any) =>
      m.commodity?.toLowerCase() === resolvedName.toLowerCase() ||
      m.name?.toLowerCase() === resolvedName.toLowerCase()
    );

    return {
      stationName: r.name || 'Unknown',
      systemName: r.system_name || 'Unknown',
      distanceLy: r.distance ?? 0,
      distanceToArrivalLs: r.distance_to_arrival ?? 0,
      landingPadSize: r.has_large_pad ? 'L' : (r.medium_pads > 0 ? 'M' : (r.small_pads > 0 ? 'S' : '?')),
      sellPrice: marketEntry?.sell_price ?? 0,
      buyPrice: marketEntry?.buy_price ?? 0,
      demand: marketEntry?.demand ?? 0,
      supply: marketEntry?.supply ?? 0,
      marketUpdatedAt: r.market_updated_at || '',
      stationType: r.type || 'Unknown',
      isPlanetary: r.is_planetary ?? false,
    };
  });

  return {
    commodity: resolvedName,
    results,
    totalCount: data.count || 0,
  };
}

/**
 * Search for the best stations to buy a commodity (cheapest price).
 */
export async function searchBestBuyPrice(
  commodity: string,
  referenceSystem: string,
  maxResults = 5,
  minSupply = 1,
): Promise<SpanshCommoditySearch> {
  const resolvedName = await resolveCommodityName(commodity);
  if (!resolvedName) {
    return { commodity, results: [], totalCount: 0 };
  }

  const body: any = {
    filters: {
      market: [{
        name: resolvedName,
        ...(minSupply > 0 ? { supply: { value: [minSupply], comparison: '>=' } } : {}),
      }],
    },
    sort: [{
      market: { direction: 'asc', name: resolvedName, field: 'buy_price' },
    }],
    size: maxResults,
  };

  if (referenceSystem) {
    body.reference_system = referenceSystem;
  }

  const resp = await fetch(`${SPANSH_BASE}/stations/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`Spansh search failed: ${resp.status} ${resp.statusText}`);
  }

  const data: any = await resp.json();

  const results: SpanshCommodityResult[] = (data.results || []).map((r: any) => {
    const marketEntry = (r.market || []).find((m: any) =>
      m.commodity?.toLowerCase() === resolvedName.toLowerCase() ||
      m.name?.toLowerCase() === resolvedName.toLowerCase()
    );

    return {
      stationName: r.name || 'Unknown',
      systemName: r.system_name || 'Unknown',
      distanceLy: r.distance ?? 0,
      distanceToArrivalLs: r.distance_to_arrival ?? 0,
      landingPadSize: r.has_large_pad ? 'L' : (r.medium_pads > 0 ? 'M' : (r.small_pads > 0 ? 'S' : '?')),
      sellPrice: marketEntry?.sell_price ?? 0,
      buyPrice: marketEntry?.buy_price ?? 0,
      demand: marketEntry?.demand ?? 0,
      supply: marketEntry?.supply ?? 0,
      marketUpdatedAt: r.market_updated_at || '',
      stationType: r.type || 'Unknown',
      isPlanetary: r.is_planetary ?? false,
    };
  });

  return {
    commodity: resolvedName,
    results,
    totalCount: data.count || 0,
  };
}
