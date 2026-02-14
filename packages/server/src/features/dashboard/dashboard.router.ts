/**
 * @vayu/server — Dashboard Router
 *
 * Express router for the dashboard API. Provides endpoints for:
 *   - GET /api/dashboard/briefing — "Where Was I?" session briefing
 *   - GET /api/dashboard/state    — Current game state summary
 *
 * All endpoints return JSON wrapped in { success, data } or { success, error }.
 */

import { Router, type Request, type Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { gameStateManager } from '../../core/game-state.js';

export const dashboardRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/dashboard/briefing
// ---------------------------------------------------------------------------

/**
 * Generate and return the "Where Was I?" briefing.
 *
 * This reads from historical journal files and the live game state to
 * build a comprehensive session recap. The response includes narrative
 * text, commander info, location, ship status, missions, and highlights.
 */
dashboardRouter.get('/briefing', async (_req: Request, res: Response) => {
  try {
    const briefing = await dashboardService.generateBriefing();
    res.json({ success: true, data: briefing });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dashboard] Failed to generate briefing:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate briefing',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/state
// ---------------------------------------------------------------------------

/**
 * Return the current game state summary.
 *
 * This is a lightweight endpoint that returns the live game state
 * from the GameStateManager without reading any journal files.
 */
dashboardRouter.get('/state', (_req: Request, res: Response) => {
  try {
    const state = gameStateManager.getState();
    res.json({
      success: true,
      data: {
        initialized: state.initialized,
        lastUpdated: state.lastUpdated,
        commander: {
          name: state.commander.name,
          fid: state.commander.fid,
          credits: state.commander.credits,
          ranks: state.commander.ranks,
          gameMode: state.commander.gameMode,
        },
        ship: {
          type: state.ship.ship,
          name: state.ship.shipName,
          ident: state.ship.shipIdent,
          fuel: state.ship.fuel,
          hullHealth: state.ship.hullHealth,
          cargoCount: state.ship.cargoCount,
          cargoCapacity: state.ship.cargoCapacity,
        },
        location: {
          system: state.location.system,
          body: state.location.body,
          station: state.location.station,
          docked: state.location.docked,
          supercruise: state.location.supercruise,
          landed: state.location.landed,
          onFoot: state.location.onFoot,
        },
        session: state.session,
        activeMissions: state.missions.length,
        hasCarrier: state.carrier !== null,
        eventsProcessed: gameStateManager.getEventsProcessed(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dashboard] Failed to get state:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to get game state',
      detail: message,
    });
  }
});
