/**
 * @vayu/shared — Rank System Constants
 *
 * All Elite Dangerous rank progressions with their numeric indices.
 * The existing rank name arrays live in types/commander.ts; this file
 * provides structured rank data objects with level numbers and
 * convenience utilities for display and comparison.
 *
 * Note: The raw `as const` arrays (COMBAT_RANKS, TRADE_RANKS, etc.)
 * are re-exported from types/commander.ts. This module adds structured
 * rank system definitions on top.
 */

// Re-export the raw arrays from the types layer for convenience.
export {
  COMBAT_RANKS,
  TRADE_RANKS,
  EXPLORE_RANKS,
  CQC_RANKS,
  FEDERATION_RANKS,
  EMPIRE_RANKS,
  EXOBIOLOGIST_RANKS,
  SOLDIER_RANKS,
} from '../types/commander.js';

// ---------------------------------------------------------------------------
// Structured Rank Data
// ---------------------------------------------------------------------------

/** A single rank level entry. */
export interface RankLevel {
  /** Numeric index (0-based, matches journal value). */
  index: number;
  /** Display name for this rank level. */
  name: string;
  /** Whether this is an "Elite" tier (Elite through Elite V). */
  isElite: boolean;
}

/** Definition of a complete rank system. */
export interface RankSystem {
  /** Identifier for this rank category. */
  category: string;
  /** Human-readable label. */
  label: string;
  /** Ordered rank levels from lowest to highest. */
  levels: readonly RankLevel[];
}

/** Build a RankSystem from a const rank name array. */
function buildRankSystem(category: string, label: string, names: readonly string[]): RankSystem {
  return {
    category,
    label,
    levels: names.map((name, index) => ({
      index,
      name,
      isElite: name.startsWith('Elite'),
    })),
  };
}

// ---------------------------------------------------------------------------
// Import rank arrays for building structured data
// ---------------------------------------------------------------------------

import {
  COMBAT_RANKS,
  TRADE_RANKS,
  EXPLORE_RANKS,
  CQC_RANKS,
  FEDERATION_RANKS,
  EMPIRE_RANKS,
  EXOBIOLOGIST_RANKS,
  SOLDIER_RANKS,
} from '../types/commander.js';

// ---------------------------------------------------------------------------
// Rank Systems
// ---------------------------------------------------------------------------

/** Combat rank system: Harmless -> Elite V. */
export const COMBAT_RANK_SYSTEM: RankSystem = buildRankSystem(
  'combat',
  'Combat',
  COMBAT_RANKS,
);

/** Trade rank system: Penniless -> Elite V. */
export const TRADE_RANK_SYSTEM: RankSystem = buildRankSystem(
  'trade',
  'Trade',
  TRADE_RANKS,
);

/** Explorer rank system: Aimless -> Elite V. */
export const EXPLORE_RANK_SYSTEM: RankSystem = buildRankSystem(
  'explore',
  'Explorer',
  EXPLORE_RANKS,
);

/** CQC rank system: Helpless -> Elite V. */
export const CQC_RANK_SYSTEM: RankSystem = buildRankSystem(
  'cqc',
  'CQC',
  CQC_RANKS,
);

/** Federation navy rank system: None -> Admiral. */
export const FEDERATION_RANK_SYSTEM: RankSystem = buildRankSystem(
  'federation',
  'Federation',
  FEDERATION_RANKS,
);

/** Empire navy rank system: None -> King. */
export const EMPIRE_RANK_SYSTEM: RankSystem = buildRankSystem(
  'empire',
  'Empire',
  EMPIRE_RANKS,
);

/** Exobiologist rank system: Directionless -> Elite V. */
export const EXOBIOLOGIST_RANK_SYSTEM: RankSystem = buildRankSystem(
  'exobiologist',
  'Exobiologist',
  EXOBIOLOGIST_RANKS,
);

/** Mercenary/Soldier rank system: Defenceless -> Elite V. */
export const SOLDIER_RANK_SYSTEM: RankSystem = buildRankSystem(
  'soldier',
  'Mercenary',
  SOLDIER_RANKS,
);

/** All rank systems in a convenient array. */
export const ALL_RANK_SYSTEMS: readonly RankSystem[] = [
  COMBAT_RANK_SYSTEM,
  TRADE_RANK_SYSTEM,
  EXPLORE_RANK_SYSTEM,
  CQC_RANK_SYSTEM,
  FEDERATION_RANK_SYSTEM,
  EMPIRE_RANK_SYSTEM,
  EXOBIOLOGIST_RANK_SYSTEM,
  SOLDIER_RANK_SYSTEM,
] as const;

/** Map from rank category to its rank system. */
export const RANK_SYSTEM_BY_CATEGORY: ReadonlyMap<string, RankSystem> = new Map(
  ALL_RANK_SYSTEMS.map((rs) => [rs.category, rs]),
);

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Get the display name for a rank value in a given category.
 * Returns 'Unknown' if the rank value is out of range.
 */
export function getRankName(category: string, rankValue: number): string {
  const system = RANK_SYSTEM_BY_CATEGORY.get(category);
  if (!system) return 'Unknown';
  return system.levels[rankValue]?.name ?? 'Unknown';
}

/**
 * Get the maximum rank index for a given category.
 */
export function getMaxRank(category: string): number {
  const system = RANK_SYSTEM_BY_CATEGORY.get(category);
  if (!system) return 0;
  return system.levels.length - 1;
}

/**
 * Check if a given rank value represents an Elite tier.
 */
export function isEliteRank(category: string, rankValue: number): boolean {
  const system = RANK_SYSTEM_BY_CATEGORY.get(category);
  if (!system) return false;
  return system.levels[rankValue]?.isElite ?? false;
}
