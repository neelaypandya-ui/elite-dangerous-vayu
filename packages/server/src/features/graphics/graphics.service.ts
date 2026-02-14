/**
 * Graphics profile manager service.
 * Reads/writes GraphicsConfigurationOverride.xml for HUD color and quality profiles.
 */

import { config } from '../../config.js';
import * as fs from 'fs';
import * as path from 'path';

interface GraphicsProfile {
  name: string;
  description: string;
  hudMatrix: {
    matrixRed: [number, number, number];
    matrixGreen: [number, number, number];
    matrixBlue: [number, number, number];
  };
  fov: number | null;
}

const PRESET_PROFILES: GraphicsProfile[] = [
  {
    name: 'Default Orange',
    description: 'Stock Elite Dangerous HUD',
    hudMatrix: { matrixRed: [1, 0, 0], matrixGreen: [0, 1, 0], matrixBlue: [0, 0, 1] },
    fov: null,
  },
  {
    name: 'VAYU Green',
    description: 'Forest green theme matching VAYU dashboard',
    hudMatrix: { matrixRed: [0.3, 0.6, 0], matrixGreen: [0, 1, 0], matrixBlue: [0, 0.2, 0.8] },
    fov: null,
  },
  {
    name: 'Midnight Blue',
    description: 'Deep blue tactical display',
    hudMatrix: { matrixRed: [0, 0.2, 1], matrixGreen: [0, 0.6, 0.4], matrixBlue: [0.5, 0, 1] },
    fov: null,
  },
  {
    name: 'Imperial White',
    description: 'Clean white and gold imperial aesthetic',
    hudMatrix: { matrixRed: [1, 1, 1], matrixGreen: [1, 0.8, 0], matrixBlue: [0.5, 0.5, 1] },
    fov: null,
  },
];

class GraphicsService {
  private profiles: GraphicsProfile[] = [...PRESET_PROFILES];
  private activeProfile: string = 'Default Orange';

  getProfiles(): GraphicsProfile[] {
    return this.profiles;
  }

  getActiveProfile(): string {
    return this.activeProfile;
  }

  getOverridePath(): string {
    return config.paths.graphicsOverride;
  }

  readCurrentOverride(): string | null {
    try {
      const filePath = config.paths.graphicsOverride;
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }

  applyProfile(profileName: string): { success: boolean; error?: string } {
    const profile = this.profiles.find((p) => p.name === profileName);
    if (!profile) return { success: false, error: `Profile "${profileName}" not found` };

    const xml = this.generateOverrideXml(profile);
    try {
      const filePath = config.paths.graphicsOverride;
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, xml, 'utf-8');
      this.activeProfile = profileName;
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: msg };
    }
  }

  addCustomProfile(profile: GraphicsProfile): void {
    const existing = this.profiles.findIndex((p) => p.name === profile.name);
    if (existing >= 0) this.profiles[existing] = profile;
    else this.profiles.push(profile);
  }

  private generateOverrideXml(profile: GraphicsProfile): string {
    const { matrixRed, matrixGreen, matrixBlue } = profile.hudMatrix;
    return `<?xml version="1.0" encoding="UTF-8" ?>
<GraphicsConfig>
  <GUIColour>
    <Default>
      <LocalisationName>Standard</LocalisationName>
      <MatrixRed>${matrixRed[0]}, ${matrixRed[1]}, ${matrixRed[2]}</MatrixRed>
      <MatrixGreen>${matrixGreen[0]}, ${matrixGreen[1]}, ${matrixGreen[2]}</MatrixGreen>
      <MatrixBlue>${matrixBlue[0]}, ${matrixBlue[1]}, ${matrixBlue[2]}</MatrixBlue>
    </Default>
  </GUIColour>${profile.fov ? `\n  <FOV>${profile.fov}</FOV>` : ''}
</GraphicsConfig>`;
  }
}

export const graphicsService = new GraphicsService();
