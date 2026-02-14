/**
 * @vayu/shared — Odyssey On-Foot Types
 *
 * Types for Odyssey-specific state: suits, weapons, backpack inventory,
 * on-foot materials, and player status while disembarked.
 */

// ---------------------------------------------------------------------------
// Suit Types
// ---------------------------------------------------------------------------

/** Suit class names. */
export type SuitType =
  | 'flightsuit'
  | 'explorationsuit'
  | 'tacticalsuit'
  | 'utilitysuit';

/** Suit class display names. */
export const SUIT_DISPLAY_NAMES: Record<SuitType, string> = {
  flightsuit: 'Flight Suit',
  explorationsuit: 'Artemis Suit',
  tacticalsuit: 'Dominator Suit',
  utilitysuit: 'Maverick Suit',
};

/** A suit owned by the commander. */
export interface Suit {
  /** Unique suit ID. */
  suitId: number;
  /** Internal suit name. */
  name: string;
  /** Localised suit name. */
  nameLocalised: string | null;
  /** Suit type classification. */
  type: SuitType;
  /** Suit class/grade (1-5). */
  class: number;
  /** Installed suit modifications. */
  mods: string[];
}

// ---------------------------------------------------------------------------
// Weapon Types
// ---------------------------------------------------------------------------

/** On-foot weapon categories. */
export type WeaponType =
  | 'primary'
  | 'secondary';

/** Weapon damage type. */
export type WeaponDamageType =
  | 'kinetic'
  | 'plasma'
  | 'laser'
  | 'explosive'
  | 'shock';

/** An on-foot weapon. */
export interface Weapon {
  /** Unique weapon module ID. */
  suitModuleId: number;
  /** Internal module name. */
  name: string;
  /** Localised weapon name. */
  nameLocalised: string | null;
  /** Module class/grade (1-5). */
  class: number;
  /** Installed weapon modifications. */
  mods: string[];
  /** Weapon slot name. */
  slotName: string;
}

// ---------------------------------------------------------------------------
// Suit Loadout
// ---------------------------------------------------------------------------

/** A complete suit loadout (suit + weapons). */
export interface SuitLoadout {
  /** Loadout ID. */
  loadoutId: number;
  /** Player-assigned loadout name. */
  loadoutName: string;
  /** Suit details. */
  suit: Suit;
  /** Equipped weapon modules. */
  weapons: Weapon[];
}

// ---------------------------------------------------------------------------
// Backpack & Inventory
// ---------------------------------------------------------------------------

/** Categories of backpack items. */
export type BackpackItemType = 'Item' | 'Component' | 'Consumable' | 'Data';

/** A single item in the backpack. */
export interface BackpackItem {
  /** Internal item name. */
  name: string;
  /** Localised display name. */
  nameLocalised: string | null;
  /** Item type / category. */
  type: BackpackItemType;
  /** Owner ID (commander FID hash). */
  ownerId: number;
  /** Associated mission ID (null if not mission-related). */
  missionId: number | null;
  /** Quantity held. */
  count: number;
  /** Whether the item is stolen. */
  stolen: boolean;
}

// ---------------------------------------------------------------------------
// Odyssey Materials (Micro Resources)
// ---------------------------------------------------------------------------

/** On-foot material categories (micro resources). */
export type OdysseyMaterialCategory =
  | 'Component'
  | 'Item'
  | 'Data'
  | 'Consumable';

/** An Odyssey micro-resource / material. */
export interface OdysseyMaterial {
  /** Internal name. */
  name: string;
  /** Localised display name. */
  nameLocalised: string | null;
  /** Material category. */
  category: OdysseyMaterialCategory;
  /** Current count. */
  count: number;
}

// ---------------------------------------------------------------------------
// Exobiology
// ---------------------------------------------------------------------------

/** A biological species scan in progress or completed. */
export interface ExobiologyScan {
  /** Genus name. */
  genus: string;
  /** Localised genus name. */
  genusLocalised: string | null;
  /** Species name. */
  species: string;
  /** Localised species name. */
  speciesLocalised: string | null;
  /** Variant name (if identified). */
  variant: string | null;
  /** Localised variant name. */
  variantLocalised: string | null;
  /** System address where scanned. */
  systemAddress: number;
  /** Body ID where scanned. */
  bodyId: number;
  /** Scan stage: Log (1/3), Sample (2/3), Analyse (3/3). */
  scanType: 'Log' | 'Sample' | 'Analyse';
  /** Whether the analysis is complete. */
  complete: boolean;
  /** Timestamp of the latest scan step. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Odyssey State
// ---------------------------------------------------------------------------

/** Full Odyssey on-foot state tracked by VAYU. */
export interface OdysseyState {
  /** Whether the commander is currently on foot. */
  onFoot: boolean;
  /** Current suit loadout (null if in ship/SRV). */
  currentLoadout: SuitLoadout | null;
  /** All owned suits. */
  suits: Suit[];
  /** All configured loadouts. */
  loadouts: SuitLoadout[];
  /** Current backpack contents. */
  backpack: BackpackItem[];
  /** Odyssey material inventory (micro resources). */
  materials: OdysseyMaterial[];
  /** Active exobiology scans in progress. */
  activeScans: ExobiologyScan[];
  /** Total number of unique species analysed. */
  speciesAnalysed: number;
}
