/**
 * Audio profile manager service.
 * Manages audio output settings and volume profiles.
 */

interface AudioProfile {
  name: string;
  description: string;
  masterVolume: number;
  gameVolume: number;
  voiceVolume: number;
  musicVolume: number;
  ttsVolume: number;
}

const DEFAULT_PROFILES: AudioProfile[] = [
  { name: 'Default', description: 'Balanced audio levels', masterVolume: 80, gameVolume: 70, voiceVolume: 90, musicVolume: 50, ttsVolume: 85 },
  { name: 'Combat', description: 'Loud game audio, reduced music', masterVolume: 90, gameVolume: 90, voiceVolume: 100, musicVolume: 20, ttsVolume: 95 },
  { name: 'Exploration', description: 'Relaxed levels with ambient music', masterVolume: 70, gameVolume: 50, voiceVolume: 80, musicVolume: 80, ttsVolume: 75 },
  { name: 'Streaming', description: 'Balanced for capture', masterVolume: 75, gameVolume: 65, voiceVolume: 85, musicVolume: 40, ttsVolume: 80 },
];

class AudioService {
  private profiles: AudioProfile[] = [...DEFAULT_PROFILES];
  private activeProfile = 'Default';

  getProfiles(): AudioProfile[] {
    return this.profiles;
  }

  getActiveProfile(): string {
    return this.activeProfile;
  }

  setActiveProfile(name: string): boolean {
    if (!this.profiles.find((p) => p.name === name)) return false;
    this.activeProfile = name;
    return true;
  }

  getProfile(name: string): AudioProfile | null {
    return this.profiles.find((p) => p.name === name) ?? null;
  }

  addProfile(profile: AudioProfile): void {
    const existing = this.profiles.findIndex((p) => p.name === profile.name);
    if (existing >= 0) this.profiles[existing] = profile;
    else this.profiles.push(profile);
  }

  deleteProfile(name: string): boolean {
    const idx = this.profiles.findIndex((p) => p.name === name);
    if (idx < 0 || name === 'Default') return false;
    this.profiles.splice(idx, 1);
    if (this.activeProfile === name) this.activeProfile = 'Default';
    return true;
  }
}

export const audioService = new AudioService();
