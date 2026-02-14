/**
 * Ship / fleet management service.
 * Tracks all owned ships, stored ships, and transfer costs.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import { resolveShipName } from '@vayu/shared';

interface StoredShip {
  shipId: number;
  shipType: string;
  displayName: string;
  name: string;
  system: string;
  station: string;
  value: number;
  hot: boolean;
  inTransit: boolean;
}

class ShipsService {
  private storedShips: StoredShip[] = [];

  constructor() {
    eventBus.onJournalEvent('StoredShips', (evt) => {
      const raw = evt as any;
      const ships = raw.ShipsHere as Array<any> || [];
      const remote = raw.ShipsRemote as Array<any> || [];
      this.storedShips = [];

      for (const s of ships) {
        this.storedShips.push({
          shipId: s.ShipID,
          shipType: s.ShipType,
          displayName: resolveShipName(s.ShipType),
          name: s.Name || '',
          system: raw.StarSystem || '',
          station: raw.StationName || '',
          value: s.Value || 0,
          hot: s.Hot || false,
          inTransit: false,
        });
      }
      for (const s of remote) {
        this.storedShips.push({
          shipId: s.ShipID,
          shipType: s.ShipType,
          displayName: resolveShipName(s.ShipType),
          name: s.Name || '',
          system: s.StarSystem || 'Unknown',
          station: s.ShipMarketID ? 'Station' : 'Unknown',
          value: s.Value || 0,
          hot: s.Hot || false,
          inTransit: s.InTransit || false,
        });
      }
    });
  }

  getCurrentShip(): object {
    const { ship } = gameStateManager.getState();
    return {
      type: ship.ship,
      displayName: resolveShipName(ship.ship),
      name: ship.shipName,
      ident: ship.shipIdent,
      shipId: ship.shipId,
      hullValue: ship.hullValue,
      modulesValue: ship.modulesValue,
      rebuy: ship.rebuy,
      hullHealth: ship.hullHealth,
      fuel: ship.fuel,
      cargo: ship.cargoCount,
      cargoCapacity: ship.cargoCapacity,
      modules: ship.modules.length,
    };
  }

  getStoredShips(): StoredShip[] {
    return this.storedShips;
  }

  getFleetSummary(): object {
    const current = this.getCurrentShip() as any;
    const totalValue = this.storedShips.reduce((s, ship) => s + ship.value, 0) + (current.hullValue || 0) + (current.modulesValue || 0);
    return {
      currentShip: current,
      storedShips: this.storedShips,
      fleetSize: this.storedShips.length + 1,
      totalFleetValue: totalValue,
    };
  }
}

export const shipsService = new ShipsService();
