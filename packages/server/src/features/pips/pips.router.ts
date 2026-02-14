import { Router, type Request, type Response } from 'express';
import { pipsService } from './pips.service.js';

export const pipsRouter = Router();

pipsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: pipsService.getPipStats() });
});

pipsRouter.get('/current', (_req: Request, res: Response) => {
  res.json({ success: true, data: pipsService.getCurrentPips() });
});

pipsRouter.get('/recommendation', (_req: Request, res: Response) => {
  res.json({ success: true, data: pipsService.getRecommendation() });
});

pipsRouter.get('/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({ success: true, data: pipsService.getPipHistory(limit) });
});
