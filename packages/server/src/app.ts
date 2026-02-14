/**
 * @vayu/server — Express Application Factory
 *
 * Creates and configures the Express application with middleware,
 * route mounting, and a health check endpoint.
 *
 * Usage:
 *   import { createApp } from './app.js';
 *   const app = createApp();
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

import { config } from './config.js';
import { apiRouter } from './routes/index.js';

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Creates a fully-configured Express application.
 * Does NOT call `app.listen()` — that is the caller's responsibility
 * so the HTTP server can also be passed to the WebSocket manager.
 */
export function createApp(): express.Express {
  const app = express();

  // -- CORS --
  app.use(
    cors({
      origin: `http://localhost:${config.server.clientPort}`,
      credentials: true,
    }),
  );

  // -- Body parsing --
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.raw({ type: 'application/octet-stream', limit: '25mb' }));

  // -- Request logging (lightweight) --
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const start = Date.now();
    _res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`,
      );
    });
    next();
  });

  // -- API routes --
  app.use('/api', apiRouter);

  // -- Health check (outside /api prefix for load-balancer probes) --
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // -- 404 handler --
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${_req.method} ${_req.originalUrl} not found`,
      },
      timestamp: new Date().toISOString(),
      durationMs: 0,
    });
  });

  // -- Global error handler --
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
      },
      timestamp: new Date().toISOString(),
      durationMs: 0,
    });
  });

  return app;
}
