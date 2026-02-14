import { Router, type Request, type Response } from 'express';
import { analyticsService } from './analytics.service.js';

export const analyticsRouter = Router();

analyticsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: analyticsService.getSessionSummary() });
});

analyticsRouter.get('/session', (_req: Request, res: Response) => {
  res.json({ success: true, data: analyticsService.getCurrentSession() });
});

analyticsRouter.get('/snapshots', (_req: Request, res: Response) => {
  res.json({ success: true, data: analyticsService.getSnapshots() });
});
