/**
 * Pre-flight system preparation service.
 * Provides a checklist of items to verify before departing a station.
 */

import { gameStateManager } from '../../core/game-state.js';

interface PreflightCheck {
  id: string;
  label: string;
  category: 'fuel' | 'ship' | 'cargo' | 'missions' | 'modules';
  status: 'pass' | 'warn' | 'fail' | 'info';
  message: string;
}

class PreflightService {
  runChecklist(): PreflightCheck[] {
    const state = gameStateManager.getState();
    const checks: PreflightCheck[] = [];

    // Fuel check
    const fuelPct = state.ship.fuel.mainCapacity > 0
      ? (state.ship.fuel.main / state.ship.fuel.mainCapacity) * 100 : 100;
    checks.push({
      id: 'fuel_level',
      label: 'Fuel Level',
      category: 'fuel',
      status: fuelPct < 25 ? 'fail' : fuelPct < 50 ? 'warn' : 'pass',
      message: `${fuelPct.toFixed(0)}% — ${state.ship.fuel.main.toFixed(1)}t / ${state.ship.fuel.mainCapacity}t`,
    });

    // Hull check
    const hullPct = state.ship.hullHealth * 100;
    checks.push({
      id: 'hull_integrity',
      label: 'Hull Integrity',
      category: 'ship',
      status: hullPct < 50 ? 'fail' : hullPct < 80 ? 'warn' : 'pass',
      message: `${hullPct.toFixed(0)}%`,
    });

    // Cargo space
    checks.push({
      id: 'cargo_space',
      label: 'Cargo Space',
      category: 'cargo',
      status: state.ship.cargoCount >= state.ship.cargoCapacity ? 'warn' : 'pass',
      message: `${state.ship.cargoCount}/${state.ship.cargoCapacity}t used`,
    });

    // Active missions
    const expiringCount = state.missions.filter((m) => {
      if (!m.expiry) return false;
      return new Date(m.expiry).getTime() - Date.now() < 2 * 60 * 60 * 1000;
    }).length;
    checks.push({
      id: 'missions',
      label: 'Active Missions',
      category: 'missions',
      status: expiringCount > 0 ? 'warn' : 'info',
      message: `${state.missions.length} active${expiringCount > 0 ? `, ${expiringCount} expiring soon` : ''}`,
    });

    // Module health check
    const damagedModules = state.ship.modules.filter((m) => m.health < 0.8);
    checks.push({
      id: 'module_health',
      label: 'Module Health',
      category: 'modules',
      status: damagedModules.length > 3 ? 'fail' : damagedModules.length > 0 ? 'warn' : 'pass',
      message: damagedModules.length > 0
        ? `${damagedModules.length} module${damagedModules.length !== 1 ? 's' : ''} below 80%`
        : 'All modules healthy',
    });

    // Rebuy check
    const canRebuy = state.commander.credits >= state.ship.rebuy;
    checks.push({
      id: 'rebuy_cost',
      label: 'Rebuy Available',
      category: 'ship',
      status: canRebuy ? 'pass' : 'fail',
      message: canRebuy
        ? `Rebuy: ${(state.ship.rebuy / 1_000_000).toFixed(1)}M CR`
        : `INSUFFICIENT CREDITS for rebuy (${(state.ship.rebuy / 1_000_000).toFixed(1)}M CR)`,
    });

    // Docking status
    checks.push({
      id: 'docking_status',
      label: 'Docking Status',
      category: 'ship',
      status: 'info',
      message: state.location.docked
        ? `Docked at ${state.location.station || 'Unknown'}`
        : state.location.supercruise ? 'In supercruise' : 'In space',
    });

    return checks;
  }

  getChecklistSummary(): object {
    const checks = this.runChecklist();
    const failCount = checks.filter((c) => c.status === 'fail').length;
    const warnCount = checks.filter((c) => c.status === 'warn').length;
    return {
      checks,
      summary: {
        total: checks.length,
        pass: checks.filter((c) => c.status === 'pass').length,
        warn: warnCount,
        fail: failCount,
        info: checks.filter((c) => c.status === 'info').length,
        readyToLaunch: failCount === 0,
      },
    };
  }
}

export const preflightService = new PreflightService();
