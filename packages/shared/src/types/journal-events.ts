/**
 * @vayu/shared — Elite Dangerous Journal Event Types
 *
 * Comprehensive TypeScript interfaces for all major journal events.
 * Each interface extends the base JournalEvent and uses real field names
 * as written by the game to the player journal files.
 *
 * Reference: https://elite-journal.readthedocs.io/
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

/** Base interface every journal event extends. */
export interface JournalEvent {
  /** ISO 8601 timestamp written by the game. */
  timestamp: string;
  /** Event name — matches the concrete interface discriminant. */
  event: string;
}

// ---------------------------------------------------------------------------
// Shared Sub-types (used across multiple events)
// ---------------------------------------------------------------------------

export interface JournalFaction {
  Name: string;
  FactionState: string;
  Government: string;
  Influence: number;
  Allegiance: string;
  Happiness: string;
  Happiness_Localised?: string;
  MyReputation?: number;
  ActiveStates?: Array<{ State: string }>;
  PendingStates?: Array<{ State: string; Trend: number }>;
  RecoveringStates?: Array<{ State: string; Trend: number }>;
  SquadronFaction?: boolean;
  HappiestSystem?: boolean;
  HomeSystem?: boolean;
}

export interface JournalConflict {
  WarType: string;
  Status: string;
  Faction1: { Name: string; Stake: string; WonDays: number };
  Faction2: { Name: string; Stake: string; WonDays: number };
}

export interface JournalThargoidWar {
  CurrentState: string;
  NextStateSuccess: string;
  NextStateFailure: string;
  SuccessStateReached: boolean;
  WarProgress: number;
  RemainingPorts: number;
  EstimatedRemainingTime: string;
}

export interface JournalMaterialItem {
  Name: string;
  Name_Localised?: string;
  Count: number;
}

export interface JournalEngineerModifier {
  Label: string;
  Value: number;
  OriginalValue: number;
  LessIsGood: number;
}

export interface JournalModuleEngineering {
  Engineer?: string;
  EngineerID?: number;
  BlueprintName: string;
  BlueprintID: number;
  Level: number;
  Quality: number;
  Modifiers: JournalEngineerModifier[];
  ExperimentalEffect?: string;
  ExperimentalEffect_Localised?: string;
}

export interface JournalShipModule {
  Slot: string;
  Item: string;
  On: boolean;
  Priority: number;
  Health: number;
  Value?: number;
  AmmoInClip?: number;
  AmmoInHopper?: number;
  Engineering?: JournalModuleEngineering;
}

export interface JournalCargoItem {
  Name: string;
  Name_Localised?: string;
  Count: number;
  Stolen: number;
  MissionID?: number;
}

export interface JournalStationEconomy {
  Name: string;
  Name_Localised?: string;
  Proportion: number;
}

export interface JournalStationService {
  Name: string;
}

// ---------------------------------------------------------------------------
// Category: Startup
// ---------------------------------------------------------------------------

export interface FileheaderEvent extends JournalEvent {
  event: 'Fileheader';
  part: number;
  language: string;
  Odyssey: boolean;
  gameversion: string;
  build: string;
}

export interface CommanderEvent extends JournalEvent {
  event: 'Commander';
  FID: string;
  Name: string;
}

export interface LoadGameEvent extends JournalEvent {
  event: 'LoadGame';
  FID: string;
  Commander: string;
  Horizons: boolean;
  Odyssey: boolean;
  Ship: string;
  Ship_Localised?: string;
  ShipID: number;
  ShipName: string;
  ShipIdent: string;
  FuelLevel: number;
  FuelCapacity: number;
  GameMode: string;
  Credits: number;
  Loan: number;
  language: string;
  gameversion: string;
  build: string;
  Group?: string;
}

export interface MaterialsEvent extends JournalEvent {
  event: 'Materials';
  Raw: JournalMaterialItem[];
  Manufactured: JournalMaterialItem[];
  Encoded: JournalMaterialItem[];
}

export interface RankEvent extends JournalEvent {
  event: 'Rank';
  Combat: number;
  Trade: number;
  Explore: number;
  Soldier: number;
  Exobiologist: number;
  Empire: number;
  Federation: number;
  CQC: number;
}

export interface ProgressEvent extends JournalEvent {
  event: 'Progress';
  Combat: number;
  Trade: number;
  Explore: number;
  Soldier: number;
  Exobiologist: number;
  Empire: number;
  Federation: number;
  CQC: number;
}

export interface ReputationEvent extends JournalEvent {
  event: 'Reputation';
  Empire: number;
  Federation: number;
  Alliance: number;
  Independent: number;
}

export interface StatisticsEvent extends JournalEvent {
  event: 'Statistics';
  Bank_Account: Record<string, number>;
  Combat: Record<string, number>;
  Crime: Record<string, number>;
  Smuggling: Record<string, number>;
  Trading: Record<string, number>;
  Mining: Record<string, number>;
  Exploration: Record<string, number>;
  Passengers: Record<string, number>;
  Search_And_Rescue: Record<string, number>;
  Crafting: Record<string, number>;
  Crew: Record<string, number>;
  Multicrew: Record<string, number>;
  TG_ENCOUNTERS?: Record<string, number>;
  Material_Trader_Stats: Record<string, number>;
  CQC: Record<string, number>;
  FLEETCARRIER?: Record<string, number>;
  Exobiology?: Record<string, number>;
}

export interface LoadoutEvent extends JournalEvent {
  event: 'Loadout';
  Ship: string;
  ShipID: number;
  ShipName: string;
  ShipIdent: string;
  HullValue: number;
  ModulesValue: number;
  HullHealth: number;
  UnladenMass: number;
  CargoCapacity: number;
  MaxJumpRange: number;
  FuelCapacity: { Main: number; Reserve: number };
  Rebuy: number;
  Modules: JournalShipModule[];
  Hot?: boolean;
}

export interface CargoEvent extends JournalEvent {
  event: 'Cargo';
  Vessel: string;
  Count: number;
  Inventory: JournalCargoItem[];
}

export interface StoredModulesEvent extends JournalEvent {
  event: 'StoredModules';
  StationName: string;
  MarketID: number;
  Items: Array<{
    Name: string;
    Name_Localised?: string;
    StorageSlot: number;
    StarSystem: string;
    MarketID: number;
    TransferCost: number;
    TransferTime: number;
    BuyPrice: number;
    Hot: boolean;
    EngineerModifications?: string;
    Level?: number;
    Quality?: number;
  }>;
}

export interface StoredShipsEvent extends JournalEvent {
  event: 'StoredShips';
  StationName: string;
  MarketID: number;
  ShipsHere: Array<{
    ShipID: number;
    ShipType: string;
    ShipType_Localised?: string;
    Name?: string;
    Value: number;
    Hot: boolean;
  }>;
  ShipsRemote: Array<{
    ShipID: number;
    ShipType: string;
    ShipType_Localised?: string;
    Name?: string;
    Value: number;
    Hot: boolean;
    StarSystem: string;
    ShipMarketID: number;
    TransferPrice: number;
    TransferTime: number;
  }>;
}

export interface MissionsEvent extends JournalEvent {
  event: 'Missions';
  Active: Array<{
    MissionID: number;
    Name: string;
    PassengerMission: boolean;
    Expires: number;
  }>;
  Failed: Array<{
    MissionID: number;
    Name: string;
    PassengerMission: boolean;
    Expires: number;
  }>;
  Complete: Array<{
    MissionID: number;
    Name: string;
    PassengerMission: boolean;
    Expires: number;
  }>;
}

// ---------------------------------------------------------------------------
// Category: Travel
// ---------------------------------------------------------------------------

export interface LocationEvent extends JournalEvent {
  event: 'Location';
  Docked: boolean;
  Taxi?: boolean;
  Multicrew?: boolean;
  StarSystem: string;
  SystemAddress: number;
  StarPos: [number, number, number];
  SystemAllegiance: string;
  SystemEconomy: string;
  SystemEconomy_Localised?: string;
  SystemSecondEconomy: string;
  SystemSecondEconomy_Localised?: string;
  SystemGovernment: string;
  SystemGovernment_Localised?: string;
  SystemSecurity: string;
  SystemSecurity_Localised?: string;
  Population: number;
  Body: string;
  BodyID: number;
  BodyType: string;
  Factions?: JournalFaction[];
  SystemFaction?: { Name: string; FactionState?: string };
  Conflicts?: JournalConflict[];
  ThargoidWar?: JournalThargoidWar;
  Powers?: string[];
  PowerplayState?: string;
  /** Present when docked */
  StationName?: string;
  StationType?: string;
  MarketID?: number;
  StationFaction?: { Name: string; FactionState?: string };
  StationGovernment?: string;
  StationGovernment_Localised?: string;
  StationAllegiance?: string;
  StationServices?: string[];
  StationEconomies?: JournalStationEconomy[];
  DistFromStarLS?: number;
  Latitude?: number;
  Longitude?: number;
}

export interface FSDJumpEvent extends JournalEvent {
  event: 'FSDJump';
  Taxi?: boolean;
  Multicrew?: boolean;
  StarSystem: string;
  SystemAddress: number;
  StarPos: [number, number, number];
  SystemAllegiance: string;
  SystemEconomy: string;
  SystemEconomy_Localised?: string;
  SystemSecondEconomy: string;
  SystemSecondEconomy_Localised?: string;
  SystemGovernment: string;
  SystemGovernment_Localised?: string;
  SystemSecurity: string;
  SystemSecurity_Localised?: string;
  Population: number;
  Body: string;
  BodyID: number;
  BodyType: string;
  JumpDist: number;
  FuelUsed: number;
  FuelLevel: number;
  Factions?: JournalFaction[];
  SystemFaction?: { Name: string; FactionState?: string };
  Conflicts?: JournalConflict[];
  ThargoidWar?: JournalThargoidWar;
  Powers?: string[];
  PowerplayState?: string;
  BoostUsed?: number;
}

export interface DockedEvent extends JournalEvent {
  event: 'Docked';
  StationName: string;
  StationType: string;
  Taxi?: boolean;
  Multicrew?: boolean;
  StarSystem: string;
  SystemAddress: number;
  MarketID: number;
  StationFaction: { Name: string; FactionState?: string };
  StationGovernment: string;
  StationGovernment_Localised?: string;
  StationAllegiance?: string;
  StationServices: string[];
  StationEconomies?: JournalStationEconomy[];
  DistFromStarLS: number;
  LandingPads?: { Small: number; Medium: number; Large: number };
}

export interface UndockedEvent extends JournalEvent {
  event: 'Undocked';
  StationName: string;
  StationType: string;
  MarketID: number;
  Taxi?: boolean;
  Multicrew?: boolean;
}

export interface SupercruiseEntryEvent extends JournalEvent {
  event: 'SupercruiseEntry';
  Taxi?: boolean;
  Multicrew?: boolean;
  StarSystem: string;
  SystemAddress: number;
}

export interface SupercruiseExitEvent extends JournalEvent {
  event: 'SupercruiseExit';
  Taxi?: boolean;
  Multicrew?: boolean;
  StarSystem: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
  BodyType: string;
}

export interface ApproachBodyEvent extends JournalEvent {
  event: 'ApproachBody';
  StarSystem: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
}

export interface LeaveBodyEvent extends JournalEvent {
  event: 'LeaveBody';
  StarSystem: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
}

export interface ApproachSettlementEvent extends JournalEvent {
  event: 'ApproachSettlement';
  Name: string;
  Name_Localised?: string;
  MarketID?: number;
  SystemAddress: number;
  BodyID: number;
  BodyName: string;
  Latitude: number;
  Longitude: number;
}

export interface DockingRequestedEvent extends JournalEvent {
  event: 'DockingRequested';
  StationName: string;
  StationType: string;
  MarketID: number;
  LandingPads?: { Small: number; Medium: number; Large: number };
}

export interface DockingGrantedEvent extends JournalEvent {
  event: 'DockingGranted';
  StationName: string;
  StationType: string;
  MarketID: number;
  LandingPad: number;
}

export interface DockingDeniedEvent extends JournalEvent {
  event: 'DockingDenied';
  StationName: string;
  StationType: string;
  MarketID: number;
  Reason: string;
}

export interface DockingCancelledEvent extends JournalEvent {
  event: 'DockingCancelled';
  StationName: string;
  StationType: string;
  MarketID: number;
}

export interface DockingTimeoutEvent extends JournalEvent {
  event: 'DockingTimeout';
  StationName: string;
  StationType: string;
  MarketID: number;
}

export interface FSDTargetEvent extends JournalEvent {
  event: 'FSDTarget';
  Name: string;
  SystemAddress: number;
  StarClass: string;
  RemainingJumpsInRoute?: number;
}

export interface StartJumpEvent extends JournalEvent {
  event: 'StartJump';
  JumpType: 'Hyperspace' | 'Supercruise';
  StarSystem?: string;
  SystemAddress?: number;
  StarClass?: string;
}

export interface NavRouteEvent extends JournalEvent {
  event: 'NavRoute';
  Route?: Array<{
    StarSystem: string;
    SystemAddress: number;
    StarPos: [number, number, number];
    StarClass: string;
  }>;
}

export interface NavRouteClearEvent extends JournalEvent {
  event: 'NavRouteClear';
}

// ---------------------------------------------------------------------------
// Category: Combat
// ---------------------------------------------------------------------------

export interface BountyEvent extends JournalEvent {
  event: 'Bounty';
  Rewards: Array<{ Faction: string; Reward: number }>;
  Target: string;
  Target_Localised?: string;
  TotalReward: number;
  VictimFaction: string;
  VictimFaction_Localised?: string;
  SharedWithOthers?: number;
}

export interface ShipTargetedEvent extends JournalEvent {
  event: 'ShipTargeted';
  TargetLocked: boolean;
  Ship?: string;
  Ship_Localised?: string;
  ScanStage?: number;
  PilotName?: string;
  PilotName_Localised?: string;
  PilotRank?: string;
  ShieldHealth?: number;
  HullHealth?: number;
  Faction?: string;
  LegalStatus?: string;
  Bounty?: number;
  Subsystem?: string;
  Subsystem_Localised?: string;
  SubsystemHealth?: number;
  Power?: string;
  SquadronID?: number;
}

export interface DiedEvent extends JournalEvent {
  event: 'Died';
  KillerName?: string;
  KillerName_Localised?: string;
  KillerShip?: string;
  KillerRank?: string;
  /** Wing kills */
  Killers?: Array<{
    Name: string;
    Ship: string;
    Rank: string;
  }>;
}

export interface PVPKillEvent extends JournalEvent {
  event: 'PVPKill';
  Victim: string;
  CombatRank: number;
}

export interface FighterDestroyedEvent extends JournalEvent {
  event: 'FighterDestroyed';
  ID?: number;
}

export interface HullDamageEvent extends JournalEvent {
  event: 'HullDamage';
  Health: number;
  PlayerPilot: boolean;
  Fighter?: boolean;
}

export interface ShieldStateEvent extends JournalEvent {
  event: 'ShieldState';
  ShieldsUp: boolean;
}

export interface UnderAttackEvent extends JournalEvent {
  event: 'UnderAttack';
  Target: string;
}

export interface InterdictedEvent extends JournalEvent {
  event: 'Interdicted';
  Submitted: boolean;
  Interdictor: string;
  Interdictor_Localised?: string;
  IsPlayer: boolean;
  CombatRank?: number;
  Faction?: string;
  Power?: string;
}

export interface InterdictionEvent extends JournalEvent {
  event: 'Interdiction';
  Success: boolean;
  Interdicted: string;
  Interdicted_Localised?: string;
  IsPlayer: boolean;
  CombatRank?: number;
  Faction?: string;
  Power?: string;
}

export interface EscapeInterdictionEvent extends JournalEvent {
  event: 'EscapeInterdiction';
  Interdictor: string;
  Interdictor_Localised?: string;
  IsPlayer: boolean;
}

export interface CrewMemberJoinsEvent extends JournalEvent {
  event: 'CrewMemberJoins';
  Crew: string;
  Telepresence?: boolean;
}

export interface CrewMemberQuitsEvent extends JournalEvent {
  event: 'CrewMemberQuits';
  Crew: string;
  Telepresence?: boolean;
}

export interface CrewMemberRoleChangeEvent extends JournalEvent {
  event: 'CrewMemberRoleChange';
  Crew: string;
  Role: string;
  Telepresence?: boolean;
}

// ---------------------------------------------------------------------------
// Category: Exploration
// ---------------------------------------------------------------------------

export interface ScanEvent extends JournalEvent {
  event: 'Scan';
  ScanType: string;
  BodyName: string;
  BodyID: number;
  StarSystem: string;
  SystemAddress: number;
  DistanceFromArrivalLS: number;
  /** Star fields */
  StarType?: string;
  Subclass?: number;
  StellarMass?: number;
  Radius?: number;
  AbsoluteMagnitude?: number;
  Age_MY?: number;
  SurfaceTemperature?: number;
  Luminosity?: string;
  RotationPeriod?: number;
  AxialTilt?: number;
  Rings?: Array<{
    Name: string;
    RingClass: string;
    MassMT: number;
    InnerRad: number;
    OuterRad: number;
  }>;
  /** Planet fields */
  TidalLock?: boolean;
  TerraformState?: string;
  PlanetClass?: string;
  Atmosphere?: string;
  AtmosphereType?: string;
  AtmosphereComposition?: Array<{ Name: string; Percent: number }>;
  Volcanism?: string;
  MassEM?: number;
  SurfaceGravity?: number;
  SurfacePressure?: number;
  Landable?: boolean;
  Materials?: Array<{ Name: string; Percent: number }>;
  Composition?: { Ice: number; Rock: number; Metal: number };
  SemiMajorAxis?: number;
  Eccentricity?: number;
  OrbitalInclination?: number;
  Periapsis?: number;
  OrbitalPeriod?: number;
  AscendingNode?: number;
  MeanAnomaly?: number;
  WasDiscovered: boolean;
  WasMapped: boolean;
  Parents?: Array<Record<string, number>>;
  ReserveLevel?: string;
}

export interface FSSDiscoveryScanEvent extends JournalEvent {
  event: 'FSSDiscoveryScan';
  Progress: number;
  BodyCount: number;
  NonBodyCount: number;
  SystemName: string;
  SystemAddress: number;
}

export interface FSSAllBodiesFoundEvent extends JournalEvent {
  event: 'FSSAllBodiesFound';
  SystemName: string;
  SystemAddress: number;
  Count: number;
}

export interface FSSSignalDiscoveredEvent extends JournalEvent {
  event: 'FSSSignalDiscovered';
  SystemAddress: number;
  SignalName: string;
  SignalName_Localised?: string;
  IsStation?: boolean;
  USSType?: string;
  USSType_Localised?: string;
  SpawningState?: string;
  SpawningState_Localised?: string;
  SpawningFaction?: string;
  SpawningFaction_Localised?: string;
  ThreatLevel?: number;
  TimeRemaining?: number;
}

export interface SAASignalsFoundEvent extends JournalEvent {
  event: 'SAASignalsFound';
  BodyName: string;
  SystemAddress: number;
  BodyID: number;
  Signals: Array<{
    Type: string;
    Type_Localised?: string;
    Count: number;
  }>;
  Genuses?: Array<{
    Genus: string;
    Genus_Localised?: string;
  }>;
}

export interface SAAScanCompleteEvent extends JournalEvent {
  event: 'SAAScanComplete';
  BodyName: string;
  SystemAddress: number;
  BodyID: number;
  ProbesUsed: number;
  EfficiencyTarget: number;
}

export interface CodexEntryEvent extends JournalEvent {
  event: 'CodexEntry';
  EntryID: number;
  Name: string;
  Name_Localised?: string;
  SubCategory: string;
  SubCategory_Localised?: string;
  Category: string;
  Category_Localised?: string;
  Region: string;
  Region_Localised?: string;
  System: string;
  SystemAddress: number;
  IsNewEntry?: boolean;
  NewTraitsDiscovered?: boolean;
  Traits?: string[];
  NearestDestination?: string;
  NearestDestination_Localised?: string;
  VoucherAmount?: number;
}

export interface MultiSellExplorationDataEvent extends JournalEvent {
  event: 'MultiSellExplorationData';
  Discovered: Array<{
    SystemName: string;
    NumBodies: number;
  }>;
  BaseValue: number;
  Bonus: number;
  TotalEarnings: number;
}

export interface SellExplorationDataEvent extends JournalEvent {
  event: 'SellExplorationData';
  Systems: string[];
  Discovered: string[];
  BaseValue: number;
  Bonus: number;
  TotalEarnings: number;
}

export interface DiscoveryScanEvent extends JournalEvent {
  event: 'DiscoveryScan';
  SystemAddress: number;
  Bodies: number;
}

// ---------------------------------------------------------------------------
// Category: Trade
// ---------------------------------------------------------------------------

export interface MarketBuyEvent extends JournalEvent {
  event: 'MarketBuy';
  MarketID: number;
  Type: string;
  Type_Localised?: string;
  Count: number;
  BuyPrice: number;
  TotalCost: number;
}

export interface MarketSellEvent extends JournalEvent {
  event: 'MarketSell';
  MarketID: number;
  Type: string;
  Type_Localised?: string;
  Count: number;
  SellPrice: number;
  TotalSale: number;
  AvgPricePaid: number;
  IllegalGoods?: boolean;
  StolenGoods?: boolean;
  BlackMarket?: boolean;
}

export interface BuyTradeDataEvent extends JournalEvent {
  event: 'BuyTradeData';
  System: string;
  Cost: number;
}

export interface CollectCargoEvent extends JournalEvent {
  event: 'CollectCargo';
  Type: string;
  Type_Localised?: string;
  Stolen: boolean;
  MissionID?: number;
}

export interface EjectCargoEvent extends JournalEvent {
  event: 'EjectCargo';
  Type: string;
  Type_Localised?: string;
  Count: number;
  Abandoned: boolean;
  MissionID?: number;
  PowerplayOrigin?: string;
}

export interface MarketEvent extends JournalEvent {
  event: 'Market';
  MarketID: number;
  StationName: string;
  StationType: string;
  StarSystem: string;
}

// ---------------------------------------------------------------------------
// Category: Station Services
// ---------------------------------------------------------------------------

export interface MissionAcceptedEvent extends JournalEvent {
  event: 'MissionAccepted';
  Faction: string;
  Name: string;
  LocalisedName?: string;
  MissionID: number;
  Commodity?: string;
  Commodity_Localised?: string;
  Count?: number;
  TargetFaction?: string;
  DestinationSystem?: string;
  DestinationStation?: string;
  DestinationSettlement?: string;
  Target?: string;
  Target_Localised?: string;
  TargetType?: string;
  TargetType_Localised?: string;
  KillCount?: number;
  Expiry?: string;
  Wing?: boolean;
  Influence: string;
  Reputation: string;
  Reward: number;
  PassengerCount?: number;
  PassengerVIPs?: boolean;
  PassengerWanted?: boolean;
  PassengerType?: string;
}

export interface MissionCompletedEvent extends JournalEvent {
  event: 'MissionCompleted';
  Faction: string;
  Name: string;
  LocalisedName?: string;
  MissionID: number;
  Commodity?: string;
  Commodity_Localised?: string;
  Count?: number;
  TargetFaction?: string;
  DestinationSystem?: string;
  DestinationStation?: string;
  Target?: string;
  Target_Localised?: string;
  Reward: number;
  FactionEffects?: Array<{
    Faction: string;
    Effects: Array<{
      Effect: string;
      Effect_Localised?: string;
      Trend: string;
    }>;
    Influence: Array<{
      SystemAddress: number;
      Trend: string;
      Influence: string;
    }>;
    ReputationTrend: string;
    Reputation: string;
  }>;
  MaterialsReward?: Array<{
    Name: string;
    Name_Localised?: string;
    Category: string;
    Category_Localised?: string;
    Count: number;
  }>;
  CommodityReward?: Array<{
    Name: string;
    Name_Localised?: string;
    Count: number;
  }>;
}

export interface MissionAbandonedEvent extends JournalEvent {
  event: 'MissionAbandoned';
  Name: string;
  LocalisedName?: string;
  MissionID: number;
  Fine?: number;
}

export interface MissionFailedEvent extends JournalEvent {
  event: 'MissionFailed';
  Name: string;
  LocalisedName?: string;
  MissionID: number;
  Fine?: number;
}

export interface MissionRedirectedEvent extends JournalEvent {
  event: 'MissionRedirected';
  MissionID: number;
  Name: string;
  LocalisedName?: string;
  NewDestinationStation: string;
  NewDestinationSystem: string;
  OldDestinationStation: string;
  OldDestinationSystem: string;
}

export interface CommunityGoalEvent extends JournalEvent {
  event: 'CommunityGoal';
  CurrentGoals: Array<{
    CGID: number;
    Title: string;
    SystemName: string;
    MarketName: string;
    Expiry: string;
    IsComplete: boolean;
    CurrentTotal: number;
    PlayerContribution: number;
    NumContributors: number;
    TopTier: { Name: string; Bonus: string };
    TopRankSize?: number;
    PlayerInTopRank?: boolean;
    TierReached: string;
    PlayerPercentileBand: number;
    Bonus: number;
  }>;
}

export interface EngineerCraftEvent extends JournalEvent {
  event: 'EngineerCraft';
  Slot: string;
  Module: string;
  Ingredients: Array<{ Name: string; Name_Localised?: string; Count: number }>;
  Engineer: string;
  EngineerID: number;
  BlueprintName: string;
  BlueprintID: number;
  Level: number;
  Quality: number;
  Modifiers: JournalEngineerModifier[];
  ExperimentalEffect?: string;
  ExperimentalEffect_Localised?: string;
}

export interface EngineerProgressEvent extends JournalEvent {
  event: 'EngineerProgress';
  Engineers?: Array<{
    Engineer: string;
    EngineerID: number;
    Progress: string;
    RankProgress?: number;
    Rank?: number;
  }>;
  /** Single engineer unlock notification */
  Engineer?: string;
  EngineerID?: number;
  Progress?: string;
  Rank?: number;
}

export interface ShipyardBuyEvent extends JournalEvent {
  event: 'ShipyardBuy';
  ShipType: string;
  ShipType_Localised?: string;
  ShipPrice: number;
  StoreOldShip?: string;
  StoreShipID?: number;
  SellOldShip?: string;
  SellShipID?: number;
  SellPrice?: number;
  MarketID: number;
}

export interface ShipyardSellEvent extends JournalEvent {
  event: 'ShipyardSell';
  ShipType: string;
  ShipType_Localised?: string;
  SellShipID: number;
  ShipPrice: number;
  MarketID: number;
  System?: string;
}

export interface ShipyardSwapEvent extends JournalEvent {
  event: 'ShipyardSwap';
  ShipType: string;
  ShipType_Localised?: string;
  ShipID: number;
  StoreOldShip: string;
  StoreShipID: number;
  MarketID: number;
}

export interface ShipyardTransferEvent extends JournalEvent {
  event: 'ShipyardTransfer';
  ShipType: string;
  ShipType_Localised?: string;
  ShipID: number;
  System: string;
  ShipMarketID: number;
  Distance: number;
  TransferPrice: number;
  TransferTime: number;
  MarketID: number;
}

export interface OutfittingEvent extends JournalEvent {
  event: 'Outfitting';
  MarketID: number;
  StationName: string;
  StarSystem: string;
}

export interface ModuleBuyEvent extends JournalEvent {
  event: 'ModuleBuy';
  Slot: string;
  BuyItem: string;
  BuyItem_Localised?: string;
  MarketID: number;
  BuyPrice: number;
  Ship: string;
  ShipID: number;
  SellItem?: string;
  SellItem_Localised?: string;
  SellPrice?: number;
  StoredItem?: string;
  StoredItem_Localised?: string;
}

export interface ModuleSellEvent extends JournalEvent {
  event: 'ModuleSell';
  Slot: string;
  SellItem: string;
  SellItem_Localised?: string;
  MarketID: number;
  SellPrice: number;
  Ship: string;
  ShipID: number;
}

export interface ModuleStoreEvent extends JournalEvent {
  event: 'ModuleStore';
  Slot: string;
  StoredItem: string;
  StoredItem_Localised?: string;
  MarketID: number;
  Ship: string;
  ShipID: number;
  Hot?: boolean;
  EngineerModifications?: string;
  Level?: number;
  Quality?: number;
  ReplacementItem?: string;
  ReplacementItem_Localised?: string;
}

export interface ModuleRetrieveEvent extends JournalEvent {
  event: 'ModuleRetrieve';
  Slot: string;
  RetrievedItem: string;
  RetrievedItem_Localised?: string;
  MarketID: number;
  Ship: string;
  ShipID: number;
  Hot?: boolean;
  EngineerModifications?: string;
  Level?: number;
  Quality?: number;
  SwapOutItem?: string;
  SwapOutItem_Localised?: string;
}

export interface PayFinesEvent extends JournalEvent {
  event: 'PayFines';
  Amount: number;
  AllFines: boolean;
  Faction?: string;
  ShipID: number;
  BrokerPercentage?: number;
}

export interface RedeemVoucherEvent extends JournalEvent {
  event: 'RedeemVoucher';
  Type: string;
  Amount: number;
  Factions?: Array<{ Faction: string; Amount: number }>;
  Faction?: string;
  BrokerPercentage?: number;
}

export interface RefuelAllEvent extends JournalEvent {
  event: 'RefuelAll';
  Cost: number;
  Amount: number;
}

export interface RepairEvent extends JournalEvent {
  event: 'Repair';
  Item: string;
  Cost: number;
}

export interface RepairAllEvent extends JournalEvent {
  event: 'RepairAll';
  Cost: number;
}

export interface RestockVehicleEvent extends JournalEvent {
  event: 'RestockVehicle';
  Type: string;
  Loadout: string;
  Cost: number;
  Count: number;
}

export interface ModuleSwapEvent extends JournalEvent {
  event: 'ModuleSwap';
  MarketID: number;
  FromSlot: string;
  ToSlot: string;
  FromItem: string;
  FromItem_Localised?: string;
  ToItem?: string;
  ToItem_Localised?: string;
  Ship: string;
  ShipID: number;
}

export interface SetUserShipNameEvent extends JournalEvent {
  event: 'SetUserShipName';
  Ship: string;
  ShipID: number;
  UserShipName: string;
  UserShipId: string;
}

export interface BuyAmmoEvent extends JournalEvent {
  event: 'BuyAmmo';
  Cost: number;
}

export interface BuyDronesEvent extends JournalEvent {
  event: 'BuyDrones';
  Type: string;
  Count: number;
  BuyPrice: number;
  TotalCost: number;
}

export interface SellDronesEvent extends JournalEvent {
  event: 'SellDrones';
  Type: string;
  Count: number;
  SellPrice: number;
  TotalSale: number;
}

// ---------------------------------------------------------------------------
// Category: Mining
// ---------------------------------------------------------------------------

export interface ProspectedAsteroidEvent extends JournalEvent {
  event: 'ProspectedAsteroid';
  Materials: Array<{
    Name: string;
    Name_Localised?: string;
    Proportion: number;
  }>;
  Content: string;
  Content_Localised?: string;
  Remaining: number;
  MotherlodeMaterial?: string;
  MotherlodeMaterial_Localised?: string;
}

export interface AsteroidCrackedEvent extends JournalEvent {
  event: 'AsteroidCracked';
  Body: string;
}

export interface MiningRefinedEvent extends JournalEvent {
  event: 'MiningRefined';
  Type: string;
  Type_Localised?: string;
}

export interface LaunchDroneEvent extends JournalEvent {
  event: 'LaunchDrone';
  Type: string;
}

// ---------------------------------------------------------------------------
// Category: Carrier
// ---------------------------------------------------------------------------

export interface CarrierJumpRequestEvent extends JournalEvent {
  event: 'CarrierJumpRequest';
  CarrierID: number;
  SystemName: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
  DepartureTime?: string;
}

export interface CarrierJumpCancelledEvent extends JournalEvent {
  event: 'CarrierJumpCancelled';
  CarrierID: number;
}

export interface CarrierJumpEvent extends JournalEvent {
  event: 'CarrierJump';
  Docked: boolean;
  StationName: string;
  StationType: string;
  MarketID: number;
  StationFaction: { Name: string };
  StationGovernment: string;
  StationGovernment_Localised?: string;
  StationServices: string[];
  StationEconomies?: JournalStationEconomy[];
  StarSystem: string;
  SystemAddress: number;
  StarPos: [number, number, number];
  SystemAllegiance: string;
  SystemEconomy: string;
  SystemEconomy_Localised?: string;
  SystemSecondEconomy: string;
  SystemSecondEconomy_Localised?: string;
  SystemGovernment: string;
  SystemGovernment_Localised?: string;
  SystemSecurity: string;
  SystemSecurity_Localised?: string;
  Population: number;
  Body: string;
  BodyID: number;
  BodyType: string;
  Factions?: JournalFaction[];
  SystemFaction?: { Name: string; FactionState?: string };
  Conflicts?: JournalConflict[];
  Powers?: string[];
  PowerplayState?: string;
}

export interface CarrierStatsEvent extends JournalEvent {
  event: 'CarrierStats';
  CarrierID: number;
  Callsign: string;
  Name: string;
  DockingAccess: string;
  AllowNotorious: boolean;
  FuelLevel: number;
  JumpRangeCurr: number;
  JumpRangeMax: number;
  PendingDecommission: boolean;
  SpaceUsage: {
    TotalCapacity: number;
    Crew: number;
    Cargo: number;
    CargoSpaceReserved: number;
    ShipPacks: number;
    ModulePacks: number;
    FreeSpace: number;
  };
  Finance: {
    CarrierBalance: number;
    ReserveBalance: number;
    AvailableBalance: number;
    ReservePercent: number;
    TaxRate_rearm?: number;
    TaxRate_refuel?: number;
    TaxRate_repair?: number;
    TaxRate_pioneersupplies?: number;
    TaxRate_shipyard?: number;
    TaxRate_outfitting?: number;
  };
  Crew: Array<{
    CrewRole: string;
    Activated: boolean;
    Enabled: boolean;
    CrewName?: string;
  }>;
  ShipPacks: Array<{ PackTheme: string; PackTier: number }>;
  ModulePacks: Array<{ PackTheme: string; PackTier: number }>;
}

export interface CarrierDecommissionEvent extends JournalEvent {
  event: 'CarrierDecommission';
  CarrierID: number;
  ScrapRefund: number;
  ScrapTime: number;
}

export interface CarrierBuyEvent extends JournalEvent {
  event: 'CarrierBuy';
  CarrierID: number;
  BoughtAtMarket: number;
  Location: string;
  SystemAddress: number;
  Price: number;
  Variant: string;
  Callsign: string;
}

export interface CarrierDepositFuelEvent extends JournalEvent {
  event: 'CarrierDepositFuel';
  CarrierID: number;
  Amount: number;
  Total: number;
}

export interface CarrierDockingPermissionEvent extends JournalEvent {
  event: 'CarrierDockingPermission';
  CarrierID: number;
  DockingAccess: string;
  AllowNotorious: boolean;
}

export interface CarrierCrewServicesEvent extends JournalEvent {
  event: 'CarrierCrewServices';
  CarrierID: number;
  CrewRole: string;
  Operation: string;
  CrewName?: string;
}

export interface CarrierFinanceEvent extends JournalEvent {
  event: 'CarrierFinance';
  CarrierID: number;
  TaxRate: number;
  CarrierBalance: number;
  ReserveBalance: number;
  AvailableBalance: number;
  ReservePercent: number;
}

export interface CarrierTradeOrderEvent extends JournalEvent {
  event: 'CarrierTradeOrder';
  CarrierID: number;
  BlackMarket: boolean;
  Commodity: string;
  Commodity_Localised?: string;
  PurchaseOrder?: number;
  SaleOrder?: number;
  CancelTrade?: boolean;
  Price: number;
}

export interface CarrierModulePackEvent extends JournalEvent {
  event: 'CarrierModulePack';
  CarrierID: number;
  Operation: string;
  PackTheme: string;
  PackTier: number;
  Cost?: number;
  Refund?: number;
}

export interface CarrierBankTransferEvent extends JournalEvent {
  event: 'CarrierBankTransfer';
  CarrierID: number;
  Deposit?: number;
  Withdraw?: number;
  PlayerBalance: number;
  CarrierBalance: number;
}

export interface CarrierNameChangedEvent extends JournalEvent {
  event: 'CarrierNameChanged';
  CarrierID: number;
  Callsign: string;
  Name: string;
}

// ---------------------------------------------------------------------------
// Category: Odyssey
// ---------------------------------------------------------------------------

export interface BackpackEvent extends JournalEvent {
  event: 'Backpack';
  Items: Array<{
    Name: string;
    Name_Localised?: string;
    OwnerID: number;
    MissionID?: number;
    Count: number;
  }>;
  Components: Array<{
    Name: string;
    Name_Localised?: string;
    OwnerID: number;
    Count: number;
  }>;
  Consumables: Array<{
    Name: string;
    Name_Localised?: string;
    OwnerID: number;
    Count: number;
  }>;
  Data: Array<{
    Name: string;
    Name_Localised?: string;
    OwnerID: number;
    Count: number;
  }>;
}

export interface BackpackChangeEvent extends JournalEvent {
  event: 'BackpackChange';
  Added?: Array<{
    Name: string;
    Name_Localised?: string;
    OwnerID: number;
    MissionID?: number;
    Count: number;
    Type: string;
  }>;
  Removed?: Array<{
    Name: string;
    Name_Localised?: string;
    OwnerID: number;
    MissionID?: number;
    Count: number;
    Type: string;
  }>;
}

export interface SuitLoadoutEvent extends JournalEvent {
  event: 'SuitLoadout';
  SuitID: number;
  SuitName: string;
  SuitName_Localised?: string;
  SuitMods?: string[];
  LoadoutID: number;
  LoadoutName: string;
  Modules: Array<{
    SlotName: string;
    SuitModuleID: number;
    ModuleName: string;
    ModuleName_Localised?: string;
    Class?: number;
    WeaponMods?: string[];
  }>;
}

export interface SwitchSuitLoadoutEvent extends JournalEvent {
  event: 'SwitchSuitLoadout';
  SuitID: number;
  SuitName: string;
  SuitName_Localised?: string;
  SuitMods?: string[];
  LoadoutID: number;
  LoadoutName: string;
  Modules: Array<{
    SlotName: string;
    SuitModuleID: number;
    ModuleName: string;
    ModuleName_Localised?: string;
    Class?: number;
    WeaponMods?: string[];
  }>;
}

export interface BookDropshipEvent extends JournalEvent {
  event: 'BookDropship';
  Cost: number;
  DestinationSystem: string;
  DestinationLocation: string;
}

export interface DisembarkEvent extends JournalEvent {
  event: 'Disembark';
  SRV: boolean;
  Taxi: boolean;
  Multicrew: boolean;
  ID?: number;
  StarSystem: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
  OnStation: boolean;
  OnPlanet: boolean;
  StationName?: string;
  StationType?: string;
  MarketID?: number;
}

export interface EmbarkEvent extends JournalEvent {
  event: 'Embark';
  SRV: boolean;
  Taxi: boolean;
  Multicrew: boolean;
  ID?: number;
  StarSystem: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
  OnStation: boolean;
  OnPlanet: boolean;
  StationName?: string;
  StationType?: string;
  MarketID?: number;
}

export interface CollectItemsEvent extends JournalEvent {
  event: 'CollectItems';
  Name: string;
  Name_Localised?: string;
  Type: string;
  OwnerID: number;
  Count: number;
  Stolen: boolean;
}

export interface DropItemsEvent extends JournalEvent {
  event: 'DropItems';
  Name: string;
  Name_Localised?: string;
  Type: string;
  OwnerID: number;
  Count: number;
}

export interface UseConsumableEvent extends JournalEvent {
  event: 'UseConsumable';
  Name: string;
  Name_Localised?: string;
  Type: string;
}

export interface ScanOrganicEvent extends JournalEvent {
  event: 'ScanOrganic';
  ScanType: 'Log' | 'Sample' | 'Analyse';
  Genus: string;
  Genus_Localised?: string;
  Species: string;
  Species_Localised?: string;
  Variant?: string;
  Variant_Localised?: string;
  SystemAddress: number;
  Body: number;
}

export interface BuyMicroResourcesEvent extends JournalEvent {
  event: 'BuyMicroResources';
  Name: string;
  Name_Localised?: string;
  Category: string;
  Count: number;
  Price: number;
  MarketID: number;
}

export interface SellMicroResourcesEvent extends JournalEvent {
  event: 'SellMicroResources';
  MicroResources: Array<{
    Name: string;
    Name_Localised?: string;
    Category: string;
    Count: number;
  }>;
  Price: number;
  MarketID: number;
}

export interface TradeMicroResourcesEvent extends JournalEvent {
  event: 'TradeMicroResources';
  Offered: Array<{
    Name: string;
    Name_Localised?: string;
    Category: string;
    Count: number;
  }>;
  Received: string;
  Received_Localised?: string;
  Category: string;
  Count: number;
  MarketID: number;
}

// ---------------------------------------------------------------------------
// Category: Powerplay
// ---------------------------------------------------------------------------

export interface PowerplayJoinEvent extends JournalEvent {
  event: 'PowerplayJoin';
  Power: string;
}

export interface PowerplayLeaveEvent extends JournalEvent {
  event: 'PowerplayLeave';
  Power: string;
}

export interface PowerplayVoteEvent extends JournalEvent {
  event: 'PowerplayVote';
  Power: string;
  Votes: number;
  System: string;
}

export interface PowerplaySalaryEvent extends JournalEvent {
  event: 'PowerplaySalary';
  Power: string;
  Amount: number;
}

export interface PowerplayCollectEvent extends JournalEvent {
  event: 'PowerplayCollect';
  Power: string;
  Type: string;
  Type_Localised?: string;
  Count: number;
}

export interface PowerplayDefectEvent extends JournalEvent {
  event: 'PowerplayDefect';
  FromPower: string;
  ToPower: string;
}

export interface PowerplayDeliverEvent extends JournalEvent {
  event: 'PowerplayDeliver';
  Power: string;
  Type: string;
  Type_Localised?: string;
  Count: number;
}

export interface PowerplayFastTrackEvent extends JournalEvent {
  event: 'PowerplayFastTrack';
  Power: string;
  Cost: number;
}

// ---------------------------------------------------------------------------
// Category: Other
// ---------------------------------------------------------------------------

export interface ReceiveTextEvent extends JournalEvent {
  event: 'ReceiveText';
  From: string;
  From_Localised?: string;
  Message: string;
  Message_Localised?: string;
  Channel: string;
}

export interface SendTextEvent extends JournalEvent {
  event: 'SendText';
  To: string;
  To_Localised?: string;
  Message: string;
}

export interface MusicEvent extends JournalEvent {
  event: 'Music';
  MusicTrack: string;
}

export interface FuelScoopEvent extends JournalEvent {
  event: 'FuelScoop';
  Scooped: number;
  Total: number;
}

export interface JetConeBoostEvent extends JournalEvent {
  event: 'JetConeBoost';
  BoostValue: number;
}

export interface ShutdownEvent extends JournalEvent {
  event: 'Shutdown';
}

export interface FriendsEvent extends JournalEvent {
  event: 'Friends';
  Status: 'Requested' | 'Declined' | 'Added' | 'Lost' | 'Online' | 'Offline';
  Name: string;
}

export interface SynthesisEvent extends JournalEvent {
  event: 'Synthesis';
  Name: string;
  Materials: Array<{ Name: string; Count: number }>;
}

export interface MaterialCollectedEvent extends JournalEvent {
  event: 'MaterialCollected';
  Category: string;
  Name: string;
  Name_Localised?: string;
  Count: number;
}

export interface MaterialDiscardedEvent extends JournalEvent {
  event: 'MaterialDiscarded';
  Category: string;
  Name: string;
  Name_Localised?: string;
  Count: number;
}

export interface MaterialTradeEvent extends JournalEvent {
  event: 'MaterialTrade';
  MarketID: number;
  TraderType: string;
  Paid: { Material: string; Material_Localised?: string; Category: string; Quantity: number };
  Received: { Material: string; Material_Localised?: string; Category: string; Quantity: number };
}

export interface TechnologyBrokerEvent extends JournalEvent {
  event: 'TechnologyBroker';
  BrokerType: string;
  MarketID: number;
  ItemsUnlocked: Array<{ Name: string; Name_Localised?: string }>;
  Commodities?: Array<{ Name: string; Name_Localised?: string; Count: number }>;
  Materials?: Array<{ Name: string; Name_Localised?: string; Count: number; Category: string }>;
}

export interface ScreenshotEvent extends JournalEvent {
  event: 'Screenshot';
  Filename: string;
  Width: number;
  Height: number;
  System: string;
  Body: string;
  Latitude?: number;
  Longitude?: number;
  Heading?: number;
  Altitude?: number;
}

export interface AfmuRepairsEvent extends JournalEvent {
  event: 'AfmuRepairs';
  Module: string;
  Module_Localised?: string;
  FullyRepaired: boolean;
  Health: number;
}

export interface RebootRepairEvent extends JournalEvent {
  event: 'RebootRepair';
  Modules: string[];
}

export interface RepairDroneEvent extends JournalEvent {
  event: 'RepairDrone';
  HullRepaired: number;
  CockpitRepaired?: number;
  CorrosionRepaired?: number;
}

export interface CockpitBreachedEvent extends JournalEvent {
  event: 'CockpitBreached';
}

export interface SelfDestructEvent extends JournalEvent {
  event: 'SelfDestruct';
}

export interface HeatWarningEvent extends JournalEvent {
  event: 'HeatWarning';
}

export interface HeatDamageEvent extends JournalEvent {
  event: 'HeatDamage';
}

export interface LaunchSRVEvent extends JournalEvent {
  event: 'LaunchSRV';
  Loadout: string;
  ID: number;
  PlayerControlled: boolean;
  SRVType: string;
  SRVType_Localised?: string;
}

export interface DockSRVEvent extends JournalEvent {
  event: 'DockSRV';
  ID: number;
  SRVType: string;
  SRVType_Localised?: string;
}

export interface SRVDestroyedEvent extends JournalEvent {
  event: 'SRVDestroyed';
  ID: number;
  SRVType: string;
  SRVType_Localised?: string;
}

export interface LaunchFighterEvent extends JournalEvent {
  event: 'LaunchFighter';
  Loadout: string;
  ID: number;
  PlayerControlled: boolean;
}

export interface DockFighterEvent extends JournalEvent {
  event: 'DockFighter';
  ID: number;
}

export interface TouchdownEvent extends JournalEvent {
  event: 'Touchdown';
  PlayerControlled: boolean;
  Latitude: number;
  Longitude: number;
  NearestDestination?: string;
  NearestDestination_Localised?: string;
  StarSystem: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
  OnStation?: boolean;
  OnPlanet?: boolean;
}

export interface LiftoffEvent extends JournalEvent {
  event: 'Liftoff';
  PlayerControlled: boolean;
  Latitude: number;
  Longitude: number;
  NearestDestination?: string;
  NearestDestination_Localised?: string;
  StarSystem: string;
  SystemAddress: number;
  Body: string;
  BodyID: number;
  OnStation?: boolean;
  OnPlanet?: boolean;
}

export interface CommitCrimeEvent extends JournalEvent {
  event: 'CommitCrime';
  CrimeType: string;
  Faction: string;
  Victim?: string;
  Victim_Localised?: string;
  Fine?: number;
  Bounty?: number;
}

export interface PromotionEvent extends JournalEvent {
  event: 'Promotion';
  Combat?: number;
  Trade?: number;
  Explore?: number;
  CQC?: number;
  Federation?: number;
  Empire?: number;
  Soldier?: number;
  Exobiologist?: number;
}

export interface ClearSavedGameEvent extends JournalEvent {
  event: 'ClearSavedGame';
  Name: string;
  FID: string;
}

export interface NewCommanderEvent extends JournalEvent {
  event: 'NewCommander';
  Name: string;
  FID: string;
  Package: string;
}

export interface SupercruiseDestinationDropEvent extends JournalEvent {
  event: 'SupercruiseDestinationDrop';
  Type: string;
  Threat: number;
  MarketID?: number;
}

export interface ResurrectEvent extends JournalEvent {
  event: 'Resurrect';
  Option: string;
  Cost: number;
  Bankrupt: boolean;
}

export interface WingJoinEvent extends JournalEvent {
  event: 'WingJoin';
  Others: string[];
}

export interface WingAddEvent extends JournalEvent {
  event: 'WingAdd';
  Name: string;
}

export interface WingLeaveEvent extends JournalEvent {
  event: 'WingLeave';
}

export interface WingInviteEvent extends JournalEvent {
  event: 'WingInvite';
  Name: string;
}

export interface RefuelPartialEvent extends JournalEvent {
  event: 'RefuelPartial';
  Cost: number;
  Amount: number;
}

export interface NpcCrewPaidWageEvent extends JournalEvent {
  event: 'NpcCrewPaidWage';
  NpcCrewId: number;
  NpcCrewName: string;
  Amount: number;
}

export interface PowerplayEvent extends JournalEvent {
  event: 'Powerplay';
  Power: string;
  Rank: number;
  Merits: number;
  Votes: number;
  TimePledged: number;
}

export interface AppliedToSquadronEvent extends JournalEvent {
  event: 'AppliedToSquadron';
  SquadronName: string;
}

export interface JoinedSquadronEvent extends JournalEvent {
  event: 'JoinedSquadron';
  SquadronName: string;
}

export interface LeftSquadronEvent extends JournalEvent {
  event: 'LeftSquadron';
  SquadronName: string;
}

export interface DatalinkScanEvent extends JournalEvent {
  event: 'DatalinkScan';
  Message: string;
  Message_Localised?: string;
}

export interface DataScannedEvent extends JournalEvent {
  event: 'DataScanned';
  Type: string;
  Type_Localised?: string;
}

export interface CargoDepotEvent extends JournalEvent {
  event: 'CargoDepot';
  MissionID: number;
  UpdateType: string;
  CargoType?: string;
  CargoType_Localised?: string;
  Count?: number;
  StartMarketID: number;
  EndMarketID: number;
  ItemsCollected: number;
  ItemsDelivered: number;
  TotalItemsToDeliver: number;
  Progress: number;
}

export interface SearchAndRescueEvent extends JournalEvent {
  event: 'SearchAndRescue';
  MarketID: number;
  Name: string;
  Name_Localised?: string;
  Count: number;
  Reward: number;
}

export interface ScientificResearchEvent extends JournalEvent {
  event: 'ScientificResearch';
  MarketID: number;
  Name: string;
  Category: string;
  Count: number;
}

export interface CrewAssignEvent extends JournalEvent {
  event: 'CrewAssign';
  Name: string;
  CrewID: number;
  Role: string;
}

export interface CrewFireEvent extends JournalEvent {
  event: 'CrewFire';
  Name: string;
  CrewID: number;
}

export interface CrewHireEvent extends JournalEvent {
  event: 'CrewHire';
  Name: string;
  CrewID: number;
  Faction: string;
  Cost: number;
  CombatRank: number;
}

// ---------------------------------------------------------------------------
// Discriminated union of ALL journal events
// ---------------------------------------------------------------------------

/** Discriminated union covering every known journal event type. */
export type AnyJournalEvent =
  // Startup
  | FileheaderEvent
  | CommanderEvent
  | LoadGameEvent
  | MaterialsEvent
  | RankEvent
  | ProgressEvent
  | ReputationEvent
  | StatisticsEvent
  | LoadoutEvent
  | CargoEvent
  | StoredModulesEvent
  | StoredShipsEvent
  | MissionsEvent
  // Travel
  | LocationEvent
  | FSDJumpEvent
  | DockedEvent
  | UndockedEvent
  | SupercruiseEntryEvent
  | SupercruiseExitEvent
  | ApproachBodyEvent
  | LeaveBodyEvent
  | ApproachSettlementEvent
  | DockingRequestedEvent
  | DockingGrantedEvent
  | DockingDeniedEvent
  | DockingCancelledEvent
  | DockingTimeoutEvent
  | FSDTargetEvent
  | StartJumpEvent
  | NavRouteEvent
  | NavRouteClearEvent
  // Combat
  | BountyEvent
  | ShipTargetedEvent
  | DiedEvent
  | PVPKillEvent
  | FighterDestroyedEvent
  | HullDamageEvent
  | ShieldStateEvent
  | UnderAttackEvent
  | InterdictedEvent
  | InterdictionEvent
  | EscapeInterdictionEvent
  | CrewMemberJoinsEvent
  | CrewMemberQuitsEvent
  | CrewMemberRoleChangeEvent
  // Exploration
  | ScanEvent
  | FSSDiscoveryScanEvent
  | FSSAllBodiesFoundEvent
  | FSSSignalDiscoveredEvent
  | SAASignalsFoundEvent
  | SAAScanCompleteEvent
  | CodexEntryEvent
  | MultiSellExplorationDataEvent
  | SellExplorationDataEvent
  | DiscoveryScanEvent
  // Trade
  | MarketBuyEvent
  | MarketSellEvent
  | BuyTradeDataEvent
  | CollectCargoEvent
  | EjectCargoEvent
  | MarketEvent
  // Station Services
  | MissionAcceptedEvent
  | MissionCompletedEvent
  | MissionAbandonedEvent
  | MissionFailedEvent
  | MissionRedirectedEvent
  | CommunityGoalEvent
  | EngineerCraftEvent
  | EngineerProgressEvent
  | ShipyardBuyEvent
  | ShipyardSellEvent
  | ShipyardSwapEvent
  | ShipyardTransferEvent
  | OutfittingEvent
  | ModuleBuyEvent
  | ModuleSellEvent
  | ModuleStoreEvent
  | ModuleRetrieveEvent
  | ModuleSwapEvent
  | SetUserShipNameEvent
  | PayFinesEvent
  | RedeemVoucherEvent
  | RefuelAllEvent
  | RepairEvent
  | RepairAllEvent
  | RestockVehicleEvent
  | BuyAmmoEvent
  | BuyDronesEvent
  | SellDronesEvent
  // Mining
  | ProspectedAsteroidEvent
  | AsteroidCrackedEvent
  | MiningRefinedEvent
  | LaunchDroneEvent
  // Carrier
  | CarrierJumpRequestEvent
  | CarrierJumpCancelledEvent
  | CarrierJumpEvent
  | CarrierStatsEvent
  | CarrierDecommissionEvent
  | CarrierBuyEvent
  | CarrierDepositFuelEvent
  | CarrierDockingPermissionEvent
  | CarrierCrewServicesEvent
  | CarrierFinanceEvent
  | CarrierTradeOrderEvent
  | CarrierModulePackEvent
  | CarrierBankTransferEvent
  | CarrierNameChangedEvent
  // Odyssey
  | BackpackEvent
  | BackpackChangeEvent
  | SuitLoadoutEvent
  | SwitchSuitLoadoutEvent
  | BookDropshipEvent
  | DisembarkEvent
  | EmbarkEvent
  | CollectItemsEvent
  | DropItemsEvent
  | UseConsumableEvent
  | ScanOrganicEvent
  | BuyMicroResourcesEvent
  | SellMicroResourcesEvent
  | TradeMicroResourcesEvent
  // Powerplay
  | PowerplayJoinEvent
  | PowerplayLeaveEvent
  | PowerplayVoteEvent
  | PowerplaySalaryEvent
  | PowerplayCollectEvent
  | PowerplayDefectEvent
  | PowerplayDeliverEvent
  | PowerplayFastTrackEvent
  | PowerplayEvent
  // Other
  | ReceiveTextEvent
  | SendTextEvent
  | MusicEvent
  | FuelScoopEvent
  | JetConeBoostEvent
  | ShutdownEvent
  | FriendsEvent
  | SynthesisEvent
  | MaterialCollectedEvent
  | MaterialDiscardedEvent
  | MaterialTradeEvent
  | TechnologyBrokerEvent
  | ScreenshotEvent
  | AfmuRepairsEvent
  | RebootRepairEvent
  | RepairDroneEvent
  | CockpitBreachedEvent
  | SelfDestructEvent
  | HeatWarningEvent
  | HeatDamageEvent
  | LaunchSRVEvent
  | DockSRVEvent
  | SRVDestroyedEvent
  | LaunchFighterEvent
  | DockFighterEvent
  | TouchdownEvent
  | LiftoffEvent
  | CommitCrimeEvent
  | PromotionEvent
  | ClearSavedGameEvent
  | NewCommanderEvent
  | SupercruiseDestinationDropEvent
  | ResurrectEvent
  | WingJoinEvent
  | WingAddEvent
  | WingLeaveEvent
  | WingInviteEvent
  | RefuelPartialEvent
  | NpcCrewPaidWageEvent
  | AppliedToSquadronEvent
  | JoinedSquadronEvent
  | LeftSquadronEvent
  | DatalinkScanEvent
  | DataScannedEvent
  | CargoDepotEvent
  | SearchAndRescueEvent
  | ScientificResearchEvent
  | CrewAssignEvent
  | CrewFireEvent
  | CrewHireEvent;

/**
 * Map from event name string to its concrete interface.
 * Useful for type-safe event handlers: `handler<K extends JournalEventName>(event: JournalEventMap[K])`
 */
export interface JournalEventMap {
  Fileheader: FileheaderEvent;
  Commander: CommanderEvent;
  LoadGame: LoadGameEvent;
  Materials: MaterialsEvent;
  Rank: RankEvent;
  Progress: ProgressEvent;
  Reputation: ReputationEvent;
  Statistics: StatisticsEvent;
  Loadout: LoadoutEvent;
  Cargo: CargoEvent;
  StoredModules: StoredModulesEvent;
  StoredShips: StoredShipsEvent;
  Missions: MissionsEvent;
  Location: LocationEvent;
  FSDJump: FSDJumpEvent;
  Docked: DockedEvent;
  Undocked: UndockedEvent;
  SupercruiseEntry: SupercruiseEntryEvent;
  SupercruiseExit: SupercruiseExitEvent;
  ApproachBody: ApproachBodyEvent;
  LeaveBody: LeaveBodyEvent;
  ApproachSettlement: ApproachSettlementEvent;
  DockingRequested: DockingRequestedEvent;
  DockingGranted: DockingGrantedEvent;
  DockingDenied: DockingDeniedEvent;
  DockingCancelled: DockingCancelledEvent;
  DockingTimeout: DockingTimeoutEvent;
  FSDTarget: FSDTargetEvent;
  StartJump: StartJumpEvent;
  NavRoute: NavRouteEvent;
  NavRouteClear: NavRouteClearEvent;
  Bounty: BountyEvent;
  ShipTargeted: ShipTargetedEvent;
  Died: DiedEvent;
  PVPKill: PVPKillEvent;
  FighterDestroyed: FighterDestroyedEvent;
  HullDamage: HullDamageEvent;
  ShieldState: ShieldStateEvent;
  UnderAttack: UnderAttackEvent;
  Interdicted: InterdictedEvent;
  Interdiction: InterdictionEvent;
  EscapeInterdiction: EscapeInterdictionEvent;
  CrewMemberJoins: CrewMemberJoinsEvent;
  CrewMemberQuits: CrewMemberQuitsEvent;
  CrewMemberRoleChange: CrewMemberRoleChangeEvent;
  Scan: ScanEvent;
  FSSDiscoveryScan: FSSDiscoveryScanEvent;
  FSSAllBodiesFound: FSSAllBodiesFoundEvent;
  FSSSignalDiscovered: FSSSignalDiscoveredEvent;
  SAASignalsFound: SAASignalsFoundEvent;
  SAAScanComplete: SAAScanCompleteEvent;
  CodexEntry: CodexEntryEvent;
  MultiSellExplorationData: MultiSellExplorationDataEvent;
  SellExplorationData: SellExplorationDataEvent;
  DiscoveryScan: DiscoveryScanEvent;
  MarketBuy: MarketBuyEvent;
  MarketSell: MarketSellEvent;
  BuyTradeData: BuyTradeDataEvent;
  CollectCargo: CollectCargoEvent;
  EjectCargo: EjectCargoEvent;
  Market: MarketEvent;
  MissionAccepted: MissionAcceptedEvent;
  MissionCompleted: MissionCompletedEvent;
  MissionAbandoned: MissionAbandonedEvent;
  MissionFailed: MissionFailedEvent;
  MissionRedirected: MissionRedirectedEvent;
  CommunityGoal: CommunityGoalEvent;
  EngineerCraft: EngineerCraftEvent;
  EngineerProgress: EngineerProgressEvent;
  ShipyardBuy: ShipyardBuyEvent;
  ShipyardSell: ShipyardSellEvent;
  ShipyardSwap: ShipyardSwapEvent;
  ShipyardTransfer: ShipyardTransferEvent;
  Outfitting: OutfittingEvent;
  ModuleBuy: ModuleBuyEvent;
  ModuleSell: ModuleSellEvent;
  ModuleStore: ModuleStoreEvent;
  ModuleRetrieve: ModuleRetrieveEvent;
  ModuleSwap: ModuleSwapEvent;
  SetUserShipName: SetUserShipNameEvent;
  PayFines: PayFinesEvent;
  RedeemVoucher: RedeemVoucherEvent;
  RefuelAll: RefuelAllEvent;
  Repair: RepairEvent;
  RepairAll: RepairAllEvent;
  RestockVehicle: RestockVehicleEvent;
  BuyAmmo: BuyAmmoEvent;
  BuyDrones: BuyDronesEvent;
  SellDrones: SellDronesEvent;
  ProspectedAsteroid: ProspectedAsteroidEvent;
  AsteroidCracked: AsteroidCrackedEvent;
  MiningRefined: MiningRefinedEvent;
  LaunchDrone: LaunchDroneEvent;
  CarrierJumpRequest: CarrierJumpRequestEvent;
  CarrierJumpCancelled: CarrierJumpCancelledEvent;
  CarrierJump: CarrierJumpEvent;
  CarrierStats: CarrierStatsEvent;
  CarrierDecommission: CarrierDecommissionEvent;
  CarrierBuy: CarrierBuyEvent;
  CarrierDepositFuel: CarrierDepositFuelEvent;
  CarrierDockingPermission: CarrierDockingPermissionEvent;
  CarrierCrewServices: CarrierCrewServicesEvent;
  CarrierFinance: CarrierFinanceEvent;
  CarrierTradeOrder: CarrierTradeOrderEvent;
  CarrierModulePack: CarrierModulePackEvent;
  CarrierBankTransfer: CarrierBankTransferEvent;
  CarrierNameChanged: CarrierNameChangedEvent;
  Backpack: BackpackEvent;
  BackpackChange: BackpackChangeEvent;
  SuitLoadout: SuitLoadoutEvent;
  SwitchSuitLoadout: SwitchSuitLoadoutEvent;
  BookDropship: BookDropshipEvent;
  Disembark: DisembarkEvent;
  Embark: EmbarkEvent;
  CollectItems: CollectItemsEvent;
  DropItems: DropItemsEvent;
  UseConsumable: UseConsumableEvent;
  ScanOrganic: ScanOrganicEvent;
  BuyMicroResources: BuyMicroResourcesEvent;
  SellMicroResources: SellMicroResourcesEvent;
  TradeMicroResources: TradeMicroResourcesEvent;
  PowerplayJoin: PowerplayJoinEvent;
  PowerplayLeave: PowerplayLeaveEvent;
  PowerplayVote: PowerplayVoteEvent;
  PowerplaySalary: PowerplaySalaryEvent;
  PowerplayCollect: PowerplayCollectEvent;
  PowerplayDefect: PowerplayDefectEvent;
  PowerplayDeliver: PowerplayDeliverEvent;
  PowerplayFastTrack: PowerplayFastTrackEvent;
  Powerplay: PowerplayEvent;
  ReceiveText: ReceiveTextEvent;
  SendText: SendTextEvent;
  Music: MusicEvent;
  FuelScoop: FuelScoopEvent;
  JetConeBoost: JetConeBoostEvent;
  Shutdown: ShutdownEvent;
  Friends: FriendsEvent;
  Synthesis: SynthesisEvent;
  MaterialCollected: MaterialCollectedEvent;
  MaterialDiscarded: MaterialDiscardedEvent;
  MaterialTrade: MaterialTradeEvent;
  TechnologyBroker: TechnologyBrokerEvent;
  Screenshot: ScreenshotEvent;
  AfmuRepairs: AfmuRepairsEvent;
  RebootRepair: RebootRepairEvent;
  RepairDrone: RepairDroneEvent;
  CockpitBreached: CockpitBreachedEvent;
  SelfDestruct: SelfDestructEvent;
  HeatWarning: HeatWarningEvent;
  HeatDamage: HeatDamageEvent;
  LaunchSRV: LaunchSRVEvent;
  DockSRV: DockSRVEvent;
  SRVDestroyed: SRVDestroyedEvent;
  LaunchFighter: LaunchFighterEvent;
  DockFighter: DockFighterEvent;
  Touchdown: TouchdownEvent;
  Liftoff: LiftoffEvent;
  CommitCrime: CommitCrimeEvent;
  Promotion: PromotionEvent;
  ClearSavedGame: ClearSavedGameEvent;
  NewCommander: NewCommanderEvent;
  SupercruiseDestinationDrop: SupercruiseDestinationDropEvent;
  Resurrect: ResurrectEvent;
  WingJoin: WingJoinEvent;
  WingAdd: WingAddEvent;
  WingLeave: WingLeaveEvent;
  WingInvite: WingInviteEvent;
  RefuelPartial: RefuelPartialEvent;
  NpcCrewPaidWage: NpcCrewPaidWageEvent;
  AppliedToSquadron: AppliedToSquadronEvent;
  JoinedSquadron: JoinedSquadronEvent;
  LeftSquadron: LeftSquadronEvent;
  DatalinkScan: DatalinkScanEvent;
  DataScanned: DataScannedEvent;
  CargoDepot: CargoDepotEvent;
  SearchAndRescue: SearchAndRescueEvent;
  ScientificResearch: ScientificResearchEvent;
  CrewAssign: CrewAssignEvent;
  CrewFire: CrewFireEvent;
  CrewHire: CrewHireEvent;
}

/** String literal union of all known event names. */
export type JournalEventName = keyof JournalEventMap;
