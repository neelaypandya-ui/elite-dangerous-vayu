/**
 * Fleet carrier console service.
 * Tracks carrier state, jump history, tritium calculations, and upkeep.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import type { CarrierState, TritiumFuelCalc } from '@vayu/shared';

// Carrier jump range is always 500 LY max
const CARRIER_MAX_RANGE = 500;
// Base fuel consumption per jump at max range
const FUEL_PER_500LY = 110; // ~110t per 500 LY jump

class CarrierService {
  constructor() {
    // Game state manager already tracks carrier state from journal events
  }

  getCarrierState(): CarrierState | null {
    return gameStateManager.getState().carrier;
  }

  calculateTritiumFuel(distanceLY: number): TritiumFuelCalc | null {
    const carrier = this.getCarrierState();
    if (!carrier) return null;

    const jumpRangeMax = CARRIER_MAX_RANGE;
    const jumpsNeeded = Math.ceil(distanceLY / jumpRangeMax);
    const fuelPerJump = Math.ceil((distanceLY / jumpsNeeded / jumpRangeMax) * FUEL_PER_500LY);
    const totalFuel = fuelPerJump * jumpsNeeded;
    const hasSufficient = carrier.fuelLevel >= totalFuel;

    return {
      distance: distanceLY,
      currentFuel: carrier.fuelLevel,
      fuelCapacity: 1000,
      jumpRangeCurr: carrier.jumpRangeCurr,
      jumpRangeMax,
      estimatedFuelPerJump: fuelPerJump,
      jumpsNeeded,
      totalFuelRequired: totalFuel,
      hasSufficientFuel: hasSufficient,
      fuelDeficit: hasSufficient ? 0 : totalFuel - carrier.fuelLevel,
    };
  }

  getUpkeepWarning(): { warning: boolean; message: string; balance: number; weeklyUpkeep: number } {
    const carrier = this.getCarrierState();
    if (!carrier) return { warning: false, message: 'No carrier', balance: 0, weeklyUpkeep: 0 };

    // Base weekly upkeep is ~5M CR, + service costs
    const activeServices = carrier.services.filter((s) => s.activated).length;
    const weeklyUpkeep = 5_000_000 + activeServices * 750_000;
    const weeksOfFunding = carrier.finance.carrierBalance / weeklyUpkeep;

    return {
      warning: weeksOfFunding < 4,
      message: weeksOfFunding < 4
        ? `Low carrier balance! ~${Math.floor(weeksOfFunding)} weeks of upkeep remaining.`
        : `Carrier funded for ~${Math.floor(weeksOfFunding)} weeks.`,
      balance: carrier.finance.carrierBalance,
      weeklyUpkeep,
    };
  }

  getJumpHistory(): object[] {
    const carrier = this.getCarrierState();
    if (!carrier) return [];
    return carrier.jumpHistory;
  }

  getCarrierSummary(): object | null {
    const carrier = this.getCarrierState();
    if (!carrier) return null;

    return {
      ...carrier,
      upkeep: this.getUpkeepWarning(),
      totalJumps: carrier.jumpHistory.length,
      totalDistance: carrier.jumpHistory.reduce((s, j) => s + j.distance, 0),
    };
  }
}

export const carrierService = new CarrierService();
