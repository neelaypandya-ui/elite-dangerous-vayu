import { Router, type Request, type Response } from 'express';
import { powerplayService } from './powerplay.service.js';

export const powerplayRouter = Router();

powerplayRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: powerplayService.getPowerplayState() });
});

powerplayRouter.get('/activities', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({ success: true, data: powerplayService.getActivities(limit) });
});
