/**
 * @vayu/server — CHAKRA Router
 *
 * Express router for the CHAKRA real-time telemetry feature.
 *   - GET /api/chakra/state — Initial load with recent events + activity context
 *
 * After initial load, all data flows via WebSocket (journal:event, status:flags).
 */

import { Router, type Request, type Response } from 'express';
import { chakraService } from './chakra.service.js';

export const chakraRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/chakra/state
// ---------------------------------------------------------------------------

chakraRouter.get('/state', (_req: Request, res: Response) => {
  try {
    const state = chakraService.getState();
    res.json({ success: true, data: state });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CHAKRA] Failed to get state:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to get CHAKRA state',
      detail: message,
    });
  }
});
