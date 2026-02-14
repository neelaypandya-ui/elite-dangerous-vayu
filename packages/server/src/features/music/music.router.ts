import { Router, type Request, type Response } from 'express';
import { Readable } from 'stream';
import { musicService } from './music.service.js';

export const musicRouter = Router();

musicRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q) { res.status(400).json({ success: false, error: 'Missing query parameter q' }); return; }
    const results = await musicService.search(q);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ---------------------------------------------------------------------------
// Audio stream proxy — resolves YouTube audio URL via yt-dlp then proxies the
// CDN response so the browser <audio> element can play it.
// ---------------------------------------------------------------------------

musicRouter.get('/stream/:id', async (req: Request, res: Response) => {
  const id = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) {
    res.status(400).json({ success: false, error: 'Invalid video ID' });
    return;
  }

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Resolve direct audio stream URL
    const { stdout } = await execAsync(
      `yt-dlp -f bestaudio --get-url "https://www.youtube.com/watch?v=${id}"`,
      { timeout: 15000 },
    );
    const audioUrl = stdout.trim();
    if (!audioUrl) throw new Error('No audio URL resolved');

    // Proxy the CDN stream (preserves Content-Type, Content-Length, avoids CORS)
    const upstream = await fetch(audioUrl, { signal: AbortSignal.timeout(15000) });
    if (!upstream.ok || !upstream.body) {
      res.status(502).json({ success: false, error: 'Upstream audio fetch failed' });
      return;
    }

    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    const cl = upstream.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);
    res.setHeader('Accept-Ranges', 'none');
    res.setHeader('Cache-Control', 'no-store');

    const nodeStream = Readable.fromWeb(upstream.body as any);
    nodeStream.on('error', (err) => {
      // Suppress expected errors when client disconnects mid-stream
      if (!res.writableEnded) res.end();
    });
    nodeStream.pipe(res);

    req.on('close', () => {
      nodeStream.destroy();
    });
  } catch (err) {
    console.error('[Music] Stream error:', err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to stream audio' });
    }
  }
});

musicRouter.post('/queue', (req: Request, res: Response) => {
  const { track } = req.body;
  if (!track || !track.id) { res.status(400).json({ success: false, error: 'Missing track data' }); return; }
  musicService.addToQueue(track);
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.delete('/queue/:index', (req: Request, res: Response) => {
  const idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0) { res.status(400).json({ success: false, error: 'Invalid queue index — must be a non-negative integer' }); return; }
  if (musicService.removeFromQueue(idx)) {
    res.json({ success: true, data: musicService.getState() });
  } else {
    res.status(400).json({ success: false, error: 'Invalid queue index' });
  }
});

musicRouter.post('/queue/clear', (_req: Request, res: Response) => {
  musicService.clearQueue();
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.post('/play', (_req: Request, res: Response) => {
  musicService.play();
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.post('/pause', (_req: Request, res: Response) => {
  musicService.pause();
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.post('/next', (_req: Request, res: Response) => {
  musicService.next();
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.post('/previous', (_req: Request, res: Response) => {
  musicService.previous();
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.post('/volume', (req: Request, res: Response) => {
  const { volume } = req.body;
  const vol = typeof volume === 'number' ? volume : 80;
  musicService.setVolume(Math.max(0, Math.min(100, vol)));
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.post('/repeat', (req: Request, res: Response) => {
  const { mode } = req.body;
  musicService.setRepeat(mode || 'none');
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.post('/shuffle', (req: Request, res: Response) => {
  const { enabled } = req.body;
  musicService.setShuffle(!!enabled);
  res.json({ success: true, data: musicService.getState() });
});

musicRouter.get('/queue', (_req: Request, res: Response) => {
  res.json({ success: true, data: musicService.getQueue() });
});

musicRouter.get('/history', (_req: Request, res: Response) => {
  res.json({ success: true, data: musicService.getHistory() });
});
