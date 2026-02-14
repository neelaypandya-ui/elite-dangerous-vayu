import { Router, type Request, type Response } from 'express';
import { galnetService } from './galnet.service.js';

export const galnetRouter = Router();

galnetRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const articles = await galnetService.getArticles(limit);
    res.json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

galnetRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const article = await galnetService.getArticle(req.params.id);
    if (!article) { res.status(404).json({ success: false, error: 'Article not found' }); return; }
    res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

galnetRouter.post('/refresh', async (_req: Request, res: Response) => {
  try {
    const count = await galnetService.refresh();
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
