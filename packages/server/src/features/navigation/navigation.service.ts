/**
 * Navigation & exploration service.
 * Tracks route progress, jump history, system data, and provides EDSM lookups.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import { config } from '../../config.js';
import { systemDistance } from '@vayu/shared';

interface JumpRecord {
  timestamp: string;
  system: string;
  coordinates: { x: number; y: number; z: number };
  distance: number;
  fuelUsed: number;
  starClass: string;
}

interface SystemInfo {
  name: string;
  coordinates: { x: number; y: number; z: number };
  allegiance: string;
  economy: string;
  government: string;
  security: string;
  population: number;
  bodyCount: number | null;
}

class NavigationService {
  private jumpHistory: JumpRecord[] = [];
  private visitedSystems = new Set<string>();
  private systemInfoCache = new Map<string, { data: SystemInfo; expiry: number }>();

  constructor() {
    eventBus.onJournalEvent('FSDJump', (evt) => {
      const raw = evt as any;
      const record: JumpRecord = {
        timestamp: evt.timestamp,
        system: raw.StarSystem || 'Unknown',
        coordinates: {
          x: raw.StarPos?.[0] ?? 0,
          y: raw.StarPos?.[1] ?? 0,
          z: raw.StarPos?.[2] ?? 0,
        },
        distance: raw.JumpDist || 0,
        fuelUsed: raw.FuelUsed || 0,
        starClass: raw.StarClass || '',
      };
      this.jumpHistory.push(record);
      this.visitedSystems.add(record.system);
      if (this.jumpHistory.length > 500) this.jumpHistory.shift();
    });
  }

  getJumpHistory(limit = 50): JumpRecord[] {
    return this.jumpHistory.slice(-limit).reverse();
  }

  getVisitedSystems(): string[] {
    return [...this.visitedSystems];
  }

  getCurrentLocation(): object {
    const { location } = gameStateManager.getState();
    return {
      system: location.system,
      body: location.body,
      station: location.station,
      docked: location.docked,
      supercruise: location.supercruise,
      landed: location.landed,
      onFoot: location.onFoot,
      coordinates: location.coordinates,
      allegiance: location.systemAllegiance,
      economy: location.systemEconomy,
      government: location.systemGovernment,
      security: location.systemSecurity,
    };
  }

  calculateDistance(system1: { x: number; y: number; z: number }, system2: { x: number; y: number; z: number }): number {
    return systemDistance([system1.x, system1.y, system1.z], [system2.x, system2.y, system2.z]);
  }

  async lookupSystem(systemName: string): Promise<SystemInfo | null> {
    const cached = this.systemInfoCache.get(systemName);
    if (cached && cached.expiry > Date.now()) return cached.data;

    try {
      const url = `https://www.edsm.net/api-v1/system?systemName=${encodeURIComponent(systemName)}&showInformation=1&showCoordinates=1`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return null;
      const json = await resp.json() as any;
      if (!json.name) return null;

      const info: SystemInfo = {
        name: json.name,
        coordinates: json.coords || { x: 0, y: 0, z: 0 },
        allegiance: json.information?.allegiance || '',
        economy: json.information?.economy || '',
        government: json.information?.government || '',
        security: json.information?.security || '',
        population: json.information?.population || 0,
        bodyCount: json.bodyCount ?? null,
      };

      this.systemInfoCache.set(systemName, { data: info, expiry: Date.now() + 600_000 });
      return info;
    } catch {
      return null;
    }
  }

  getNavigationStats(): object {
    const state = gameStateManager.getState();
    return {
      currentLocation: this.getCurrentLocation(),
      totalJumps: this.jumpHistory.length,
      totalDistance: this.jumpHistory.reduce((s, j) => s + j.distance, 0),
      uniqueSystems: this.visitedSystems.size,
      recentJumps: this.getJumpHistory(10),
      sessionStats: {
        jumps: state.session.jumps,
        distance: state.session.totalDistance,
        fuelUsed: state.session.fuelUsed,
        systemsVisited: state.session.systemsVisited,
      },
    };
  }
}

export const navigationService = new NavigationService();
