/**
 * @vayu/shared — Unified Game State
 *
 * The root GameState interface composes every domain-specific state slice
 * into a single coherent object that represents the full known state of
 * an Elite Dangerous session at any point in time.
 */

import type { CommanderState } from './commander.js';
import type { ShipState } from './ship.js';
import type { LocationState } from './navigation.js';
import type { MaterialsState } from './materials.js';
import type { CarrierState } from './carrier.js';
import type { OdysseyState } from './odyssey.js';

// ---------------------------------------------------------------------------
// Mission State
// ---------------------------------------------------------------------------

/** A single active mission tracked in the game state. */
export interface MissionState {
  /** Unique mission ID. */
  missionId: number;
  /** Mission internal name. */
  name: string;
  /** Localised mission name. */
  nameLocalised: string | null;
  /** Issuing faction. */
  faction: string;
  /** Whether this is a passenger mission. */
  passengerMission: boolean;
  /** Whether this is a wing mission. */
  wing: boolean;
  /** Expiry timestamp (ISO 8601). */
  expiry: string | null;
  /** Destination system (if applicable). */
  destinationSystem: string | null;
  /** Destination station (if applicable). */
  destinationStation: string | null;
  /** Target faction (if applicable). */
  targetFaction: string | null;
  /** Target type or name (if applicable). */
  target: string | null;
  /** Commodity involved (if applicable). */
  commodity: string | null;
  /** Required count (cargo, kills, etc.). */
  count: number | null;
  /** Kill count target (if applicable). */
  killCount: number | null;
  /** Reward in credits. */
  reward: number;
  /** Influence impact rating. */
  influence: string;
  /** Reputation impact rating. */
  reputation: string;
}

// ---------------------------------------------------------------------------
// Session State
// ---------------------------------------------------------------------------

/** Aggregated session statistics since the game was started. */
export interface SessionState {
  /** When the session started (ISO 8601). */
  startTime: string;
  /** Total hyperspace jumps made. */
  jumps: number;
  /** Total distance jumped in LY. */
  totalDistance: number;
  /** Total fuel consumed in tons. */
  fuelUsed: number;
  /** Number of fuel scoops. */
  fuelScoops: number;
  /** Total fuel scooped in tons. */
  fuelScooped: number;
  /** Credits earned this session (from trade, bounties, exploration, etc.). */
  creditsEarned: number;
  /** Credits spent this session. */
  creditsSpent: number;
  /** Net profit/loss. */
  netProfit: number;
  /** Bodies scanned. */
  bodiesScanned: number;
  /** Systems visited. */
  systemsVisited: number;
  /** Unique systems visited (deduplicated). */
  uniqueSystemsVisited: string[];
  /** Bounties collected total. */
  bountiesCollected: number;
  /** Total bounty earnings. */
  bountyEarnings: number;
  /** Missions completed. */
  missionsCompleted: number;
  /** Missions failed/abandoned. */
  missionsFailed: number;
  /** Deaths this session. */
  deaths: number;
  /** Materials collected. */
  materialsCollected: number;
  /** Cargo tons traded. */
  cargoTraded: number;
  /** Trade profit. */
  tradeProfit: number;
  /** Exploration data sold. */
  explorationEarnings: number;
  /** Mining tons refined. */
  miningRefined: number;
  /** Elapsed time in seconds. */
  elapsedSeconds: number;
}

// ---------------------------------------------------------------------------
// Unified Game State
// ---------------------------------------------------------------------------

/**
 * The unified game state tracked by VAYU.
 *
 * This is the single source of truth for the current game session.
 * Each property corresponds to a domain-specific state slice that
 * is updated independently by the appropriate journal event handlers.
 */
export interface GameState {
  /** Commander identity, ranks, reputation, and account info. */
  commander: CommanderState;
  /** Current ship state: type, modules, fuel, cargo. */
  ship: ShipState;
  /** Current location: system, body, station, docking/landing flags. */
  location: LocationState;
  /** Material inventory: raw, manufactured, encoded. */
  materials: MaterialsState;
  /** Active missions. */
  missions: MissionState[];
  /** Session-level aggregated statistics. */
  session: SessionState;
  /** Fleet carrier state (null if commander has no carrier). */
  carrier: CarrierState | null;
  /** Odyssey on-foot state. */
  odyssey: OdysseyState;
  /** Whether the game state has been initialized (first Location/LoadGame received). */
  initialized: boolean;
  /** Timestamp of the last state update. */
  lastUpdated: string;
}
