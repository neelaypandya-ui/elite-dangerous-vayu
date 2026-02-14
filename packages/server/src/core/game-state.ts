/**
 * @vayu/server — Game State Manager
 *
 * The HEART of VAYU. Subscribes to all journal events via the event bus
 * and maintains a complete, up-to-date GameState singleton. When any part
 * of the state changes, it broadcasts the delta via WebSocket to all
 * connected clients.
 *
 * Event flow:
 *   Journal file -> JournalWatcher -> EventBus -> GameStateManager -> WebSocket
 *   Status.json  -> StatusWatcher  -> EventBus -> GameStateManager -> WebSocket
 *   Cargo.json   -> CompanionWatcher -> EventBus -> GameStateManager -> WebSocket
 *
 * The GameState is organized into independent slices:
 *   - commander: identity, ranks, reputation, credits
 *   - ship: current ship, modules, fuel, cargo
 *   - location: system, body, station, movement flags
 *   - materials: raw, manufactured, encoded inventories
 *   - missions: active mission list
 *   - session: aggregated session statistics
 *   - carrier: fleet carrier state (nullable)
 *   - odyssey: on-foot state, suits, backpack
 */

import { eventBus } from './event-bus.js';
import { wsManager } from '../websocket.js';
import type {
  GameState,
  CommanderState,
  ShipState,
  LocationState,
  MaterialsState,
  MissionState,
  SessionState,
  CarrierState,
  OdysseyState,
  Material,
  MaterialCategory,
  MaterialGrade,
  FuelState,
  ShipModule,
  CargoItem,
  CarrierService,
  CarrierSpaceUsage,
  CarrierFinance,
  SuitLoadout,
  Suit,
  Weapon,
  BackpackItem,
  ExobiologyScan,
  CommanderRanks,
  CommanderReputation,
} from '@vayu/shared';
import { MATERIAL_GRADE_CAPS } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[GameState]';

function log(message: string, ...args: unknown[]): void {
  console.log(`${LOG_PREFIX} ${message}`, ...args);
}

function warn(message: string, ...args: unknown[]): void {
  console.warn(`${LOG_PREFIX} ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// Default State Factories
// ---------------------------------------------------------------------------

function createDefaultRanks(): CommanderRanks {
  return {
    combat: { rank: 0, progress: 0 },
    trade: { rank: 0, progress: 0 },
    explore: { rank: 0, progress: 0 },
    cqc: { rank: 0, progress: 0 },
    federation: { rank: 0, progress: 0 },
    empire: { rank: 0, progress: 0 },
    soldier: { rank: 0, progress: 0 },
    exobiologist: { rank: 0, progress: 0 },
  };
}

function createDefaultReputation(): CommanderReputation {
  return {
    empire: 0,
    federation: 0,
    alliance: 0,
    independent: 0,
  };
}

function createDefaultCommander(): CommanderState {
  return {
    fid: '',
    name: '',
    credits: 0,
    loan: 0,
    ranks: createDefaultRanks(),
    reputation: createDefaultReputation(),
    horizons: false,
    odyssey: false,
    gameMode: '',
    group: null,
    language: '',
    gameVersion: '',
    power: null,
    timePledged: 0,
    powerplayMerits: 0,
    powerplayRank: 0,
    squadron: null,
  };
}

function createDefaultFuel(): FuelState {
  return {
    main: 0,
    reserve: 0,
    mainCapacity: 0,
    reserveCapacity: 0,
  };
}

function createDefaultShip(): ShipState {
  return {
    ship: '',
    shipLocalised: null,
    shipId: 0,
    shipName: '',
    shipIdent: '',
    hullValue: 0,
    modulesValue: 0,
    rebuy: 0,
    hullHealth: 1.0,
    unladenMass: 0,
    cargoCapacity: 0,
    maxJumpRange: 0,
    fuel: createDefaultFuel(),
    modules: [],
    cargo: [],
    cargoCount: 0,
    hot: false,
    hardpointsDeployed: false,
    landingGearDown: false,
    shieldsUp: true,
    cargoScoopOpen: false,
    lightsOn: false,
    fsdCharging: false,
    fsdCooldown: false,
    fsdMassLocked: false,
    silentRunning: false,
    nightVision: false,
  };
}

function createDefaultLocation(): LocationState {
  return {
    system: '',
    systemAddress: 0,
    coordinates: { x: 0, y: 0, z: 0 },
    body: '',
    bodyId: 0,
    bodyType: '',
    docked: false,
    landed: false,
    onFoot: false,
    supercruise: false,
    inSRV: false,
    inFighter: false,
    inTaxi: false,
    inMulticrew: false,
    station: null,
    stationType: null,
    marketId: null,
    latitude: null,
    longitude: null,
    altitude: null,
    heading: null,
    distFromStarLS: null,
    systemAllegiance: '',
    systemEconomy: '',
    systemGovernment: '',
    systemSecurity: '',
    systemPopulation: 0,
  };
}

function createDefaultMaterials(): MaterialsState {
  return {
    raw: [],
    manufactured: [],
    encoded: [],
  };
}

function createDefaultSession(): SessionState {
  return {
    startTime: new Date().toISOString(),
    jumps: 0,
    totalDistance: 0,
    fuelUsed: 0,
    fuelScoops: 0,
    fuelScooped: 0,
    creditsEarned: 0,
    creditsSpent: 0,
    netProfit: 0,
    bodiesScanned: 0,
    systemsVisited: 0,
    uniqueSystemsVisited: [],
    bountiesCollected: 0,
    bountyEarnings: 0,
    missionsCompleted: 0,
    missionsFailed: 0,
    deaths: 0,
    materialsCollected: 0,
    cargoTraded: 0,
    tradeProfit: 0,
    explorationEarnings: 0,
    miningRefined: 0,
    elapsedSeconds: 0,
  };
}

function createDefaultOdyssey(): OdysseyState {
  return {
    onFoot: false,
    currentLoadout: null,
    suits: [],
    loadouts: [],
    backpack: [],
    materials: [],
    activeScans: [],
    speciesAnalysed: 0,
  };
}

// ---------------------------------------------------------------------------
// GameStateManager
// ---------------------------------------------------------------------------

/**
 * Maintains the unified GameState by subscribing to every relevant
 * journal event and companion file update via the event bus. Changes are
 * broadcast to all connected WebSocket clients.
 */
class GameStateManager {
  private state: GameState;
  private sessionTimer: ReturnType<typeof setInterval> | null = null;
  private eventsProcessed = 0;

  constructor() {
    this.state = this.createInitialState();
    this.registerEventHandlers();
    this.startSessionTimer();
    log('Initialized');
  }

  // =========================================================================
  // Initial State
  // =========================================================================

  /**
   * Create a fully zeroed-out GameState. Every field has a sensible default
   * so the UI always has something to render even before the first journal
   * event arrives.
   */
  private createInitialState(): GameState {
    return {
      commander: createDefaultCommander(),
      ship: createDefaultShip(),
      location: createDefaultLocation(),
      materials: createDefaultMaterials(),
      missions: [],
      session: createDefaultSession(),
      carrier: null,
      odyssey: createDefaultOdyssey(),
      initialized: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  // =========================================================================
  // Event Handler Registration
  // =========================================================================

  /**
   * Register handlers for EVERY major journal event type, plus companion
   * file updates (Status.json, Cargo.json). Handlers are grouped by the
   * state slice they affect.
   */
  private registerEventHandlers(): void {
    // ----- Commander -----
    this.registerCommanderHandlers();

    // ----- Ship -----
    this.registerShipHandlers();

    // ----- Location -----
    this.registerLocationHandlers();

    // ----- Materials -----
    this.registerMaterialHandlers();

    // ----- Missions -----
    this.registerMissionHandlers();

    // ----- Session Statistics -----
    this.registerSessionHandlers();

    // ----- Fleet Carrier -----
    this.registerCarrierHandlers();

    // ----- Odyssey -----
    this.registerOdysseyHandlers();

    // ----- Companion File Updates -----
    this.registerCompanionHandlers();

    // ----- Powerplay -----
    this.registerPowerplayHandlers();

    // ----- Diagnostics -----
    eventBus.onAnyJournalEvent(() => {
      this.eventsProcessed++;
    });

    log('All event handlers registered');
  }

  // =========================================================================
  // Commander Handlers
  // =========================================================================

  private registerCommanderHandlers(): void {
    // Commander event -> set commander name, FID
    eventBus.onJournalEvent('Commander', (e) => {
      this.state.commander.fid = e.FID;
      this.state.commander.name = e.Name;
      this.broadcastStateChange('commander');
    });

    // LoadGame -> set commander name, ship, game mode, credits, loan
    eventBus.onJournalEvent('LoadGame', (e) => {
      const cmd = this.state.commander;
      cmd.fid = e.FID;
      cmd.name = e.Commander;
      cmd.credits = e.Credits;
      cmd.loan = e.Loan;
      cmd.horizons = e.Horizons;
      cmd.odyssey = e.Odyssey;
      cmd.gameMode = e.GameMode;
      cmd.group = e.Group ?? null;
      cmd.language = e.language;
      cmd.gameVersion = e.gameversion;

      // LoadGame also provides basic ship info
      const ship = this.state.ship;
      ship.ship = e.Ship;
      ship.shipLocalised = e.Ship_Localised ?? null;
      ship.shipId = e.ShipID;
      ship.shipName = e.ShipName;
      ship.shipIdent = e.ShipIdent;
      ship.fuel.main = e.FuelLevel;
      ship.fuel.mainCapacity = e.FuelCapacity;

      // Mark state as initialized on LoadGame
      this.state.initialized = true;

      // Reset session on new game load
      this.resetSession();

      this.broadcastStateChange('commander');
      this.broadcastStateChange('ship');
      log(`Commander loaded: ${cmd.name} in ${ship.shipName} (${ship.ship})`);
    });

    // Rank -> update all rank levels
    eventBus.onJournalEvent('Rank', (e) => {
      const ranks = this.state.commander.ranks;
      ranks.combat.rank = e.Combat;
      ranks.trade.rank = e.Trade;
      ranks.explore.rank = e.Explore;
      ranks.cqc.rank = e.CQC;
      ranks.federation.rank = e.Federation;
      ranks.empire.rank = e.Empire;
      ranks.soldier.rank = e.Soldier;
      ranks.exobiologist.rank = e.Exobiologist;
      this.broadcastStateChange('commander');
    });

    // Progress -> update rank progress percentages
    eventBus.onJournalEvent('Progress', (e) => {
      const ranks = this.state.commander.ranks;
      ranks.combat.progress = e.Combat;
      ranks.trade.progress = e.Trade;
      ranks.explore.progress = e.Explore;
      ranks.cqc.progress = e.CQC;
      ranks.federation.progress = e.Federation;
      ranks.empire.progress = e.Empire;
      ranks.soldier.progress = e.Soldier;
      ranks.exobiologist.progress = e.Exobiologist;
      this.broadcastStateChange('commander');
    });

    // Reputation -> update superpower reputation
    eventBus.onJournalEvent('Reputation', (e) => {
      this.state.commander.reputation.empire = e.Empire;
      this.state.commander.reputation.federation = e.Federation;
      this.state.commander.reputation.alliance = e.Alliance;
      this.state.commander.reputation.independent = e.Independent;
      this.broadcastStateChange('commander');
    });

    // Promotion -> update specific rank
    eventBus.onJournalEvent('Promotion', (e) => {
      const ranks = this.state.commander.ranks;
      if (e.Combat !== undefined) ranks.combat.rank = e.Combat;
      if (e.Trade !== undefined) ranks.trade.rank = e.Trade;
      if (e.Explore !== undefined) ranks.explore.rank = e.Explore;
      if (e.CQC !== undefined) ranks.cqc.rank = e.CQC;
      if (e.Federation !== undefined) ranks.federation.rank = e.Federation;
      if (e.Empire !== undefined) ranks.empire.rank = e.Empire;
      if (e.Soldier !== undefined) ranks.soldier.rank = e.Soldier;
      if (e.Exobiologist !== undefined) ranks.exobiologist.rank = e.Exobiologist;
      this.broadcastStateChange('commander');
    });

    // Statistics -> store (we just log receipt; full stats are complex)
    eventBus.onJournalEvent('Statistics', (_e) => {
      // Statistics event contains aggregated lifetime stats. We store the
      // fact that we received it but do not duplicate the data into the
      // GameState since it is not session-scoped. Individual session stats
      // are tracked in the session slice.
      log('Statistics event received');
    });

    // Fileheader -> track Odyssey flag and game version
    eventBus.onJournalEvent('Fileheader', (e) => {
      this.state.commander.odyssey = e.Odyssey;
      this.state.commander.gameVersion = e.gameversion;
      this.state.commander.language = e.language;
    });

    // JoinedSquadron / LeftSquadron
    eventBus.onJournalEvent('JoinedSquadron', (e) => {
      this.state.commander.squadron = e.SquadronName;
      this.broadcastStateChange('commander');
    });

    eventBus.onJournalEvent('LeftSquadron', (_e) => {
      this.state.commander.squadron = null;
      this.broadcastStateChange('commander');
    });
  }

  // =========================================================================
  // Ship Handlers
  // =========================================================================

  private registerShipHandlers(): void {
    // Loadout -> full ship state (name, ident, modules, hull health)
    eventBus.onJournalEvent('Loadout', (e) => {
      const ship = this.state.ship;
      ship.ship = e.Ship;
      ship.shipLocalised = null; // Loadout doesn't include Ship_Localised
      ship.shipId = e.ShipID;
      ship.shipName = e.ShipName;
      ship.shipIdent = e.ShipIdent;
      ship.hullValue = e.HullValue;
      ship.modulesValue = e.ModulesValue;
      ship.hullHealth = e.HullHealth;
      ship.unladenMass = e.UnladenMass;
      ship.cargoCapacity = e.CargoCapacity;
      ship.maxJumpRange = e.MaxJumpRange;
      ship.rebuy = e.Rebuy;
      ship.hot = e.Hot ?? false;

      // Fuel capacities from Loadout
      ship.fuel.mainCapacity = e.FuelCapacity.Main;
      ship.fuel.reserveCapacity = e.FuelCapacity.Reserve;

      // Map all modules
      ship.modules = e.Modules.map((m): ShipModule => ({
        slot: m.Slot,
        item: m.Item,
        on: m.On,
        priority: m.Priority,
        health: m.Health,
        value: m.Value ?? 0,
        ammoInClip: m.AmmoInClip ?? null,
        ammoInHopper: m.AmmoInHopper ?? null,
        engineering: m.Engineering
          ? {
              engineer: m.Engineering.Engineer ?? null,
              engineerId: m.Engineering.EngineerID ?? null,
              blueprintName: m.Engineering.BlueprintName,
              blueprintId: m.Engineering.BlueprintID,
              level: m.Engineering.Level,
              quality: m.Engineering.Quality,
              modifiers: m.Engineering.Modifiers.map((mod) => ({
                label: mod.Label,
                value: mod.Value,
                originalValue: mod.OriginalValue,
                lessIsGood: mod.LessIsGood,
              })),
              experimentalEffect: m.Engineering.ExperimentalEffect ?? null,
              experimentalEffectLocalised:
                m.Engineering.ExperimentalEffect_Localised ?? null,
            }
          : null,
      }));

      this.broadcastStateChange('ship');
      log(`Loadout: ${ship.shipName} (${ship.ship}), ${ship.modules.length} modules`);
    });

    // ShipyardSwap -> changed ship
    eventBus.onJournalEvent('ShipyardSwap', (e) => {
      const ship = this.state.ship;
      ship.ship = e.ShipType;
      ship.shipLocalised = e.ShipType_Localised ?? null;
      ship.shipId = e.ShipID;
      // Name/ident will come with the subsequent Loadout event
      this.broadcastStateChange('ship');
      log(`Ship swapped to: ${e.ShipType} (ID ${e.ShipID})`);
    });

    // ShipyardBuy -> bought new ship (becomes active)
    eventBus.onJournalEvent('ShipyardBuy', (e) => {
      const ship = this.state.ship;
      ship.ship = e.ShipType;
      ship.shipLocalised = e.ShipType_Localised ?? null;
      // ShipID comes with subsequent Loadout; clear old state
      ship.modules = [];
      ship.hullHealth = 1.0;

      // Track spending
      this.state.session.creditsSpent += e.ShipPrice;
      this.updateNetProfit();

      this.broadcastStateChange('ship');
      this.broadcastStateChange('session');
      log(`Ship purchased: ${e.ShipType} for ${e.ShipPrice} CR`);
    });

    // SetUserShipName -> rename ship
    eventBus.onJournalEvent('SetUserShipName', (e) => {
      if (e.ShipID === this.state.ship.shipId) {
        this.state.ship.shipName = e.UserShipName;
        this.state.ship.shipIdent = e.UserShipId;
        this.broadcastStateChange('ship');
      }
    });

    // ModuleBuy -> module installed (swapped or new)
    eventBus.onJournalEvent('ModuleBuy', (e) => {
      if (e.ShipID === this.state.ship.shipId) {
        // Replace module in the slot
        this.updateModuleInSlot(e.Slot, {
          slot: e.Slot,
          item: e.BuyItem,
          on: true,
          priority: 1,
          health: 1.0,
          value: e.BuyPrice,
          ammoInClip: null,
          ammoInHopper: null,
          engineering: null,
        });

        this.state.session.creditsSpent += e.BuyPrice;
        this.updateNetProfit();

        this.broadcastStateChange('ship');
        this.broadcastStateChange('session');
      }
    });

    // ModuleSell -> module removed from slot
    eventBus.onJournalEvent('ModuleSell', (e) => {
      if (e.ShipID === this.state.ship.shipId) {
        this.removeModuleFromSlot(e.Slot);

        this.state.session.creditsEarned += e.SellPrice;
        this.updateNetProfit();

        this.broadcastStateChange('ship');
        this.broadcastStateChange('session');
      }
    });

    // ModuleStore -> module removed from slot to storage
    eventBus.onJournalEvent('ModuleStore', (e) => {
      if (e.ShipID === this.state.ship.shipId) {
        // If there's a replacement, update the slot; otherwise remove
        if (e.ReplacementItem) {
          this.updateModuleInSlot(e.Slot, {
            slot: e.Slot,
            item: e.ReplacementItem,
            on: true,
            priority: 1,
            health: 1.0,
            value: 0,
            ammoInClip: null,
            ammoInHopper: null,
            engineering: null,
          });
        } else {
          this.removeModuleFromSlot(e.Slot);
        }
        this.broadcastStateChange('ship');
      }
    });

    // ModuleRetrieve -> module retrieved from storage into slot
    eventBus.onJournalEvent('ModuleRetrieve', (e) => {
      if (e.ShipID === this.state.ship.shipId) {
        this.updateModuleInSlot(e.Slot, {
          slot: e.Slot,
          item: e.RetrievedItem,
          on: true,
          priority: 1,
          health: 1.0,
          value: 0,
          ammoInClip: null,
          ammoInHopper: null,
          engineering: null,
        });
        this.broadcastStateChange('ship');
      }
    });

    // ModuleSwap -> swap modules between two slots
    eventBus.onJournalEvent('ModuleSwap', (e) => {
      if (e.ShipID === this.state.ship.shipId) {
        const modules = this.state.ship.modules;
        const fromIdx = modules.findIndex((m) => m.slot === e.FromSlot);
        const toIdx = modules.findIndex((m) => m.slot === e.ToSlot);

        if (fromIdx !== -1 && toIdx !== -1) {
          // Swap slot names
          const temp = modules[fromIdx];
          modules[fromIdx] = { ...modules[toIdx], slot: e.FromSlot };
          modules[toIdx] = { ...temp, slot: e.ToSlot };
        } else if (fromIdx !== -1) {
          // Move from -> to (to was empty)
          modules[fromIdx] = { ...modules[fromIdx], slot: e.ToSlot };
        }
        this.broadcastStateChange('ship');
      }
    });

    // HullDamage -> update hull health
    eventBus.onJournalEvent('HullDamage', (e) => {
      if (e.PlayerPilot && !e.Fighter) {
        this.state.ship.hullHealth = e.Health;
        this.broadcastStateChange('ship');
      }
    });

    // ShieldState -> update shield status (informational broadcast)
    eventBus.onJournalEvent('ShieldState', (e) => {
      // ShieldState doesn't map to a ShipState field directly, but we
      // broadcast so the UI can show shield up/down status.
      wsManager.broadcast('state:ship', {
        ...this.state.ship,
        _shieldsUp: e.ShieldsUp,
      });
    });

    // FuelScoop -> update fuel level
    eventBus.onJournalEvent('FuelScoop', (e) => {
      this.state.ship.fuel.main = e.Total;

      // Track session scooping stats
      this.state.session.fuelScoops++;
      this.state.session.fuelScooped += e.Scooped;

      this.broadcastStateChange('ship');
      this.broadcastStateChange('session');
    });

    // RefuelAll -> fuel to max
    eventBus.onJournalEvent('RefuelAll', (e) => {
      this.state.ship.fuel.main = this.state.ship.fuel.mainCapacity;

      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();

      this.broadcastStateChange('ship');
      this.broadcastStateChange('session');
    });

    // RefuelPartial -> partial refuel
    eventBus.onJournalEvent('RefuelPartial', (e) => {
      // Amount is in fractional tons; add to current level
      this.state.ship.fuel.main = Math.min(
        this.state.ship.fuel.main + e.Amount,
        this.state.ship.fuel.mainCapacity,
      );

      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();

      this.broadcastStateChange('ship');
      this.broadcastStateChange('session');
    });

    // RepairAll -> hull to 100%
    eventBus.onJournalEvent('RepairAll', (e) => {
      this.state.ship.hullHealth = 1.0;

      // Also reset all module health to 1.0
      for (const mod of this.state.ship.modules) {
        mod.health = 1.0;
      }

      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();

      this.broadcastStateChange('ship');
      this.broadcastStateChange('session');
    });

    // Repair -> single module/hull repair
    eventBus.onJournalEvent('Repair', (e) => {
      if (e.Item === 'Hull' || e.Item === 'hull') {
        this.state.ship.hullHealth = 1.0;
      } else {
        // Try to find the module and restore its health
        const mod = this.state.ship.modules.find(
          (m) => m.item.toLowerCase() === e.Item.toLowerCase() || m.slot.toLowerCase() === e.Item.toLowerCase(),
        );
        if (mod) {
          mod.health = 1.0;
        }
      }

      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();

      this.broadcastStateChange('ship');
      this.broadcastStateChange('session');
    });

    // Cargo -> full cargo manifest (startup event)
    eventBus.onJournalEvent('Cargo', (e) => {
      if (e.Vessel === 'Ship') {
        this.state.ship.cargo = e.Inventory.map((item): CargoItem => ({
          name: item.Name,
          nameLocalised: item.Name_Localised ?? null,
          count: item.Count,
          stolen: item.Stolen,
          missionId: item.MissionID ?? null,
        }));
        this.state.ship.cargoCount = e.Count;
        this.broadcastStateChange('ship');
      }
    });

    // RepairDrone -> partial hull repair
    eventBus.onJournalEvent('RepairDrone', (e) => {
      this.state.ship.hullHealth = Math.min(
        1.0,
        this.state.ship.hullHealth + e.HullRepaired,
      );
      this.broadcastStateChange('ship');
    });

    // AfmuRepairs -> module repair via AFMU
    eventBus.onJournalEvent('AfmuRepairs', (e) => {
      const mod = this.state.ship.modules.find(
        (m) => m.item.toLowerCase() === e.Module.toLowerCase() || m.slot.toLowerCase() === e.Module.toLowerCase(),
      );
      if (mod) {
        mod.health = e.Health;
      }
      this.broadcastStateChange('ship');
    });

    // EngineerCraft -> update module engineering (also consumes materials)
    eventBus.onJournalEvent('EngineerCraft', (e) => {
      const mod = this.state.ship.modules.find((m) => m.slot === e.Slot);
      if (mod) {
        mod.engineering = {
          engineer: e.Engineer,
          engineerId: e.EngineerID,
          blueprintName: e.BlueprintName,
          blueprintId: e.BlueprintID,
          level: e.Level,
          quality: e.Quality,
          modifiers: e.Modifiers.map((m) => ({
            label: m.Label,
            value: m.Value,
            originalValue: m.OriginalValue,
            lessIsGood: m.LessIsGood,
          })),
          experimentalEffect: e.ExperimentalEffect ?? null,
          experimentalEffectLocalised: e.ExperimentalEffect_Localised ?? null,
        };
        this.broadcastStateChange('ship');
      }

      // Materials consumed are handled by material handlers
    });

    // BuyAmmo / BuyDrones / SellDrones -> track spending
    eventBus.onJournalEvent('BuyAmmo', (e) => {
      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    eventBus.onJournalEvent('BuyDrones', (e) => {
      this.state.session.creditsSpent += e.TotalCost;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    eventBus.onJournalEvent('SellDrones', (e) => {
      this.state.session.creditsEarned += e.TotalSale;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });
  }

  // =========================================================================
  // Location Handlers
  // =========================================================================

  private registerLocationHandlers(): void {
    // Location -> full location update (startup event)
    eventBus.onJournalEvent('Location', (e) => {
      const loc = this.state.location;
      loc.system = e.StarSystem;
      loc.systemAddress = e.SystemAddress;
      loc.coordinates = { x: e.StarPos[0], y: e.StarPos[1], z: e.StarPos[2] };
      loc.body = e.Body;
      loc.bodyId = e.BodyID;
      loc.bodyType = e.BodyType;
      loc.docked = e.Docked;
      loc.inTaxi = e.Taxi ?? false;
      loc.inMulticrew = e.Multicrew ?? false;
      loc.systemAllegiance = e.SystemAllegiance;
      loc.systemEconomy = e.SystemEconomy_Localised ?? e.SystemEconomy;
      loc.systemGovernment = e.SystemGovernment_Localised ?? e.SystemGovernment;
      loc.systemSecurity = e.SystemSecurity_Localised ?? e.SystemSecurity;
      loc.systemPopulation = e.Population;
      loc.distFromStarLS = e.DistFromStarLS ?? null;
      loc.latitude = e.Latitude ?? null;
      loc.longitude = e.Longitude ?? null;

      // Station info if docked
      if (e.Docked && e.StationName) {
        loc.station = e.StationName;
        loc.stationType = e.StationType ?? null;
        loc.marketId = e.MarketID ?? null;
      } else {
        loc.station = null;
        loc.stationType = null;
        loc.marketId = null;
      }

      // Mark initialized
      this.state.initialized = true;

      // Track unique system visit
      this.trackSystemVisit(e.StarSystem);

      this.broadcastStateChange('location');
      log(`Location: ${loc.system} (${loc.docked ? 'docked at ' + loc.station : loc.bodyType})`);
    });

    // FSDJump -> moved to new system
    eventBus.onJournalEvent('FSDJump', (e) => {
      const loc = this.state.location;
      const prevSystem = loc.system;
      const prevCoords = { ...loc.coordinates };

      loc.system = e.StarSystem;
      loc.systemAddress = e.SystemAddress;
      loc.coordinates = { x: e.StarPos[0], y: e.StarPos[1], z: e.StarPos[2] };
      loc.body = e.Body;
      loc.bodyId = e.BodyID;
      loc.bodyType = e.BodyType;
      loc.docked = false;
      loc.landed = false;
      loc.onFoot = false;
      loc.supercruise = true; // After jump you're in supercruise
      loc.inSRV = false;
      loc.inFighter = false;
      loc.inTaxi = e.Taxi ?? false;
      loc.inMulticrew = e.Multicrew ?? false;
      loc.station = null;
      loc.stationType = null;
      loc.marketId = null;
      loc.latitude = null;
      loc.longitude = null;
      loc.altitude = null;
      loc.heading = null;
      loc.distFromStarLS = null;
      loc.systemAllegiance = e.SystemAllegiance;
      loc.systemEconomy = e.SystemEconomy_Localised ?? e.SystemEconomy;
      loc.systemGovernment = e.SystemGovernment_Localised ?? e.SystemGovernment;
      loc.systemSecurity = e.SystemSecurity_Localised ?? e.SystemSecurity;
      loc.systemPopulation = e.Population;

      // Update fuel from FSDJump
      this.state.ship.fuel.main = e.FuelLevel;

      // Session stats
      this.state.session.jumps++;
      this.state.session.totalDistance += e.JumpDist;
      this.state.session.fuelUsed += e.FuelUsed;
      this.trackSystemVisit(e.StarSystem);

      this.broadcastStateChange('location');
      this.broadcastStateChange('ship');
      this.broadcastStateChange('session');
      log(`FSDJump: ${prevSystem} -> ${e.StarSystem} (${e.JumpDist.toFixed(2)} LY)`);
    });

    // CarrierJump -> player's location changed because carrier jumped
    eventBus.onJournalEvent('CarrierJump', (e) => {
      const loc = this.state.location;
      loc.system = e.StarSystem;
      loc.systemAddress = e.SystemAddress;
      loc.coordinates = { x: e.StarPos[0], y: e.StarPos[1], z: e.StarPos[2] };
      loc.body = e.Body;
      loc.bodyId = e.BodyID;
      loc.bodyType = e.BodyType;
      loc.docked = e.Docked;
      loc.systemAllegiance = e.SystemAllegiance;
      loc.systemEconomy = e.SystemEconomy_Localised ?? e.SystemEconomy;
      loc.systemGovernment = e.SystemGovernment_Localised ?? e.SystemGovernment;
      loc.systemSecurity = e.SystemSecurity_Localised ?? e.SystemSecurity;
      loc.systemPopulation = e.Population;

      if (e.Docked) {
        loc.station = e.StationName;
        loc.stationType = e.StationType;
        loc.marketId = e.MarketID;
      }

      // Also update carrier location
      if (this.state.carrier) {
        this.state.carrier.currentSystem = e.StarSystem;
        this.state.carrier.currentBody = e.Body;
        this.broadcastStateChange('carrier');
      }

      this.trackSystemVisit(e.StarSystem);

      this.broadcastStateChange('location');
      this.broadcastStateChange('session');
      log(`CarrierJump: arrived at ${e.StarSystem}`);
    });

    // SupercruiseEntry -> update supercruise flag
    eventBus.onJournalEvent('SupercruiseEntry', (e) => {
      const loc = this.state.location;
      loc.supercruise = true;
      loc.docked = false;
      loc.landed = false;
      loc.station = null;
      loc.stationType = null;
      loc.marketId = null;
      loc.latitude = null;
      loc.longitude = null;
      loc.altitude = null;
      loc.heading = null;
      loc.inTaxi = e.Taxi ?? false;
      loc.inMulticrew = e.Multicrew ?? false;
      this.broadcastStateChange('location');
    });

    // SupercruiseExit -> update supercruise flag, set body
    eventBus.onJournalEvent('SupercruiseExit', (e) => {
      const loc = this.state.location;
      loc.supercruise = false;
      loc.body = e.Body;
      loc.bodyId = e.BodyID;
      loc.bodyType = e.BodyType;
      loc.inTaxi = e.Taxi ?? false;
      loc.inMulticrew = e.Multicrew ?? false;
      this.broadcastStateChange('location');
    });

    // Docked -> set station, docked flag
    eventBus.onJournalEvent('Docked', (e) => {
      const loc = this.state.location;
      loc.docked = true;
      loc.supercruise = false;
      loc.station = e.StationName;
      loc.stationType = e.StationType;
      loc.marketId = e.MarketID;
      loc.inTaxi = e.Taxi ?? false;
      loc.inMulticrew = e.Multicrew ?? false;
      loc.distFromStarLS = e.DistFromStarLS;
      this.broadcastStateChange('location');
      log(`Docked at ${e.StationName} (${e.StationType})`);
    });

    // Undocked -> clear station, docked flag
    eventBus.onJournalEvent('Undocked', (e) => {
      const loc = this.state.location;
      loc.docked = false;
      loc.station = null;
      loc.stationType = null;
      loc.marketId = null;
      loc.inTaxi = e.Taxi ?? false;
      loc.inMulticrew = e.Multicrew ?? false;
      this.broadcastStateChange('location');
      log(`Undocked from ${e.StationName}`);
    });

    // ApproachBody -> approaching a body
    eventBus.onJournalEvent('ApproachBody', (e) => {
      const loc = this.state.location;
      loc.body = e.Body;
      loc.bodyId = e.BodyID;
      this.broadcastStateChange('location');
    });

    // LeaveBody -> leaving a body's proximity
    eventBus.onJournalEvent('LeaveBody', (e) => {
      const loc = this.state.location;
      loc.body = e.Body;
      loc.bodyId = e.BodyID;
      loc.latitude = null;
      loc.longitude = null;
      loc.altitude = null;
      loc.heading = null;
      this.broadcastStateChange('location');
    });

    // Touchdown -> landed on surface
    eventBus.onJournalEvent('Touchdown', (e) => {
      if (e.PlayerControlled) {
        const loc = this.state.location;
        loc.landed = true;
        loc.latitude = e.Latitude;
        loc.longitude = e.Longitude;
        loc.body = e.Body;
        loc.bodyId = e.BodyID;
        this.broadcastStateChange('location');
      }
    });

    // Liftoff -> left the surface
    eventBus.onJournalEvent('Liftoff', (e) => {
      if (e.PlayerControlled) {
        const loc = this.state.location;
        loc.landed = false;
        loc.latitude = e.Latitude;
        loc.longitude = e.Longitude;
        this.broadcastStateChange('location');
      }
    });

    // Embark -> boarding ship from on-foot
    eventBus.onJournalEvent('Embark', (e) => {
      const loc = this.state.location;
      loc.onFoot = false;
      loc.inSRV = e.SRV;
      loc.inTaxi = e.Taxi;
      loc.inMulticrew = e.Multicrew;

      this.state.odyssey.onFoot = false;

      this.broadcastStateChange('location');
      this.broadcastStateChange('odyssey');
    });

    // Disembark -> going on foot
    eventBus.onJournalEvent('Disembark', (e) => {
      const loc = this.state.location;
      loc.onFoot = true;
      loc.inSRV = false;
      loc.inTaxi = e.Taxi;
      loc.inMulticrew = e.Multicrew;

      if (e.StationName) {
        loc.station = e.StationName;
        loc.stationType = e.StationType ?? null;
        loc.marketId = e.MarketID ?? null;
      }

      this.state.odyssey.onFoot = true;

      this.broadcastStateChange('location');
      this.broadcastStateChange('odyssey');
    });

    // LaunchSRV -> player is in SRV
    eventBus.onJournalEvent('LaunchSRV', (e) => {
      if (e.PlayerControlled) {
        this.state.location.inSRV = true;
        this.state.location.onFoot = false;
        this.broadcastStateChange('location');
      }
    });

    // DockSRV -> player returned to ship from SRV
    eventBus.onJournalEvent('DockSRV', (_e) => {
      this.state.location.inSRV = false;
      this.broadcastStateChange('location');
    });

    // LaunchFighter -> player is in fighter
    eventBus.onJournalEvent('LaunchFighter', (e) => {
      if (e.PlayerControlled) {
        this.state.location.inFighter = true;
        this.broadcastStateChange('location');
      }
    });

    // DockFighter -> player returned to ship from fighter
    eventBus.onJournalEvent('DockFighter', (_e) => {
      this.state.location.inFighter = false;
      this.broadcastStateChange('location');
    });

    // ApproachSettlement -> near a settlement
    eventBus.onJournalEvent('ApproachSettlement', (e) => {
      const loc = this.state.location;
      loc.latitude = e.Latitude;
      loc.longitude = e.Longitude;
      loc.body = e.BodyName;
      loc.bodyId = e.BodyID;
      this.broadcastStateChange('location');
    });
  }

  // =========================================================================
  // Material Handlers
  // =========================================================================

  private registerMaterialHandlers(): void {
    // Materials -> full material inventory (startup event)
    eventBus.onJournalEvent('Materials', (e) => {
      this.state.materials.raw = e.Raw.map((m) =>
        this.toMaterial(m.Name, m.Name_Localised ?? null, 'Raw', m.Count),
      );
      this.state.materials.manufactured = e.Manufactured.map((m) =>
        this.toMaterial(m.Name, m.Name_Localised ?? null, 'Manufactured', m.Count),
      );
      this.state.materials.encoded = e.Encoded.map((m) =>
        this.toMaterial(m.Name, m.Name_Localised ?? null, 'Encoded', m.Count),
      );
      this.broadcastStateChange('materials');
      log(
        `Materials loaded: ${this.state.materials.raw.length} raw, ` +
        `${this.state.materials.manufactured.length} manufactured, ` +
        `${this.state.materials.encoded.length} encoded`,
      );
    });

    // MaterialCollected -> add material
    eventBus.onJournalEvent('MaterialCollected', (e) => {
      const category = this.normalizeMaterialCategory(e.Category);
      this.addMaterial(category, e.Name, e.Name_Localised ?? null, e.Count);

      this.state.session.materialsCollected += e.Count;

      this.broadcastStateChange('materials');
      this.broadcastStateChange('session');
    });

    // MaterialDiscarded -> remove material
    eventBus.onJournalEvent('MaterialDiscarded', (e) => {
      const category = this.normalizeMaterialCategory(e.Category);
      this.removeMaterial(category, e.Name, e.Count);
      this.broadcastStateChange('materials');
    });

    // MaterialTrade -> trade materials (remove paid, add received)
    eventBus.onJournalEvent('MaterialTrade', (e) => {
      const paidCategory = this.normalizeMaterialCategory(e.Paid.Category);
      this.removeMaterial(paidCategory, e.Paid.Material, e.Paid.Quantity);

      const receivedCategory = this.normalizeMaterialCategory(e.Received.Category);
      this.addMaterial(
        receivedCategory,
        e.Received.Material,
        e.Received.Material_Localised ?? null,
        e.Received.Quantity,
      );

      this.broadcastStateChange('materials');
    });

    // EngineerCraft -> consume materials
    eventBus.onJournalEvent('EngineerCraft', (e) => {
      for (const ingredient of e.Ingredients) {
        // Try all categories since the event doesn't specify category
        this.removeMaterialFromAnyCategory(ingredient.Name, ingredient.Count);
      }
      this.broadcastStateChange('materials');
    });

    // Synthesis -> consume materials
    eventBus.onJournalEvent('Synthesis', (e) => {
      for (const mat of e.Materials) {
        this.removeMaterialFromAnyCategory(mat.Name, mat.Count);
      }
      this.broadcastStateChange('materials');
    });

    // TechnologyBroker -> consume materials
    eventBus.onJournalEvent('TechnologyBroker', (e) => {
      if (e.Materials) {
        for (const mat of e.Materials) {
          const category = this.normalizeMaterialCategory(mat.Category);
          this.removeMaterial(category, mat.Name, mat.Count);
        }
      }
      this.broadcastStateChange('materials');
    });

    // ScientificResearch -> donate materials
    eventBus.onJournalEvent('ScientificResearch', (e) => {
      const category = this.normalizeMaterialCategory(e.Category);
      this.removeMaterial(category, e.Name, e.Count);
      this.broadcastStateChange('materials');
    });
  }

  // =========================================================================
  // Mission Handlers
  // =========================================================================

  private registerMissionHandlers(): void {
    // Missions -> full active mission list (startup event)
    eventBus.onJournalEvent('Missions', (e) => {
      // The startup Missions event only provides minimal info; we use what
      // we have and enrich later from MissionAccepted events in the journal
      // backlog.
      this.state.missions = e.Active.map(
        (m): MissionState => ({
          missionId: m.MissionID,
          name: m.Name,
          nameLocalised: null,
          faction: '',
          passengerMission: m.PassengerMission,
          wing: false,
          expiry: m.Expires ? new Date(m.Expires * 1000).toISOString() : null,
          destinationSystem: null,
          destinationStation: null,
          targetFaction: null,
          target: null,
          commodity: null,
          count: null,
          killCount: null,
          reward: 0,
          influence: '',
          reputation: '',
        }),
      );
      this.broadcastStateChange('missions');
      log(`Missions loaded: ${this.state.missions.length} active`);
    });

    // MissionAccepted -> add mission
    eventBus.onJournalEvent('MissionAccepted', (e) => {
      // Check if mission already exists (from Missions startup event)
      const existingIdx = this.state.missions.findIndex(
        (m) => m.missionId === e.MissionID,
      );

      const mission: MissionState = {
        missionId: e.MissionID,
        name: e.Name,
        nameLocalised: e.LocalisedName ?? null,
        faction: e.Faction,
        passengerMission: e.PassengerCount !== undefined && e.PassengerCount > 0,
        wing: e.Wing ?? false,
        expiry: e.Expiry ?? null,
        destinationSystem: e.DestinationSystem ?? null,
        destinationStation: e.DestinationStation ?? e.DestinationSettlement ?? null,
        targetFaction: e.TargetFaction ?? null,
        target: e.Target ?? e.Target_Localised ?? null,
        commodity: e.Commodity_Localised ?? e.Commodity ?? null,
        count: e.Count ?? null,
        killCount: e.KillCount ?? null,
        reward: e.Reward,
        influence: e.Influence,
        reputation: e.Reputation,
      };

      if (existingIdx !== -1) {
        // Update existing stub from Missions event
        this.state.missions[existingIdx] = mission;
      } else {
        this.state.missions.push(mission);
      }

      this.broadcastStateChange('missions');
    });

    // MissionCompleted -> remove mission, track earnings
    eventBus.onJournalEvent('MissionCompleted', (e) => {
      this.state.missions = this.state.missions.filter(
        (m) => m.missionId !== e.MissionID,
      );

      // Track session earnings
      this.state.session.creditsEarned += e.Reward;
      this.state.session.missionsCompleted++;
      this.updateNetProfit();

      // Handle material rewards
      if (e.MaterialsReward) {
        for (const mat of e.MaterialsReward) {
          const category = this.normalizeMaterialCategory(mat.Category);
          this.addMaterial(
            category,
            mat.Name,
            mat.Name_Localised ?? null,
            mat.Count,
          );
        }
        this.broadcastStateChange('materials');
      }

      this.broadcastStateChange('missions');
      this.broadcastStateChange('session');
    });

    // MissionAbandoned -> remove mission
    eventBus.onJournalEvent('MissionAbandoned', (e) => {
      this.state.missions = this.state.missions.filter(
        (m) => m.missionId !== e.MissionID,
      );
      this.state.session.missionsFailed++;

      if (e.Fine) {
        this.state.session.creditsSpent += e.Fine;
        this.updateNetProfit();
      }

      this.broadcastStateChange('missions');
      this.broadcastStateChange('session');
    });

    // MissionFailed -> remove mission
    eventBus.onJournalEvent('MissionFailed', (e) => {
      this.state.missions = this.state.missions.filter(
        (m) => m.missionId !== e.MissionID,
      );
      this.state.session.missionsFailed++;

      if (e.Fine) {
        this.state.session.creditsSpent += e.Fine;
        this.updateNetProfit();
      }

      this.broadcastStateChange('missions');
      this.broadcastStateChange('session');
    });

    // MissionRedirected -> update mission destination
    eventBus.onJournalEvent('MissionRedirected', (e) => {
      const mission = this.state.missions.find(
        (m) => m.missionId === e.MissionID,
      );
      if (mission) {
        mission.destinationSystem = e.NewDestinationSystem;
        mission.destinationStation = e.NewDestinationStation;
        this.broadcastStateChange('missions');
      }
    });
  }

  // =========================================================================
  // Session Statistics Handlers
  // =========================================================================

  private registerSessionHandlers(): void {
    // MarketSell -> add to trade earnings
    eventBus.onJournalEvent('MarketSell', (e) => {
      const profit = e.TotalSale - e.AvgPricePaid * e.Count;
      this.state.session.creditsEarned += e.TotalSale;
      this.state.session.tradeProfit += profit;
      this.state.session.cargoTraded += e.Count;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // MarketBuy -> track spending
    eventBus.onJournalEvent('MarketBuy', (e) => {
      this.state.session.creditsSpent += e.TotalCost;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // RedeemVoucher -> add to earnings (bounties, combat bonds, exploration)
    eventBus.onJournalEvent('RedeemVoucher', (e) => {
      this.state.session.creditsEarned += e.Amount;
      this.updateNetProfit();

      if (e.Type === 'bounty' || e.Type === 'CombatBond') {
        this.state.session.bountyEarnings += e.Amount;
      }

      this.broadcastStateChange('session');
    });

    // Bounty -> track bounties collected (not yet redeemed)
    eventBus.onJournalEvent('Bounty', (e) => {
      this.state.session.bountiesCollected++;
      this.state.session.bountyEarnings += e.TotalReward;
      this.broadcastStateChange('session');
    });

    // MultiSellExplorationData -> exploration data sold
    eventBus.onJournalEvent('MultiSellExplorationData', (e) => {
      this.state.session.creditsEarned += e.TotalEarnings;
      this.state.session.explorationEarnings += e.TotalEarnings;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // SellExplorationData -> exploration data sold (old-style)
    eventBus.onJournalEvent('SellExplorationData', (e) => {
      this.state.session.creditsEarned += e.TotalEarnings;
      this.state.session.explorationEarnings += e.TotalEarnings;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // Scan -> body scanned
    eventBus.onJournalEvent('Scan', (_e) => {
      this.state.session.bodiesScanned++;
      this.broadcastStateChange('session');
    });

    // SAAScanComplete -> detailed surface scan complete
    eventBus.onJournalEvent('SAAScanComplete', (_e) => {
      this.state.session.bodiesScanned++;
      this.broadcastStateChange('session');
    });

    // MiningRefined -> mining ton refined
    eventBus.onJournalEvent('MiningRefined', (_e) => {
      this.state.session.miningRefined++;
      this.broadcastStateChange('session');
    });

    // Died -> death counter
    eventBus.onJournalEvent('Died', (_e) => {
      this.state.session.deaths++;
      this.broadcastStateChange('session');
      log('Commander died');
    });

    // Resurrect -> cost of rebuy
    eventBus.onJournalEvent('Resurrect', (e) => {
      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // PayFines -> spending
    eventBus.onJournalEvent('PayFines', (e) => {
      this.state.session.creditsSpent += e.Amount;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // SearchAndRescue -> earnings
    eventBus.onJournalEvent('SearchAndRescue', (e) => {
      this.state.session.creditsEarned += e.Reward;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // PowerplaySalary -> earnings
    eventBus.onJournalEvent('PowerplaySalary', (e) => {
      this.state.session.creditsEarned += e.Amount;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // NpcCrewPaidWage -> spending
    eventBus.onJournalEvent('NpcCrewPaidWage', (e) => {
      this.state.session.creditsSpent += e.Amount;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // CrewHire -> spending
    eventBus.onJournalEvent('CrewHire', (e) => {
      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });

    // BuyTradeData -> spending
    eventBus.onJournalEvent('BuyTradeData', (e) => {
      this.state.session.creditsSpent += e.Cost;
      this.updateNetProfit();
      this.broadcastStateChange('session');
    });
  }

  // =========================================================================
  // Fleet Carrier Handlers
  // =========================================================================

  private registerCarrierHandlers(): void {
    // CarrierStats -> full carrier state
    eventBus.onJournalEvent('CarrierStats', (e) => {
      this.state.carrier = {
        carrierId: e.CarrierID,
        callsign: e.Callsign,
        name: e.Name,
        dockingAccess: e.DockingAccess as CarrierState['dockingAccess'],
        allowNotorious: e.AllowNotorious,
        fuelLevel: e.FuelLevel,
        jumpRangeCurr: e.JumpRangeCurr,
        jumpRangeMax: e.JumpRangeMax,
        pendingDecommission: e.PendingDecommission,
        spaceUsage: {
          totalCapacity: e.SpaceUsage.TotalCapacity,
          crew: e.SpaceUsage.Crew,
          cargo: e.SpaceUsage.Cargo,
          cargoSpaceReserved: e.SpaceUsage.CargoSpaceReserved,
          shipPacks: e.SpaceUsage.ShipPacks,
          modulePacks: e.SpaceUsage.ModulePacks,
          freeSpace: e.SpaceUsage.FreeSpace,
        },
        finance: {
          carrierBalance: e.Finance.CarrierBalance,
          reserveBalance: e.Finance.ReserveBalance,
          availableBalance: e.Finance.AvailableBalance,
          reservePercent: e.Finance.ReservePercent,
          taxRates: {
            rearm: e.Finance.TaxRate_rearm ?? 0,
            refuel: e.Finance.TaxRate_refuel ?? 0,
            repair: e.Finance.TaxRate_repair ?? 0,
            pioneerSupplies: e.Finance.TaxRate_pioneersupplies ?? 0,
            shipyard: e.Finance.TaxRate_shipyard ?? 0,
            outfitting: e.Finance.TaxRate_outfitting ?? 0,
          },
        },
        services: e.Crew.map(
          (c): CarrierService => ({
            role: c.CrewRole as CarrierService['role'],
            activated: c.Activated,
            enabled: c.Enabled,
            crewName: c.CrewName ?? null,
          }),
        ),
        shipPacks: e.ShipPacks.map((p) => ({
          theme: p.PackTheme,
          tier: p.PackTier,
        })),
        modulePacks: e.ModulePacks.map((p) => ({
          theme: p.PackTheme,
          tier: p.PackTier,
        })),
        tradeOrders: this.state.carrier?.tradeOrders ?? [],
        jumpHistory: this.state.carrier?.jumpHistory ?? [],
        currentSystem: this.state.carrier?.currentSystem ?? null,
        currentBody: this.state.carrier?.currentBody ?? null,
      };

      this.broadcastStateChange('carrier');
      log(`Carrier loaded: ${e.Name} (${e.Callsign}), fuel: ${e.FuelLevel}t`);
    });

    // CarrierJump -> update carrier location (handled in location handlers
    // for player location, but also update carrier-specific state)
    // Note: The location handler already updates carrier.currentSystem/Body.

    // CarrierDepositFuel -> update tritium
    eventBus.onJournalEvent('CarrierDepositFuel', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        this.state.carrier.fuelLevel = e.Total;
        this.broadcastStateChange('carrier');
      }
    });

    // CarrierFinance -> update balance
    eventBus.onJournalEvent('CarrierFinance', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        this.state.carrier.finance.carrierBalance = e.CarrierBalance;
        this.state.carrier.finance.reserveBalance = e.ReserveBalance;
        this.state.carrier.finance.availableBalance = e.AvailableBalance;
        this.state.carrier.finance.reservePercent = e.ReservePercent;
        this.broadcastStateChange('carrier');
      }
    });

    // CarrierBankTransfer -> update carrier and player balance
    eventBus.onJournalEvent('CarrierBankTransfer', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        this.state.carrier.finance.carrierBalance = e.CarrierBalance;
        this.broadcastStateChange('carrier');
      }
      // PlayerBalance reflects commander credits
      this.state.commander.credits = e.PlayerBalance;
      this.broadcastStateChange('commander');
    });

    // CarrierNameChanged -> update name
    eventBus.onJournalEvent('CarrierNameChanged', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        this.state.carrier.name = e.Name;
        this.state.carrier.callsign = e.Callsign;
        this.broadcastStateChange('carrier');
      }
    });

    // CarrierDockingPermission -> update access level
    eventBus.onJournalEvent('CarrierDockingPermission', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        this.state.carrier.dockingAccess = e.DockingAccess as CarrierState['dockingAccess'];
        this.state.carrier.allowNotorious = e.AllowNotorious;
        this.broadcastStateChange('carrier');
      }
    });

    // CarrierTradeOrder -> update/add/cancel trade order
    eventBus.onJournalEvent('CarrierTradeOrder', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        const orders = this.state.carrier.tradeOrders;
        const existingIdx = orders.findIndex(
          (o) => o.commodity === e.Commodity && o.blackMarket === e.BlackMarket,
        );

        if (e.CancelTrade) {
          // Remove the order
          if (existingIdx !== -1) {
            orders.splice(existingIdx, 1);
          }
        } else {
          const order = {
            commodity: e.Commodity,
            commodityLocalised: e.Commodity_Localised ?? null,
            purchaseOrder: e.PurchaseOrder ?? 0,
            saleOrder: e.SaleOrder ?? 0,
            blackMarket: e.BlackMarket,
          };

          if (existingIdx !== -1) {
            orders[existingIdx] = order;
          } else {
            orders.push(order);
          }
        }

        this.broadcastStateChange('carrier');
      }
    });

    // CarrierCrewServices -> update crew status
    eventBus.onJournalEvent('CarrierCrewServices', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        const service = this.state.carrier.services.find(
          (s) => s.role === e.CrewRole,
        );
        if (service) {
          if (e.Operation === 'Activate') {
            service.activated = true;
            service.enabled = true;
          } else if (e.Operation === 'Deactivate') {
            service.activated = false;
            service.enabled = false;
          } else if (e.Operation === 'Pause') {
            service.enabled = false;
          } else if (e.Operation === 'Resume') {
            service.enabled = true;
          }
          if (e.CrewName) {
            service.crewName = e.CrewName;
          }
        }
        this.broadcastStateChange('carrier');
      }
    });

    // CarrierModulePack -> update module packs
    eventBus.onJournalEvent('CarrierModulePack', (e) => {
      if (this.state.carrier && this.state.carrier.carrierId === e.CarrierID) {
        const packs = this.state.carrier.modulePacks;
        if (e.Operation === 'BuyPack') {
          packs.push({ theme: e.PackTheme, tier: e.PackTier });
        } else if (e.Operation === 'SellPack') {
          const idx = packs.findIndex(
            (p) => p.theme === e.PackTheme && p.tier === e.PackTier,
          );
          if (idx !== -1) packs.splice(idx, 1);
        }
        this.broadcastStateChange('carrier');
      }
    });
  }

  // =========================================================================
  // Odyssey Handlers
  // =========================================================================

  private registerOdysseyHandlers(): void {
    // SuitLoadout -> current suit loadout (startup)
    eventBus.onJournalEvent('SuitLoadout', (e) => {
      this.state.odyssey.currentLoadout = this.parseSuitLoadout(e);
      this.broadcastStateChange('odyssey');
    });

    // SwitchSuitLoadout -> changed suit loadout
    eventBus.onJournalEvent('SwitchSuitLoadout', (e) => {
      this.state.odyssey.currentLoadout = this.parseSuitLoadout(e);
      this.broadcastStateChange('odyssey');
    });

    // Backpack -> full backpack contents
    eventBus.onJournalEvent('Backpack', (e) => {
      const items: BackpackItem[] = [];

      for (const item of e.Items) {
        items.push({
          name: item.Name,
          nameLocalised: item.Name_Localised ?? null,
          type: 'Item',
          ownerId: item.OwnerID,
          missionId: item.MissionID ?? null,
          count: item.Count,
          stolen: false,
        });
      }

      for (const comp of e.Components) {
        items.push({
          name: comp.Name,
          nameLocalised: comp.Name_Localised ?? null,
          type: 'Component',
          ownerId: comp.OwnerID,
          missionId: null,
          count: comp.Count,
          stolen: false,
        });
      }

      for (const cons of e.Consumables) {
        items.push({
          name: cons.Name,
          nameLocalised: cons.Name_Localised ?? null,
          type: 'Consumable',
          ownerId: cons.OwnerID,
          missionId: null,
          count: cons.Count,
          stolen: false,
        });
      }

      for (const data of e.Data) {
        items.push({
          name: data.Name,
          nameLocalised: data.Name_Localised ?? null,
          type: 'Data',
          ownerId: data.OwnerID,
          missionId: null,
          count: data.Count,
          stolen: false,
        });
      }

      this.state.odyssey.backpack = items;
      this.broadcastStateChange('odyssey');
    });

    // BackpackChange -> incremental backpack update
    eventBus.onJournalEvent('BackpackChange', (e) => {
      if (e.Added) {
        for (const item of e.Added) {
          const existing = this.state.odyssey.backpack.find(
            (b) => b.name === item.Name && b.type === item.Type,
          );
          if (existing) {
            existing.count += item.Count;
          } else {
            this.state.odyssey.backpack.push({
              name: item.Name,
              nameLocalised: item.Name_Localised ?? null,
              type: item.Type as BackpackItem['type'],
              ownerId: item.OwnerID,
              missionId: item.MissionID ?? null,
              count: item.Count,
              stolen: false,
            });
          }
        }
      }

      if (e.Removed) {
        for (const item of e.Removed) {
          const existing = this.state.odyssey.backpack.find(
            (b) => b.name === item.Name && b.type === item.Type,
          );
          if (existing) {
            existing.count -= item.Count;
            if (existing.count <= 0) {
              this.state.odyssey.backpack = this.state.odyssey.backpack.filter(
                (b) => b !== existing,
              );
            }
          }
        }
      }

      this.broadcastStateChange('odyssey');
    });

    // ScanOrganic -> exobiology scan tracking
    eventBus.onJournalEvent('ScanOrganic', (e) => {
      const scans = this.state.odyssey.activeScans;
      const existingIdx = scans.findIndex(
        (s) =>
          s.species === e.Species &&
          s.systemAddress === e.SystemAddress &&
          s.bodyId === e.Body,
      );

      const scan: ExobiologyScan = {
        genus: e.Genus,
        genusLocalised: e.Genus_Localised ?? null,
        species: e.Species,
        speciesLocalised: e.Species_Localised ?? null,
        variant: e.Variant ?? null,
        variantLocalised: e.Variant_Localised ?? null,
        systemAddress: e.SystemAddress,
        bodyId: e.Body,
        scanType: e.ScanType,
        complete: e.ScanType === 'Analyse',
        timestamp: e.timestamp,
      };

      if (existingIdx !== -1) {
        scans[existingIdx] = scan;
      } else {
        scans.push(scan);
      }

      if (e.ScanType === 'Analyse') {
        this.state.odyssey.speciesAnalysed++;
      }

      this.broadcastStateChange('odyssey');
    });
  }

  // =========================================================================
  // Powerplay Handlers
  // =========================================================================

  private registerPowerplayHandlers(): void {
    // Powerplay -> full powerplay state (startup)
    eventBus.onJournalEvent('Powerplay', (e) => {
      const cmd = this.state.commander;
      cmd.power = e.Power;
      cmd.powerplayRank = e.Rank;
      cmd.powerplayMerits = e.Merits;
      cmd.timePledged = e.TimePledged;
      this.broadcastStateChange('commander');
    });

    // PowerplayJoin -> pledged to a power
    eventBus.onJournalEvent('PowerplayJoin', (e) => {
      this.state.commander.power = e.Power;
      this.state.commander.timePledged = 0;
      this.state.commander.powerplayMerits = 0;
      this.state.commander.powerplayRank = 0;
      this.broadcastStateChange('commander');
    });

    // PowerplayLeave -> left a power
    eventBus.onJournalEvent('PowerplayLeave', (_e) => {
      this.state.commander.power = null;
      this.state.commander.timePledged = 0;
      this.state.commander.powerplayMerits = 0;
      this.state.commander.powerplayRank = 0;
      this.broadcastStateChange('commander');
    });

    // PowerplayDefect -> switched power
    eventBus.onJournalEvent('PowerplayDefect', (e) => {
      this.state.commander.power = e.ToPower;
      this.state.commander.timePledged = 0;
      this.state.commander.powerplayMerits = 0;
      this.state.commander.powerplayRank = 0;
      this.broadcastStateChange('commander');
    });
  }

  // =========================================================================
  // Companion File Update Handlers
  // =========================================================================

  private registerCompanionHandlers(): void {
    // Status.json -> update flags, pips, fuel, cargo, firegroup
    eventBus.onStatusUpdate((status) => {
      const loc = this.state.location;

      // Status.json flag bits
      const flags = (status['Flags'] as number) ?? 0;
      const flags2 = (status['Flags2'] as number) ?? 0;

      // Decode key flags from the bitfield
      loc.docked = (flags & 0x00000001) !== 0;
      loc.landed = (flags & 0x00000002) !== 0;
      loc.supercruise = (flags & 0x00000010) !== 0;
      loc.inSRV = (flags & 0x04000000) !== 0;
      loc.inFighter = (flags & 0x02000000) !== 0;
      loc.inMulticrew = (flags & 0x08000000) !== 0;

      // Ship status flags from the bitfield
      const ship = this.state.ship;
      ship.landingGearDown    = (flags & 0x00000004) !== 0;  // bit 2
      ship.shieldsUp          = (flags & 0x00000008) !== 0;  // bit 3
      ship.hardpointsDeployed = (flags & 0x00000040) !== 0;  // bit 6
      ship.lightsOn           = (flags & 0x00000100) !== 0;  // bit 8
      ship.cargoScoopOpen     = (flags & 0x00000200) !== 0;  // bit 9
      ship.fsdMassLocked      = (flags & 0x00010000) !== 0;  // bit 16
      ship.fsdCharging        = (flags & 0x00020000) !== 0;  // bit 17
      ship.fsdCooldown        = (flags & 0x00040000) !== 0;  // bit 18
      ship.silentRunning      = (flags & 0x00001000) !== 0;  // bit 12
      ship.nightVision        = (flags & 0x10000000) !== 0;  // bit 28

      // Odyssey flags (Flags2)
      loc.onFoot = (flags2 & 0x00000001) !== 0;
      loc.inTaxi = (flags2 & 0x00000004) !== 0;
      this.state.odyssey.onFoot = loc.onFoot;

      // Fuel update from Status.json
      if (typeof status['Fuel'] === 'object' && status['Fuel'] !== null) {
        const fuel = status['Fuel'] as { FuelMain?: number; FuelReservoir?: number };
        if (fuel.FuelMain !== undefined) {
          this.state.ship.fuel.main = fuel.FuelMain;
        }
        if (fuel.FuelReservoir !== undefined) {
          this.state.ship.fuel.reserve = fuel.FuelReservoir;
        }
      }

      // Cargo from Status.json (total tons)
      if (typeof status['Cargo'] === 'number') {
        this.state.ship.cargoCount = status['Cargo'] as number;
      }

      // Surface coordinates
      if (typeof status['Latitude'] === 'number') {
        loc.latitude = status['Latitude'] as number;
      }
      if (typeof status['Longitude'] === 'number') {
        loc.longitude = status['Longitude'] as number;
      }
      if (typeof status['Altitude'] === 'number') {
        loc.altitude = status['Altitude'] as number;
      }
      if (typeof status['Heading'] === 'number') {
        loc.heading = status['Heading'] as number;
      }

      // Body name from Status.json
      if (typeof status['BodyName'] === 'string') {
        loc.body = status['BodyName'] as string;
      }

      this.state.lastUpdated = new Date().toISOString();

      // Broadcast detailed status flags to clients for UI use
      wsManager.broadcast('status:flags', {
        flags,
        flags2,
        pips: (status['Pips'] as [number, number, number]) ?? [0, 0, 0],
        fireGroup: (status['FireGroup'] as number) ?? 0,
        guiFocus: (status['GuiFocus'] as number) ?? 0,
        fuelMain: this.state.ship.fuel.main,
        fuelReservoir: this.state.ship.fuel.reserve,
        cargo: this.state.ship.cargoCount,
        legalState: (status['LegalState'] as string) ?? '',
        latitude: loc.latitude,
        longitude: loc.longitude,
        altitude: loc.altitude,
        heading: loc.heading,
        bodyName: loc.body || null,
        planetRadius: (status['PlanetRadius'] as number) ?? null,
        destination: status['Destination'] ?? null,
      });

      this.broadcastStateChange('location');
      this.broadcastStateChange('ship');
    });

    // Cargo.json -> full cargo update
    eventBus.onCargoUpdate((cargo) => {
      const vessel = cargo['Vessel'] as string | undefined;
      if (vessel === 'Ship') {
        const inventory = (cargo['Inventory'] as Array<{
          Name: string;
          Name_Localised?: string;
          Count: number;
          Stolen: number;
          MissionID?: number;
        }>) ?? [];

        this.state.ship.cargo = inventory.map((item): CargoItem => ({
          name: item.Name,
          nameLocalised: item.Name_Localised ?? null,
          count: item.Count,
          stolen: item.Stolen,
          missionId: item.MissionID ?? null,
        }));
        this.state.ship.cargoCount = (cargo['Count'] as number) ?? 0;
        this.broadcastStateChange('ship');
      }
    });
  }

  // =========================================================================
  // Public API
  // =========================================================================

  /** Get the full game state. */
  getState(): GameState {
    return this.state;
  }

  /** Get the commander state slice. */
  getCommander(): CommanderState {
    return this.state.commander;
  }

  /** Get the ship state slice. */
  getShip(): ShipState {
    return this.state.ship;
  }

  /** Get the location state slice. */
  getLocation(): LocationState {
    return this.state.location;
  }

  /** Get the materials state slice. */
  getMaterials(): MaterialsState {
    return this.state.materials;
  }

  /** Get the active missions list. */
  getMissions(): MissionState[] {
    return this.state.missions;
  }

  /** Get the session statistics slice. */
  getSession(): SessionState {
    return this.state.session;
  }

  /** Get the carrier state (null if no carrier). */
  getCarrier(): CarrierState | null {
    return this.state.carrier;
  }

  /** Get the Odyssey state slice. */
  getOdyssey(): OdysseyState {
    return this.state.odyssey;
  }

  /** Whether the game state has been initialized with at least one Location/LoadGame event. */
  isInitialized(): boolean {
    return this.state.initialized;
  }

  /** Total journal events processed since startup. */
  getEventsProcessed(): number {
    return this.eventsProcessed;
  }

  /**
   * Reset session statistics. Called automatically on LoadGame, or can be
   * called manually when the user wants to start tracking a new session.
   */
  resetSession(): void {
    this.state.session = createDefaultSession();
    this.broadcastStateChange('session');
    log('Session reset');
  }

  /**
   * Shut down the game state manager. Stops the session timer.
   */
  shutdown(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
    log('Shut down');
  }

  // =========================================================================
  // Internal Helpers
  // =========================================================================

  /**
   * Broadcast a state change for a specific section via WebSocket.
   * Also emits a gamestate:change event on the event bus and updates
   * the lastUpdated timestamp.
   */
  private broadcastStateChange(section: string): void {
    this.state.lastUpdated = new Date().toISOString();

    // Broadcast the specific section
    const sectionKey = section as keyof GameState;
    const sectionData = this.state[sectionKey];
    wsManager.broadcast(`state:${section}` as any, sectionData);

    // Emit game state change on event bus for other server-side consumers
    eventBus.emitGameStateChange({ section, data: sectionData as unknown as Record<string, unknown> });
  }

  /**
   * Start a timer that increments the session elapsed time every second.
   */
  private startSessionTimer(): void {
    this.sessionTimer = setInterval(() => {
      this.state.session.elapsedSeconds++;
    }, 1000);
  }

  /**
   * Track a unique system visit in session stats.
   */
  private trackSystemVisit(system: string): void {
    this.state.session.systemsVisited++;
    if (!this.state.session.uniqueSystemsVisited.includes(system)) {
      this.state.session.uniqueSystemsVisited.push(system);
    }
  }

  /**
   * Update the session net profit from earned/spent.
   */
  private updateNetProfit(): void {
    this.state.session.netProfit =
      this.state.session.creditsEarned - this.state.session.creditsSpent;
  }

  // ----- Module helpers -----

  /**
   * Replace or insert a module in a specific slot.
   */
  private updateModuleInSlot(slot: string, mod: ShipModule): void {
    const idx = this.state.ship.modules.findIndex((m) => m.slot === slot);
    if (idx !== -1) {
      this.state.ship.modules[idx] = mod;
    } else {
      this.state.ship.modules.push(mod);
    }
  }

  /**
   * Remove a module from a specific slot.
   */
  private removeModuleFromSlot(slot: string): void {
    this.state.ship.modules = this.state.ship.modules.filter(
      (m) => m.slot !== slot,
    );
  }

  // ----- Material helpers -----

  /**
   * Create a Material object from journal data.
   */
  private toMaterial(
    name: string,
    nameLocalised: string | null,
    category: MaterialCategory,
    count: number,
  ): Material {
    // Default grade to 1 if we cannot determine it
    const grade: MaterialGrade = 1;
    return {
      name: name.toLowerCase(),
      nameLocalised,
      category,
      grade,
      count,
      maximum: MATERIAL_GRADE_CAPS[grade],
    };
  }

  /**
   * Normalize a journal category string to the MaterialCategory type.
   */
  private normalizeMaterialCategory(category: string): MaterialCategory {
    const lower = category.toLowerCase();
    if (lower.includes('raw')) return 'Raw';
    if (lower.includes('manufactured')) return 'Manufactured';
    if (lower.includes('encoded') || lower.includes('data')) return 'Encoded';
    // Default fallback
    return 'Raw';
  }

  /**
   * Get the material array for a given category.
   */
  private getMaterialArray(category: MaterialCategory): Material[] {
    switch (category) {
      case 'Raw':
        return this.state.materials.raw;
      case 'Manufactured':
        return this.state.materials.manufactured;
      case 'Encoded':
        return this.state.materials.encoded;
    }
  }

  /**
   * Add a quantity of a material to the inventory.
   */
  private addMaterial(
    category: MaterialCategory,
    name: string,
    nameLocalised: string | null,
    count: number,
  ): void {
    const materials = this.getMaterialArray(category);
    const lowerName = name.toLowerCase();
    const existing = materials.find((m) => m.name === lowerName);

    if (existing) {
      existing.count = Math.min(existing.count + count, existing.maximum);
      if (nameLocalised && !existing.nameLocalised) {
        existing.nameLocalised = nameLocalised;
      }
    } else {
      materials.push(this.toMaterial(name, nameLocalised, category, count));
    }
  }

  /**
   * Remove a quantity of a material from the inventory.
   */
  private removeMaterial(
    category: MaterialCategory,
    name: string,
    count: number,
  ): void {
    const materials = this.getMaterialArray(category);
    const lowerName = name.toLowerCase();
    const existing = materials.find((m) => m.name === lowerName);

    if (existing) {
      existing.count = Math.max(0, existing.count - count);
    } else {
      warn(`Tried to remove material '${name}' not found in ${category}`);
    }
  }

  /**
   * Remove a material from any category (when category is unknown).
   */
  private removeMaterialFromAnyCategory(name: string, count: number): void {
    const lowerName = name.toLowerCase();
    const categories: MaterialCategory[] = ['Raw', 'Manufactured', 'Encoded'];

    for (const category of categories) {
      const materials = this.getMaterialArray(category);
      const existing = materials.find((m) => m.name === lowerName);
      if (existing) {
        existing.count = Math.max(0, existing.count - count);
        return;
      }
    }

    warn(`Material '${name}' not found in any category for removal`);
  }

  // ----- Odyssey helpers -----

  /**
   * Parse a SuitLoadout or SwitchSuitLoadout event into our SuitLoadout type.
   */
  private parseSuitLoadout(e: {
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
  }): SuitLoadout {
    const suit: Suit = {
      suitId: e.SuitID,
      name: e.SuitName,
      nameLocalised: e.SuitName_Localised ?? null,
      type: this.classifySuitType(e.SuitName),
      class: 1, // Will be overridden by suit-specific events if available
      mods: e.SuitMods ?? [],
    };

    const weapons: Weapon[] = e.Modules.map((m) => ({
      suitModuleId: m.SuitModuleID,
      name: m.ModuleName,
      nameLocalised: m.ModuleName_Localised ?? null,
      class: m.Class ?? 1,
      mods: m.WeaponMods ?? [],
      slotName: m.SlotName,
    }));

    return {
      loadoutId: e.LoadoutID,
      loadoutName: e.LoadoutName,
      suit,
      weapons,
    };
  }

  /**
   * Classify a suit internal name into a SuitType.
   */
  private classifySuitType(suitName: string): Suit['type'] {
    const lower = suitName.toLowerCase();
    if (lower.includes('flight')) return 'flightsuit';
    if (lower.includes('exploration') || lower.includes('artemis')) return 'explorationsuit';
    if (lower.includes('tactical') || lower.includes('dominator')) return 'tacticalsuit';
    if (lower.includes('utility') || lower.includes('maverick')) return 'utilitysuit';
    return 'flightsuit'; // Default fallback
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

/** Global GameStateManager instance for the VAYU server. */
export const gameStateManager = new GameStateManager();
