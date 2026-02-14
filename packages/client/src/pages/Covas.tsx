import { useEffect, useState, useRef, useCallback } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

/* ── LocalStorage keys for voice preferences ──────────────────── */

const LS_VOICE_NAME  = 'vayu-voice-name';
const LS_VOICE_RATE  = 'vayu-voice-rate';
const LS_VOICE_PITCH = 'vayu-voice-pitch';
const LS_TTS_MODE    = 'vayu-tts-mode'; // 'browser' | 'server' | 'off'
const LS_INPUT_DEV   = 'vayu-input-device';
const LS_OUTPUT_DEV  = 'vayu-output-device';

function loadPref(key: string, fallback: string): string {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePref(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota */ }
}

/* ── Setup Guide (collapsible) ─────────────────────────────────── */

function SetupGuide() {
  const [expanded, setExpanded] = useState(false);
  return (
    <HoloPanel title="COVAS Setup Guide">
      <div style={{ padding: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded ? 12 : 0 }}>
          <span style={{ fontSize: 15, color: 'var(--color-accent-bright)' }}>How to set up VAYU's voice assistant</span>
          <HoloButton onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : 'Expand'}</HoloButton>
        </div>
        {expanded && (
          <div style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-text-secondary)' }}>
            <p style={{ marginBottom: 16 }}>
              COVAS uses your browser's built-in speech recognition for voice input and the Claude API for intelligent responses.
              For voice output, choose between free browser voices or premium ElevenLabs TTS.
            </p>
            <div style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', padding: 16, marginBottom: 12, borderRadius: 4 }}>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 8, letterSpacing: 1 }}>
                STEP 1 — ANTHROPIC API KEY (REQUIRED)
              </div>
              <ol style={{ paddingLeft: 20, marginBottom: 8 }}>
                <li>Go to <strong style={{ color: '#fff' }}>console.anthropic.com</strong> and create an account</li>
                <li>Set <code style={{ color: 'var(--color-accent-bright)', background: 'var(--color-bg-primary)', padding: '2px 6px' }}>ANTHROPIC_API_KEY=sk-ant-your-key-here</code> in <code style={{ color: 'var(--color-accent-bright)', background: 'var(--color-bg-primary)', padding: '2px 6px' }}>.env</code></li>
                <li>Restart the VAYU server</li>
              </ol>
            </div>
            <div style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', padding: 16, marginBottom: 12, borderRadius: 4 }}>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 8, letterSpacing: 1 }}>
                STEP 2 — VOICE OUTPUT (CHOOSE ONE)
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong style={{ color: '#4E9A3E' }}>Browser Voice (Free)</strong> — Works immediately. Select a voice in the Voice Settings panel below. Windows has several built-in voices including Microsoft Mark, Zira, and David.
              </div>
              <div>
                <strong style={{ color: '#4E9A3E' }}>ElevenLabs (Premium)</strong> — Natural-sounding AI voices. Set <code style={{ color: 'var(--color-accent-bright)', background: 'var(--color-bg-primary)', padding: '2px 6px' }}>ELEVENLABS_API_KEY</code> and <code style={{ color: 'var(--color-accent-bright)', background: 'var(--color-bg-primary)', padding: '2px 6px' }}>ELEVENLABS_VOICE_ID</code> in .env. Clone your own voice or pick from the voice library.
              </div>
            </div>
          </div>
        )}
      </div>
    </HoloPanel>
  );
}

/* ── Server audio playback ────────────────────────────────────── */

function playAudioBase64(base64: string, outputDeviceId?: string, format = 'audio/mpeg'): Promise<void> {
  return new Promise((resolve, reject) => {
    const bytes = atob(base64);
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
    const blob = new Blob([buf], { type: format });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Audio playback failed')); };
    if (outputDeviceId && 'setSinkId' in audio) {
      (audio as any).setSinkId(outputDeviceId).then(() => audio.play()).catch(() => audio.play());
    } else {
      audio.play().catch(reject);
    }
  });
}

/* ── Browser TTS ──────────────────────────────────────────────── */

function speakWithBrowser(text: string, voiceName: string, rate: number, pitch: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) { reject(new Error('speechSynthesis not available')); return; }

    // Strip markdown-like formatting for cleaner speech
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, '. ')
      .trim();

    if (!clean) { resolve(); return; }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    // Find the selected voice
    const voices = window.speechSynthesis.getVoices();
    if (voiceName) {
      const match = voices.find(v => v.name === voiceName);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') resolve();
      else reject(new Error(`TTS error: ${e.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}

/* ── SpeechRecognition type shim ───────────────────────────────── */

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

function getSpeechRecognition(): SpeechRecognitionType | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/* ── Voice Preview Component ───────────────────────────────────── */

function VoicePreview({ voiceName, rate, pitch }: { voiceName: string; rate: number; pitch: number }) {
  const [playing, setPlaying] = useState(false);
  const previewText = 'CMDR, all systems nominal. Welcome back to the cockpit.';

  const play = async () => {
    setPlaying(true);
    try {
      await speakWithBrowser(previewText, voiceName, rate, pitch);
    } catch { /* ignore */ }
    setPlaying(false);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  };

  return (
    <HoloButton onClick={playing ? stop : play} disabled={!window.speechSynthesis}>
      {playing ? 'Stop Preview' : 'Preview Voice'}
    </HoloButton>
  );
}

/* ── Main Component ────────────────────────────────────────────── */

interface CovasMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  latency?: { stt?: number | null; llm?: number; tts?: number | null; total?: number };
}

export default function Covas() {
  const { data, loading, fetch: load } = useApi<any>('/covas/state');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<CovasMessage[]>([]);
  const [micError, setMicError] = useState<string | null>(null);

  // Audio device selection
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>(() => loadPref(LS_INPUT_DEV, ''));
  const [selectedOutput, setSelectedOutput] = useState<string>(() => loadPref(LS_OUTPUT_DEV, ''));

  // Voice settings
  const [ttsMode, setTtsMode] = useState<'browser' | 'server' | 'off'>(() => loadPref(LS_TTS_MODE, 'browser') as any);
  const [voiceName, setVoiceName] = useState<string>(() => loadPref(LS_VOICE_NAME, ''));
  const [voiceRate, setVoiceRate] = useState<number>(() => parseFloat(loadPref(LS_VOICE_RATE, '1.0')));
  const [voicePitch, setVoicePitch] = useState<number>(() => parseFloat(loadPref(LS_VOICE_PITCH, '1.0')));
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice state
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [micLevel, setMicLevel] = useState(0);

  // Refs
  const recognitionRef = useRef<any>(null);
  const vadStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const levelIntervalRef = useRef<number | null>(null);
  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedOutputRef = useRef(selectedOutput);
  const ttsModeRef = useRef(ttsMode);
  const voiceNameRef = useRef(voiceName);
  const voiceRateRef = useRef(voiceRate);
  const voicePitchRef = useRef(voicePitch);

  // Keep refs in sync
  useEffect(() => { selectedOutputRef.current = selectedOutput; }, [selectedOutput]);
  useEffect(() => { ttsModeRef.current = ttsMode; }, [ttsMode]);
  useEffect(() => { voiceNameRef.current = voiceName; }, [voiceName]);
  useEffect(() => { voiceRateRef.current = voiceRate; }, [voiceRate]);
  useEffect(() => { voicePitchRef.current = voicePitch; }, [voicePitch]);

  // Persist preferences
  useEffect(() => { savePref(LS_TTS_MODE, ttsMode); }, [ttsMode]);
  useEffect(() => { savePref(LS_VOICE_NAME, voiceName); }, [voiceName]);
  useEffect(() => { savePref(LS_VOICE_RATE, String(voiceRate)); }, [voiceRate]);
  useEffect(() => { savePref(LS_VOICE_PITCH, String(voicePitch)); }, [voicePitch]);
  useEffect(() => { savePref(LS_INPUT_DEV, selectedInput); }, [selectedInput]);
  useEffect(() => { savePref(LS_OUTPUT_DEV, selectedOutput); }, [selectedOutput]);

  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load available browser voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setAvailableVoices(voices);
      // Auto-select a good default if none chosen
      if (!voiceName && voices.length > 0) {
        // Prefer Microsoft Online voices (better quality), then any English voice
        const preferred = voices.find(v => v.name.includes('Microsoft') && v.name.includes('Online') && v.lang.startsWith('en'))
          || voices.find(v => v.name.includes('Microsoft') && v.lang.startsWith('en'))
          || voices.find(v => v.lang.startsWith('en'))
          || voices[0];
        if (preferred) {
          setVoiceName(preferred.name);
        }
      }
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => { window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Enumerate audio devices
  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
        const devs = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(devs.filter(d => d.kind === 'audioinput'));
        setAudioOutputs(devs.filter(d => d.kind === 'audiooutput'));
      } catch { /* permission denied */ }
    })();
  }, []);

  /* ── Speak a response (server TTS or browser TTS) ────────────── */

  const speakResponse = useCallback(async (text: string, audioBase64: string | null) => {
    const mode = ttsModeRef.current;
    if (mode === 'off') return;

    // Try server audio first (ElevenLabs/Piper)
    if (mode === 'server' && audioBase64) {
      try {
        setIsSpeaking(true);
        await playAudioBase64(audioBase64, selectedOutputRef.current);
        setIsSpeaking(false);
        return;
      } catch (err) {
        console.warn('[COVAS] Server TTS playback failed, falling back to browser:', err);
      }
    }

    // Browser TTS
    if (mode === 'browser' || (mode === 'server' && !audioBase64)) {
      try {
        setIsSpeaking(true);
        await speakWithBrowser(text, voiceNameRef.current, voiceRateRef.current, voicePitchRef.current);
      } catch (err) {
        console.warn('[COVAS] Browser TTS failed:', err);
      }
      setIsSpeaking(false);
    }
  }, []);

  /* ── Send transcript to server ─────────────────────────────── */

  const sendTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isSendingRef.current) return;
    isSendingRef.current = true;
    setSending(true);

    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);

    try {
      const res = await apiFetch<any>('/covas/text', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (res?.responseText) {
        setMessages(prev => [...prev, {
          role: 'assistant', content: res.responseText,
          timestamp: new Date().toISOString(), latency: res.latency,
        }]);
        // Speak the response
        speakResponse(res.responseText, res.audioBase64);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      isSendingRef.current = false;
      setSending(false);
    }
  }, [speakResponse]);

  /* ── Start/Stop mic level meter ─────────────────────────────── */

  const startLevelMeter = useCallback(async () => {
    try {
      const audioConstraints: MediaTrackConstraints = selectedInput
        ? { deviceId: { exact: selectedInput }, echoCancellation: true, noiseSuppression: true }
        : { echoCancellation: true, noiseSuppression: true };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      vadStreamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Float32Array(analyser.fftSize);
      levelIntervalRef.current = window.setInterval(() => {
        analyser.getFloatTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length);
        setMicLevel(Math.min(rms * 5, 1));
      }, 50);
    } catch { /* no meter, not critical */ }
  }, [selectedInput]);

  const stopLevelMeter = useCallback(() => {
    if (levelIntervalRef.current) { clearInterval(levelIntervalRef.current); levelIntervalRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (vadStreamRef.current) { vadStreamRef.current.getTracks().forEach(t => t.stop()); vadStreamRef.current = null; }
    analyserRef.current = null;
    setMicLevel(0);
  }, []);

  /* ── SpeechRecognition (always-on listening) ────────────────── */

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setMicError('Speech recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }
    if (listening) return;
    setMicError(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[COVAS] Speech recognition started');
      setListening(true);
    };

    recognition.onspeechstart = () => {
      setSpeaking(true);
    };

    recognition.onspeechend = () => {
      setSpeaking(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimText(interim);

      if (finalTranscript.trim()) {
        console.log('[COVAS] Final transcript:', finalTranscript.trim());
        setInterimText('');
        sendTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[COVAS] Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setMicError('Microphone permission denied. Allow mic access in your browser settings.');
        setListening(false);
      } else if (event.error === 'no-speech') {
        // Normal — just silence, keep listening
      } else if (event.error === 'aborted') {
        // We stopped it intentionally
      } else {
        setMicError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('[COVAS] Speech recognition ended');
      // Auto-restart if we're still supposed to be listening
      if (recognitionRef.current === recognition) {
        console.log('[COVAS] Restarting speech recognition...');
        try {
          recognition.start();
        } catch {
          // Already started or page navigated away
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      startLevelMeter();
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Failed to start speech recognition');
    }
  }, [listening, sendTranscript, startLevelMeter]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null; // Clear ref first so onend doesn't restart
      try { rec.stop(); } catch { /* already stopped */ }
    }
    stopLevelMeter();
    setListening(false);
    setSpeaking(false);
    setInterimText('');
  }, [stopLevelMeter]);

  // Cleanup on unmount
  useEffect(() => { return () => { stopListening(); window.speechSynthesis?.cancel(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart listening when device changes
  useEffect(() => {
    if (listening) {
      stopListening();
      const t = setTimeout(() => startListening(), 200);
      return () => clearTimeout(t);
    }
  }, [selectedInput]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Text Send ──────────────────────────────────────────────── */

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendTranscript(text);
  };

  const toggle = async () => {
    await apiFetch('/covas/enable', { method: 'POST', body: JSON.stringify({ enabled: !data?.enabled }) });
    await load();
  };

  const clearChat = async () => {
    await apiFetch('/covas/clear', { method: 'POST' });
    setMessages([]);
  };

  /* ── Render ─────────────────────────────────────────────────── */

  const hasSpeechAPI = !!getSpeechRecognition();
  const levelColor = speaking ? '#ff4444' : micLevel > 0.04 ? 'var(--color-accent-bright)' : 'var(--color-accent-dim)';
  const serverTTSAvailable = data?.ttsProvider && data.ttsProvider !== 'none';

  // Group voices by language for the selector
  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
  const otherVoices = availableVoices.filter(v => !v.lang.startsWith('en'));

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '6px 8px', fontSize: 13,
    background: 'var(--color-bg-tertiary)', color: '#fff',
    border: '1px solid var(--color-border)', borderRadius: 2,
    fontFamily: 'var(--font-mono)',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%', accentColor: '#4E9A3E', cursor: 'pointer',
  };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>COVAS</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Cockpit Voice Assistant — always-on voice interaction with VAYU. Powered by Claude AI with full game state context.
      </p>

      {loading && !data && <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Loading...</p>}

      <SetupGuide />

      <div className="grid-2" style={{ gap: 20, marginTop: 20 }}>
        {/* Voice Status */}
        <HoloPanel title="Voice Status">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
            Toggle the microphone for always-on voice detection. VAYU automatically listens and responds when you speak.
          </div>

          {!hasSpeechAPI && (
            <div style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid var(--color-danger)', padding: 10, borderRadius: 4, marginBottom: 12, fontSize: 13, color: 'var(--color-danger)' }}>
              Speech recognition not available. Use Chrome or Edge for voice input.
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <button
              onClick={() => listening ? stopListening() : startListening()}
              disabled={!hasSpeechAPI}
              style={{
                width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: listening
                  ? speaking ? 'rgba(255,68,68,0.3)' : 'rgba(78,154,62,0.25)'
                  : 'rgba(255,255,255,0.05)',
                border: `3px solid ${listening ? speaking ? '#ff4444' : 'var(--color-accent-bright)' : 'var(--color-border)'}`,
                cursor: hasSpeechAPI ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                color: listening ? speaking ? '#ff4444' : 'var(--color-accent-bright)' : 'var(--color-text-muted)',
                boxShadow: speaking ? '0 0 20px rgba(255,68,68,0.3)' : listening ? '0 0 15px rgba(78,154,62,0.2)' : 'none',
              }}
              title={listening ? 'Click to disable microphone' : 'Click to enable always-on microphone'}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontFamily: 'var(--font-display)', letterSpacing: 1, marginBottom: 4,
                color: listening ? speaking ? '#ff4444' : 'var(--color-accent-bright)' : 'var(--color-text-muted)' }}>
                {listening ? speaking ? 'LISTENING...' : 'MIC ACTIVE' : 'MIC OFF'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {listening
                  ? speaking ? 'Speech detected — processing your command' : 'Monitoring — speak to activate'
                  : 'Click the microphone to enable voice detection'}
              </div>
              {isSpeaking && (
                <div style={{ fontSize: 12, color: 'var(--color-accent-bright)', marginTop: 4 }}>
                  VAYU is speaking...
                </div>
              )}
            </div>
          </div>

          {/* Volume level bar */}
          {listening && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>INPUT LEVEL</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{(micLevel * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg-tertiary)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <div style={{
                  height: '100%', width: `${Math.min(micLevel * 100, 100)}%`,
                  background: levelColor, transition: 'width 0.05s linear, background 0.15s', borderRadius: 4,
                }} />
              </div>
            </div>
          )}

          {/* Interim transcript preview */}
          {interimText && (
            <div style={{
              padding: '6px 10px', marginBottom: 8, fontSize: 13, fontStyle: 'italic',
              color: 'var(--color-accent-bright)', background: 'rgba(78,154,62,0.1)',
              border: '1px solid var(--color-border)', borderRadius: 4,
            }}>
              {interimText}...
            </div>
          )}

          {/* COVAS pipeline state */}
          <div style={{ fontSize: 14, lineHeight: 1.8, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>COVAS:</span>{' '}
              <span style={{ color: data?.enabled ? '#4E9A3E' : '#ff4444', fontFamily: 'var(--font-display)', fontSize: 13 }}>
                {data?.enabled ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            {sending && <div style={{ color: 'var(--color-warning)', fontSize: 12 }}>Processing command...</div>}
            <div style={{ marginTop: 8 }}>
              <HoloButton onClick={toggle}>{data?.enabled ? 'Disable COVAS' : 'Enable COVAS'}</HoloButton>
            </div>
          </div>
        </HoloPanel>

        {/* Voice Settings */}
        <HoloPanel title="Voice Settings">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
            Configure how VAYU speaks to you. Changes are saved automatically.
          </div>

          {/* TTS Mode selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 1, marginBottom: 6 }}>
              VOICE OUTPUT MODE
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['browser', 'server', 'off'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setTtsMode(mode)}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: 13, fontFamily: 'var(--font-display)', letterSpacing: 1,
                    background: ttsMode === mode ? 'rgba(78,154,62,0.25)' : 'var(--color-bg-tertiary)',
                    border: `1px solid ${ttsMode === mode ? 'var(--color-accent-bright)' : 'var(--color-border)'}`,
                    color: ttsMode === mode ? 'var(--color-accent-bright)' : 'var(--color-text-muted)',
                    borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {mode === 'browser' ? 'BROWSER' : mode === 'server' ? 'ELEVENLABS' : 'TEXT ONLY'}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {ttsMode === 'browser' && 'Free — uses your system\'s built-in voices'}
              {ttsMode === 'server' && (serverTTSAvailable ? 'Premium — using ElevenLabs API' : 'Not configured — set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env')}
              {ttsMode === 'off' && 'Voice disabled — responses shown as text only'}
            </div>
          </div>

          {/* Browser voice settings */}
          {ttsMode === 'browser' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 1, marginBottom: 4 }}>
                  VOICE ({availableVoices.length} available)
                </div>
                <select
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  style={selectStyle}
                >
                  {englishVoices.length > 0 && (
                    <optgroup label="English">
                      {englishVoices.map(v => (
                        <option key={v.name} value={v.name}>
                          {v.name} {v.localService ? '' : '(online)'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherVoices.length > 0 && (
                    <optgroup label="Other Languages">
                      {otherVoices.map(v => (
                        <option key={v.name} value={v.name}>
                          {v.name} [{v.lang}] {v.localService ? '' : '(online)'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>SPEED</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{voiceRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2.0" step="0.1" value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  style={sliderStyle}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
                  <span>Slow</span><span>Normal</span><span>Fast</span>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>PITCH</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{voicePitch.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0.5" max="2.0" step="0.1" value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  style={sliderStyle}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
                  <span>Low</span><span>Normal</span><span>High</span>
                </div>
              </div>

              <VoicePreview voiceName={voiceName} rate={voiceRate} pitch={voicePitch} />
            </>
          )}

          {/* ElevenLabs info */}
          {ttsMode === 'server' && (
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Status: </span>
                <span style={{ color: serverTTSAvailable ? '#4E9A3E' : '#ff4444', fontFamily: 'var(--font-display)' }}>
                  {serverTTSAvailable ? 'CONNECTED' : 'NOT CONFIGURED'}
                </span>
              </div>
              {!serverTTSAvailable && (
                <div style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', padding: 12, borderRadius: 4, fontSize: 12 }}>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>To use ElevenLabs voices:</p>
                  <ol style={{ paddingLeft: 18, color: 'var(--color-text-secondary)' }}>
                    <li>Sign up at <strong style={{ color: '#fff' }}>elevenlabs.io</strong></li>
                    <li>Get your API key from Profile Settings</li>
                    <li>Pick a voice from the Voice Library or clone your own</li>
                    <li>Copy the Voice ID from the voice details</li>
                    <li>Add to your <code style={{ color: 'var(--color-accent-bright)', background: 'var(--color-bg-primary)', padding: '1px 4px' }}>.env</code>:
                      <pre style={{ background: 'var(--color-bg-primary)', padding: 8, marginTop: 4, borderRadius: 2, fontSize: 11, color: 'var(--color-accent-bright)', overflowX: 'auto' }}>
{`ELEVENLABS_API_KEY=your-key-here
ELEVENLABS_VOICE_ID=your-voice-id`}
                      </pre>
                    </li>
                    <li>Restart the VAYU server</li>
                  </ol>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 11 }}>
                    Recommended voices: "Adam" (calm, authoritative), "Antoni" (warm), or clone a custom voice for a unique COVAS personality.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Audio devices section */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 1, marginBottom: 8 }}>
              AUDIO DEVICES
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 3 }}>Microphone Input</div>
              <select value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)} style={selectStyle}>
                <option value="">System Default</option>
                {audioInputs.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 8)}`}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 3 }}>Speaker Output</div>
              <select value={selectedOutput} onChange={(e) => setSelectedOutput(e.target.value)} style={selectStyle}>
                <option value="">System Default</option>
                {audioOutputs.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0, 8)}`}</option>
                ))}
              </select>
            </div>
            {audioInputs.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 4 }}>
                No devices detected yet. Click the mic button to grant permission.
              </div>
            )}
          </div>
        </HoloPanel>
      </div>

      {/* Error banner */}
      {micError && (
        <div style={{
          background: 'rgba(255,68,68,0.15)', border: '1px solid var(--color-danger)',
          padding: '8px 12px', marginTop: 12, borderRadius: 4, fontSize: 13, color: 'var(--color-danger)',
        }}>
          {micError}
          <span onClick={() => setMicError(null)} style={{ float: 'right', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>DISMISS</span>
        </div>
      )}

      {/* Conversation */}
      <div style={{ marginTop: 20 }}>
        <HoloPanel title="Conversation">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 10 }}>
            {listening
              ? 'VAYU is listening. Speak naturally — your voice is automatically detected and transcribed.'
              : 'Enable the microphone above for hands-free voice, or type below.'}
          </div>

          {/* Speaking indicator */}
          {speaking && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', marginBottom: 8,
              background: 'rgba(255,68,68,0.15)', border: '1px solid #ff4444', borderRadius: 4,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4444', animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ fontSize: 13, color: '#ff6666', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>LISTENING</span>
              {interimText && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8, fontStyle: 'italic' }}>{interimText}</span>}
            </div>
          )}

          {/* Messages */}
          <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 12, padding: 8 }}>
            {messages.length > 0 ? messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', fontSize: 14, lineHeight: 1.6,
                  background: m.role === 'user' ? 'rgba(78,154,62,0.2)' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${m.role === 'user' ? 'var(--color-accent-bright)' : 'var(--color-border)'}`,
                  borderRadius: 4, whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3, display: 'flex', gap: 8 }}>
                  <span>{m.role === 'user' ? 'CMDR' : 'VAYU'} {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}</span>
                  {m.latency?.total != null && (
                    <span>({m.latency.total}ms{m.latency.llm ? ` | LLM ${m.latency.llm}ms` : ''})</span>
                  )}
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>
                {listening ? 'Mic is active — just speak to VAYU.' : 'Enable the microphone or type below to start.'}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Text input */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && send()}
              placeholder={listening ? 'Or type here...' : 'Type a message to VAYU...'}
              disabled={sending}
              style={{
                flex: 1, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                color: '#fff', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-mono)', borderRadius: 2,
              }}
            />
            <HoloButton onClick={send} disabled={sending || !input.trim()}>{sending ? '...' : 'Send'}</HoloButton>
            {messages.length > 0 && <HoloButton variant="danger" onClick={clearChat}>Clear</HoloButton>}
          </div>
        </HoloPanel>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        input[type="range"] {
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4E9A3E;
          border: 2px solid #6ECB5E;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
