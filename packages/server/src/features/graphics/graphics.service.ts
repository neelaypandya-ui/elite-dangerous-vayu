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

export interface QualitySettings {
  shadows: 'Off' | 'Low' | 'Medium' | 'High' | 'Ultra';
  ambientOcclusion: 'Off' | 'Low' | 'Medium' | 'High';
  bloom: 'Off' | 'Medium' | 'High' | 'Ultra';
  fx: 'Off' | 'Low' | 'Medium' | 'High';
  materials: 'Low' | 'Medium' | 'High' | 'Ultra';
  environment: 'Low' | 'Medium' | 'High' | 'Ultra';
  galaxyMap: 'Low' | 'Medium' | 'High';
}

export interface QualityPresetDef {
  name: string;
  description: string;
  settings: QualitySettings;
}

const QUALITY_PRESETS: QualityPresetDef[] = [
  {
    name: 'Combat',
    description: 'Max FPS for CZs, AXCZs, and PvP',
    settings: {
      shadows: 'Off',
      ambientOcclusion: 'Off',
      bloom: 'Off',
      fx: 'Low',
      materials: 'Low',
      environment: 'Low',
      galaxyMap: 'Low',
    },
  },
  {
    name: 'Cruise',
    description: 'Balanced defaults for normal flight',
    settings: {
      shadows: 'Medium',
      ambientOcclusion: 'Low',
      bloom: 'Medium',
      fx: 'Medium',
      materials: 'Medium',
      environment: 'Medium',
      galaxyMap: 'Medium',
    },
  },
  {
    name: 'Exploration',
    description: 'Max quality for screenshots and sightseeing',
    settings: {
      shadows: 'Ultra',
      ambientOcclusion: 'High',
      bloom: 'Ultra',
      fx: 'High',
      materials: 'Ultra',
      environment: 'Ultra',
      galaxyMap: 'High',
    },
  },
];

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
  private activeQualityPreset: string = 'Cruise';

  getProfiles(): GraphicsProfile[] {
    return this.profiles;
  }

  getActiveProfile(): string {
    return this.activeProfile;
  }

  getOverridePath(): string {
    return config.paths.graphicsOverride;
  }

  getQualityPresets(): QualityPresetDef[] {
    return QUALITY_PRESETS;
  }

  getActiveQualityPreset(): string {
    return this.activeQualityPreset;
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

    this.activeProfile = profileName;
    return this.writeOverrideXml(profile);
  }

  applyQualityPreset(presetName: string): { success: boolean; error?: string } {
    const preset = QUALITY_PRESETS.find((p) => p.name === presetName);
    if (!preset) return { success: false, error: `Quality preset "${presetName}" not found` };

    this.activeQualityPreset = presetName;
    const activeHudProfile = this.profiles.find((p) => p.name === this.activeProfile) ?? PRESET_PROFILES[0];
    return this.writeOverrideXml(activeHudProfile);
  }

  addCustomProfile(profile: GraphicsProfile): void {
    const existing = this.profiles.findIndex((p) => p.name === profile.name);
    if (existing >= 0) this.profiles[existing] = profile;
    else this.profiles.push(profile);
  }

  private writeOverrideXml(profile: GraphicsProfile): { success: boolean; error?: string } {
    const qualityPreset = QUALITY_PRESETS.find((p) => p.name === this.activeQualityPreset);
    const xml = this.generateOverrideXml(profile, qualityPreset?.settings ?? null);
    try {
      const filePath = config.paths.graphicsOverride;
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, xml, 'utf-8');
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: msg };
    }
  }

  private generateOverrideXml(profile: GraphicsProfile, quality: QualitySettings | null): string {
    const { matrixRed, matrixGreen, matrixBlue } = profile.hudMatrix;
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<GraphicsConfig>
  <GUIColour>
    <Default>
      <LocalisationName>Standard</LocalisationName>
      <MatrixRed>${matrixRed[0]}, ${matrixRed[1]}, ${matrixRed[2]}</MatrixRed>
      <MatrixGreen>${matrixGreen[0]}, ${matrixGreen[1]}, ${matrixGreen[2]}</MatrixGreen>
      <MatrixBlue>${matrixBlue[0]}, ${matrixBlue[1]}, ${matrixBlue[2]}</MatrixBlue>
    </Default>
  </GUIColour>`;

    if (quality) {
      xml += `\n  <Shadows>${quality.shadows}</Shadows>`;
      xml += `\n  <AmbientOcclusion>${quality.ambientOcclusion}</AmbientOcclusion>`;
      xml += `\n  <Bloom>${quality.bloom}</Bloom>`;
      xml += `\n  <FXQuality>${quality.fx}</FXQuality>`;
      xml += `\n  <MaterialQuality>${quality.materials}</MaterialQuality>`;
      xml += `\n  <EnvironmentQuality>${quality.environment}</EnvironmentQuality>`;
      xml += `\n  <GalaxyMapQuality>${quality.galaxyMap}</GalaxyMapQuality>`;
    }

    if (profile.fov) {
      xml += `\n  <FOV>${profile.fov}</FOV>`;
    }

    xml += '\n</GraphicsConfig>';
    return xml;
  }
}

export const graphicsService = new GraphicsService();
