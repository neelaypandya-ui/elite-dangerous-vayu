/**
 * Music player service.
 * YouTube search integration, queue management, and playback controls.
 */

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  url: string;
}

interface PlaybackState {
  playing: boolean;
  currentTrack: MusicTrack | null;
  position: number;
  volume: number;
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
}

class MusicService {
  private queue: MusicTrack[] = [];
  private history: MusicTrack[] = [];
  private playbackState: PlaybackState = {
    playing: false,
    currentTrack: null,
    position: 0,
    volume: 80,
    repeat: 'none',
    shuffle: false,
  };

  async search(query: string): Promise<MusicTrack[]> {
    // YouTube search via yt-dlp (if available)
    try {
      const { execSync } = await import('child_process');
      const output = execSync(
        `yt-dlp --dump-json --flat-playlist --no-download "ytsearch5:${query.replace(/"/g, '\\"')}"`,
        { timeout: 15000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      );

      const results: MusicTrack[] = [];
      for (const line of output.trim().split('\n')) {
        try {
          const data = JSON.parse(line);
          results.push({
            id: data.id || '',
            title: data.title || 'Unknown',
            artist: data.uploader || data.channel || 'Unknown',
            duration: data.duration_string || this.formatDuration(data.duration || 0),
            thumbnail: data.thumbnail || '',
            url: `https://www.youtube.com/watch?v=${data.id}`,
          });
        } catch { /* skip malformed lines */ }
      }
      return results;
    } catch {
      console.warn('[Music] yt-dlp not available or search failed');
      return [];
    }
  }

  addToQueue(track: MusicTrack): void {
    this.queue.push(track);
    if (!this.playbackState.currentTrack) {
      this.next();
    }
  }

  removeFromQueue(index: number): boolean {
    if (index < 0 || index >= this.queue.length) return false;
    this.queue.splice(index, 1);
    return true;
  }

  clearQueue(): void {
    this.queue = [];
  }

  play(): void {
    if (!this.playbackState.currentTrack && this.queue.length > 0) {
      this.next();
    }
    this.playbackState.playing = true;
  }

  pause(): void {
    this.playbackState.playing = false;
  }

  next(): MusicTrack | null {
    if (this.playbackState.currentTrack) {
      this.history.push(this.playbackState.currentTrack);
      if (this.history.length > 100) this.history.shift();
    }

    if (this.queue.length === 0) {
      this.playbackState.currentTrack = null;
      this.playbackState.playing = false;
      return null;
    }

    const idx = this.playbackState.shuffle ? Math.floor(Math.random() * this.queue.length) : 0;
    const track = this.queue.splice(idx, 1)[0];

    if (this.playbackState.repeat === 'one' && this.playbackState.currentTrack) {
      this.queue.unshift(track);
      // Keep playing current
    } else if (this.playbackState.repeat === 'all' && this.playbackState.currentTrack) {
      this.queue.push(this.playbackState.currentTrack);
    }

    this.playbackState.currentTrack = track;
    this.playbackState.position = 0;
    this.playbackState.playing = true;
    return track;
  }

  previous(): MusicTrack | null {
    if (this.history.length === 0) return null;
    if (this.playbackState.currentTrack) {
      this.queue.unshift(this.playbackState.currentTrack);
    }
    const track = this.history.pop()!;
    this.playbackState.currentTrack = track;
    this.playbackState.position = 0;
    this.playbackState.playing = true;
    return track;
  }

  setVolume(volume: number): void {
    this.playbackState.volume = Math.max(0, Math.min(100, volume));
  }

  setRepeat(mode: 'none' | 'one' | 'all'): void {
    this.playbackState.repeat = mode;
  }

  setShuffle(enabled: boolean): void {
    this.playbackState.shuffle = enabled;
  }

  getState(): object {
    return {
      ...this.playbackState,
      queue: this.queue,
      queueLength: this.queue.length,
      historyLength: this.history.length,
    };
  }

  getQueue(): MusicTrack[] { return [...this.queue]; }
  getHistory(): MusicTrack[] { return [...this.history].reverse(); }

  private formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

export const musicService = new MusicService();
