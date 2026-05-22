import { EQ_PRESETS } from '@/types/music';
import type { AppSettings } from '@/types/music';

export interface AudioEngine {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  filters: BiquadFilterNode[];
  bassFilter: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  splitter: ChannelSplitterNode;
  leftDelay: DelayNode;
  rightDelay: DelayNode;
  stereoMerger: ChannelMergerNode;
  stereoGain: GainNode;
  monoSum: GainNode;
  monoMerger: ChannelMergerNode;
  monoGain: GainNode;
  transitionGain: GainNode;
  dryGain: GainNode;
  wetGain: GainNode;
  convolver: ConvolverNode;
  outputGain: GainNode;
  supportsSpatialAudio: boolean;
}

function buildImpulseResponse(ctx: AudioContext) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * 1.8));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const decay = Math.pow(1 - i / length, 2.25);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
  }

  return impulse;
}

export function createAudioEngine(
  audio: HTMLAudioElement,
  settings: AppSettings,
  volume: number,
): AudioEngine | null {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;

    const ctx = new AudioContextCtor();
    const source = ctx.createMediaElementSource(audio);
    const eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

    const filters = eqFrequencies.map((frequency, index) => {
      const filter = ctx.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' : index === eqFrequencies.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = frequency;
      filter.Q.value = 1.15;
      filter.gain.value = 0;
      return filter;
    });

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 180;
    bassFilter.Q.value = 0.82;

    const compressor = ctx.createDynamicsCompressor();
    const splitter = ctx.createChannelSplitter(2);
    const leftDelay = ctx.createDelay(0.05);
    const rightDelay = ctx.createDelay(0.05);
    const stereoMerger = ctx.createChannelMerger(2);
    const stereoGain = ctx.createGain();
    const monoSum = ctx.createGain();
    const monoMerger = ctx.createChannelMerger(2);
    const monoGain = ctx.createGain();
    const transitionGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const convolver = ctx.createConvolver();
    const outputGain = ctx.createGain();

    convolver.buffer = buildImpulseResponse(ctx);

    source.connect(filters[0]);
    for (let index = 0; index < filters.length - 1; index += 1) {
      filters[index].connect(filters[index + 1]);
    }

    filters[filters.length - 1].connect(bassFilter);
    bassFilter.connect(compressor);
    compressor.connect(splitter);

    splitter.connect(leftDelay, 0);
    splitter.connect(rightDelay, 1);
    leftDelay.connect(stereoMerger, 0, 0);
    rightDelay.connect(stereoMerger, 0, 1);
    stereoMerger.connect(stereoGain);

    splitter.connect(monoSum, 0);
    splitter.connect(monoSum, 1);
    monoSum.connect(monoMerger, 0, 0);
    monoSum.connect(monoMerger, 0, 1);
    monoMerger.connect(monoGain);

    stereoGain.connect(transitionGain);
    monoGain.connect(transitionGain);

    transitionGain.connect(dryGain);
    transitionGain.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);
    outputGain.connect(ctx.destination);

    const engine: AudioEngine = {
      ctx,
      source,
      filters,
      bassFilter,
      compressor,
      splitter,
      leftDelay,
      rightDelay,
      stereoMerger,
      stereoGain,
      monoSum,
      monoMerger,
      monoGain,
      transitionGain,
      dryGain,
      wetGain,
      convolver,
      outputGain,
      supportsSpatialAudio: Boolean(convolver.buffer),
    };

    applyAudioSettings(engine, audio, settings, volume);
    return engine;
  } catch {
    return null;
  }
}

export function applyAudioSettings(
  engine: AudioEngine,
  audio: HTMLAudioElement,
  settings: AppSettings,
  volume: number,
) {
  const preset = EQ_PRESETS.find((entry) => entry.name === settings.eqPreset);
  const bands = settings.eqPreset === 'custom' ? settings.eqCustomBands : (preset?.bands ?? []);

  engine.filters.forEach((filter, index) => {
    filter.gain.value = bands[index] ?? 0;
  });

  engine.bassFilter.gain.value = settings.bassBoost * 1.65;

  if (settings.normalization) {
    engine.compressor.threshold.value = -24;
    engine.compressor.knee.value = 24;
    engine.compressor.ratio.value = 3.1;
    engine.compressor.attack.value = 0.01;
    engine.compressor.release.value = 0.23;
  } else {
    engine.compressor.threshold.value = 0;
    engine.compressor.knee.value = 0;
    engine.compressor.ratio.value = 1;
    engine.compressor.attack.value = 0.003;
    engine.compressor.release.value = 0.25;
  }

  const width = Math.min(Math.max(settings.stereoWidening / 10, 0), 1);
  const monoMode = settings.monoAudio;

  engine.leftDelay.delayTime.value = monoMode ? 0 : width * 0.014;
  engine.rightDelay.delayTime.value = monoMode ? 0 : width * 0.008;
  engine.stereoGain.gain.value = monoMode ? 0 : 1 + width * 0.14;
  engine.monoGain.gain.value = monoMode ? 1 : 0;

  if (settings.spatialAudio && engine.supportsSpatialAudio) {
    engine.dryGain.gain.value = 0.88;
    engine.wetGain.gain.value = 0.18;
  } else {
    engine.dryGain.gain.value = 1;
    engine.wetGain.gain.value = 0;
  }

  engine.outputGain.gain.value = volume;
  audio.volume = 1;
  audio.playbackRate = settings.playbackSpeed;
}

export function fadeAudioEngine(engine: AudioEngine, target: number, durationMs: number) {
  if (durationMs <= 0) return Promise.resolve();

  const nowAt = engine.ctx.currentTime;
  engine.transitionGain.gain.cancelScheduledValues(nowAt);
  engine.transitionGain.gain.setValueAtTime(engine.transitionGain.gain.value, nowAt);
  engine.transitionGain.gain.linearRampToValueAtTime(target, nowAt + durationMs / 1000);

  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs + 24);
  });
}

export function setImmediateAudioLevel(engine: AudioEngine, value: number) {
  const nowAt = engine.ctx.currentTime;
  engine.transitionGain.gain.cancelScheduledValues(nowAt);
  engine.transitionGain.gain.setValueAtTime(value, nowAt);
}

export function rampOutputVolume(engine: AudioEngine, value: number, durationMs = 140) {
  const nowAt = engine.ctx.currentTime;
  const target = Math.min(Math.max(value, 0), 1);
  engine.outputGain.gain.cancelScheduledValues(nowAt);
  engine.outputGain.gain.setValueAtTime(engine.outputGain.gain.value, nowAt);
  engine.outputGain.gain.linearRampToValueAtTime(target, nowAt + durationMs / 1000);
}

export function resumeAudioEngine(engine: AudioEngine | null) {
  if (!engine) return Promise.resolve();
  if (engine.ctx.state === 'suspended') {
    return engine.ctx.resume().catch(() => {});
  }
  return Promise.resolve();
}
