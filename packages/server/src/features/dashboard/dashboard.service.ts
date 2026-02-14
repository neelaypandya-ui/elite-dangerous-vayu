/**
 * @vayu/server — Dashboard / Briefing Service
 *
 * Generates the "Where Was I?" session briefing that greets the commander
 * when they return after time away. Reads recent journal files, extracts
 * the last session's data, computes highlights and notable events, and
 * produces a narrative paragraph summarizing the state of the galaxy from
 * the commander's perspective.
 *
 * This is a read-only service — it never writes to journals or mutates
 * game state. It reads from:
 *   1. The live GameStateManager singleton (current session state)
 *   2. Historical journal files on disk (past sessions)
 */

import { gameStateManager } from '../../core/game-state.js';
import {
  readRecentJournals,
  findJournalFiles,
  readJournalFile,
} from '../../core/journal-reader.js';
import { config } from '../../config.js';
import type { AnyJournalEvent } from '@vayu/shared';
import {
  COMBAT_RANKS,
  TRADE_RANKS,
  EXPLORE_RANKS,
  resolveShipName,
  formatCredits,
  formatDuration,
} from '@vayu/shared';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[Dashboard]';

function log(message: string, ...args: unknown[]): void {
  console.log(`${LOG_PREFIX} ${message}`, ...args);
}

function warn(message: string, ...args: unknown[]): void {
  console.warn(`${LOG_PREFIX} ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// BriefingData Interface
// ---------------------------------------------------------------------------

/** Data structure returned by the briefing endpoint. */
export interface BriefingData {
  lastSession: {
    date: string;
    duration: string;
    system: string;
    station: string | null;
    ship: string;
    shipName: string | null;
  };
  commander: {
    name: string;
    credits: number;
    combatRank: string;
    tradeRank: string;
    explorationRank: string;
  };
  currentLocation: {
    system: string;
    body: string | null;
    station: string | null;
    docked: boolean;
    coordinates: [number, number, number] | null;
  };
  activeMissions: {
    name: string;
    destination: string;
    reward: number;
    expiry: string | null;
  }[];
  recentHighlights: {
    event: string;
    summary: string;
    timestamp: string;
  }[];
  shipStatus: {
    type: string;
    name: string | null;
    fuelLevel: number;
    fuelCapacity: number;
    hullHealth: number;
    cargoUsed: number;
    cargoCapacity: number;
  };
  sessionsSinceLastPlay: number;
  daysSinceLastPlay: number;
  narrative: string;
}

// ---------------------------------------------------------------------------
// Highlight Event Types
// ---------------------------------------------------------------------------

/**
 * Events considered "notable" for the highlights timeline.
 * Each entry maps an event name to a function that generates a summary.
 */
const HIGHLIGHT_EVENTS = new Set<string>([
  'FSDJump',
  'Scan',
  'SAAScanComplete',
  'Docked',
  'MissionCompleted',
  'Promotion',
  'Bounty',
  'Died',
  'EngineerCraft',
  'MultiSellExplorationData',
  'SellExplorationData',
  'MarketSell',
  'CommunityGoal',
  'FSSDiscoveryScan',
  'FSSAllBodiesFound',
  'CodexEntry',
  'Resurrect',
]);

// ---------------------------------------------------------------------------
// DashboardService
// ---------------------------------------------------------------------------

/**
 * Service that generates the "Where Was I?" briefing and provides
 * dashboard data to the client.
 */
class DashboardService {
  /**
   * Generate the full briefing data.
   *
   * This is the primary method called by the dashboard router.
   * It reads from both the live game state and historical journal files
   * to build a comprehensive session recap.
   */
  async generateBriefing(): Promise<BriefingData> {
    log('Generating briefing...');

    const state = gameStateManager.getState();
    const journalDir = config.paths.journalDir;

    // 1. Read recent journal files (up to 7 days) for highlights
    let recentEvents: AnyJournalEvent[] = [];
    try {
      recentEvents = await readRecentJournals(journalDir, 7);
    } catch (err) {
      warn('Failed to read recent journals:', err);
    }

    // 2. Get last session data
    const lastSession = await this.getLastSessionStats(journalDir, recentEvents);

    // 3. Extract commander info from live state
    const commander = {
      name: state.commander.name || 'CMDR',
      credits: state.commander.credits,
      combatRank: COMBAT_RANKS[state.commander.ranks.combat.rank] ?? 'Unknown',
      tradeRank: TRADE_RANKS[state.commander.ranks.trade.rank] ?? 'Unknown',
      explorationRank: EXPLORE_RANKS[state.commander.ranks.explore.rank] ?? 'Unknown',
    };

    // 4. Extract current location
    const loc = state.location;
    const currentLocation = {
      system: loc.system || 'Unknown',
      body: loc.body || null,
      station: loc.station || null,
      docked: loc.docked,
      coordinates: loc.coordinates
        ? [loc.coordinates.x, loc.coordinates.y, loc.coordinates.z] as [number, number, number]
        : null,
    };

    // 5. Extract active missions
    const activeMissions = state.missions.map((m) => ({
      name: m.nameLocalised || this.cleanMissionName(m.name),
      destination: [m.destinationStation, m.destinationSystem]
        .filter(Boolean)
        .join(', ') || 'Unknown',
      reward: m.reward,
      expiry: m.expiry,
    }));

    // 6. Extract recent highlights
    const recentHighlights = this.getRecentHighlights(recentEvents, 20);

    // 7. Extract ship status
    const ship = state.ship;
    const shipStatus = {
      type: resolveShipName(ship.ship),
      name: ship.shipName || null,
      fuelLevel: ship.fuel.main,
      fuelCapacity: ship.fuel.mainCapacity,
      hullHealth: ship.hullHealth,
      cargoUsed: ship.cargoCount,
      cargoCapacity: ship.cargoCapacity,
    };

    // 8. Calculate days since last play
    const { daysSinceLastPlay, sessionsSinceLastPlay } =
      await this.calculateTimeSinceLastPlay(journalDir);

    // 9. Build partial data for narrative generation
    const partialData: Partial<BriefingData> = {
      lastSession,
      commander,
      currentLocation,
      activeMissions,
      shipStatus,
      daysSinceLastPlay,
      sessionsSinceLastPlay,
      recentHighlights,
    };

    // 10. Generate narrative
    const narrative = this.generateNarrative(partialData);

    const briefing: BriefingData = {
      lastSession,
      commander,
      currentLocation,
      activeMissions,
      recentHighlights,
      shipStatus,
      sessionsSinceLastPlay,
      daysSinceLastPlay,
      narrative,
    };

    log(
      'Briefing generated: %s in %s, %d highlights, %d missions',
      commander.name,
      currentLocation.system,
      recentHighlights.length,
      activeMissions.length,
    );

    return briefing;
  }

  // =========================================================================
  // Last Session Stats
  // =========================================================================

  /**
   * Extract stats from the most recent completed session.
   *
   * Scans recent events for the last LoadGame and corresponding
   * Shutdown/new LoadGame pair to determine session boundaries.
   */
  private async getLastSessionStats(
    journalDir: string,
    recentEvents: AnyJournalEvent[],
  ): Promise<BriefingData['lastSession']> {
    const defaults: BriefingData['lastSession'] = {
      date: new Date().toISOString(),
      duration: '0s',
      system: 'Unknown',
      station: null,
      ship: 'Unknown',
      shipName: null,
    };

    if (recentEvents.length === 0) {
      return defaults;
    }

    // Find all LoadGame events to determine session boundaries
    const loadGameEvents: Array<{ event: AnyJournalEvent; index: number }> = [];
    for (let i = 0; i < recentEvents.length; i++) {
      if (recentEvents[i].event === 'LoadGame') {
        loadGameEvents.push({ event: recentEvents[i], index: i });
      }
    }

    if (loadGameEvents.length === 0) {
      return defaults;
    }

    // The "last session" is the second-to-last LoadGame through to the last LoadGame
    // (or if only one session exists, it is the current one)
    let sessionStartIdx: number;
    let sessionEndIdx: number;

    if (loadGameEvents.length >= 2) {
      // Previous session: from second-to-last LoadGame to last LoadGame
      sessionStartIdx = loadGameEvents[loadGameEvents.length - 2].index;
      sessionEndIdx = loadGameEvents[loadGameEvents.length - 1].index;
    } else {
      // Only one session: use it
      sessionStartIdx = loadGameEvents[0].index;
      sessionEndIdx = recentEvents.length;
    }

    const sessionEvents = recentEvents.slice(sessionStartIdx, sessionEndIdx);
    if (sessionEvents.length === 0) {
      return defaults;
    }

    // Extract LoadGame data
    const loadGame = sessionEvents[0] as AnyJournalEvent & {
      Ship?: string;
      Ship_Localised?: string;
      ShipName?: string;
      Commander?: string;
    };

    // Find the last known system and station in this session
    let lastSystem = 'Unknown';
    let lastStation: string | null = null;
    let lastShip = loadGame.Ship ? resolveShipName(loadGame.Ship) : 'Unknown';
    let lastShipName = loadGame.ShipName ?? null;

    for (const evt of sessionEvents) {
      if (evt.event === 'Location' || evt.event === 'FSDJump' || evt.event === 'CarrierJump') {
        const locEvt = evt as AnyJournalEvent & { StarSystem?: string };
        if (locEvt.StarSystem) {
          lastSystem = locEvt.StarSystem;
        }
      }
      if (evt.event === 'Docked') {
        const dockEvt = evt as AnyJournalEvent & { StationName?: string };
        if (dockEvt.StationName) {
          lastStation = dockEvt.StationName;
        }
      }
      if (evt.event === 'Undocked') {
        lastStation = null;
      }
      if (evt.event === 'Loadout') {
        const loadoutEvt = evt as AnyJournalEvent & {
          Ship?: string;
          ShipName?: string;
        };
        if (loadoutEvt.Ship) {
          lastShip = resolveShipName(loadoutEvt.Ship);
        }
        if (loadoutEvt.ShipName) {
          lastShipName = loadoutEvt.ShipName;
        }
      }
    }

    // Calculate session duration
    const startTime = new Date(sessionEvents[0].timestamp).getTime();
    const endTime = new Date(sessionEvents[sessionEvents.length - 1].timestamp).getTime();
    const durationSec = Math.max(0, Math.floor((endTime - startTime) / 1000));

    return {
      date: sessionEvents[0].timestamp,
      duration: formatDuration(durationSec),
      system: lastSystem,
      station: lastStation,
      ship: lastShip,
      shipName: lastShipName,
    };
  }

  // =========================================================================
  // Recent Highlights
  // =========================================================================

  /**
   * Extract notable events from recent journal entries.
   *
   * Filters for "interesting" events and generates human-readable summaries.
   * Returns at most `limit` highlights, sorted newest first.
   */
  private getRecentHighlights(
    events: AnyJournalEvent[],
    limit: number,
  ): BriefingData['recentHighlights'] {
    const highlights: BriefingData['recentHighlights'] = [];

    // Walk events in reverse (newest first) for recency ordering
    for (let i = events.length - 1; i >= 0 && highlights.length < limit; i--) {
      const evt = events[i];

      if (!HIGHLIGHT_EVENTS.has(evt.event)) {
        continue;
      }

      const summary = this.summarizeEvent(evt);
      if (summary) {
        highlights.push({
          event: evt.event,
          summary,
          timestamp: evt.timestamp,
        });
      }
    }

    return highlights;
  }

  /**
   * Generate a human-readable one-line summary for a notable event.
   *
   * Returns null if the event is not interesting enough to surface
   * (e.g., a jump to a common system).
   */
  private summarizeEvent(evt: AnyJournalEvent): string | null {
    // Use type-unsafe access since we are checking evt.event manually.
    // The double-cast through unknown is intentional — we check evt.event
    // in the switch to know which fields are safe to access.
    const raw = evt as unknown as Record<string, unknown>;

    switch (evt.event) {
      case 'FSDJump': {
        const system = raw['StarSystem'] as string | undefined;
        const dist = raw['JumpDist'] as number | undefined;
        if (!system) return null;
        return `Jumped to ${system}${dist ? ` (${dist.toFixed(1)} LY)` : ''}`;
      }

      case 'Scan': {
        const body = raw['BodyName'] as string | undefined;
        const wasDiscovered = raw['WasDiscovered'] as boolean | undefined;
        const planetClass = raw['PlanetClass'] as string | undefined;
        const starType = raw['StarType'] as string | undefined;
        if (!body) return null;

        // Only highlight first discoveries or interesting body types
        if (wasDiscovered === false) {
          return `First discovery: ${body}${planetClass ? ` (${planetClass})` : ''}`;
        }
        if (planetClass === 'Earthlike body' || planetClass === 'Water world' || planetClass === 'Ammonia world') {
          return `Scanned ${body} -- ${planetClass}`;
        }
        if (starType === 'N' || starType === 'H') {
          const starNames: Record<string, string> = { N: 'Neutron Star', H: 'Black Hole' };
          return `Scanned ${body} -- ${starNames[starType]}`;
        }
        return null; // Skip routine scans
      }

      case 'SAAScanComplete': {
        const body = raw['BodyName'] as string | undefined;
        const probes = raw['ProbesUsed'] as number | undefined;
        const efficiency = raw['EfficiencyTarget'] as number | undefined;
        if (!body) return null;
        const isEfficient = probes !== undefined && efficiency !== undefined && probes <= efficiency;
        return `Mapped ${body}${isEfficient ? ' (efficiency bonus)' : ''}`;
      }

      case 'Docked': {
        const station = raw['StationName'] as string | undefined;
        const stationType = raw['StationType'] as string | undefined;
        if (!station) return null;
        return `Docked at ${station}${stationType ? ` (${stationType})` : ''}`;
      }

      case 'MissionCompleted': {
        const name = (raw['LocalisedName'] as string) || (raw['Name'] as string) || 'a mission';
        const reward = raw['Reward'] as number | undefined;
        const cleanName = this.cleanMissionName(name);
        return `Completed: ${cleanName}${reward ? ` -- ${formatCredits(reward, true)}` : ''}`;
      }

      case 'Promotion': {
        const fields = ['Combat', 'Trade', 'Explore', 'CQC', 'Federation', 'Empire', 'Soldier', 'Exobiologist'];
        const rankArrays: Record<string, readonly string[]> = {
          Combat: COMBAT_RANKS,
          Trade: TRADE_RANKS,
          Explore: EXPLORE_RANKS,
        };
        for (const field of fields) {
          const value = raw[field] as number | undefined;
          if (value !== undefined) {
            const rankName = rankArrays[field]?.[value] ?? `Rank ${value}`;
            return `Promoted to ${field} rank: ${rankName}`;
          }
        }
        return 'Rank promotion';
      }

      case 'Bounty': {
        const target = (raw['Target_Localised'] as string) || (raw['Target'] as string) || 'a target';
        const totalReward = raw['TotalReward'] as number | undefined;
        return `Bounty: ${target}${totalReward ? ` -- ${formatCredits(totalReward, true)}` : ''}`;
      }

      case 'Died': {
        const killer = (raw['KillerName_Localised'] as string) || (raw['KillerName'] as string);
        if (killer) {
          return `Destroyed by ${killer}`;
        }
        return 'Ship destroyed';
      }

      case 'EngineerCraft': {
        const module = raw['Module'] as string | undefined;
        const engineer = raw['Engineer'] as string | undefined;
        const level = raw['Level'] as number | undefined;
        const blueprint = raw['BlueprintName'] as string | undefined;
        if (!module || !engineer) return null;
        return `Engineered at ${engineer}: ${blueprint ?? module} G${level ?? '?'}`;
      }

      case 'MultiSellExplorationData': {
        const earnings = raw['TotalEarnings'] as number | undefined;
        const discovered = raw['Discovered'] as Array<{ SystemName: string; NumBodies: number }> | undefined;
        const systemCount = discovered?.length ?? 0;
        return `Sold exploration data: ${systemCount} system${systemCount !== 1 ? 's' : ''}${earnings ? ` -- ${formatCredits(earnings, true)}` : ''}`;
      }

      case 'SellExplorationData': {
        const earnings = raw['TotalEarnings'] as number | undefined;
        return `Sold exploration data${earnings ? ` -- ${formatCredits(earnings, true)}` : ''}`;
      }

      case 'MarketSell': {
        const type = (raw['Type_Localised'] as string) || (raw['Type'] as string) || 'cargo';
        const count = raw['Count'] as number | undefined;
        const totalSale = raw['TotalSale'] as number | undefined;
        if (!totalSale || totalSale < 100000) return null; // Skip small trades
        return `Sold ${count ?? '?'}t ${type} -- ${formatCredits(totalSale, true)}`;
      }

      case 'CommunityGoal': {
        const cgName = raw['Title'] as string | undefined;
        return cgName ? `Community Goal: ${cgName}` : null;
      }

      case 'FSSAllBodiesFound': {
        const system = raw['SystemName'] as string | undefined;
        const count = raw['Count'] as number | undefined;
        return `All ${count ?? '?'} bodies found in ${system ?? 'system'}`;
      }

      case 'CodexEntry': {
        const name = (raw['Name_Localised'] as string) || (raw['Name'] as string);
        const isNew = raw['IsNewEntry'] as boolean | undefined;
        if (!isNew) return null;
        return `New codex entry: ${name ?? 'Unknown'}`;
      }

      case 'FSSDiscoveryScan': {
        const system = raw['SystemName'] as string | undefined;
        const bodyCount = raw['BodyCount'] as number | undefined;
        if (!bodyCount || bodyCount < 20) return null; // Only highlight large systems
        return `Honk in ${system ?? 'system'}: ${bodyCount} bodies detected`;
      }

      case 'Resurrect': {
        const cost = raw['Cost'] as number | undefined;
        return `Rebuy${cost ? ` -- ${formatCredits(cost, true)}` : ''}`;
      }

      default:
        return null;
    }
  }

  // =========================================================================
  // Time Since Last Play
  // =========================================================================

  /**
   * Calculate how long it has been since the commander last played,
   * and how many journal sessions exist in the gap.
   */
  private async calculateTimeSinceLastPlay(
    journalDir: string,
  ): Promise<{ daysSinceLastPlay: number; sessionsSinceLastPlay: number }> {
    try {
      const files = await findJournalFiles(journalDir);

      if (files.length === 0) {
        return { daysSinceLastPlay: 0, sessionsSinceLastPlay: 0 };
      }

      // The most recent journal file's timestamp gives us a rough "last played" date
      // Read the first few events from the latest journal to get a more accurate timestamp
      const latestEvents = await readJournalFile(files[0]);
      let lastTimestamp = new Date();

      // Find the last event timestamp in the latest journal
      if (latestEvents.length > 0) {
        const lastEvt = latestEvents[latestEvents.length - 1];
        lastTimestamp = new Date(lastEvt.timestamp);
      }

      const now = new Date();
      const diffMs = now.getTime() - lastTimestamp.getTime();
      const daysSinceLastPlay = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      // Count distinct sessions (each journal file represents roughly one session)
      // Only count files from the last 30 days as "recent sessions"
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let sessionsSinceLastPlay = 0;
      for (const file of files) {
        // Use the journal filename to determine its date
        // Files are sorted newest first by findJournalFiles
        try {
          const events = await readJournalFile(file);
          if (events.length > 0) {
            const fileDate = new Date(events[0].timestamp);
            if (fileDate.getTime() >= thirtyDaysAgo.getTime()) {
              sessionsSinceLastPlay++;
            } else {
              break; // Files are sorted newest first
            }
          }
        } catch {
          // Skip unreadable files
          continue;
        }

        // Cap at 30 files to avoid excessive reads
        if (sessionsSinceLastPlay >= 30) break;
      }

      return { daysSinceLastPlay, sessionsSinceLastPlay };
    } catch (err) {
      warn('Failed to calculate time since last play:', err);
      return { daysSinceLastPlay: 0, sessionsSinceLastPlay: 0 };
    }
  }

  // =========================================================================
  // Narrative Generation
  // =========================================================================

  /**
   * Generate a natural-language narrative paragraph summarizing the briefing.
   *
   * This is the "welcome back" message displayed prominently on the dashboard.
   * It reads like a cockpit AI greeting the commander.
   */
  private generateNarrative(data: Partial<BriefingData>): string {
    const parts: string[] = [];

    // Opening: Welcome back, CMDR
    const name = data.commander?.name || 'Commander';
    parts.push(`Welcome back, CMDR ${name}.`);

    // Time away
    const days = data.daysSinceLastPlay ?? 0;
    if (days >= 1) {
      parts.push(
        days === 1
          ? "It's been 1 day since your last session."
          : `It's been ${days} days since your last session.`,
      );
    }

    // Last known position
    const session = data.lastSession;
    const loc = data.currentLocation;
    if (loc?.system && loc.system !== 'Unknown') {
      if (loc.docked && loc.station) {
        parts.push(`You are currently docked at ${loc.station} in ${loc.system}.`);
      } else if (loc.system) {
        parts.push(`You are currently in the ${loc.system} system.`);
      }
    } else if (session?.system && session.system !== 'Unknown') {
      if (session.station) {
        parts.push(
          `You were last seen docked at ${session.station} in ${session.system}.`,
        );
      } else {
        parts.push(`You were last seen in the ${session.system} system.`);
      }
    }

    // Ship info
    const ship = data.shipStatus;
    if (ship?.type && ship.type !== 'Unknown') {
      const shipDesc = ship.name
        ? `your ${ship.type} '${ship.name}'`
        : `your ${ship.type}`;
      parts.push(`You are flying ${shipDesc}.`);
    }

    // Fuel warning
    if (ship && ship.fuelCapacity > 0) {
      const fuelPercent = (ship.fuelLevel / ship.fuelCapacity) * 100;
      if (fuelPercent < 25) {
        parts.push(`Warning: fuel level is critically low at ${fuelPercent.toFixed(0)}%.`);
      } else if (fuelPercent < 50) {
        parts.push(`Fuel level is at ${fuelPercent.toFixed(0)}% -- consider refuelling.`);
      }
    }

    // Hull warning
    if (ship && ship.hullHealth < 0.5) {
      const hullPercent = (ship.hullHealth * 100).toFixed(0);
      parts.push(`Hull integrity is at ${hullPercent}% -- repairs recommended.`);
    }

    // Missions
    const missions = data.activeMissions ?? [];
    if (missions.length > 0) {
      parts.push(
        missions.length === 1
          ? 'You have 1 active mission.'
          : `You have ${missions.length} active missions.`,
      );

      // Check for expiring missions
      const now = Date.now();
      const expiringCount = missions.filter((m) => {
        if (!m.expiry) return false;
        const expiryTime = new Date(m.expiry).getTime();
        return expiryTime - now < 24 * 60 * 60 * 1000; // Within 24 hours
      }).length;

      if (expiringCount > 0) {
        parts.push(
          expiringCount === 1
            ? 'Warning: 1 mission expires within 24 hours.'
            : `Warning: ${expiringCount} missions expire within 24 hours.`,
        );
      }
    }

    // Credits
    const credits = data.commander?.credits;
    if (credits !== undefined && credits > 0) {
      parts.push(`Credit balance: ${formatCredits(credits, true)}.`);
    }

    // Combat rank
    const combatRank = data.commander?.combatRank;
    if (combatRank && combatRank !== 'Unknown' && combatRank !== 'Harmless') {
      parts.push(`Combat rank: ${combatRank}.`);
    }

    return parts.join(' ');
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  /**
   * Clean an Elite Dangerous mission name for display.
   *
   * Mission names in the journal are often internal IDs like
   * "Mission_Delivery_name" — this strips the prefix/suffix and
   * converts underscores to spaces.
   */
  private cleanMissionName(name: string): string {
    let clean = name;

    // Remove common prefixes
    clean = clean.replace(/^Mission_/i, '');
    clean = clean.replace(/_name$/i, '');

    // Replace underscores with spaces
    clean = clean.replace(/_/g, ' ');

    // Title case
    clean = clean.replace(/\b\w/g, (c) => c.toUpperCase());

    return clean.trim() || name;
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

/** Global DashboardService instance. */
export const dashboardService = new DashboardService();
