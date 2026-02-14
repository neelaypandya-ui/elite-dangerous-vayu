/**
 * @vayu/server — Route Scaffold
 *
 * Central API router that mounts all feature route modules under `/api`.
 */

import { Router, type Request, type Response } from 'express';

export const apiRouter = Router();

// ---------------------------------------------------------------------------
// Feature route mounts
// ---------------------------------------------------------------------------

// -- Dashboard & overview --
import { dashboardRouter } from '../features/dashboard/index.js';
apiRouter.use('/dashboard', dashboardRouter);

// -- Key bindings --
import { bindingsRouter } from '../features/bindings/index.js';
apiRouter.use('/bindings', bindingsRouter);

// -- COVAS voice pipeline --
import { covasRouter } from '../covas/index.js';
apiRouter.use('/covas', covasRouter);

// -- Trade analysis --
import { tradeRouter } from '../features/trade/index.js';
apiRouter.use('/trade', tradeRouter);

// -- Engineering & materials --
import { engineeringRouter } from '../features/engineering/index.js';
apiRouter.use('/engineering', engineeringRouter);

// -- Mission control --
import { missionsRouter } from '../features/missions/index.js';
apiRouter.use('/missions', missionsRouter);

// -- Navigation & exploration --
import { navigationRouter } from '../features/navigation/index.js';
apiRouter.use('/navigation', navigationRouter);

// -- Graphics profile manager --
import { graphicsRouter } from '../features/graphics/index.js';
apiRouter.use('/graphics', graphicsRouter);

// -- Audio profile manager --
import { audioRouter } from '../features/audio/index.js';
apiRouter.use('/audio', audioRouter);

// -- Alert system --
import { alertsRouter } from '../features/alerts/index.js';
apiRouter.use('/alerts', alertsRouter);

// -- Pre-flight checklist --
import { preflightRouter } from '../features/preflight/index.js';
apiRouter.use('/preflight', preflightRouter);

// -- Powerplay & BGS --
import { powerplayRouter } from '../features/powerplay/index.js';
apiRouter.use('/powerplay', powerplayRouter);

// -- Ship / fleet management --
import { shipsRouter } from '../features/ships/index.js';
apiRouter.use('/ships', shipsRouter);

// -- Community integrations (EDSM, Inara) --
import { communityRouter } from '../features/community/index.js';
apiRouter.use('/community', communityRouter);

// -- GalNet news --
import { galnetRouter } from '../features/galnet/index.js';
apiRouter.use('/galnet', galnetRouter);

// -- Session analytics --
import { analyticsRouter } from '../features/analytics/index.js';
apiRouter.use('/analytics', analyticsRouter);

// -- Screenshots --
import { screenshotsRouter } from '../features/screenshots/index.js';
apiRouter.use('/screenshots', screenshotsRouter);

// -- Fleet carrier --
import { carrierRouter } from '../features/carrier/index.js';
apiRouter.use('/carrier', carrierRouter);

// -- Mining --
import { miningRouter } from '../features/mining/index.js';
apiRouter.use('/mining', miningRouter);

// -- Pip management --
import { pipsRouter } from '../features/pips/index.js';
apiRouter.use('/pips', pipsRouter);

// -- Threats & intel --
import { threatsRouter } from '../features/threats/index.js';
apiRouter.use('/threats', threatsRouter);

// -- Odyssey on-foot --
import { odysseyRouter } from '../features/odyssey/index.js';
apiRouter.use('/odyssey', odysseyRouter);

// -- Ship outfitting --
import { outfittingRouter } from '../features/outfitting/index.js';
apiRouter.use('/outfitting', outfittingRouter);

// -- Trivia & training --
import { triviaRouter } from '../features/trivia/index.js';
apiRouter.use('/trivia', triviaRouter);

// -- Personal logbook --
import { logbookRouter } from '../features/logbook/index.js';
apiRouter.use('/logbook', logbookRouter);

// -- Journal archiver --
import { archiverRouter } from '../features/archiver/index.js';
apiRouter.use('/archiver', archiverRouter);

// -- Music player --
import { musicRouter } from '../features/music/index.js';
apiRouter.use('/music', musicRouter);

// -- CHAKRA real-time telemetry --
import { chakraRouter } from '../features/chakra/index.js';
apiRouter.use('/chakra', chakraRouter);

// ---------------------------------------------------------------------------
// Status endpoint (always available)
// ---------------------------------------------------------------------------

apiRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    features: [
      'dashboard', 'bindings', 'covas', 'trade', 'engineering', 'missions',
      'navigation', 'graphics', 'audio', 'alerts', 'preflight', 'powerplay',
      'ships', 'community', 'galnet', 'analytics', 'screenshots', 'carrier',
      'mining', 'pips', 'threats', 'odyssey', 'outfitting', 'trivia',
      'logbook', 'archiver', 'music', 'chakra',
    ],
  });
});
