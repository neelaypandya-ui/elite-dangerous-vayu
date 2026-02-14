import { Router, type Request, type Response } from 'express';
import { threatsService } from './threats.service.js';

export const threatsRouter = Router();

threatsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: threatsService.getThreatSummary() });
});

threatsRouter.get('/current', (_req: Request, res: Response) => {
  res.json({ success: true, data: threatsService.getCurrentSystemThreat() });
});

threatsRouter.get('/known', (_req: Request, res: Response) => {
  res.json({ success: true, data: threatsService.getKnownThreats() });
});

threatsRouter.get('/interdictions', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  res.json({ success: true, data: threatsService.getInterdictions(limit) });
});
