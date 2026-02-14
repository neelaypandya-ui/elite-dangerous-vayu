import { Router, type Request, type Response } from 'express';
import { tradeService } from './trade.service.js';

export const tradeRouter = Router();

tradeRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: tradeService.getTradeStats() });
});

tradeRouter.get('/sessions', (_req: Request, res: Response) => {
  res.json({ success: true, data: tradeService.getSessions() });
});

tradeRouter.get('/current', (_req: Request, res: Response) => {
  res.json({ success: true, data: tradeService.getCurrentSession() });
});

tradeRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const commodity = (req.query.commodity as string) || '';
    const prices = await tradeService.searchCommodityPrices(commodity);
    res.json({ success: true, data: { commodity, prices } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});
