/**
 * @vayu/shared — Name Resolver Utilities
 *
 * Resolve internal Elite Dangerous identifiers into human-readable names.
 *
 * The game uses a localization-string pattern for many names:
 *   "$sidewinder_name;"   -> "Sidewinder"
 *   "$hpt_beamlaser_gimbal_large_name;" -> "Large Gimballed Beam Laser"
 *
 * This module provides best-effort resolution by leveraging the static
 * data in the constants package (ships, materials) plus pattern-based
 * heuristics for module names.
 */

import { SHIP_BY_ID } from '../constants/ships.js';
import { MATERIAL_BY_NAME } from '../constants/materials.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strip the ED localization wrapper from a string.
 *
 * Examples:
 *   "$sidewinder_name;"       -> "sidewinder"
 *   "$hpt_beamlaser_gimbal_large_name;" -> "hpt_beamlaser_gimbal_large"
 *   "already_clean"           -> "already_clean"
 */
function stripLocalizationWrapper(str: string): string {
  let result = str;
  if (result.startsWith('$')) {
    result = result.slice(1);
  }
  if (result.endsWith(';')) {
    result = result.slice(0, -1);
  }
  // Remove trailing _name suffix (common ED convention).
  if (result.endsWith('_name')) {
    result = result.slice(0, -5);
  }
  return result;
}

/**
 * Convert an underscore_separated or camelCase identifier to Title Case.
 * Handles common ED abbreviations.
 */
function identifierToTitle(id: string): string {
  // Replace underscores with spaces, then title-case each word.
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Module name resolution
// ---------------------------------------------------------------------------

/** Map of known module size prefixes. */
const MODULE_SIZES: Record<string, string> = {
  tiny: 'Tiny',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  huge: 'Huge',
};

/** Map of known module mount types. */
const MODULE_MOUNTS: Record<string, string> = {
  fixed: 'Fixed',
  gimbal: 'Gimballed',
  turret: 'Turreted',
};

/** Map of known module type prefixes in journal names. */
const MODULE_TYPES: Record<string, string> = {
  beamlaser: 'Beam Laser',
  pulselaser: 'Pulse Laser',
  burstlaser: 'Burst Laser',
  cannon: 'Cannon',
  multicannon: 'Multi-Cannon',
  railgun: 'Rail Gun',
  plasmaaccelerator: 'Plasma Accelerator',
  fragcannon: 'Fragment Cannon',
  minelauncher: 'Mine Launcher',
  missilerack: 'Missile Rack',
  torpedopylon: 'Torpedo Pylon',
  chafflauncher: 'Chaff Launcher',
  heatsinklauncher: 'Heat Sink Launcher',
  pointdefence: 'Point Defence',
  electroniccountermeasure: 'Electronic Countermeasure',
  shieldbooster: 'Shield Booster',
  killwarrantscanner: 'Kill Warrant Scanner',
  cargoscanner: 'Cargo Scanner',
  wakescanner: 'Frame Shift Wake Analyser',
  cloudscanner: 'Composition Scanner',
  // Core modules
  armour: 'Armour',
  powerplant: 'Power Plant',
  engine: 'Thrusters',
  hyperdrive: 'Frame Shift Drive',
  lifesupport: 'Life Support',
  powerdistributor: 'Power Distributor',
  sensors: 'Sensors',
  fueltank: 'Fuel Tank',
  // Optional modules
  shieldgenerator: 'Shield Generator',
  hullreinforcement: 'Hull Reinforcement Package',
  modulereinforcement: 'Module Reinforcement Package',
  guardianshieldreinforcement: 'Guardian Shield Reinforcement',
  guardianhullreinforcement: 'Guardian Hull Reinforcement',
  guardianfsdbooster: 'Guardian FSD Booster',
  fuelscoop: 'Fuel Scoop',
  refinery: 'Refinery',
  fsdinterdictor: 'FSD Interdictor',
  hatchbreaker: 'Hatch Breaker Limpet Controller',
  collectorlimpet: 'Collector Limpet Controller',
  prospectorlimpet: 'Prospector Limpet Controller',
  fueltransferlimpet: 'Fuel Transfer Limpet Controller',
  repairdrone: 'Repair Limpet Controller',
  researchlimpet: 'Research Limpet Controller',
  decontaminationlimpet: 'Decontamination Limpet Controller',
  reconlimpet: 'Recon Limpet Controller',
  detailedsurfacescanner: 'Detailed Surface Scanner',
  supercruiseassist: 'Supercruise Assist',
  dockingcomputer: 'Docking Computer',
  cargorack: 'Cargo Rack',
  passengercabin: 'Passenger Cabin',
  planetapproachsuite: 'Planetary Approach Suite',
  fighterhanger: 'Fighter Hangar',
  buggybay: 'Planetary Vehicle Hangar',
  corrosionproofcargorack: 'Corrosion Resistant Cargo Rack',
  // Mining
  mininglaser: 'Mining Laser',
  abrasionblaster: 'Abrasion Blaster',
  seismicchargeLauncher: 'Seismic Charge Launcher',
  subsurfacelauncher: 'Sub-Surface Displacement Missile',
  pulsewave: 'Pulse Wave Analyser',
};

/**
 * Attempt to resolve a module internal name to a human-readable string.
 *
 * Handles the common patterns:
 *   - `$hpt_{type}_{mount}_{size}_name;`  (hardpoints)
 *   - `$int_{type}_size{N}_class{C}_name;` (internal modules)
 *   - Plain identifier fallback with title-case conversion.
 *
 * @param internalId - The raw module name from the journal.
 */
export function resolveModuleName(internalId: string): string {
  const stripped = stripLocalizationWrapper(internalId).toLowerCase();

  // --- Hardpoint pattern: hpt_{type}_{mount}_{size} ---
  const hptMatch = /^hpt_(\w+?)_(fixed|gimbal|turret)_(tiny|small|medium|large|huge)$/.exec(stripped);
  if (hptMatch) {
    const [, typeKey, mountKey, sizeKey] = hptMatch;
    const typeName = MODULE_TYPES[typeKey] ?? identifierToTitle(typeKey);
    const mountName = MODULE_MOUNTS[mountKey] ?? identifierToTitle(mountKey);
    const sizeName = MODULE_SIZES[sizeKey] ?? identifierToTitle(sizeKey);
    return `${sizeName} ${mountName} ${typeName}`;
  }

  // --- Utility hardpoint pattern: hpt_{type}_{size} (no mount) ---
  const hptUtilMatch = /^hpt_(\w+?)_(tiny|small|medium|large|huge)$/.exec(stripped);
  if (hptUtilMatch) {
    const [, typeKey, sizeKey] = hptUtilMatch;
    const typeName = MODULE_TYPES[typeKey] ?? identifierToTitle(typeKey);
    const sizeName = MODULE_SIZES[sizeKey] ?? identifierToTitle(sizeKey);
    return `${sizeName} ${typeName}`;
  }

  // --- Internal module pattern: int_{type}_size{N}_class{C} ---
  const intMatch = /^int_(\w+?)_size(\d+)_class(\d+)$/.exec(stripped);
  if (intMatch) {
    const [, typeKey, sizeStr, classStr] = intMatch;
    const typeName = MODULE_TYPES[typeKey] ?? identifierToTitle(typeKey);
    const classLetter = String.fromCharCode(69 - parseInt(classStr, 10) + 1); // 1->E, 2->D, 3->C, 4->B, 5->A
    return `${sizeStr}${classLetter} ${typeName}`;
  }

  // --- Bare "int_{type}" pattern (e.g. int_planetapproachsuite) ---
  const intBareMatch = /^int_(\w+)$/.exec(stripped);
  if (intBareMatch) {
    const [, typeKey] = intBareMatch;
    return MODULE_TYPES[typeKey] ?? identifierToTitle(typeKey);
  }

  // Fallback: title-case the stripped identifier.
  return identifierToTitle(stripped);
}

// ---------------------------------------------------------------------------
// Ship name resolution
// ---------------------------------------------------------------------------

/**
 * Case-insensitive map from lowercase ship journal IDs to display names.
 * Built once from the SHIPS constant.
 */
const SHIP_NAME_MAP: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [key, data] of SHIP_BY_ID) {
    map.set(key.toLowerCase(), data.displayName);
  }
  return map;
})();

/**
 * Resolve a ship internal name to a human-readable display name.
 *
 * Handles both raw journal identifiers (`sidewinder`, `CobraMkIII`) and
 * localized strings (`$sidewinder_name;`).
 *
 * Falls back to title-casing the cleaned identifier if no match is found.
 *
 * @param internalId - The ship identifier from the journal.
 */
export function resolveShipName(internalId: string): string {
  const stripped = stripLocalizationWrapper(internalId);
  const lower = stripped.toLowerCase();

  // Direct lookup.
  const match = SHIP_NAME_MAP.get(lower);
  if (match) return match;

  // Fallback: title-case.
  return identifierToTitle(stripped);
}

// ---------------------------------------------------------------------------
// Material name resolution
// ---------------------------------------------------------------------------

/**
 * Case-insensitive map from lowercase material names to display names.
 * Built once from the ALL_MATERIALS constant.
 */
const MATERIAL_NAME_MAP: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [key, data] of MATERIAL_BY_NAME) {
    map.set(key.toLowerCase(), data.displayName);
  }
  return map;
})();

/**
 * Resolve a material internal name to a human-readable display name.
 *
 * Handles both raw names (`iron`, `biotechconductors`) and localized
 * strings (`$iron_name;`).
 *
 * Falls back to title-casing the cleaned identifier if no match is found.
 *
 * @param internalId - The material name from the journal.
 */
export function resolveMaterialName(internalId: string): string {
  const stripped = stripLocalizationWrapper(internalId);
  const lower = stripped.toLowerCase();

  const match = MATERIAL_NAME_MAP.get(lower);
  if (match) return match;

  // Fallback: title-case.
  return identifierToTitle(stripped);
}

// ---------------------------------------------------------------------------
// Localized string cleaning
// ---------------------------------------------------------------------------

/**
 * Clean an Elite Dangerous localized string by removing the `$` prefix,
 * `_name;` suffix, and converting underscores to spaces with title case.
 *
 * Use this as a generic fallback when no specific resolver is available.
 *
 * @param str - The raw localized string.
 */
export function cleanLocalizedString(str: string): string {
  const stripped = stripLocalizationWrapper(str);
  return identifierToTitle(stripped);
}

// ---------------------------------------------------------------------------
// Formatting utilities
// ---------------------------------------------------------------------------

/**
 * Format a credit amount for display.
 *
 * Normal mode (short = false): "1,234,567 CR"
 * Short mode (short = true):   "1.23M CR"
 *
 * Short mode uses abbreviations:
 *   K = thousands, M = millions, B = billions, T = trillions.
 *
 * @param amount  - The credit amount (integer).
 * @param short   - Whether to use abbreviated notation (default: false).
 */
export function formatCredits(amount: number, short: boolean = false): string {
  if (short) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (abs >= 1_000_000_000_000) {
      return `${sign}${(abs / 1_000_000_000_000).toFixed(2)}T CR`;
    }
    if (abs >= 1_000_000_000) {
      return `${sign}${(abs / 1_000_000_000).toFixed(2)}B CR`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(2)}M CR`;
    }
    if (abs >= 1_000) {
      return `${sign}${(abs / 1_000).toFixed(2)}K CR`;
    }
    return `${sign}${abs} CR`;
  }

  // Full comma-separated format.
  const formatted = Math.abs(amount)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatted} CR`;
}

/**
 * Format a distance in light years for display.
 *
 * - >= 1 LY:    "12.34 LY"
 * - >= 0.001:   "0.543 LY"
 * - < 0.001:    "1,234 LS" (converted to light seconds, 1 LY ~ 31,557,600 LS)
 *
 * @param ly - Distance in light years.
 */
export function formatDistance(ly: number): string {
  const abs = Math.abs(ly);

  if (abs >= 1) {
    return `${ly.toFixed(2)} LY`;
  }

  if (abs >= 0.001) {
    return `${ly.toFixed(3)} LY`;
  }

  // Convert to light-seconds.
  // 1 LY = speed of light * 1 Julian year = 31,557,600 LS (approx).
  const ls = ly * 31_557_600;
  const formatted = Math.abs(ls)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = ly < 0 ? '-' : '';
  return `${sign}${formatted} LS`;
}
