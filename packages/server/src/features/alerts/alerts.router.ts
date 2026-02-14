import { Router, type Request, type Response } from 'express';
import { alertsService } from './alerts.service.js';

export const alertsRouter = Router();

alertsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: { rules: alertsService.getRules(), recent: alertsService.getAlertHistory(10) } });
});

alertsRouter.get('/rules', (_req: Request, res: Response) => {
  res.json({ success: true, data: alertsService.getRules() });
});

alertsRouter.put('/rules/:id', (req: Request, res: Response) => {
  if (alertsService.updateRule(req.params.id, req.body)) {
    res.json({ success: true, data: alertsService.getRules() });
  } else {
    res.status(404).json({ success: false, error: 'Rule not found' });
  }
});

alertsRouter.get('/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({ success: true, data: alertsService.getAlertHistory(limit) });
});

alertsRouter.post('/acknowledge/:id', (req: Request, res: Response) => {
  if (alertsService.acknowledgeAlert(req.params.id)) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Alert not found' });
  }
});

alertsRouter.post('/clear', (_req: Request, res: Response) => {
  alertsService.clearHistory();
  res.json({ success: true });
});
