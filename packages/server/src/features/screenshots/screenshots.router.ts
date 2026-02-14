import { Router, type Request, type Response } from 'express';
import { screenshotsService } from './screenshots.service.js';

export const screenshotsRouter = Router();

screenshotsRouter.get('/', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    res.json({ success: true, data: { screenshots: screenshotsService.getScreenshots(limit, offset), stats: screenshotsService.getStats() } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

screenshotsRouter.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  res.json({ success: true, data: screenshotsService.search(q) });
});

screenshotsRouter.get('/system/:name', (req: Request, res: Response) => {
  res.json({ success: true, data: screenshotsService.getScreenshotsBySystem(req.params.name) });
});

screenshotsRouter.post('/scan', async (_req: Request, res: Response) => {
  try {
    const count = await screenshotsService.scanDirectory();
    res.json({ success: true, data: { scanned: count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
