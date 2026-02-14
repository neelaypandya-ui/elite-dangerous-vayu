/**
 * @vayu/shared — Type Barrel Export
 *
 * Re-exports all types from the types directory for convenient single-import usage:
 *   import { GameState, FSDJumpEvent, ShipState, ... } from '@vayu/shared/types';
 */

// Journal events (80+ event interfaces + base + union + map)
export type {
  JournalEvent,
  JournalFaction,
  JournalConflict,
  JournalThargoidWar,
  JournalMaterialItem,
  JournalEngineerModifier,
  JournalModuleEngineering,
  JournalShipModule,
  JournalCargoItem,
  JournalStationEconomy,
  JournalStationService,
  // Startup
  FileheaderEvent,
  CommanderEvent,
  LoadGameEvent,
  MaterialsEvent,
  RankEvent,
  ProgressEvent,
  ReputationEvent,
  StatisticsEvent,
  LoadoutEvent,
  CargoEvent,
  StoredModulesEvent,
  StoredShipsEvent,
  MissionsEvent,
  // Travel
  LocationEvent,
  FSDJumpEvent,
  DockedEvent,
  UndockedEvent,
  SupercruiseEntryEvent,
  SupercruiseExitEvent,
  ApproachBodyEvent,
  LeaveBodyEvent,
  ApproachSettlementEvent,
  DockingRequestedEvent,
  DockingGrantedEvent,
  DockingDeniedEvent,
  DockingCancelledEvent,
  DockingTimeoutEvent,
  FSDTargetEvent,
  StartJumpEvent,
  NavRouteEvent,
  NavRouteClearEvent,
  // Combat
  BountyEvent,
  ShipTargetedEvent,
  DiedEvent,
  PVPKillEvent,
  FighterDestroyedEvent,
  HullDamageEvent,
  ShieldStateEvent,
  UnderAttackEvent,
  InterdictedEvent,
  InterdictionEvent,
  EscapeInterdictionEvent,
  CrewMemberJoinsEvent,
  CrewMemberQuitsEvent,
  CrewMemberRoleChangeEvent,
  // Exploration
  ScanEvent,
  FSSDiscoveryScanEvent,
  FSSAllBodiesFoundEvent,
  FSSSignalDiscoveredEvent,
  SAASignalsFoundEvent,
  SAAScanCompleteEvent,
  CodexEntryEvent,
  MultiSellExplorationDataEvent,
  SellExplorationDataEvent,
  DiscoveryScanEvent,
  // Trade
  MarketBuyEvent,
  MarketSellEvent,
  BuyTradeDataEvent,
  CollectCargoEvent,
  EjectCargoEvent,
  MarketEvent,
  // Station Services
  MissionAcceptedEvent,
  MissionCompletedEvent,
  MissionAbandonedEvent,
  MissionFailedEvent,
  MissionRedirectedEvent,
  CommunityGoalEvent,
  EngineerCraftEvent,
  EngineerProgressEvent,
  ShipyardBuyEvent,
  ShipyardSellEvent,
  ShipyardSwapEvent,
  ShipyardTransferEvent,
  OutfittingEvent,
  ModuleBuyEvent,
  ModuleSellEvent,
  ModuleStoreEvent,
  ModuleRetrieveEvent,
  ModuleSwapEvent,
  SetUserShipNameEvent,
  PayFinesEvent,
  RedeemVoucherEvent,
  RefuelAllEvent,
  RepairEvent,
  RepairAllEvent,
  RestockVehicleEvent,
  BuyAmmoEvent,
  BuyDronesEvent,
  SellDronesEvent,
  // Mining
  ProspectedAsteroidEvent,
  AsteroidCrackedEvent,
  MiningRefinedEvent,
  LaunchDroneEvent,
  // Carrier
  CarrierJumpRequestEvent,
  CarrierJumpCancelledEvent,
  CarrierJumpEvent,
  CarrierStatsEvent,
  CarrierDecommissionEvent,
  CarrierBuyEvent,
  CarrierDepositFuelEvent,
  CarrierDockingPermissionEvent,
  CarrierCrewServicesEvent,
  CarrierFinanceEvent,
  CarrierTradeOrderEvent,
  CarrierModulePackEvent,
  CarrierBankTransferEvent,
  CarrierNameChangedEvent,
  // Odyssey
  BackpackEvent,
  BackpackChangeEvent,
  SuitLoadoutEvent,
  SwitchSuitLoadoutEvent,
  BookDropshipEvent,
  DisembarkEvent,
  EmbarkEvent,
  CollectItemsEvent,
  DropItemsEvent,
  UseConsumableEvent,
  ScanOrganicEvent,
  BuyMicroResourcesEvent,
  SellMicroResourcesEvent,
  TradeMicroResourcesEvent,
  // Powerplay
  PowerplayJoinEvent,
  PowerplayLeaveEvent,
  PowerplayVoteEvent,
  PowerplaySalaryEvent,
  PowerplayCollectEvent,
  PowerplayDefectEvent,
  PowerplayDeliverEvent,
  PowerplayFastTrackEvent,
  PowerplayEvent,
  // Other
  ReceiveTextEvent,
  SendTextEvent,
  MusicEvent,
  FuelScoopEvent,
  JetConeBoostEvent,
  ShutdownEvent,
  FriendsEvent,
  SynthesisEvent,
  MaterialCollectedEvent,
  MaterialDiscardedEvent,
  MaterialTradeEvent,
  TechnologyBrokerEvent,
  ScreenshotEvent,
  AfmuRepairsEvent,
  RebootRepairEvent,
  RepairDroneEvent,
  CockpitBreachedEvent,
  SelfDestructEvent,
  HeatWarningEvent,
  HeatDamageEvent,
  LaunchSRVEvent,
  DockSRVEvent,
  SRVDestroyedEvent,
  LaunchFighterEvent,
  DockFighterEvent,
  TouchdownEvent,
  LiftoffEvent,
  CommitCrimeEvent,
  PromotionEvent,
  ClearSavedGameEvent,
  NewCommanderEvent,
  SupercruiseDestinationDropEvent,
  ResurrectEvent,
  WingJoinEvent,
  WingAddEvent,
  WingLeaveEvent,
  WingInviteEvent,
  RefuelPartialEvent,
  NpcCrewPaidWageEvent,
  AppliedToSquadronEvent,
  JoinedSquadronEvent,
  LeftSquadronEvent,
  DatalinkScanEvent,
  DataScannedEvent,
  CargoDepotEvent,
  SearchAndRescueEvent,
  ScientificResearchEvent,
  CrewAssignEvent,
  CrewFireEvent,
  CrewHireEvent,
  // Union & map
  AnyJournalEvent,
  JournalEventMap,
  JournalEventName,
} from './journal-events.js';

// Commander types
export type {
  CombatRankName,
  TradeRankName,
  ExploreRankName,
  CQCRankName,
  FederationRankName,
  EmpireRankName,
  ExobiologistRankName,
  SoldierRankName,
  RankInfo,
  CommanderRanks,
  ReputationLevel,
  CommanderReputation,
  CommanderState,
} from './commander.js';
export {
  COMBAT_RANKS,
  TRADE_RANKS,
  EXPLORE_RANKS,
  CQC_RANKS,
  FEDERATION_RANKS,
  EMPIRE_RANKS,
  EXOBIOLOGIST_RANKS,
  SOLDIER_RANKS,
} from './commander.js';

// Ship types
export type {
  ModuleEngineering,
  ModuleModifier,
  ShipModule,
  Hardpoint,
  UtilityMount,
  CoreModule,
  OptionalModule,
  FuelState,
  CargoItem,
  ShipState,
  ShipManufacturer,
  ShipSize,
  ShipInfo,
  ShipType,
} from './ship.js';
export { SHIP_DISPLAY_NAMES } from './ship.js';

// Material types
export type {
  MaterialCategory,
  MaterialGrade,
  Material,
  MaterialsState,
  BlueprintIngredient,
  BlueprintGrade,
  EngineeringBlueprint,
  ExperimentalEffect,
  EngineerState,
  MaterialTradeRate,
} from './materials.js';
export { MATERIAL_GRADE_CAPS } from './materials.js';

// Market types
export type {
  CommodityCategory,
  Commodity,
  MarketEntry,
  MarketSnapshot,
  TradeRoute,
  TradeResult,
  TradeSession,
} from './market.js';

// Navigation types
export type {
  Coordinates,
  StarClass,
  SystemAllegiance,
  SystemGovernment,
  SystemSecurity,
  SystemEconomy,
  StarSystem,
  PlanetClass,
  TerraformState,
  ReserveLevel,
  BodyRing,
  SystemBody,
  Station,
  RouteWaypoint,
  NavRoute,
  LocationState,
} from './navigation.js';
export { StationType } from './navigation.js';

// Binding types
export type {
  BindingCategory,
  BindingModifier,
  KeyBinding,
  AxisBinding,
  BindingEntry,
  BindingSet,
  BindingCategorySummary,
} from './bindings.js';
export { DeviceType } from './bindings.js';

// Graphics types
export type {
  DisplayMode,
  QualityPreset,
  AntiAliasingMode,
  TextureQuality,
  ShadowQuality,
  AmbientOcclusionMode,
  BloomQuality,
  GraphicsSetting,
  HUDColorMatrix,
  GraphicsProfile,
} from './graphics.js';

// Carrier types
export type {
  CarrierServiceRole,
  CarrierService,
  CarrierDockingAccess,
  CarrierSpaceUsage,
  CarrierFinance,
  CarrierJumpRecord,
  CarrierTradeOrder,
  TritiumFuelCalc,
  CarrierState,
} from './carrier.js';

// Odyssey types
export type {
  SuitType,
  Suit,
  WeaponType,
  WeaponDamageType,
  Weapon,
  SuitLoadout,
  BackpackItemType,
  BackpackItem,
  OdysseyMaterialCategory,
  OdysseyMaterial,
  ExobiologyScan,
  OdysseyState,
} from './odyssey.js';
export { SUIT_DISPLAY_NAMES } from './odyssey.js';

// Mining types
export type {
  AsteroidContent,
  ProspectorMaterial,
  ProspectorResult,
  AsteroidCrack,
  MiningYield,
  MiningSession,
} from './mining.js';

// COVAS types
export type {
  STTProvider,
  STTConfig,
  STTResult,
  TTSProvider,
  TTSConfig,
  TTSResult,
  CovasCommandCategory,
  CovasCommand,
  CovasMessageRole,
  CovasMessage,
  CovasState,
} from './covas.js';
export { CovasPipelineStage } from './covas.js';

// WebSocket types
export type {
  WSEventType,
  WSEnvelope,
  WSConnectionOpenPayload,
  WSConnectionClosePayload,
  WSConnectionErrorPayload,
  WSSubscriptionPayload,
  WSClientCommandPayload,
  WSServerInfoPayload,
  WSStatePatchPayload,
  WSJournalBatchPayload,
  WSStatusFlagsPayload,
} from './websocket.js';

// API types
export type {
  ApiResponse,
  ApiError,
  ApiResult,
  PaginationMeta,
  PaginatedResponse,
  ListQueryParams,
  JournalQueryParams,
  TradeRouteQueryParams,
  HttpMethod,
  ApiRouteDefinition,
} from './api.js';

// Game State (unified)
export type {
  MissionState,
  SessionState,
  GameState,
} from './game-state.js';
