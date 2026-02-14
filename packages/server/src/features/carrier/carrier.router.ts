import { Router, type Request, type Response } from 'express';
import { carrierService } from './carrier.service.js';

export const carrierRouter = Router();

carrierRouter.get('/', (_req: Request, res: Response) => {
  const data = carrierService.getCarrierSummary();
  if (!data) { res.json({ success: true, data: null, message: 'No carrier data available' }); return; }
  res.json({ success: true, data });
});

carrierRouter.get('/state', (_req: Request, res: Response) => {
  res.json({ success: true, data: carrierService.getCarrierState() });
});

carrierRouter.get('/fuel-calc', (req: Request, res: Response) => {
  const distance = parseFloat(req.query.distance as string);
  if (isNaN(distance) || distance <= 0) { res.status(400).json({ success: false, error: 'Provide a valid distance parameter' }); return; }
  const calc = carrierService.calculateTritiumFuel(distance);
  if (!calc) { res.status(404).json({ success: false, error: 'No carrier data' }); return; }
  res.json({ success: true, data: calc });
});

carrierRouter.get('/upkeep', (_req: Request, res: Response) => {
  res.json({ success: true, data: carrierService.getUpkeepWarning() });
});

carrierRouter.get('/jumps', (_req: Request, res: Response) => {
  res.json({ success: true, data: carrierService.getJumpHistory() });
});
