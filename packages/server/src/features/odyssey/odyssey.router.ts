import { Router, type Request, type Response } from 'express';
import { odysseyService } from './odyssey.service.js';

export const odysseyRouter = Router();

odysseyRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: odysseyService.getOdysseySummary() });
});

odysseyRouter.get('/suits', (_req: Request, res: Response) => {
  res.json({ success: true, data: odysseyService.getSuits() });
});

odysseyRouter.get('/loadouts', (_req: Request, res: Response) => {
  res.json({ success: true, data: odysseyService.getLoadouts() });
});

odysseyRouter.get('/backpack', (_req: Request, res: Response) => {
  res.json({ success: true, data: odysseyService.getBackpack() });
});

odysseyRouter.get('/materials', (_req: Request, res: Response) => {
  res.json({ success: true, data: odysseyService.getMaterials() });
});

odysseyRouter.get('/scans', (_req: Request, res: Response) => {
  res.json({ success: true, data: odysseyService.getActiveScans() });
});

odysseyRouter.get('/farm-guide', (req: Request, res: Response) => {
  const component = req.query.component as string | undefined;
  res.json({ success: true, data: odysseyService.getFarmGuide(component) });
});
