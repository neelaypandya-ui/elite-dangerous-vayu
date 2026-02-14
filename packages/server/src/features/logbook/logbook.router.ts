import { Router, type Request, type Response } from 'express';
import { logbookService } from './logbook.service.js';

export const logbookRouter = Router();

logbookRouter.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  res.json({ success: true, data: { entries: logbookService.getEntries(limit, offset), stats: logbookService.getStats() } });
});

logbookRouter.post('/', (req: Request, res: Response) => {
  const { content, source, tags } = req.body;
  if (!content) { res.status(400).json({ success: false, error: 'Missing content' }); return; }
  const entry = logbookService.addEntry(content, source || 'text', tags || []);
  res.json({ success: true, data: entry });
});

logbookRouter.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  res.json({ success: true, data: logbookService.searchEntries(q) });
});

logbookRouter.get('/system/:name', (req: Request, res: Response) => {
  res.json({ success: true, data: logbookService.getEntriesBySystem(req.params.name) });
});

logbookRouter.get('/:id', (req: Request, res: Response) => {
  const entry = logbookService.getEntry(req.params.id);
  if (!entry) { res.status(404).json({ success: false, error: 'Entry not found' }); return; }
  res.json({ success: true, data: entry });
});

logbookRouter.put('/:id', (req: Request, res: Response) => {
  const { content, tags } = req.body;
  const entry = logbookService.updateEntry(req.params.id, content, tags);
  if (!entry) { res.status(404).json({ success: false, error: 'Entry not found' }); return; }
  res.json({ success: true, data: entry });
});

logbookRouter.delete('/:id', (req: Request, res: Response) => {
  if (logbookService.deleteEntry(req.params.id)) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Entry not found' });
  }
});
