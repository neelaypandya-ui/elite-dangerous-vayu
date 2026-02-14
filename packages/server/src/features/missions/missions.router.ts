import { Router, type Request, type Response } from 'express';
import { missionsService } from './missions.service.js';

export const missionsRouter = Router();

missionsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: missionsService.getMissionStats() });
});

missionsRouter.get('/active', (_req: Request, res: Response) => {
  res.json({ success: true, data: missionsService.getActiveMissions() });
});

missionsRouter.get('/completed', (_req: Request, res: Response) => {
  res.json({ success: true, data: missionsService.getCompletedMissions() });
});

missionsRouter.get('/expiring', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  res.json({ success: true, data: missionsService.getExpiringMissions(hours) });
});

missionsRouter.get('/by-destination', (_req: Request, res: Response) => {
  res.json({ success: true, data: missionsService.getMissionsByDestination() });
});
