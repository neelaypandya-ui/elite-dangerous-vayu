/**
 * @vayu/shared — Commander Types
 *
 * Types for commander state, ranks, reputation, and progression.
 * Rank names and tier values match the Elite Dangerous journal specification.
 */

// ---------------------------------------------------------------------------
// Rank name constants
// ---------------------------------------------------------------------------

/** Combat rank names (index = numeric rank value from journal). */
export const COMBAT_RANKS = [
  'Harmless',
  'Mostly Harmless',
  'Novice',
  'Competent',
  'Expert',
  'Master',
  'Dangerous',
  'Deadly',
  'Elite',
  'Elite I',
  'Elite II',
  'Elite III',
  'Elite IV',
  'Elite V',
] as const;
export type CombatRankName = (typeof COMBAT_RANKS)[number];

/** Trade rank names. */
export const TRADE_RANKS = [
  'Penniless',
  'Mostly Penniless',
  'Peddler',
  'Dealer',
  'Merchant',
  'Broker',
  'Entrepreneur',
  'Tycoon',
  'Elite',
  'Elite I',
  'Elite II',
  'Elite III',
  'Elite IV',
  'Elite V',
] as const;
export type TradeRankName = (typeof TRADE_RANKS)[number];

/** Exploration rank names. */
export const EXPLORE_RANKS = [
  'Aimless',
  'Mostly Aimless',
  'Scout',
  'Surveyor',
  'Trailblazer',
  'Pathfinder',
  'Ranger',
  'Pioneer',
  'Elite',
  'Elite I',
  'Elite II',
  'Elite III',
  'Elite IV',
  'Elite V',
] as const;
export type ExploreRankName = (typeof EXPLORE_RANKS)[number];

/** CQC rank names. */
export const CQC_RANKS = [
  'Helpless',
  'Mostly Helpless',
  'Amateur',
  'Semi Professional',
  'Professional',
  'Champion',
  'Hero',
  'Legend',
  'Elite',
  'Elite I',
  'Elite II',
  'Elite III',
  'Elite IV',
  'Elite V',
] as const;
export type CQCRankName = (typeof CQC_RANKS)[number];

/** Federation navy rank names. */
export const FEDERATION_RANKS = [
  'None',
  'Recruit',
  'Cadet',
  'Midshipman',
  'Petty Officer',
  'Chief Petty Officer',
  'Warrant Officer',
  'Ensign',
  'Lieutenant',
  'Lt. Commander',
  'Post Commander',
  'Post Captain',
  'Rear Admiral',
  'Vice Admiral',
  'Admiral',
] as const;
export type FederationRankName = (typeof FEDERATION_RANKS)[number];

/** Empire navy rank names. */
export const EMPIRE_RANKS = [
  'None',
  'Outsider',
  'Serf',
  'Master',
  'Squire',
  'Knight',
  'Lord',
  'Baron',
  'Viscount',
  'Count',
  'Earl',
  'Marquis',
  'Duke',
  'Prince',
  'King',
] as const;
export type EmpireRankName = (typeof EMPIRE_RANKS)[number];

/** Exobiologist rank names. */
export const EXOBIOLOGIST_RANKS = [
  'Directionless',
  'Mostly Directionless',
  'Compiler',
  'Collector',
  'Cataloguer',
  'Taxonomist',
  'Ecologist',
  'Geneticist',
  'Elite',
  'Elite I',
  'Elite II',
  'Elite III',
  'Elite IV',
  'Elite V',
] as const;
export type ExobiologistRankName = (typeof EXOBIOLOGIST_RANKS)[number];

/** Mercenary / Soldier rank names (Odyssey). */
export const SOLDIER_RANKS = [
  'Defenceless',
  'Mostly Defenceless',
  'Rookie',
  'Soldier',
  'Gunslinger',
  'Warrior',
  'Gladiator',
  'Deadeye',
  'Elite',
  'Elite I',
  'Elite II',
  'Elite III',
  'Elite IV',
  'Elite V',
] as const;
export type SoldierRankName = (typeof SOLDIER_RANKS)[number];

// ---------------------------------------------------------------------------
// Rank interfaces
// ---------------------------------------------------------------------------

/** Numeric rank value and the percentage progress toward the next tier. */
export interface RankInfo {
  /** Numeric rank tier (0-based index matching the rank arrays). */
  rank: number;
  /** Percentage progress to next rank (0-100). */
  progress: number;
}

/** All tracked rank categories for a commander. */
export interface CommanderRanks {
  combat: RankInfo;
  trade: RankInfo;
  explore: RankInfo;
  cqc: RankInfo;
  federation: RankInfo;
  empire: RankInfo;
  soldier: RankInfo;
  exobiologist: RankInfo;
}

// ---------------------------------------------------------------------------
// Reputation
// ---------------------------------------------------------------------------

/** Super-power reputation levels. */
export type ReputationLevel =
  | 'Hostile'
  | 'Unfriendly'
  | 'Neutral'
  | 'Cordial'
  | 'Friendly'
  | 'Allied';

/** Reputation state with major factions. */
export interface CommanderReputation {
  /** Empire reputation (-100 to +100). */
  empire: number;
  /** Federation reputation (-100 to +100). */
  federation: number;
  /** Alliance reputation (-100 to +100). */
  alliance: number;
  /** Independent reputation (-100 to +100). */
  independent: number;
}

// ---------------------------------------------------------------------------
// Commander State
// ---------------------------------------------------------------------------

/** Full commander state as tracked by VAYU. */
export interface CommanderState {
  /** Frontier ID. */
  fid: string;
  /** Commander name. */
  name: string;
  /** Current credit balance. */
  credits: number;
  /** Outstanding loan amount. */
  loan: number;
  /** All rank categories. */
  ranks: CommanderRanks;
  /** Super-power reputation values. */
  reputation: CommanderReputation;
  /** Whether the player owns Horizons. */
  horizons: boolean;
  /** Whether the player owns Odyssey. */
  odyssey: boolean;
  /** Current game mode (Open, Solo, Group). */
  gameMode: string;
  /** Private group name if applicable. */
  group: string | null;
  /** Frontier account language code. */
  language: string;
  /** Game version string. */
  gameVersion: string;
  /** Power the commander is pledged to (null if none). */
  power: string | null;
  /** Time pledged to current power in seconds. */
  timePledged: number;
  /** Powerplay merit count. */
  powerplayMerits: number;
  /** Powerplay rank. */
  powerplayRank: number;
  /** Squadron name if a member (null if none). */
  squadron: string | null;
}
