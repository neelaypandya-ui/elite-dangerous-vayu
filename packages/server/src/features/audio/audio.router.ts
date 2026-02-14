import { Router, type Request, type Response } from 'express';
import { audioService } from './audio.service.js';

export const audioRouter = Router();

audioRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { profiles: audioService.getProfiles(), activeProfile: audioService.getActiveProfile() },
  });
});

audioRouter.post('/apply', (req: Request, res: Response) => {
  const { profileName } = req.body;
  if (!profileName) { res.status(400).json({ success: false, error: 'Missing profileName' }); return; }
  if (audioService.setActiveProfile(profileName)) {
    res.json({ success: true, data: { applied: profileName } });
  } else {
    res.status(404).json({ success: false, error: 'Profile not found' });
  }
});

audioRouter.post('/profiles', (req: Request, res: Response) => {
  const { name, description, masterVolume, gameVolume, voiceVolume, musicVolume, ttsVolume } = req.body;
  if (!name) { res.status(400).json({ success: false, error: 'Missing name' }); return; }
  audioService.addProfile({ name, description: description || '', masterVolume: masterVolume ?? 80, gameVolume: gameVolume ?? 70, voiceVolume: voiceVolume ?? 90, musicVolume: musicVolume ?? 50, ttsVolume: ttsVolume ?? 85 });
  res.json({ success: true, data: { profiles: audioService.getProfiles() } });
});

audioRouter.delete('/profiles/:name', (req: Request, res: Response) => {
  if (audioService.deleteProfile(req.params.name)) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Cannot delete this profile' });
  }
});
