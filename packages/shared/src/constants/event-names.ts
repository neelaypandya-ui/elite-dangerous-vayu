/**
 * @vayu/shared — Journal Event Name Constants
 *
 * Const arrays of all Elite Dangerous journal event names, grouped by category.
 * These match the `event` field discriminant in the journal event interfaces.
 *
 * Using `as const` ensures each array produces a narrow string-literal tuple type,
 * enabling type-safe event filtering and handler registration.
 */

// ---------------------------------------------------------------------------
// Startup Events
// ---------------------------------------------------------------------------

/** Events emitted during game startup / session load. */
export const STARTUP_EVENTS = [
  'Fileheader',
  'Commander',
  'LoadGame',
  'Materials',
  'Rank',
  'Progress',
  'Reputation',
  'Statistics',
  'Loadout',
  'Cargo',
  'StoredModules',
  'StoredShips',
  'Missions',
] as const;

export type StartupEventName = (typeof STARTUP_EVENTS)[number];

// ---------------------------------------------------------------------------
// Travel Events
// ---------------------------------------------------------------------------

/** Events related to navigation, jumping, docking, and movement. */
export const TRAVEL_EVENTS = [
  'Location',
  'FSDJump',
  'Docked',
  'Undocked',
  'SupercruiseEntry',
  'SupercruiseExit',
  'ApproachBody',
  'LeaveBody',
  'ApproachSettlement',
  'DockingRequested',
  'DockingGranted',
  'DockingDenied',
  'DockingCancelled',
  'DockingTimeout',
  'FSDTarget',
  'StartJump',
  'NavRoute',
  'NavRouteClear',
] as const;

export type TravelEventName = (typeof TRAVEL_EVENTS)[number];

// ---------------------------------------------------------------------------
// Combat Events
// ---------------------------------------------------------------------------

/** Events related to combat, interdiction, and ship encounters. */
export const COMBAT_EVENTS = [
  'Bounty',
  'ShipTargeted',
  'Died',
  'PVPKill',
  'FighterDestroyed',
  'HullDamage',
  'ShieldState',
  'UnderAttack',
  'Interdicted',
  'Interdiction',
  'EscapeInterdiction',
  'CrewMemberJoins',
  'CrewMemberQuits',
  'CrewMemberRoleChange',
] as const;

export type CombatEventName = (typeof COMBAT_EVENTS)[number];

// ---------------------------------------------------------------------------
// Exploration Events
// ---------------------------------------------------------------------------

/** Events related to scanning, mapping, and selling exploration data. */
export const EXPLORATION_EVENTS = [
  'Scan',
  'FSSDiscoveryScan',
  'FSSAllBodiesFound',
  'FSSSignalDiscovered',
  'SAASignalsFound',
  'SAAScanComplete',
  'CodexEntry',
  'MultiSellExplorationData',
  'SellExplorationData',
  'DiscoveryScan',
] as const;

export type ExplorationEventName = (typeof EXPLORATION_EVENTS)[number];

// ---------------------------------------------------------------------------
// Trade Events
// ---------------------------------------------------------------------------

/** Events related to commodity trading. */
export const TRADE_EVENTS = [
  'MarketBuy',
  'MarketSell',
  'BuyTradeData',
  'CollectCargo',
  'EjectCargo',
  'Market',
] as const;

export type TradeEventName = (typeof TRADE_EVENTS)[number];

// ---------------------------------------------------------------------------
// Station Service Events
// ---------------------------------------------------------------------------

/** Events triggered by using station services (missions, outfitting, shipyard, etc.). */
export const STATION_EVENTS = [
  'MissionAccepted',
  'MissionCompleted',
  'MissionAbandoned',
  'MissionFailed',
  'MissionRedirected',
  'CommunityGoal',
  'EngineerCraft',
  'EngineerProgress',
  'ShipyardBuy',
  'ShipyardSell',
  'ShipyardSwap',
  'ShipyardTransfer',
  'Outfitting',
  'ModuleBuy',
  'ModuleSell',
  'ModuleStore',
  'ModuleRetrieve',
  'ModuleSwap',
  'SetUserShipName',
  'PayFines',
  'RedeemVoucher',
  'RefuelAll',
  'Repair',
  'RepairAll',
  'RestockVehicle',
  'BuyAmmo',
  'BuyDrones',
  'SellDrones',
] as const;

export type StationEventName = (typeof STATION_EVENTS)[number];

// ---------------------------------------------------------------------------
// Mining Events
// ---------------------------------------------------------------------------

/** Events related to asteroid mining. */
export const MINING_EVENTS = [
  'ProspectedAsteroid',
  'AsteroidCracked',
  'MiningRefined',
  'LaunchDrone',
] as const;

export type MiningEventName = (typeof MINING_EVENTS)[number];

// ---------------------------------------------------------------------------
// Carrier Events
// ---------------------------------------------------------------------------

/** Events related to fleet carrier operations. */
export const CARRIER_EVENTS = [
  'CarrierJumpRequest',
  'CarrierJumpCancelled',
  'CarrierJump',
  'CarrierStats',
  'CarrierDecommission',
  'CarrierBuy',
  'CarrierDepositFuel',
  'CarrierDockingPermission',
  'CarrierCrewServices',
  'CarrierFinance',
  'CarrierTradeOrder',
  'CarrierModulePack',
  'CarrierBankTransfer',
  'CarrierNameChanged',
] as const;

export type CarrierEventName = (typeof CARRIER_EVENTS)[number];

// ---------------------------------------------------------------------------
// Odyssey Events
// ---------------------------------------------------------------------------

/** Events related to on-foot Odyssey gameplay. */
export const ODYSSEY_EVENTS = [
  'Backpack',
  'BackpackChange',
  'SuitLoadout',
  'SwitchSuitLoadout',
  'BookDropship',
  'Disembark',
  'Embark',
  'CollectItems',
  'DropItems',
  'UseConsumable',
  'ScanOrganic',
  'BuyMicroResources',
  'SellMicroResources',
  'TradeMicroResources',
] as const;

export type OdysseyEventName = (typeof ODYSSEY_EVENTS)[number];

// ---------------------------------------------------------------------------
// Powerplay Events
// ---------------------------------------------------------------------------

/** Events related to Powerplay mechanics. */
export const POWERPLAY_EVENTS = [
  'PowerplayJoin',
  'PowerplayLeave',
  'PowerplayVote',
  'PowerplaySalary',
  'PowerplayCollect',
  'PowerplayDefect',
  'PowerplayDeliver',
  'PowerplayFastTrack',
  'Powerplay',
] as const;

export type PowerplayEventName = (typeof POWERPLAY_EVENTS)[number];

// ---------------------------------------------------------------------------
// Other / Miscellaneous Events
// ---------------------------------------------------------------------------

/** Events that do not fall into a specific gameplay category above. */
export const OTHER_EVENTS = [
  'ReceiveText',
  'SendText',
  'Music',
  'FuelScoop',
  'JetConeBoost',
  'Shutdown',
  'Friends',
  'Synthesis',
  'MaterialCollected',
  'MaterialDiscarded',
  'MaterialTrade',
  'TechnologyBroker',
  'Screenshot',
  'AfmuRepairs',
  'RebootRepair',
  'RepairDrone',
  'CockpitBreached',
  'SelfDestruct',
  'HeatWarning',
  'HeatDamage',
  'LaunchSRV',
  'DockSRV',
  'SRVDestroyed',
  'LaunchFighter',
  'DockFighter',
  'Touchdown',
  'Liftoff',
  'CommitCrime',
  'Promotion',
  'ClearSavedGame',
  'NewCommander',
  'SupercruiseDestinationDrop',
  'Resurrect',
  'WingJoin',
  'WingAdd',
  'WingLeave',
  'WingInvite',
  'RefuelPartial',
  'NpcCrewPaidWage',
  'AppliedToSquadron',
  'JoinedSquadron',
  'LeftSquadron',
  'DatalinkScan',
  'DataScanned',
  'CargoDepot',
  'SearchAndRescue',
  'ScientificResearch',
  'CrewAssign',
  'CrewFire',
  'CrewHire',
] as const;

export type OtherEventName = (typeof OTHER_EVENTS)[number];

// ---------------------------------------------------------------------------
// All Event Names (combined)
// ---------------------------------------------------------------------------

/** Flat array of every known journal event name across all categories. */
export const ALL_EVENT_NAMES = [
  ...STARTUP_EVENTS,
  ...TRAVEL_EVENTS,
  ...COMBAT_EVENTS,
  ...EXPLORATION_EVENTS,
  ...TRADE_EVENTS,
  ...STATION_EVENTS,
  ...MINING_EVENTS,
  ...CARRIER_EVENTS,
  ...ODYSSEY_EVENTS,
  ...POWERPLAY_EVENTS,
  ...OTHER_EVENTS,
] as const;

/** Union of all known journal event name strings. */
export type AllEventName = (typeof ALL_EVENT_NAMES)[number];

// ---------------------------------------------------------------------------
// Category map (for runtime lookup of which category an event belongs to)
// ---------------------------------------------------------------------------

/** Category labels matching the grouped arrays. */
export type EventCategory =
  | 'startup'
  | 'travel'
  | 'combat'
  | 'exploration'
  | 'trade'
  | 'station'
  | 'mining'
  | 'carrier'
  | 'odyssey'
  | 'powerplay'
  | 'other';

/** Lookup map from event name to its category. Built once at module load. */
export const EVENT_CATEGORY_MAP: ReadonlyMap<string, EventCategory> = new Map([
  ...STARTUP_EVENTS.map((e) => [e, 'startup'] as const),
  ...TRAVEL_EVENTS.map((e) => [e, 'travel'] as const),
  ...COMBAT_EVENTS.map((e) => [e, 'combat'] as const),
  ...EXPLORATION_EVENTS.map((e) => [e, 'exploration'] as const),
  ...TRADE_EVENTS.map((e) => [e, 'trade'] as const),
  ...STATION_EVENTS.map((e) => [e, 'station'] as const),
  ...MINING_EVENTS.map((e) => [e, 'mining'] as const),
  ...CARRIER_EVENTS.map((e) => [e, 'carrier'] as const),
  ...ODYSSEY_EVENTS.map((e) => [e, 'odyssey'] as const),
  ...POWERPLAY_EVENTS.map((e) => [e, 'powerplay'] as const),
  ...OTHER_EVENTS.map((e) => [e, 'other'] as const),
]);
