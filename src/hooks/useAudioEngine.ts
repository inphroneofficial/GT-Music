import { useRef, useCallback, useEffect } from 'react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '@/types/music';
import type { EQPresetName } from '@/types/music';

interface AudioEngineOptions {
  onTimeUpdate: (time: number) => void;
  onDurationChange: (dur: number) => void;
  onEnded: () => void;
  onPlayStateChange: (playing: boolean) => void;
}

export function useAudioEngine(opts: AudioEngineOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const connectedRef = useRef(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.7;
      audioRef.current.crossOrigin = 'anonymous';
    }
    const audio = audioRef.current;
    const onTime = () => opts.onTimeUpdate(audio.currentTime);
    const onDur = () => opts.onDurationChange(audio.duration || 0);
    const onEnd = () => opts.onEnded();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (ctxRef.current) return;
    const audio = audioRef.current!;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;

      // Create 10-band EQ
      const filters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });
      filtersRef.current = filters;

      // Gain for normalization
      const gain = ctx.createGain();
      gain.gain.value = 1;
      gainRef.current = gain;

      // Chain: source -> filters -> gain -> destination
      source.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(gain);
      gain.connect(ctx.destination);
      connectedRef.current = true;
    } catch {
      // Fallback: no Web Audio API
    }
  }, []);

  const play = useCallback(async (src: string) => {
    const audio = audioRef.current!;
    audio.src = src;
    ensureAudioContext();
    if (ctxRef.current?.state === 'suspended') {
      await ctxRef.current.resume();
    }
    await audio.play();
    opts.onPlayStateChange(true);
  }, [ensureAudioContext]);

  const resume = useCallback(async () => {
    const audio = audioRef.current!;
    if (ctxRef.current?.state === 'suspended') {
      await ctxRef.current.resume();
    }
    await audio.play();
    opts.onPlayStateChange(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    opts.onPlayStateChange(false);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const setSpeed = useCallback((speed: number) => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, []);

  const setEQ = useCallback((bands: number[]) => {
    filtersRef.current.forEach((f, i) => {
      if (bands[i] !== undefined) f.gain.value = bands[i];
    });
  }, []);

  const applyPreset = useCallback((presetName: EQPresetName, customBands?: number[]) => {
    if (presetName === 'custom' && customBands) {
      setEQ(customBands);
    } else {
      const preset = EQ_PRESETS.find(p => p.name === presetName);
      if (preset) setEQ(preset.bands);
    }
  }, [setEQ]);

  const setNormalization = useCallback((enabled: boolean) => {
    if (gainRef.current) {
      gainRef.current.gain.value = enabled ? 0.8 : 1;
    }
  }, []);

  const getCurrentTime = useCallback(() => audioRef.current?.currentTime || 0, []);
  const getDuration = useCallback(() => audioRef.current?.duration || 0, []);

  return {
    play, resume, pause, seek, setVolume, setSpeed,
    setEQ, applyPreset, setNormalization,
    getCurrentTime, getDuration,
    audioRef,
  };
}
