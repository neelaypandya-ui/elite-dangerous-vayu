/**
 * @vayu/shared — Constants Barrel Export
 *
 * Re-exports all shared constants and static data for convenient single-import usage:
 *   import { ALL_EVENT_NAMES, SHIPS, ALL_ENGINEERS, ... } from '@vayu/shared';
 */

// Event name constants and categories
export {
  STARTUP_EVENTS,
  TRAVEL_EVENTS,
  COMBAT_EVENTS,
  EXPLORATION_EVENTS,
  TRADE_EVENTS,
  STATION_EVENTS,
  MINING_EVENTS,
  CARRIER_EVENTS,
  ODYSSEY_EVENTS,
  POWERPLAY_EVENTS,
  OTHER_EVENTS,
  ALL_EVENT_NAMES,
  EVENT_CATEGORY_MAP,
} from './event-names.js';
export type {
  StartupEventName,
  TravelEventName,
  CombatEventName,
  ExplorationEventName,
  TradeEventName,
  StationEventName,
  MiningEventName,
  CarrierEventName,
  OdysseyEventName,
  PowerplayEventName,
  OtherEventName,
  AllEventName,
  EventCategory,
} from './event-names.js';

// Default file paths
export {
  DEFAULT_JOURNAL_DIR,
  DEFAULT_BINDINGS_FILE,
  DEFAULT_GRAPHICS_OVERRIDE,
  DEFAULT_SCREENSHOTS_DIR,
  COMPANION_FILES,
  DEFAULT_PATHS,
} from './paths.js';

// Ship database
export {
  SHIPS,
  SHIP_BY_ID,
  getShipById,
  getShipByName,
} from './ships.js';
export type { ShipData } from './ships.js';

// Materials database
export {
  RAW_MATERIALS,
  MANUFACTURED_MATERIALS,
  ENCODED_MATERIALS,
  ALL_MATERIALS,
  MATERIAL_BY_NAME,
  getMaterialByName,
  getMaterialsByCategory,
  getMaterialsByGrade,
} from './materials.js';
export type { MaterialData } from './materials.js';

// Rank systems
export {
  COMBAT_RANK_SYSTEM,
  TRADE_RANK_SYSTEM,
  EXPLORE_RANK_SYSTEM,
  CQC_RANK_SYSTEM,
  FEDERATION_RANK_SYSTEM,
  EMPIRE_RANK_SYSTEM,
  EXOBIOLOGIST_RANK_SYSTEM,
  SOLDIER_RANK_SYSTEM,
  ALL_RANK_SYSTEMS,
  RANK_SYSTEM_BY_CATEGORY,
  getRankName,
  getMaxRank,
  isEliteRank,
} from './ranks.js';
export type { RankLevel, RankSystem } from './ranks.js';

// Engineer database
export {
  HORIZONS_ENGINEERS,
  ODYSSEY_ENGINEERS,
  ALL_ENGINEERS,
  ENGINEER_BY_ID,
  ENGINEER_BY_NAME,
  getEngineerById,
  getEngineerByName,
  getEngineersForSpecialty,
  getReferralChain,
} from './engineers.js';
export type { EngineerData } from './engineers.js';

// Binding wizard phases and actions
export {
  WIZARD_PHASES,
  WIZARD_TOTAL_ACTIONS,
} from './wizard-actions.js';
export type {
  WizardSlotType,
  WizardAction,
  WizardPhase,
} from './wizard-actions.js';
