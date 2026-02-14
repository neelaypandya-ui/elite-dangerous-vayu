import { Router, type Request, type Response } from 'express';
import { shipsService } from './ships.service.js';

export const shipsRouter = Router();

shipsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: shipsService.getFleetSummary() });
});

shipsRouter.get('/current', (_req: Request, res: Response) => {
  res.json({ success: true, data: shipsService.getCurrentShip() });
});

shipsRouter.get('/stored', (_req: Request, res: Response) => {
  res.json({ success: true, data: shipsService.getStoredShips() });
});
