import { Router, type Request, type Response } from 'express';
import { archiverService } from './archiver.service.js';

export const archiverRouter = Router();

archiverRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: archiverService.getStatus() });
});

archiverRouter.get('/scan', async (_req: Request, res: Response) => {
  try {
    const result = await archiverService.scanJournals();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

archiverRouter.post('/backup', async (_req: Request, res: Response) => {
  try {
    const result = await archiverService.runBackup();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

archiverRouter.get('/history', (_req: Request, res: Response) => {
  res.json({ success: true, data: archiverService.getBackupHistory() });
});
