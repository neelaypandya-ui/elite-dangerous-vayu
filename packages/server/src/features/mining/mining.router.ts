import { Router, type Request, type Response } from 'express';
import { miningService } from './mining.service.js';

export const miningRouter = Router();

miningRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: miningService.getMiningSummary() });
});

miningRouter.get('/current', (_req: Request, res: Response) => {
  res.json({ success: true, data: miningService.getCurrentSession() });
});

miningRouter.get('/sessions', (_req: Request, res: Response) => {
  res.json({ success: true, data: miningService.getSessions() });
});

miningRouter.get('/profit', (_req: Request, res: Response) => {
  res.json({ success: true, data: { profitPerHour: miningService.getProfitPerHour() } });
});
