/**
 * @vayu/server -- Bindings Router
 *
 * Express router for the key bindings API. Provides endpoints for:
 *   - GET  /api/bindings            -- Full parsed binding set with summary
 *   - GET  /api/bindings/device/:deviceName -- Bindings for a specific device
 *   - GET  /api/bindings/category/:category -- Bindings for a category
 *   - GET  /api/bindings/conflicts  -- Binding conflicts (duplicate mappings)
 *   - GET  /api/bindings/unbound    -- Actions with no binding
 *   - GET  /api/bindings/search?q=  -- Search bindings by action name
 *   - POST /api/bindings/reload     -- Force-reload bindings from disk
 *   - PUT  /api/bindings/:action    -- Update a binding for a specific action
 *
 * All endpoints return JSON wrapped in { success, data } or { success, error }.
 */

import { Router, type Request, type Response } from 'express';
import { bindingsService } from './bindings.service.js';
import { wsManager } from '../../websocket.js';

export const bindingsRouter = Router();

// ---------------------------------------------------------------------------
// Middleware: ensure bindings are loaded before every request
// ---------------------------------------------------------------------------

bindingsRouter.use(async (_req: Request, res: Response, next) => {
  try {
    await bindingsService.ensureLoaded();
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to load bindings:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to load bindings file',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bindings -- Full binding set with summary
// ---------------------------------------------------------------------------

bindingsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const data = bindingsService.toJSON();
    res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to get bindings:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to get bindings',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bindings/device/:deviceName -- Bindings for a specific device
// ---------------------------------------------------------------------------

bindingsRouter.get('/device/:deviceName', (req: Request, res: Response) => {
  try {
    const { deviceName } = req.params;
    const entries = bindingsService.getByDevice(deviceName);
    res.json({
      success: true,
      data: {
        device: deviceName,
        count: entries.length,
        bindings: entries,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to get device bindings:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to get device bindings',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bindings/category/:category -- Bindings for a category
// ---------------------------------------------------------------------------

bindingsRouter.get('/category/:category', (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const entries = bindingsService.getByCategory(category);
    res.json({
      success: true,
      data: {
        category,
        count: entries.length,
        bindings: entries,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to get category bindings:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to get category bindings',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bindings/conflicts -- Binding conflicts
// ---------------------------------------------------------------------------

bindingsRouter.get('/conflicts', (_req: Request, res: Response) => {
  try {
    const conflicts = bindingsService.getConflicts();
    res.json({
      success: true,
      data: {
        count: conflicts.length,
        conflicts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to get conflicts:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to get binding conflicts',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bindings/unbound -- Unbound actions
// ---------------------------------------------------------------------------

bindingsRouter.get('/unbound', (_req: Request, res: Response) => {
  try {
    const unbound = bindingsService.getUnbound();
    res.json({
      success: true,
      data: {
        count: unbound.length,
        actions: unbound,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to get unbound actions:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to get unbound actions',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bindings/search?q=... -- Search bindings by action name
// ---------------------------------------------------------------------------

bindingsRouter.get('/search', (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json({
        success: true,
        data: { query: '', count: 0, bindings: [] },
      });
      return;
    }

    const entries = bindingsService.search(query);
    res.json({
      success: true,
      data: {
        query,
        count: entries.length,
        bindings: entries,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to search bindings:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to search bindings',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/bindings/reload -- Force-reload bindings from disk
// ---------------------------------------------------------------------------

bindingsRouter.post('/reload', async (_req: Request, res: Response) => {
  try {
    await bindingsService.reload();
    const data = bindingsService.toJSON();
    res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to reload bindings:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to reload bindings',
      detail: message,
    });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/bindings/:action -- Update a binding for a specific action
// ---------------------------------------------------------------------------

bindingsRouter.put('/:action', async (req: Request, res: Response) => {
  try {
    const { action } = req.params;
    const { slot, clear, device, key, modifiers, axis, inverted, deadzone } = req.body;

    // Validate slot
    if (!slot || !['primary', 'secondary', 'axis'].includes(slot)) {
      res.status(400).json({
        success: false,
        error: 'Invalid slot. Must be "primary", "secondary", or "axis".',
      });
      return;
    }

    // Validate that we have either clear or device+key/axis
    if (!clear && !device) {
      res.status(400).json({
        success: false,
        error: 'Must provide either "clear: true" or "device" with "key"/"axis".',
      });
      return;
    }

    const updatedEntry = await bindingsService.updateBinding(action, slot, {
      clear,
      device,
      key,
      modifiers,
      axis,
      inverted,
      deadzone,
    });

    // Broadcast update via WebSocket
    wsManager.broadcast('bindings:updated', {
      action,
      slot,
      entry: updatedEntry,
    });

    res.json({
      success: true,
      data: updatedEntry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bindings] Failed to update binding:', message);
    res.status(500).json({
      success: false,
      error: 'Failed to update binding',
      detail: message,
    });
  }
});
