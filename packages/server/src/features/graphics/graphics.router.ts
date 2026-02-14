import { Router, type Request, type Response } from 'express';
import { graphicsService } from './graphics.service.js';

export const graphicsRouter = Router();

graphicsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      profiles: graphicsService.getProfiles(),
      activeProfile: graphicsService.getActiveProfile(),
      overridePath: graphicsService.getOverridePath(),
    },
  });
});

graphicsRouter.get('/current', (_req: Request, res: Response) => {
  const xml = graphicsService.readCurrentOverride();
  res.json({ success: true, data: { xml, activeProfile: graphicsService.getActiveProfile() } });
});

graphicsRouter.post('/apply', (req: Request, res: Response) => {
  const { profileName } = req.body;
  if (!profileName) {
    res.status(400).json({ success: false, error: 'Missing profileName' });
    return;
  }
  const result = graphicsService.applyProfile(profileName);
  if (result.success) res.json({ success: true, data: { applied: profileName } });
  else res.status(400).json({ success: false, error: result.error });
});

graphicsRouter.post('/profiles', (req: Request, res: Response) => {
  const { name, description, hudMatrix, fov } = req.body;
  if (!name || !hudMatrix) {
    res.status(400).json({ success: false, error: 'Missing name or hudMatrix' });
    return;
  }
  graphicsService.addCustomProfile({ name, description: description || '', hudMatrix, fov: fov || null });
  res.json({ success: true, data: { profiles: graphicsService.getProfiles() } });
});
