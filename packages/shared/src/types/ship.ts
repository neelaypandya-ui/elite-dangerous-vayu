/**
 * @vayu/shared — Ship Types
 *
 * Types for ship state, modules, hardpoints, and the full list of playable
 * Elite Dangerous ships. Field names align with the journal Loadout event.
 */

// ---------------------------------------------------------------------------
// Module Types
// ---------------------------------------------------------------------------

/** Engineering modification applied to a ship module. */
export interface ModuleEngineering {
  /** Engineer name. */
  engineer: string | null;
  /** Engineer ID. */
  engineerId: number | null;
  /** Blueprint internal name. */
  blueprintName: string;
  /** Blueprint numeric ID. */
  blueprintId: number;
  /** Engineering level (1-5). */
  level: number;
  /** Quality / roll quality (0.0-1.0). */
  quality: number;
  /** Stat modifiers produced by this blueprint. */
  modifiers: ModuleModifier[];
  /** Experimental effect name (null if none). */
  experimentalEffect: string | null;
  /** Localised experimental effect name. */
  experimentalEffectLocalised: string | null;
}

/** A single stat modifier from engineering. */
export interface ModuleModifier {
  /** Stat label (e.g. "DamagePerSecond"). */
  label: string;
  /** Current modified value. */
  value: number;
  /** Original unmodified value. */
  originalValue: number;
  /** 1 if lower is better, 0 otherwise. */
  lessIsGood: number;
}

/** Base interface for any equipped module. */
export interface ShipModule {
  /** Slot identifier (e.g. "MediumHardpoint1", "MainEngines"). */
  slot: string;
  /** Internal item identifier. */
  item: string;
  /** Whether the module is powered on. */
  on: boolean;
  /** Power priority group (1-5). */
  priority: number;
  /** Module health (0.0-1.0). */
  health: number;
  /** Purchase value in credits. */
  value: number;
  /** Ammo currently in magazine/clip (weapons only). */
  ammoInClip: number | null;
  /** Ammo in reserve hopper (weapons only). */
  ammoInHopper: number | null;
  /** Engineering data (null if unengineered). */
  engineering: ModuleEngineering | null;
}

/** A weapon hardpoint (small / medium / large / huge). */
export interface Hardpoint extends ShipModule {
  /** Size class: 1=Small, 2=Medium, 3=Large, 4=Huge. */
  size: 1 | 2 | 3 | 4;
  /** Mount type. */
  mount: 'Fixed' | 'Gimballed' | 'Turreted';
}

/** A utility mount (point defence, chaff, heat sink, etc.). */
export interface UtilityMount extends ShipModule {
  /** Always size 0. */
  size: 0;
}

/** A core internal module (power plant, thrusters, FSD, etc.). */
export interface CoreModule extends ShipModule {
  /** Module class (1-8). */
  class: number;
  /** Module rating (A-E). */
  rating: string;
}

/** An optional internal module (shield gen, cargo rack, etc.). */
export interface OptionalModule extends ShipModule {
  /** Module class (1-8). */
  class: number;
  /** Module rating (A-E). */
  rating: string;
}

// ---------------------------------------------------------------------------
// Fuel & Cargo
// ---------------------------------------------------------------------------

/** Fuel state of the ship. */
export interface FuelState {
  /** Main fuel tank level in tons. */
  main: number;
  /** Reserve tank level in tons. */
  reserve: number;
  /** Main tank capacity in tons. */
  mainCapacity: number;
  /** Reserve tank capacity in tons. */
  reserveCapacity: number;
}

/** A single cargo item in the hold. */
export interface CargoItem {
  /** Commodity internal name. */
  name: string;
  /** Localised display name. */
  nameLocalised: string | null;
  /** Number of tons held. */
  count: number;
  /** Number of stolen units in this stack. */
  stolen: number;
  /** Associated mission ID if mission cargo. */
  missionId: number | null;
}

// ---------------------------------------------------------------------------
// Ship State
// ---------------------------------------------------------------------------

/** Full state of the commander's current ship. */
export interface ShipState {
  /** Internal ship type identifier (e.g. "Anaconda", "CobraMkIII"). */
  ship: string;
  /** Localised ship name. */
  shipLocalised: string | null;
  /** Unique ship ID (stable across sessions for this hull). */
  shipId: number;
  /** Player-assigned ship name. */
  shipName: string;
  /** Player-assigned ship ID tag. */
  shipIdent: string;
  /** Hull value in credits. */
  hullValue: number;
  /** Total modules value in credits. */
  modulesValue: number;
  /** Insurance rebuy cost. */
  rebuy: number;
  /** Hull health (0.0-1.0). */
  hullHealth: number;
  /** Unladen mass in tons. */
  unladenMass: number;
  /** Maximum cargo capacity in tons. */
  cargoCapacity: number;
  /** Maximum jump range in LY. */
  maxJumpRange: number;
  /** Current fuel state. */
  fuel: FuelState;
  /** All equipped modules indexed by slot name. */
  modules: ShipModule[];
  /** Current cargo manifest. */
  cargo: CargoItem[];
  /** Total cargo count. */
  cargoCount: number;
  /** Whether the ship is flagged as hot (wanted). */
  hot: boolean;

  // -- Real-time Status.json flags --

  /** Whether hardpoints are currently deployed. */
  hardpointsDeployed: boolean;
  /** Whether landing gear is currently down. */
  landingGearDown: boolean;
  /** Whether shields are currently up. */
  shieldsUp: boolean;
  /** Whether cargo scoop is currently open. */
  cargoScoopOpen: boolean;
  /** Whether ship lights are currently on. */
  lightsOn: boolean;
  /** Whether the FSD is currently charging. */
  fsdCharging: boolean;
  /** Whether the FSD is on cooldown after a jump. */
  fsdCooldown: boolean;
  /** Whether the FSD is mass-locked by a nearby body. */
  fsdMassLocked: boolean;
  /** Whether silent running is currently active. */
  silentRunning: boolean;
  /** Whether night vision is currently active. */
  nightVision: boolean;
}

// ---------------------------------------------------------------------------
// Ship Info (static reference data)
// ---------------------------------------------------------------------------

/** Ship manufacturer enum. */
export type ShipManufacturer =
  | 'Core Dynamics'
  | 'Faulcon DeLacy'
  | 'Gutamaya'
  | 'Lakon Spaceways'
  | 'Saud Kruger'
  | 'Zorgon Peterson'
  | 'DeLacy';

/** Size class of the ship for landing pads. */
export type ShipSize = 'Small' | 'Medium' | 'Large';

/** Static information about a ship model. */
export interface ShipInfo {
  /** Internal type identifier used by the journal. */
  id: string;
  /** Display name. */
  name: string;
  /** Manufacturer. */
  manufacturer: ShipManufacturer;
  /** Landing pad size requirement. */
  size: ShipSize;
  /** Base purchase cost in credits. */
  cost: number;
  /** Number of hardpoints by size [small, medium, large, huge]. */
  hardpoints: [number, number, number, number];
  /** Number of utility mounts. */
  utilityMounts: number;
  /** Core module sizes [powerplant, thrusters, fsd, lifesupport, powerDistributor, sensors, fuelTank]. */
  coreModuleSizes: [number, number, number, number, number, number, number];
  /** Optional internal slot sizes (sorted largest first). */
  optionalInternalSizes: number[];
  /** Military compartment sizes (empty array if none). */
  militarySlotSizes: number[];
  /** Base crew capacity. */
  crewSeats: number;
  /** Whether the ship can carry a fighter hangar. */
  fighterHangar: boolean;
  /** Base hull mass in tons. */
  hullMass: number;
  /** Base shield strength in MJ. */
  baseShieldStrength: number;
  /** Base armour strength. */
  baseArmour: number;
  /** Maximum fuel tank size in tons. */
  fuelCapacity: number;
  /** Top speed (base, m/s). */
  topSpeed: number;
  /** Boost speed (base, m/s). */
  boostSpeed: number;
  /** Agility rating (0-10, informational). */
  agility: number;
}

/** All playable ship identifiers as used in journal Ship field. */
export type ShipType =
  | 'Adder'
  | 'Anaconda'
  | 'Asp'
  | 'Asp_Scout'
  | 'BelugaLiner'
  | 'CobraMkIII'
  | 'CobraMkIV'
  | 'Cutter'
  | 'DiamondBack'
  | 'DiamondBackXL'
  | 'Dolphin'
  | 'Eagle'
  | 'Empire_Courier'
  | 'Empire_Eagle'
  | 'Empire_Fighter'
  | 'Empire_Trader'
  | 'Federation_Corvette'
  | 'Federation_Dropship'
  | 'Federation_Dropship_MkII'
  | 'Federation_Gunship'
  | 'Federation_Fighter'
  | 'FerDeLance'
  | 'Hauler'
  | 'Independant_Trader'
  | 'Krait_Light'
  | 'Krait_MkII'
  | 'Mamba'
  | 'Orca'
  | 'Python'
  | 'Python_NX'
  | 'SideWinder'
  | 'Type6'
  | 'Type7'
  | 'Type9'
  | 'Type9_Military'
  | 'TypeX'
  | 'TypeX_2'
  | 'TypeX_3'
  | 'Viper'
  | 'Viper_MkIV'
  | 'Vulture';

/** Mapping from ShipType identifier to its display name. */
export const SHIP_DISPLAY_NAMES: Record<ShipType, string> = {
  Adder: 'Adder',
  Anaconda: 'Anaconda',
  Asp: 'Asp Explorer',
  Asp_Scout: 'Asp Scout',
  BelugaLiner: 'Beluga Liner',
  CobraMkIII: 'Cobra Mk III',
  CobraMkIV: 'Cobra Mk IV',
  Cutter: 'Imperial Cutter',
  DiamondBack: 'Diamondback Scout',
  DiamondBackXL: 'Diamondback Explorer',
  Dolphin: 'Dolphin',
  Eagle: 'Eagle',
  Empire_Courier: 'Imperial Courier',
  Empire_Eagle: 'Imperial Eagle',
  Empire_Fighter: 'Imperial Fighter',
  Empire_Trader: 'Imperial Clipper',
  Federation_Corvette: 'Federal Corvette',
  Federation_Dropship: 'Federal Dropship',
  Federation_Dropship_MkII: 'Federal Assault Ship',
  Federation_Gunship: 'Federal Gunship',
  Federation_Fighter: 'F63 Condor',
  FerDeLance: 'Fer-de-Lance',
  Hauler: 'Hauler',
  Independant_Trader: 'Keelback',
  Krait_Light: 'Krait Phantom',
  Krait_MkII: 'Krait Mk II',
  Mamba: 'Mamba',
  Orca: 'Orca',
  Python: 'Python',
  Python_NX: 'Python Mk II',
  SideWinder: 'Sidewinder',
  Type6: 'Type-6 Transporter',
  Type7: 'Type-7 Transporter',
  Type9: 'Type-9 Heavy',
  Type9_Military: 'Type-10 Defender',
  TypeX: 'Alliance Chieftain',
  TypeX_2: 'Alliance Crusader',
  TypeX_3: 'Alliance Challenger',
  Viper: 'Viper Mk III',
  Viper_MkIV: 'Viper Mk IV',
  Vulture: 'Vulture',
};
