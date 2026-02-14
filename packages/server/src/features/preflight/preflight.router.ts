import { Router, type Request, type Response } from 'express';
import { preflightService } from './preflight.service.js';

export const preflightRouter = Router();

preflightRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: preflightService.getChecklistSummary() });
});

preflightRouter.get('/checklist', (_req: Request, res: Response) => {
  res.json({ success: true, data: preflightService.runChecklist() });
});
