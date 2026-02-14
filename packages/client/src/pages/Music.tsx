import { useEffect, useState, useRef, useCallback } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';
import HoloProgress from '../components/common/HoloProgress';

export default function Music() {
  const { data, loading, fetch: load } = useApi<any>('/music');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [position, setPosition] = useState(0);
  const [streamLoading, setStreamLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  const np = data?.currentTrack;
  const isPlaying = data?.playing ?? false;

  // Compute the stream URL declaratively
  const streamUrl = np?.id ? `/api/music/stream/${np.id}` : '';

  // Sync volume from server state
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = (data?.volume ?? 80) / 100;
  }, [data?.volume]);

  // Reset position when track changes
  useEffect(() => {
    setPosition(0);
    setStreamLoading(!!np?.id);
  }, [np?.id]);

  const handleCanPlay = useCallback(() => {
    setStreamLoading(false);
  }, []);

  // -----------------------------------------------------------------------
  // Commands
  // -----------------------------------------------------------------------

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await apiFetch<any[]>(`/music/search?q=${encodeURIComponent(search)}`);
      setResults(Array.isArray(res) ? res : []);
    } finally { setSearching(false); }
  };

  const cmd = async (action: string, body?: any) => {
    await apiFetch(`/music/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    await load();
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio?.pause();
      cmd('pause');
    } else {
      audio?.play().catch(() => {});
      cmd('play');
    }
  };

  const handleVolume = (vol: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = vol / 100;
    cmd('volume', { volume: vol });
  };

  const handleNext = () => {
    audioRef.current?.pause();
    cmd('next');
  };

  const handlePrev = () => {
    audioRef.current?.pause();
    cmd('previous');
  };

  const handleEnded = () => {
    cmd('next');
  };

  // Cycle repeat mode: none -> all -> one -> none
  const cycleRepeat = () => {
    const next = data?.repeat === 'none' ? 'all' : data?.repeat === 'all' ? 'one' : 'none';
    cmd('repeat', { mode: next });
  };

  const toggleShuffle = () => {
    cmd('shuffle', { enabled: !data?.shuffle });
  };

  const repeatLabel = data?.repeat === 'one' ? 'Repeat 1' : data?.repeat === 'all' ? 'Repeat All' : 'Repeat';

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>MUSIC</h1>
      {loading && !data && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}

      {/* Audio element — src set declaratively from current track */}
      {streamUrl && (
        <audio
          key={np?.id}
          ref={audioRef}
          src={streamUrl}
          autoPlay
          onCanPlay={handleCanPlay}
          onTimeUpdate={() => {
            if (audioRef.current) setPosition(audioRef.current.currentTime);
          }}
          onEnded={handleEnded}
          onError={() => setStreamLoading(false)}
          preload="auto"
          controls
          style={{ width: '100%', marginBottom: 16 }}
        />
      )}

      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Now Playing">
          {np ? (
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 4 }}>{np.title}</div>
              {np.artist && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>{np.artist}</div>}
              {np.duration && (
                <HoloProgress
                  value={position}
                  max={parseDuration(np.duration)}
                  label={`${formatTime(position)} / ${np.duration}`}
                />
              )}
              {streamLoading && (
                <div style={{ fontSize: 11, color: 'var(--color-accent)', fontFamily: 'var(--font-display)', textAlign: 'center', marginTop: 6, letterSpacing: 1 }}>
                  BUFFERING...
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                <HoloButton onClick={handlePrev}>Prev</HoloButton>
                <HoloButton onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</HoloButton>
                <HoloButton onClick={handleNext}>Next</HoloButton>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Vol</span>
                <input type="range" min={0} max={100} value={data.volume ?? 80} onChange={(e) => handleVolume(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 30 }}>{data.volume ?? 80}%</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                <HoloButton onClick={cycleRepeat} style={{ opacity: data.repeat !== 'none' ? 1 : 0.5 }}>{repeatLabel}</HoloButton>
                <HoloButton onClick={toggleShuffle} style={{ opacity: data.shuffle ? 1 : 0.5 }}>Shuffle</HoloButton>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>Nothing playing. Search for a track to begin.</p>
          )}
        </HoloPanel>
        <HoloPanel title="Search">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Search for music..."
              style={{ flex: 1, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: '#fff', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)' }}
            />
            <HoloButton onClick={doSearch} disabled={searching}>{searching ? '...' : 'Search'}</HoloButton>
          </div>
          {results.map((r: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: 13 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.artist || r.channel} {r.duration ? `\u2022 ${r.duration}` : ''}</div>
              </div>
              <HoloButton onClick={() => cmd('queue', { track: { id: r.id, title: r.title, artist: r.artist, duration: r.duration, thumbnail: r.thumbnail, url: r.url } })}>+</HoloButton>
            </div>
          ))}
        </HoloPanel>
      </div>
      <HoloPanel title="Queue">
        {data?.queue?.length > 0 ? (
          <>
            {data.queue.map((q: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', marginRight: 8 }}>{i + 1}.</span>
                  {q.title}
                  {q.artist && <span style={{ color: 'var(--color-text-muted)' }}> — {q.artist}</span>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{q.duration || ''}</span>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <HoloButton onClick={() => cmd('queue/clear')}>Clear Queue</HoloButton>
            </div>
          </>
        ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Queue empty</p>}
      </HoloPanel>
    </div>
  );
}

/** Parse "M:SS" or "H:MM:SS" duration string to seconds. */
function parseDuration(dur: string | number): number {
  if (typeof dur === 'number') return dur;
  const parts = dur.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(dur) || 0;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
