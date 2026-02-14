import { Router, type Request, type Response } from 'express';
import { navigationService } from './navigation.service.js';

export const navigationRouter = Router();

navigationRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: navigationService.getNavigationStats() });
});

navigationRouter.get('/location', (_req: Request, res: Response) => {
  res.json({ success: true, data: navigationService.getCurrentLocation() });
});

navigationRouter.get('/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({ success: true, data: navigationService.getJumpHistory(limit) });
});

navigationRouter.get('/visited', (_req: Request, res: Response) => {
  res.json({ success: true, data: navigationService.getVisitedSystems() });
});

navigationRouter.get('/lookup/:systemName', async (req: Request, res: Response) => {
  try {
    const info = await navigationService.lookupSystem(req.params.systemName);
    if (!info) {
      res.status(404).json({ success: false, error: 'System not found' });
      return;
    }
    res.json({ success: true, data: info });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});
