import { Router, type Request, type Response } from 'express';
import { outfittingService } from './outfitting.service.js';

export const outfittingRouter = Router();

outfittingRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: outfittingService.getOutfittingSummary() });
});

outfittingRouter.get('/loadout', (_req: Request, res: Response) => {
  res.json({ success: true, data: outfittingService.getCurrentLoadout() });
});

outfittingRouter.get('/stored-modules', (_req: Request, res: Response) => {
  res.json({ success: true, data: outfittingService.getStoredModules() });
});
