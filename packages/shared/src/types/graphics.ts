/**
 * @vayu/shared — Graphics Profile Types
 *
 * Types for Elite Dangerous graphics configuration as parsed from
 * the GraphicsConfigurationOverride.xml and DisplaySettings.xml files.
 */

// ---------------------------------------------------------------------------
// Display Mode
// ---------------------------------------------------------------------------

/** Display mode options. */
export type DisplayMode = 'Fullscreen' | 'Borderless' | 'Windowed';

// ---------------------------------------------------------------------------
// Quality Presets
// ---------------------------------------------------------------------------

/** Named quality presets. */
export type QualityPreset = 'Low' | 'Medium' | 'High' | 'Ultra' | 'Custom';

// ---------------------------------------------------------------------------
// Individual Graphics Settings
// ---------------------------------------------------------------------------

/** Anti-aliasing mode. */
export type AntiAliasingMode = 'None' | 'FXAA' | 'SMAA' | 'MSAA_2x' | 'MSAA_4x' | 'MSAA_8x';

/** Texture quality level. */
export type TextureQuality = 'Low' | 'Medium' | 'High' | 'Ultra';

/** Shadow quality level. */
export type ShadowQuality = 'Off' | 'Low' | 'Medium' | 'High' | 'Ultra';

/** Ambient occlusion mode. */
export type AmbientOcclusionMode = 'Off' | 'Low' | 'Medium' | 'High';

/** Bloom quality. */
export type BloomQuality = 'Off' | 'Low' | 'Medium' | 'High' | 'Ultra';

/** A single graphics setting with its key and current value. */
export interface GraphicsSetting {
  /** Setting identifier. */
  key: string;
  /** Current value (type varies by setting). */
  value: string | number | boolean;
  /** Available options (if enumerable). */
  options?: (string | number | boolean)[];
  /** Human-readable label. */
  label: string;
  /** Which category this setting belongs to. */
  category: 'display' | 'quality' | 'effects' | 'hud' | 'performance';
}

// ---------------------------------------------------------------------------
// HUD Colors
// ---------------------------------------------------------------------------

/** HUD colour matrix (3x3 transformation applied to the orange base HUD). */
export interface HUDColorMatrix {
  /** Red channel row [r, g, b]. */
  matrixRed: [number, number, number];
  /** Green channel row [r, g, b]. */
  matrixGreen: [number, number, number];
  /** Blue channel row [r, g, b]. */
  matrixBlue: [number, number, number];
}

// ---------------------------------------------------------------------------
// Graphics Profile
// ---------------------------------------------------------------------------

/** Complete graphics configuration state. */
export interface GraphicsProfile {
  /** Active quality preset (Custom if any setting is overridden). */
  preset: QualityPreset;

  // Display
  /** Display mode. */
  displayMode: DisplayMode;
  /** Horizontal resolution. */
  resolutionWidth: number;
  /** Vertical resolution. */
  resolutionHeight: number;
  /** Monitor index. */
  monitor: number;
  /** Vertical sync enabled. */
  vsync: boolean;
  /** Frame rate limit (0 = unlimited). */
  frameRateLimit: number;
  /** Field of view in degrees. */
  fov: number;
  /** Gamma correction value. */
  gamma: number;

  // Quality
  /** Anti-aliasing mode. */
  antiAliasing: AntiAliasingMode;
  /** Texture quality. */
  textureQuality: TextureQuality;
  /** Shadow quality. */
  shadowQuality: ShadowQuality;
  /** Ambient occlusion. */
  ambientOcclusion: AmbientOcclusionMode;
  /** Bloom effect. */
  bloom: BloomQuality;
  /** Depth of field enabled. */
  depthOfField: boolean;
  /** Blur effect quality. */
  blur: 'Off' | 'Low' | 'Medium' | 'High';
  /** Terrain quality level. */
  terrainQuality: 'Low' | 'Medium' | 'High' | 'Ultra';
  /** Terrain work detail. */
  terrainSampling: 'Low' | 'Medium' | 'High' | 'Ultra';
  /** Galaxy background quality. */
  galaxyBackground: 'Low' | 'Medium' | 'High' | 'Ultra';
  /** Material quality. */
  materialQuality: 'Low' | 'Medium' | 'High' | 'Ultra';
  /** Environment quality for surface features. */
  environmentQuality: 'Low' | 'Medium' | 'High' | 'Ultra';
  /** Supersampling multiplier (1.0 = native). */
  superSampling: number;
  /** Reflection quality. */
  reflections: 'Off' | 'Low' | 'Medium' | 'High';
  /** Particle effects quality. */
  particleEffects: 'Low' | 'Medium' | 'High' | 'Ultra';

  // HUD
  /** Custom HUD colour matrix (null if default). */
  hudColorMatrix: HUDColorMatrix | null;

  // Performance
  /** Whether to stream textures on demand. */
  textureStreaming: boolean;
  /** Whether the GPU is in low-power mode. */
  gpuLowPowerMode: boolean;

  /** All raw settings for pass-through. */
  rawSettings: Record<string, string | number | boolean>;
}
