/**
 * @vayu/shared — Market & Trade Types
 *
 * Types for commodity markets, trade route analysis, and trade results.
 * Field names align with the Market.json and journal trade events.
 */

// ---------------------------------------------------------------------------
// Commodity Categories
// ---------------------------------------------------------------------------

/** Market commodity categories as used by the game. */
export type CommodityCategory =
  | 'Chemicals'
  | 'Consumer Items'
  | 'Drugs'
  | 'Foods'
  | 'Industrial Materials'
  | 'Legal Drugs'
  | 'Machinery'
  | 'Medicines'
  | 'Metals'
  | 'Minerals'
  | 'Salvage'
  | 'Slaves'
  | 'Technology'
  | 'Textiles'
  | 'Waste'
  | 'Weapons'
  | 'Powerplay'
  | 'Unknown';

// ---------------------------------------------------------------------------
// Commodity & Market Entry
// ---------------------------------------------------------------------------

/** A commodity definition. */
export interface Commodity {
  /** Internal name (e.g. "Gold", "Tritium"). */
  name: string;
  /** Localised display name. */
  nameLocalised: string | null;
  /** Commodity category. */
  category: CommodityCategory;
  /** Whether this is a rare good. */
  isRare: boolean;
}

/** A single commodity listing in a station market. */
export interface MarketEntry {
  /** Commodity identifier. */
  id: number;
  /** Internal commodity name. */
  name: string;
  /** Localised commodity name. */
  nameLocalised: string | null;
  /** Category. */
  category: CommodityCategory;
  /** Station buy price (what you pay). */
  buyPrice: number;
  /** Station sell price (what you receive). */
  sellPrice: number;
  /** Mean galactic price. */
  meanPrice: number;
  /** Stock available at this station (supply). */
  stock: number;
  /** Supply bracket (0=None, 1=Low, 2=Medium, 3=High). */
  stockBracket: 0 | 1 | 2 | 3;
  /** Demand at this station. */
  demand: number;
  /** Demand bracket (0=None, 1=Low, 2=Medium, 3=High). */
  demandBracket: 0 | 1 | 2 | 3;
  /** Whether consumer/producer status affects price. */
  consumer: boolean;
  /** Whether this station produces this commodity. */
  producer: boolean;
  /** Whether the commodity is a rare good at this station. */
  rare: boolean;
}

/** Full market snapshot for a station. */
export interface MarketSnapshot {
  /** Market ID. */
  marketId: number;
  /** Station name. */
  stationName: string;
  /** Station type. */
  stationType: string;
  /** Star system name. */
  starSystem: string;
  /** Timestamp of the snapshot. */
  timestamp: string;
  /** All commodity listings. */
  items: MarketEntry[];
}

// ---------------------------------------------------------------------------
// Trade Analysis
// ---------------------------------------------------------------------------

/** A calculated trade route between two stations. */
export interface TradeRoute {
  /** Commodity to trade. */
  commodity: string;
  /** Localised commodity name. */
  commodityLocalised: string | null;
  /** Buy station details. */
  buyStation: {
    name: string;
    system: string;
    systemAddress: number;
    marketId: number;
    buyPrice: number;
    stock: number;
  };
  /** Sell station details. */
  sellStation: {
    name: string;
    system: string;
    systemAddress: number;
    marketId: number;
    sellPrice: number;
    demand: number;
  };
  /** Profit per unit (sell - buy). */
  profitPerUnit: number;
  /** Distance between systems in LY. */
  distance: number;
  /** Estimated total profit for full cargo hold. */
  estimatedTotalProfit: number;
  /** Profit per ton per LY (efficiency metric). */
  profitPerTonPerLy: number;
}

/** Result of a completed trade transaction. */
export interface TradeResult {
  /** Commodity traded. */
  commodity: string;
  /** Localised name. */
  commodityLocalised: string | null;
  /** Number of units traded. */
  count: number;
  /** Price per unit. */
  unitPrice: number;
  /** Total credits exchanged. */
  totalCredits: number;
  /** Whether this was a buy or sell. */
  type: 'buy' | 'sell';
  /** Average price paid (for sell transactions). */
  averagePricePaid: number | null;
  /** Profit per unit (for sell transactions). */
  profitPerUnit: number | null;
  /** Market ID where the transaction occurred. */
  marketId: number;
  /** Station name. */
  stationName: string;
  /** System name. */
  systemName: string;
  /** Timestamp. */
  timestamp: string;
  /** Whether the goods were illegal at this station. */
  illegal: boolean;
  /** Whether the goods were stolen. */
  stolen: boolean;
  /** Whether sold on the black market. */
  blackMarket: boolean;
}

/** Aggregated trade session statistics. */
export interface TradeSession {
  /** Session start time. */
  startTime: string;
  /** All individual transactions. */
  transactions: TradeResult[];
  /** Total profit so far. */
  totalProfit: number;
  /** Total credits spent buying. */
  totalSpent: number;
  /** Total credits earned selling. */
  totalEarned: number;
  /** Number of trade loops completed. */
  loopsCompleted: number;
  /** Best single-transaction profit. */
  bestProfit: number;
  /** Best commodity by total profit. */
  bestCommodity: string | null;
}
