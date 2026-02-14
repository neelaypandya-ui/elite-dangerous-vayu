/**
 * @vayu/shared — Engineering Materials Database
 *
 * Complete catalogue of all Raw, Manufactured, and Encoded materials
 * used in Elite Dangerous engineering. Each entry includes grade,
 * maximum storage count, a brief description, and known sources.
 *
 * Data sourced from:
 * - Elite Dangerous Wiki
 * - Inara.cz materials database
 * - In-game journal material names
 */

import type { MaterialCategory, MaterialGrade } from '../types/materials.js';

// ---------------------------------------------------------------------------
// Material Data Interface
// ---------------------------------------------------------------------------

/** Static reference data for a single engineering material. */
export interface MaterialData {
  /** Internal name (lowercase, no spaces) as used in journal events. */
  name: string;
  /** Human-readable display name. */
  displayName: string;
  /** Top-level category. */
  category: MaterialCategory;
  /** Rarity grade (1 = Very Common, 5 = Very Rare). */
  grade: MaterialGrade;
  /** Maximum storable count. Grade 1=300, 2=250, 3=200, 4=150, 5=100. */
  maxCount: number;
  /** Brief description of the material. */
  description: string;
  /** Known sources where this material can be found. */
  knownSources: string[];
}

// ---------------------------------------------------------------------------
// Max count helper
// ---------------------------------------------------------------------------

const MAX_BY_GRADE: Record<MaterialGrade, number> = {
  1: 300,
  2: 250,
  3: 200,
  4: 150,
  5: 100,
};

// ---------------------------------------------------------------------------
// Raw Materials
// ---------------------------------------------------------------------------

/** All raw materials obtainable from planetary surfaces, asteroids, and bodies. */
export const RAW_MATERIALS: readonly MaterialData[] = [
  // Grade 1
  { name: 'carbon', displayName: 'Carbon', category: 'Raw', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Common element found on planetary surfaces.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'iron', displayName: 'Iron', category: 'Raw', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Abundant metal found across many body types.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'nickel', displayName: 'Nickel', category: 'Raw', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Common metallic element found on rocky bodies.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'phosphorus', displayName: 'Phosphorus', category: 'Raw', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Non-metallic element found on various body types.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'rhenium', displayName: 'Rhenium', category: 'Raw', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Dense metallic element found on planetary surfaces.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'lead', displayName: 'Lead', category: 'Raw', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Heavy metal found on various planetary bodies.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'sulphur', displayName: 'Sulphur', category: 'Raw', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Non-metallic element common on volcanic bodies.', knownSources: ['Planetary surfaces', 'Volcanic fumaroles'] },
  // Grade 2
  { name: 'chromium', displayName: 'Chromium', category: 'Raw', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Transition metal used in alloy production.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'germanium', displayName: 'Germanium', category: 'Raw', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Metalloid element found in mineral deposits.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'manganese', displayName: 'Manganese', category: 'Raw', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Transition metal found on rocky bodies.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'vanadium', displayName: 'Vanadium', category: 'Raw', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Hard transition metal found in mineral deposits.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'zinc', displayName: 'Zinc', category: 'Raw', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Common transition metal found on planetary surfaces.', knownSources: ['Planetary surfaces', 'Asteroid mining'] },
  { name: 'arsenic', displayName: 'Arsenic', category: 'Raw', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Metalloid element found on rocky and icy bodies.', knownSources: ['Planetary surfaces'] },
  { name: 'zirconium', displayName: 'Zirconium', category: 'Raw', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Lustrous transition metal found in mineral deposits.', knownSources: ['Planetary surfaces'] },
  // Grade 3
  { name: 'cadmium', displayName: 'Cadmium', category: 'Raw', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Soft metal found in zinc-rich mineral deposits.', knownSources: ['Planetary surfaces (volcanic)', 'Geological signal sources'] },
  { name: 'mercury', displayName: 'Mercury', category: 'Raw', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Liquid metal found in trace amounts on hot bodies.', knownSources: ['Planetary surfaces (hot bodies)', 'Geological signal sources'] },
  { name: 'molybdenum', displayName: 'Molybdenum', category: 'Raw', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Hard refractory metal used in high-strength alloys.', knownSources: ['Planetary surfaces', 'Geological signal sources'] },
  { name: 'niobium', displayName: 'Niobium', category: 'Raw', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Soft transition metal used in superconducting alloys.', knownSources: ['Planetary surfaces', 'Geological signal sources'] },
  { name: 'tin', displayName: 'Tin', category: 'Raw', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Malleable metal found on various body types.', knownSources: ['Planetary surfaces', 'Geological signal sources'] },
  { name: 'tungsten', displayName: 'Tungsten', category: 'Raw', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Dense refractory metal with extremely high melting point.', knownSources: ['Planetary surfaces', 'Geological signal sources'] },
  // Grade 4
  { name: 'antimony', displayName: 'Antimony', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Lustrous metalloid used in advanced alloys.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
  { name: 'polonium', displayName: 'Polonium', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Highly radioactive metalloid found in trace quantities.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
  { name: 'ruthenium', displayName: 'Ruthenium', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Rare transition metal from the platinum group.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
  { name: 'selenium', displayName: 'Selenium', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Non-metallic element with semiconductor properties.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
  { name: 'technetium', displayName: 'Technetium', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Lightest element with no stable isotopes.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
  { name: 'tellurium', displayName: 'Tellurium', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Rare metalloid element found on specific body types.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
  { name: 'yttrium', displayName: 'Yttrium', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Silvery transition metal used in electronics.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
  { name: 'boron', displayName: 'Boron', category: 'Raw', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Metalloid element used in composite materials.', knownSources: ['Planetary surfaces (rare)', 'Material traders'] },
] as const;

// ---------------------------------------------------------------------------
// Manufactured Materials
// ---------------------------------------------------------------------------

/** All manufactured materials obtained from ships, signal sources, and synthesis. */
export const MANUFACTURED_MATERIALS: readonly MaterialData[] = [
  // Grade 1
  { name: 'basicconductors', displayName: 'Basic Conductors', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Simple electrical conductors salvaged from wreckage.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'chemicalstorageunits', displayName: 'Chemical Storage Units', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Standard containers for chemical compounds.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'compactcomposites', displayName: 'Compact Composites', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Lightweight composite materials from ship hulls.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'crystalshards', displayName: 'Crystal Shards', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Crystalline fragments with useful optical properties.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'gridresistors', displayName: 'Grid Resistors', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Power grid regulation components.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'heatconductionwiring', displayName: 'Heat Conduction Wiring', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Thermal management wiring from ship systems.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'mechanicalscrap', displayName: 'Mechanical Scrap', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Salvaged mechanical components.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'salvagedalloys', displayName: 'Salvaged Alloys', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Reclaimed alloy materials from ship wreckage.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'temperedalloys', displayName: 'Tempered Alloys', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Heat-treated alloys salvaged from destroyed ships.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'wornshieldemitters', displayName: 'Worn Shield Emitters', category: 'Manufactured', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Degraded shield emitter components.', knownSources: ['Ship salvage', 'Signal sources'] },
  // Grade 2
  { name: 'chemicalprocessors', displayName: 'Chemical Processors', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Processing units for chemical synthesis.', knownSources: ['Ship salvage', 'Signal sources', 'Mission rewards'] },
  { name: 'conductivecomponents', displayName: 'Conductive Components', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Higher-grade conductive materials.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'filamentcomposites', displayName: 'Filament Composites', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Advanced composite materials with filament reinforcement.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'flawedFocusCrystals', displayName: 'Flawed Focus Crystals', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Imperfect crystals usable in lower-grade engineering.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'galvanisingalloys', displayName: 'Galvanising Alloys', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Corrosion-resistant treated alloys.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'heatdispersionplate', displayName: 'Heat Dispersion Plate', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Thermal management plates for heat distribution.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'heatresistantceramics', displayName: 'Heat Resistant Ceramics', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Ceramic materials designed for extreme heat.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'hybridcapacitors', displayName: 'Hybrid Capacitors', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Dual-mode energy storage components.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'mechanicalequipment', displayName: 'Mechanical Equipment', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Functioning mechanical assemblies from ships.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'shieldemitters', displayName: 'Shield Emitters', category: 'Manufactured', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Standard shield projection components.', knownSources: ['Ship salvage', 'Signal sources'] },
  // Grade 3
  { name: 'chemicaldistillery', displayName: 'Chemical Distillery', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Advanced chemical separation equipment.', knownSources: ['Ship salvage', 'Encoded emission sources', 'Mission rewards'] },
  { name: 'conductiveceramics', displayName: 'Conductive Ceramics', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Electrically conductive ceramic compounds.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'electrochemicalarrays', displayName: 'Electrochemical Arrays', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Complex electrochemical cell arrays.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'focuscrystals', displayName: 'Focus Crystals', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Precision-cut crystals for energy focusing.', knownSources: ['Ship salvage', 'Mission rewards'] },
  { name: 'heatexchangers', displayName: 'Heat Exchangers', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Advanced thermal management components.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'highdensitycomposites', displayName: 'High Density Composites', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Dense composite materials for armour plating.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'mechanicalcomponents', displayName: 'Mechanical Components', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Precision mechanical parts.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'precipitatedalloys', displayName: 'Precipitated Alloys', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Chemically precipitated alloy compounds.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'shieldingsensors', displayName: 'Shielding Sensors', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Shield monitoring and calibration sensors.', knownSources: ['Ship salvage', 'Signal sources'] },
  { name: 'uncutfocuscrystals', displayName: 'Uncut Focus Crystals', category: 'Manufactured', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Raw focus crystals requiring cutting and polishing.', knownSources: ['Ship salvage', 'Signal sources'] },
  // Grade 4
  { name: 'chemicalmanipulators', displayName: 'Chemical Manipulators', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Molecular-level chemical manipulation equipment.', knownSources: ['Ship salvage (high-rank)', 'Mission rewards', 'Material traders'] },
  { name: 'compoundshielding', displayName: 'Compound Shielding', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Multi-layer shield reinforcement compounds.', knownSources: ['Ship salvage (high-rank)', 'Material traders'] },
  { name: 'conductivepolymers', displayName: 'Conductive Polymers', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Polymer-based conductors for advanced electronics.', knownSources: ['Ship salvage (high-rank)', 'Material traders'] },
  { name: 'configurablecomponents', displayName: 'Configurable Components', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Multi-purpose reconfigurable system components.', knownSources: ['Ship salvage (high-rank)', 'Material traders'] },
  { name: 'heatvanes', displayName: 'Heat Vanes', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Precision thermal dissipation vanes.', knownSources: ['Ship salvage (high-rank)', 'Material traders'] },
  { name: 'polymercapacitors', displayName: 'Polymer Capacitors', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'High-density polymer energy storage.', knownSources: ['Ship salvage (high-rank)', 'Material traders'] },
  { name: 'proprietarycomposites', displayName: 'Proprietary Composites', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Patented composite materials from military sources.', knownSources: ['Ship salvage (military)', 'Material traders'] },
  { name: 'refinedfocuscrystals', displayName: 'Refined Focus Crystals', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Precision-refined crystals for optimal focusing.', knownSources: ['Ship salvage (high-rank)', 'Material traders'] },
  { name: 'thermoelectricgenerators', displayName: 'Thermoelectric Generators', category: 'Manufactured', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Thermal-to-electric energy conversion devices.', knownSources: ['Ship salvage (high-rank)', 'Material traders'] },
  // Grade 5
  { name: 'biotechconductors', displayName: 'Biotech Conductors', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Bio-engineered conductive materials.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'exquisiteFocusCrystals', displayName: 'Exquisite Focus Crystals', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Flawless crystals with perfect optical properties.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'imperialshielding', displayName: 'Imperial Shielding', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Top-grade shield compounds from Imperial technology.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'improvisedcomponents', displayName: 'Improvised Components', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Makeshift but effective system components.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'militarygradealloys', displayName: 'Military Grade Alloys', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Top-secret military specification alloys.', knownSources: ['Ship salvage (military elite)', 'Material traders'] },
  { name: 'militarysupercapacitors', displayName: 'Military Supercapacitors', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Military-specification high-capacity energy storage.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'pharmaceuticalisolators', displayName: 'Pharmaceutical Isolators', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Precision pharmaceutical isolation equipment.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'protoheatradiators', displayName: 'Proto Heat Radiators', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Experimental prototype heat radiation systems.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'protolightalloys', displayName: 'Proto Light Alloys', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Experimental lightweight alloy materials.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'protoradiolicalloys', displayName: 'Proto Radiolic Alloys', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Experimental radiation-resistant alloys.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'coredynamicscomposites', displayName: 'Core Dynamics Composites', category: 'Manufactured', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Proprietary composites from Core Dynamics.', knownSources: ['Ship salvage (Federal elite)', 'Material traders'] },
] as const;

// ---------------------------------------------------------------------------
// Encoded Materials
// ---------------------------------------------------------------------------

/** All encoded (data) materials obtained from scanning ships, wakes, and data points. */
export const ENCODED_MATERIALS: readonly MaterialData[] = [
  // Grade 1
  { name: 'bulkscandata', displayName: 'Anomalous Bulk Scan Data', category: 'Encoded', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Unusual data fragments from bulk ship scans.', knownSources: ['Ship scans', 'Nav beacons'] },
  { name: 'disruptedwakeechoes', displayName: 'Atypical Disrupted Wake Echoes', category: 'Encoded', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Abnormal residual data from disrupted frame shift wakes.', knownSources: ['Frame shift wake scanning'] },
  { name: 'encryptedfiles', displayName: 'Distorted Shield Cycle Recordings', category: 'Encoded', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Corrupted recordings of shield cycling patterns.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'scrambledemissiondata', displayName: 'Exceptional Scrambled Emission Data', category: 'Encoded', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Garbled but recoverable emission data from ship systems.', knownSources: ['Ship scans', 'Nav beacons'] },
  { name: 'shieldcyclerecordings', displayName: 'Inconsistent Shield Soak Analysis', category: 'Encoded', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Imprecise analysis of shield damage absorption.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'legacyfirmware', displayName: 'Specialised Legacy Firmware', category: 'Encoded', grade: 1, maxCount: MAX_BY_GRADE[1], description: 'Outdated firmware from legacy ship systems.', knownSources: ['Ship scans', 'Data points'] },
  // Grade 2
  { name: 'archivedemissiondata', displayName: 'Irregular Emission Data', category: 'Encoded', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Archived emission data with irregular patterns.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'consumerfirmware', displayName: 'Modified Consumer Firmware', category: 'Encoded', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Consumer-grade firmware with custom modifications.', knownSources: ['Ship scans', 'Settlement data points'] },
  { name: 'encryptioncodes', displayName: 'Tagged Encryption Codes', category: 'Encoded', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Identified encryption keys from tagged transmissions.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'fsdtelemetry', displayName: 'Anomalous FSD Telemetry', category: 'Encoded', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Unusual data from frame shift drive sensors.', knownSources: ['Frame shift wake scanning'] },
  { name: 'scanarchives', displayName: 'Unidentified Scan Archives', category: 'Encoded', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Unidentified data from archived scan records.', knownSources: ['Ship scans', 'Nav beacons'] },
  { name: 'shieldsoakanalysis', displayName: 'Untypical Shield Scans', category: 'Encoded', grade: 2, maxCount: MAX_BY_GRADE[2], description: 'Shield scan data with unusual characteristics.', knownSources: ['Ship scans', 'Signal sources'] },
  // Grade 3
  { name: 'decodedemissiondata', displayName: 'Decoded Emission Data', category: 'Encoded', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Successfully decoded emission data from ship systems.', knownSources: ['Ship scans', 'Signal sources', 'Mission rewards'] },
  { name: 'emissiondata', displayName: 'Unexpected Emission Data', category: 'Encoded', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Ship emission data with unexpected characteristics.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'encryptionarchives', displayName: 'Open Symmetric Keys', category: 'Encoded', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Symmetric encryption keys from archived systems.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'industrialfirmware', displayName: 'Cracked Industrial Firmware', category: 'Encoded', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Industrial firmware with bypassed security.', knownSources: ['Ship scans', 'Settlement data points'] },
  { name: 'scandatabanks', displayName: 'Classified Scan Databanks', category: 'Encoded', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Classified scan data from restricted sources.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'shielddensityreports', displayName: 'Aberrant Shield Pattern Analysis', category: 'Encoded', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Shield pattern data showing aberrant behaviour.', knownSources: ['Ship scans', 'Signal sources'] },
  { name: 'wakesolutions', displayName: 'Strange Wake Solutions', category: 'Encoded', grade: 3, maxCount: MAX_BY_GRADE[3], description: 'Unusual mathematical solutions from wake analysis.', knownSources: ['Frame shift wake scanning'] },
  // Grade 4
  { name: 'classifiedscandata', displayName: 'Divergent Scan Data', category: 'Encoded', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Scan data that diverges significantly from norms.', knownSources: ['Ship scans (high-rank)', 'Material traders'] },
  { name: 'compactemissionsdata', displayName: 'Abnormal Compact Emissions Data', category: 'Encoded', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Highly compressed emission data with anomalies.', knownSources: ['Ship scans (high-rank)', 'Material traders'] },
  { name: 'embeddedfirmware', displayName: 'Modified Embedded Firmware', category: 'Encoded', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Deeply embedded firmware with custom modifications.', knownSources: ['Ship scans (high-rank)', 'Settlement data points'] },
  { name: 'encodedscandata', displayName: 'Classified Scan Fragment', category: 'Encoded', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Fragments of classified scanning data.', knownSources: ['Ship scans (high-rank)', 'Material traders'] },
  { name: 'hyperspacetrajectories', displayName: 'Eccentric Hyperspace Trajectories', category: 'Encoded', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Non-standard hyperspace trajectory calculations.', knownSources: ['Frame shift wake scanning (high-rank)'] },
  { name: 'shieldfrequencydata', displayName: 'Peculiar Shield Frequency Data', category: 'Encoded', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Shield frequency data with unusual spectral properties.', knownSources: ['Ship scans (high-rank)', 'Material traders'] },
  { name: 'symmetrickeys', displayName: 'Atypical Encryption Archives', category: 'Encoded', grade: 4, maxCount: MAX_BY_GRADE[4], description: 'Encryption archives with non-standard key schemes.', knownSources: ['Ship scans (high-rank)', 'Material traders'] },
  // Grade 5
  { name: 'adaptiveencryptors', displayName: 'Adaptive Encryptors Capture', category: 'Encoded', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Captured adaptive encryption algorithms.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'classifiedscanfragment', displayName: 'Classified Scan Fragment', category: 'Encoded', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Top-secret scan data fragments from classified sources.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'dataminedwake', displayName: 'Datamined Wake Exceptions', category: 'Encoded', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Data-mined anomalies from high-energy wake signals.', knownSources: ['Frame shift wake scanning (high energy)', 'Material traders'] },
  { name: 'securityfirmware', displayName: 'Security Firmware Patch', category: 'Encoded', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Critical security patches from high-value targets.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
  { name: 'shieldpatternanalysis', displayName: 'Consistent Shield Soak Analysis', category: 'Encoded', grade: 5, maxCount: MAX_BY_GRADE[5], description: 'Consistently high-quality shield damage analysis.', knownSources: ['Mission rewards (rare)', 'Material traders'] },
] as const;

// ---------------------------------------------------------------------------
// Combined & Lookup
// ---------------------------------------------------------------------------

/** All engineering materials across all categories. */
export const ALL_MATERIALS: readonly MaterialData[] = [
  ...RAW_MATERIALS,
  ...MANUFACTURED_MATERIALS,
  ...ENCODED_MATERIALS,
] as const;

/** Map from internal material name to MaterialData for O(1) lookups. */
export const MATERIAL_BY_NAME: ReadonlyMap<string, MaterialData> = new Map(
  ALL_MATERIALS.map((m) => [m.name, m]),
);

/**
 * Get material data by internal name.
 * Returns undefined if the name is not recognized.
 */
export function getMaterialByName(name: string): MaterialData | undefined {
  return MATERIAL_BY_NAME.get(name);
}

/**
 * Get all materials of a specific category.
 */
export function getMaterialsByCategory(category: MaterialCategory): readonly MaterialData[] {
  switch (category) {
    case 'Raw':
      return RAW_MATERIALS;
    case 'Manufactured':
      return MANUFACTURED_MATERIALS;
    case 'Encoded':
      return ENCODED_MATERIALS;
  }
}

/**
 * Get all materials of a specific grade.
 */
export function getMaterialsByGrade(grade: MaterialGrade): readonly MaterialData[] {
  return ALL_MATERIALS.filter((m) => m.grade === grade);
}
