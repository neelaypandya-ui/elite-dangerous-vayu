/**
 * @vayu/shared — Mining Types
 *
 * Types for mining sessions, prospector results, asteroid cracking,
 * and yield tracking.
 */

// ---------------------------------------------------------------------------
// Prospector Results
// ---------------------------------------------------------------------------

/** Content level of a prospected asteroid. */
export type AsteroidContent =
  | 'High'
  | 'Medium'
  | 'Low'
  | '$AsteroidMaterialContent_High;'
  | '$AsteroidMaterialContent_Medium;'
  | '$AsteroidMaterialContent_Low;';

/** Material found on a prospected asteroid. */
export interface ProspectorMaterial {
  /** Material/mineral name. */
  name: string;
  /** Localised name. */
  nameLocalised: string | null;
  /** Proportion of this material (0.0-1.0 as percentage weight). */
  proportion: number;
}

/** Result of a prospector limpet scan. */
export interface ProspectorResult {
  /** Timestamp when the asteroid was prospected. */
  timestamp: string;
  /** Materials present in the asteroid. */
  materials: ProspectorMaterial[];
  /** Content level (High/Medium/Low). */
  content: AsteroidContent;
  /** Localised content description. */
  contentLocalised: string | null;
  /** Remaining percentage of the asteroid (0.0-100.0). */
  remaining: number;
  /** Motherlode material (for deep core mining, null if not a core asteroid). */
  motherlodeMaterial: string | null;
  /** Localised motherlode material name. */
  motherlodeMaterialLocalised: string | null;
}

// ---------------------------------------------------------------------------
// Asteroid Cracking
// ---------------------------------------------------------------------------

/** Record of an asteroid that was cracked open (deep core mining). */
export interface AsteroidCrack {
  /** Timestamp of the crack. */
  timestamp: string;
  /** Body near which the crack occurred. */
  body: string;
  /** Motherlode material type. */
  motherlodeMaterial: string | null;
  /** Prospector data if available. */
  prospectorResult: ProspectorResult | null;
}

// ---------------------------------------------------------------------------
// Mining Yield Tracking
// ---------------------------------------------------------------------------

/** A single refined mineral and the quantity produced. */
export interface MiningYield {
  /** Mineral/material name. */
  name: string;
  /** Localised name. */
  nameLocalised: string | null;
  /** Number of units refined. */
  count: number;
  /** Estimated value per unit (credits, from market data). */
  estimatedValuePerUnit: number | null;
  /** Estimated total value. */
  estimatedTotalValue: number | null;
}

// ---------------------------------------------------------------------------
// Mining Session
// ---------------------------------------------------------------------------

/** Aggregated data for a mining session. */
export interface MiningSession {
  /** Session start time. */
  startTime: string;
  /** Session end time (null if still active). */
  endTime: string | null;
  /** System where mining is taking place. */
  system: string;
  /** Body name (ring parent or belt). */
  body: string;
  /** Ring name (if mining in a ring). */
  ring: string | null;
  /** Type of mining being performed. */
  miningType: 'laser' | 'subsurface' | 'deepcore' | 'mixed';
  /** Number of asteroids prospected. */
  asteroidsProspected: number;
  /** Number of asteroids cracked (deep core). */
  asteroidsCracked: number;
  /** All prospector results. */
  prospectorResults: ProspectorResult[];
  /** All asteroid cracks. */
  cracks: AsteroidCrack[];
  /** Refined materials and counts. */
  yields: MiningYield[];
  /** Total units of minerals refined. */
  totalRefined: number;
  /** Total estimated value of all refined materials. */
  totalEstimatedValue: number;
  /** Number of collector limpets launched. */
  collectorsLaunched: number;
  /** Number of prospector limpets launched. */
  prospectorsLaunched: number;
  /** Cargo collected (including fragments before refining). */
  cargoCollected: number;
}
