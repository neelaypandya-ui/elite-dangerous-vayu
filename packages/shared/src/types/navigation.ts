/**
 * @vayu/shared — Navigation Types
 *
 * Types for star systems, bodies, stations, routes, and the player's
 * location state. Coordinate system uses the galactic coordinate frame.
 */

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

/** 3D galactic coordinates (LY from Sol). */
export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

// ---------------------------------------------------------------------------
// Star System
// ---------------------------------------------------------------------------

/** Star spectral types. */
export type StarClass =
  | 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M'
  | 'L' | 'T' | 'Y'
  | 'TTS' | 'AeBe'
  | 'W' | 'WN' | 'WNC' | 'WC' | 'WO'
  | 'CS' | 'C' | 'CN' | 'CJ' | 'CH' | 'CHd'
  | 'MS' | 'S'
  | 'D' | 'DA' | 'DAB' | 'DAO' | 'DAZ' | 'DAV' | 'DB' | 'DBZ' | 'DBV' | 'DO' | 'DOV' | 'DQ' | 'DC' | 'DCV' | 'DX'
  | 'N'
  | 'H'
  | 'SupermassiveBlackHole'
  | 'X'
  | string;

/** Allegiance values. */
export type SystemAllegiance =
  | 'Alliance'
  | 'Empire'
  | 'Federation'
  | 'Independent'
  | 'Pilots Federation'
  | 'Thargoid'
  | 'Guardian'
  | ''
  | string;

/** Government types. */
export type SystemGovernment =
  | 'Anarchy'
  | 'Colony'
  | 'Communism'
  | 'Confederacy'
  | 'Cooperative'
  | 'Corporate'
  | 'Democracy'
  | 'Dictatorship'
  | 'Feudal'
  | 'Imperial'
  | 'None'
  | 'Patronage'
  | 'Prison'
  | 'Prison Colony'
  | 'Theocracy'
  | 'Workshop'
  | 'Engineer'
  | 'Fleet Carrier'
  | string;

/** Security levels. */
export type SystemSecurity = 'Low' | 'Medium' | 'High' | 'Anarchy' | 'Lawless' | string;

/** Economy types. */
export type SystemEconomy =
  | 'Agriculture'
  | 'Colony'
  | 'Extraction'
  | 'High Tech'
  | 'Industrial'
  | 'Military'
  | 'Refinery'
  | 'Service'
  | 'Terraforming'
  | 'Tourism'
  | 'Prison'
  | 'Damaged'
  | 'Rescue'
  | 'Repair'
  | 'None'
  | string;

/** Information about a star system. */
export interface StarSystem {
  /** System name. */
  name: string;
  /** Unique system address. */
  address: number;
  /** Galactic coordinates. */
  coordinates: Coordinates;
  /** System allegiance. */
  allegiance: SystemAllegiance;
  /** Primary economy. */
  economy: SystemEconomy;
  /** Secondary economy. */
  secondEconomy: SystemEconomy;
  /** Government type. */
  government: SystemGovernment;
  /** Security level. */
  security: SystemSecurity;
  /** System population. */
  population: number;
  /** Controlling faction name. */
  controllingFaction: string | null;
  /** Controlling faction state. */
  controllingFactionState: string | null;
  /** Powers that influence this system. */
  powers: string[];
  /** Powerplay state. */
  powerplayState: string | null;
  /** Number of bodies in the system (if scanned). */
  bodyCount: number | null;
  /** Number of non-body signals. */
  nonBodyCount: number | null;
  /** Whether the system has been fully FSS-scanned. */
  fullyScanned: boolean;
}

// ---------------------------------------------------------------------------
// System Bodies
// ---------------------------------------------------------------------------

/** Planet classes. */
export type PlanetClass =
  | 'Metal rich body'
  | 'High metal content body'
  | 'Rocky body'
  | 'Icy body'
  | 'Rocky ice body'
  | 'Earthlike body'
  | 'Water world'
  | 'Ammonia world'
  | 'Water giant'
  | 'Water giant with life'
  | 'Gas giant with water based life'
  | 'Gas giant with ammonia based life'
  | 'Sudarsky class I gas giant'
  | 'Sudarsky class II gas giant'
  | 'Sudarsky class III gas giant'
  | 'Sudarsky class IV gas giant'
  | 'Sudarsky class V gas giant'
  | 'Helium rich gas giant'
  | 'Helium gas giant'
  | string;

/** Terraforming state. */
export type TerraformState = '' | 'Terraformable' | 'Terraforming' | 'Terraformed' | string;

/** Reserve level for rings/mining. */
export type ReserveLevel = 'Depleted' | 'Low' | 'Common' | 'Major' | 'Pristine' | string;

/** A ring around a body. */
export interface BodyRing {
  name: string;
  ringClass: string;
  massMT: number;
  innerRadius: number;
  outerRadius: number;
}

/** A body (star or planet) within a system. */
export interface SystemBody {
  /** Body name. */
  name: string;
  /** Body ID within the system. */
  bodyId: number;
  /** "Star", "Planet", or "Barycentre". */
  bodyType: string;
  /** Distance from arrival star in LS. */
  distanceFromArrivalLS: number;

  // Star-specific fields
  /** Star spectral class (null for non-stars). */
  starType: string | null;
  /** Stellar subclass (0-9). */
  subclass: number | null;
  /** Stellar mass in solar masses. */
  stellarMass: number | null;
  /** Luminosity classification. */
  luminosity: string | null;
  /** Age in millions of years. */
  ageMY: number | null;

  // Planet-specific fields
  /** Planet class (null for stars). */
  planetClass: PlanetClass | null;
  /** Atmosphere type. */
  atmosphere: string | null;
  /** Volcanism description. */
  volcanism: string | null;
  /** Mass in Earth masses. */
  massEM: number | null;
  /** Surface gravity in m/s^2. */
  surfaceGravity: number | null;
  /** Surface temperature in Kelvin. */
  surfaceTemperature: number | null;
  /** Surface pressure in Pascals. */
  surfacePressure: number | null;
  /** Whether the body is landable. */
  landable: boolean;
  /** Terraforming state. */
  terraformState: TerraformState | null;

  // Shared orbital fields
  /** Radius in meters. */
  radius: number | null;
  /** Tidally locked. */
  tidalLock: boolean;
  /** Semi-major axis in meters. */
  semiMajorAxis: number | null;
  /** Orbital eccentricity. */
  eccentricity: number | null;
  /** Orbital period in seconds. */
  orbitalPeriod: number | null;
  /** Rotation period in seconds. */
  rotationPeriod: number | null;
  /** Axial tilt in radians. */
  axialTilt: number | null;
  /** Rings around this body. */
  rings: BodyRing[];
  /** Reserve level for mining. */
  reserveLevel: ReserveLevel | null;

  // Discovery
  /** Whether previously discovered by another commander. */
  wasDiscovered: boolean;
  /** Whether previously mapped. */
  wasMapped: boolean;
  /** Whether the player has mapped this body. */
  mapped: boolean;
  /** Whether the player first-discovered this body. */
  firstDiscovered: boolean;

  // Surface composition & materials
  /** Surface composition percentages. */
  composition: { ice: number; rock: number; metal: number } | null;
  /** Surface materials and percentages. */
  materials: Array<{ name: string; percent: number }>;
}

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------

/** Station / outpost / settlement type. */
export enum StationType {
  Coriolis = 'Coriolis',
  Orbis = 'Orbis',
  Ocellus = 'Ocellus',
  Outpost = 'Outpost',
  AsteroidBase = 'AsteroidBase',
  MegaShip = 'MegaShip',
  FleetCarrier = 'FleetCarrier',
  CraterOutpost = 'CraterOutpost',
  CraterPort = 'CraterPort',
  OnFootSettlement = 'OnFootSettlement',
  SurfaceStation = 'SurfaceStation',
  Unknown = 'Unknown',
}

/** Information about a station. */
export interface Station {
  /** Station name. */
  name: string;
  /** Station type. */
  type: StationType | string;
  /** Market ID. */
  marketId: number;
  /** Star system the station is in. */
  system: string;
  /** System address. */
  systemAddress: number;
  /** Distance from arrival star in LS. */
  distFromStarLS: number;
  /** Controlling faction. */
  faction: string | null;
  /** Faction state. */
  factionState: string | null;
  /** Government type. */
  government: string | null;
  /** Station allegiance. */
  allegiance: string | null;
  /** Available services. */
  services: string[];
  /** Economic profiles. */
  economies: Array<{ name: string; proportion: number }>;
  /** Landing pad counts. */
  landingPads: { small: number; medium: number; large: number } | null;
  /** Whether the station is a planetary port. */
  planetary: boolean;
}

// ---------------------------------------------------------------------------
// Navigation Routes
// ---------------------------------------------------------------------------

/** A single waypoint in a plotted route. */
export interface RouteWaypoint {
  /** System name. */
  system: string;
  /** System address. */
  systemAddress: number;
  /** Galactic coordinates. */
  coordinates: Coordinates;
  /** Star class of the primary star. */
  starClass: string;
}

/** A plotted navigation route. */
export interface NavRoute {
  /** Ordered list of waypoints. */
  waypoints: RouteWaypoint[];
  /** Total distance in LY. */
  totalDistance: number;
  /** Number of jumps. */
  jumpCount: number;
  /** Source system. */
  source: string;
  /** Destination system. */
  destination: string;
}

// ---------------------------------------------------------------------------
// Location State
// ---------------------------------------------------------------------------

/** The player's current location as tracked by VAYU. */
export interface LocationState {
  /** Current star system name. */
  system: string;
  /** System address. */
  systemAddress: number;
  /** System coordinates. */
  coordinates: Coordinates;
  /** Current body name (star, planet, ring, etc.). */
  body: string;
  /** Body ID. */
  bodyId: number;
  /** Body type. */
  bodyType: string;
  /** Whether the player is docked. */
  docked: boolean;
  /** Whether the player has landed on a surface. */
  landed: boolean;
  /** Whether the player is on foot (Odyssey). */
  onFoot: boolean;
  /** Whether the player is in supercruise. */
  supercruise: boolean;
  /** Whether the player is in an SRV. */
  inSRV: boolean;
  /** Whether the player is in a fighter. */
  inFighter: boolean;
  /** Whether the player is in a taxi. */
  inTaxi: boolean;
  /** Whether the player is in multicrew. */
  inMulticrew: boolean;
  /** Station name (if docked or near a station). */
  station: string | null;
  /** Station type. */
  stationType: string | null;
  /** Market ID (if docked). */
  marketId: number | null;
  /** Latitude (if on a surface). */
  latitude: number | null;
  /** Longitude (if on a surface). */
  longitude: number | null;
  /** Altitude in meters (if on a surface). */
  altitude: number | null;
  /** Heading in degrees (if on a surface). */
  heading: number | null;
  /** Distance from the system's main star in LS. */
  distFromStarLS: number | null;
  /** System allegiance. */
  systemAllegiance: string;
  /** System economy. */
  systemEconomy: string;
  /** System government. */
  systemGovernment: string;
  /** System security. */
  systemSecurity: string;
  /** System population. */
  systemPopulation: number;
}
