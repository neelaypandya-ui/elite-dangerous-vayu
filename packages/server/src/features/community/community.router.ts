import { Router, type Request, type Response } from 'express';
import { communityService } from './community.service.js';

export const communityRouter = Router();

communityRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: { links: communityService.getCommunityLinks(), profile: communityService.getLocalProfile() } });
});

communityRouter.get('/edsm/system/:name', async (req: Request, res: Response) => {
  try {
    const info = await communityService.getEdsmSystem(req.params.name);
    if (!info) { res.status(404).json({ success: false, error: 'System not found on EDSM' }); return; }
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

communityRouter.get('/edsm/traffic/:name', async (req: Request, res: Response) => {
  try {
    const data = await communityService.getEdsmTrafficReport(req.params.name);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

communityRouter.get('/edsm/commander', async (_req: Request, res: Response) => {
  try {
    const data = await communityService.getEdsmCommanderPosition();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
