import { Router, type Request, type Response } from 'express';
import { engineeringService } from './engineering.service.js';
import type { MaterialCategory } from '@vayu/shared';

export const engineeringRouter = Router();

engineeringRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: engineeringService.getMaterialStats() });
});

engineeringRouter.get('/materials', (_req: Request, res: Response) => {
  res.json({ success: true, data: engineeringService.getMaterials() });
});

engineeringRouter.get('/materials/:category', (req: Request, res: Response) => {
  const category = req.params.category as MaterialCategory;
  if (!['Raw', 'Manufactured', 'Encoded'].includes(category)) {
    res.status(400).json({ success: false, error: 'Invalid category. Use Raw, Manufactured, or Encoded.' });
    return;
  }
  res.json({ success: true, data: engineeringService.getMaterialsByCategory(category) });
});

engineeringRouter.get('/materials/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  res.json({ success: true, data: engineeringService.searchMaterials(q) });
});

engineeringRouter.get('/materials/near-cap', (_req: Request, res: Response) => {
  res.json({ success: true, data: engineeringService.getMaterialsNearCap() });
});

engineeringRouter.get('/engineers', (_req: Request, res: Response) => {
  res.json({ success: true, data: engineeringService.getEngineers() });
});
