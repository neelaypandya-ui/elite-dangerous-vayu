/**
 * @vayu/shared — Fleet Carrier Types
 *
 * Types for fleet carrier state, services, jump records,
 * and tritium fuel calculations.
 */

import type { Coordinates } from './navigation.js';

// ---------------------------------------------------------------------------
// Carrier Services
// ---------------------------------------------------------------------------

/** Fleet carrier crew/service roles. */
export type CarrierServiceRole =
  | 'BlackMarket'
  | 'Exploration'
  | 'FuelRat'      // Tritium depot
  | 'VoucherRedemption'
  | 'Refuel'
  | 'Repair'
  | 'Rearm'
  | 'Commodities'
  | 'Shipyard'
  | 'Outfitting'
  | 'PioneerSupplies'
  | 'VistaGenomics'
  | 'Bartender'
  | 'SearchAndRescue';

/** State of a service crew member on the carrier. */
export interface CarrierService {
  /** Service role identifier. */
  role: CarrierServiceRole;
  /** Whether this crew member has been hired (activated). */
  activated: boolean;
  /** Whether the service is currently enabled (can be temporarily suspended). */
  enabled: boolean;
  /** Crew member name (if any). */
  crewName: string | null;
}

// ---------------------------------------------------------------------------
// Carrier Docking Access
// ---------------------------------------------------------------------------

/** Docking permission levels. */
export type CarrierDockingAccess =
  | 'all'
  | 'squadronfriends'
  | 'friends'
  | 'none';

// ---------------------------------------------------------------------------
// Carrier Space Usage
// ---------------------------------------------------------------------------

/** Breakdown of carrier cargo/space usage. */
export interface CarrierSpaceUsage {
  /** Total capacity in tons. */
  totalCapacity: number;
  /** Crew space usage. */
  crew: number;
  /** Commodity cargo. */
  cargo: number;
  /** Reserved cargo space. */
  cargoSpaceReserved: number;
  /** Ship packs storage. */
  shipPacks: number;
  /** Module packs storage. */
  modulePacks: number;
  /** Free space remaining. */
  freeSpace: number;
}

// ---------------------------------------------------------------------------
// Carrier Finance
// ---------------------------------------------------------------------------

/** Fleet carrier financial state. */
export interface CarrierFinance {
  /** Total balance on the carrier. */
  carrierBalance: number;
  /** Reserve balance (locked). */
  reserveBalance: number;
  /** Available (spendable) balance. */
  availableBalance: number;
  /** Reserve percentage (0-100). */
  reservePercent: number;
  /** Tariff rates for services. */
  taxRates: {
    rearm: number;
    refuel: number;
    repair: number;
    pioneerSupplies: number;
    shipyard: number;
    outfitting: number;
  };
}

// ---------------------------------------------------------------------------
// Carrier Jump Record
// ---------------------------------------------------------------------------

/** Record of a single carrier jump. */
export interface CarrierJumpRecord {
  /** Timestamp of the jump. */
  timestamp: string;
  /** Origin system name. */
  fromSystem: string;
  /** Origin system coordinates. */
  fromCoordinates: Coordinates;
  /** Destination system name. */
  toSystem: string;
  /** Destination system coordinates. */
  toCoordinates: Coordinates;
  /** Body the carrier orbits after the jump. */
  body: string;
  /** Distance jumped in LY. */
  distance: number;
  /** Tritium consumed for the jump. */
  fuelUsed: number;
}

// ---------------------------------------------------------------------------
// Carrier Trade Order
// ---------------------------------------------------------------------------

/** A buy/sell order posted on the carrier market. */
export interface CarrierTradeOrder {
  /** Commodity internal name. */
  commodity: string;
  /** Localised commodity name. */
  commodityLocalised: string | null;
  /** Purchase order (buy from visitors): price per unit. 0 if not buying. */
  purchaseOrder: number;
  /** Sale order (sell to visitors): price per unit. 0 if not selling. */
  saleOrder: number;
  /** Whether this is a black market order. */
  blackMarket: boolean;
}

// ---------------------------------------------------------------------------
// Tritium Fuel Calculations
// ---------------------------------------------------------------------------

/** Input and result for tritium fuel consumption calculations. */
export interface TritiumFuelCalc {
  /** Distance to jump in LY. */
  distance: number;
  /** Current fuel level in tons. */
  currentFuel: number;
  /** Fuel capacity (default 1000 tons). */
  fuelCapacity: number;
  /** Current jump range in LY. */
  jumpRangeCurr: number;
  /** Maximum jump range in LY (500 LY for all carriers). */
  jumpRangeMax: number;
  /** Estimated fuel cost for a single jump of the given distance. */
  estimatedFuelPerJump: number;
  /** Number of jumps needed. */
  jumpsNeeded: number;
  /** Total fuel required. */
  totalFuelRequired: number;
  /** Whether the carrier has enough fuel. */
  hasSufficientFuel: boolean;
  /** Fuel deficit (0 if sufficient). */
  fuelDeficit: number;
}

// ---------------------------------------------------------------------------
// Carrier State
// ---------------------------------------------------------------------------

/** Full fleet carrier state as tracked by VAYU. */
export interface CarrierState {
  /** Carrier ID. */
  carrierId: number;
  /** Callsign (e.g. "X7Z-B2Q"). */
  callsign: string;
  /** Carrier name. */
  name: string;
  /** Current docking access level. */
  dockingAccess: CarrierDockingAccess;
  /** Whether notorious commanders are allowed to dock. */
  allowNotorious: boolean;
  /** Current tritium fuel level in tons. */
  fuelLevel: number;
  /** Current jump range in LY. */
  jumpRangeCurr: number;
  /** Maximum jump range in LY. */
  jumpRangeMax: number;
  /** Whether there is a pending decommission. */
  pendingDecommission: boolean;
  /** Space usage breakdown. */
  spaceUsage: CarrierSpaceUsage;
  /** Financial state. */
  finance: CarrierFinance;
  /** Installed services. */
  services: CarrierService[];
  /** Ship packs installed. */
  shipPacks: Array<{ theme: string; tier: number }>;
  /** Module packs installed. */
  modulePacks: Array<{ theme: string; tier: number }>;
  /** Active trade orders. */
  tradeOrders: CarrierTradeOrder[];
  /** Jump history. */
  jumpHistory: CarrierJumpRecord[];
  /** Current location system. */
  currentSystem: string | null;
  /** Current location body. */
  currentBody: string | null;
}
