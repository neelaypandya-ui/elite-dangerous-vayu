/**
 * COVAS REST API router.
 */

import { Router, type Request, type Response } from 'express';
import { covasPipeline } from './covas-pipeline.js';
import { pttManager } from './ptt-manager.js';
import { commandExecutor } from './command-executor.js';
import { getTTSService } from './tts-service.js';

export const covasRouter = Router();

/** POST /api/covas/text — Process text command. */
covasRouter.post('/text', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'Missing text field' });
      return;
    }
    const result = await covasPipeline.processTextInput(text.trim());
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

/** POST /api/covas/audio — Process audio buffer (expects application/octet-stream). */
covasRouter.post('/audio', async (req: Request, res: Response) => {
  try {
    // express.raw() middleware parses application/octet-stream into req.body as a Buffer
    const audioBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');

    if (audioBuffer.length === 0) {
      res.status(400).json({ success: false, error: 'Empty audio data. Send Content-Type: application/octet-stream with raw audio bytes.' });
      return;
    }

    // Detect audio format from the X-Audio-Format header, or from query param, or default to webm (browser default)
    const formatHeader = (req.headers['x-audio-format'] as string) || (req.query.format as string) || 'webm';
    const format = formatHeader.replace(/[^a-z0-9]/g, '') || 'webm';

    console.log(`[COVAS] Audio received: ${audioBuffer.length} bytes, format=${format}`);
    const result = await covasPipeline.processAudio(audioBuffer, format);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[COVAS] Audio processing error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

/** GET /api/covas/state — Get current COVAS state. */
covasRouter.get('/state', (_req: Request, res: Response) => {
  try {
    const tts = getTTSService();
    res.json({
      success: true,
      data: {
        stage: covasPipeline.getStage(),
        enabled: covasPipeline.isEnabled(),
        ptt: pttManager.getState(),
        availableCommands: commandExecutor.getAvailableCommands(),
        ttsProvider: (tts as any).constructor?.name === 'FallbackTTS' ? 'none' : (tts as any).constructor?.name === 'ElevenLabsTTS' ? 'elevenlabs' : 'piper',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

/** POST /api/covas/enable — Enable/disable COVAS. */
covasRouter.post('/enable', (req: Request, res: Response) => {
  const { enabled } = req.body;
  covasPipeline.setEnabled(!!enabled);
  res.json({ success: true, data: { enabled: covasPipeline.isEnabled() } });
});

/** POST /api/covas/ptt — Toggle push-to-talk. */
covasRouter.post('/ptt', (req: Request, res: Response) => {
  const { action } = req.body;
  if (action === 'start') pttManager.start();
  else if (action === 'stop') pttManager.stop();
  else pttManager.toggle();
  res.json({ success: true, data: { ptt: pttManager.getState() } });
});

/** POST /api/covas/clear — Clear conversation history. */
covasRouter.post('/clear', (_req: Request, res: Response) => {
  covasPipeline.clearConversation();
  res.json({ success: true });
});
