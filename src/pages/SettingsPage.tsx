import {
  AudioLines,
  Download,
  FolderOpen,
  Gauge,
  Headphones,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  Waves,
} from 'lucide-react';
import { useState } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import type { AccentColor, ThemeMode } from '@/types/music';
import { ACCENT_COLORS, EQ_PRESETS, SPEED_OPTIONS } from '@/types/music';
import { AudioEqualizer } from '@/components/AudioEqualizer';
import { DeveloperDialog } from '@/components/DeveloperDialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEO } from '@/components/SEO';

const SettingsPage = () => {
  const { settings, updateSettings, preferNativeAudio, allSongs, scanLibrary } = useMusic();
  const activePreset = EQ_PRESETS.find((preset) => preset.name === settings.eqPreset);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanMessage, setScanMessage] = useState('Drop MP3s into a mood folder, then scan to refresh the app.');

  const handleScanSongs = async () => {
    setScanState('scanning');
    setScanMessage('Scanning mood folders...');
    try {
      const result = await scanLibrary();
      setScanMessage(result.mode === 'dev-scan'
        ? `${result.total} songs ready. ${result.added} added, ${result.removed} removed, ${result.moved} organized.`
        : `${result.total} songs loaded from manifest. Run npm run scan:songs for new local files outside dev mode.`
      );
      setScanState('done');
    } catch {
      setScanMessage('Scan could not complete. Run npm run scan:songs and refresh the app.');
      setScanState('idle');
    }
  };

  return (
    <ScrollArea className="h-full">
      <SEO title="Settings" description="Customize your GT Music experience - equalizer, playback, appearance, and more." path="/settings" />
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-4 md:px-6 md:pb-10 md:pt-6">
        <div className="mb-6 flex items-center justify-between gap-3 md:mb-8">
          <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground animate-fade-in md:text-4xl">
            <SettingsIcon className="h-6 w-6 text-primary md:h-7 md:w-7" /> Settings
          </h1>
          <span className="rounded-full border border-border/40 bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Tuned
          </span>
        </div>

        <div className="space-y-5">
          <section className="animate-fade-in" style={{ animationDelay: '25ms' }}>
            <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/60 p-4 shadow-[0_24px_80px_hsl(var(--primary)/0.12)] md:p-5">
              <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold text-foreground md:text-lg">Music Library Scanner</h2>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Add MP3s inside <span className="font-semibold text-foreground">public/songs/melodies</span>, <span className="font-semibold text-foreground">mass</span>, <span className="font-semibold text-foreground">romantic</span>, <span className="font-semibold text-foreground">emotional</span>, or <span className="font-semibold text-foreground">uplifting</span>.
                  </p>
                </div>
                <button
                  onClick={handleScanSongs}
                  disabled={scanState === 'scanning'}
                  className="tap-target btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-70"
                >
                  <RefreshCw className={`h-4 w-4 ${scanState === 'scanning' ? 'animate-spin' : ''}`} />
                  {scanState === 'scanning' ? 'Scanning...' : 'Scan Songs'}
                </button>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard label="Catalog" value={`${allSongs.length} songs`} />
                <MetricCard label="Folders" value="5 moods" />
                <MetricCard label="Mode" value={scanState === 'scanning' ? 'Scanning' : 'Ready'} />
                <MetricCard label="Source" value="Manifest" />
              </div>
              <p className="relative mt-3 text-xs leading-5 text-muted-foreground">{scanMessage}</p>
            </div>
          </section>

          <section className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground md:text-lg">Theme</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                  { value: 'light' as ThemeMode, label: 'Light', icon: Sun },
                  { value: 'system' as ThemeMode, label: 'Auto', icon: Monitor },
                ]).map(({ value, label, icon: Icon }) => {
                  const active = settings.theme === value;
                  return (
                    <button
                      key={value}
                      onClick={() => updateSettings({ theme: value })}
                      className={`tap-target flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all btn-press ${
                        active
                          ? 'scale-[1.02] border-transparent btn-gradient text-primary-foreground shadow-md'
                          : 'border-border/40 bg-background/50 text-foreground hover:bg-card'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Waves className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground md:text-lg">Sound Engine</h2>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard label="Profile" value={activePreset?.label ?? 'Flat'} />
                <MetricCard label="Bass" value={`${settings.bassBoost}/10`} />
                <MetricCard label="Width" value={`${settings.stereoWidening}/10`} />
                <MetricCard label="Engine" value={preferNativeAudio ? 'Hybrid DSP' : 'DSP'} />
              </div>
              <div className="rounded-2xl border border-border/30 bg-background/30 p-4">
                <AudioEqualizer />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5 animate-fade-in" style={{ animationDelay: '140ms' }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AudioLines className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground md:text-lg">Bass Boost</h2>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{settings.bassBoost}/10</span>
              </div>
              <Slider
                value={[settings.bassBoost]}
                min={0}
                max={10}
                step={1}
                onValueChange={([value]) => updateSettings({ bassBoost: value })}
                className="cursor-pointer"
              />
            </div>

            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5 animate-fade-in" style={{ animationDelay: '180ms' }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground md:text-lg">Track Transition</h2>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{settings.crossfadeDuration}s</span>
              </div>
              <Slider
                value={[settings.crossfadeDuration]}
                min={0}
                max={12}
                step={1}
                onValueChange={([value]) => updateSettings({ crossfadeDuration: value })}
                className="cursor-pointer"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground md:text-lg">Stereo Widening</h2>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{settings.stereoWidening}/10</span>
              </div>
              <Slider
                value={[settings.stereoWidening]}
                min={0}
                max={10}
                step={1}
                onValueChange={([value]) => updateSettings({ stereoWidening: value })}
                className="cursor-pointer"
              />
            </div>

            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5 animate-fade-in" style={{ animationDelay: '220ms' }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground md:text-lg">Fade In</h2>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{settings.fadeInDuration}s</span>
              </div>
              <Slider
                value={[settings.fadeInDuration]}
                min={0}
                max={4}
                step={0.5}
                onValueChange={([value]) => updateSettings({ fadeInDuration: value })}
                className="cursor-pointer"
              />
            </div>
          </section>

          <section className="animate-fade-in" style={{ animationDelay: '220ms' }}>
            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground md:text-lg">Playback Speed</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => updateSettings({ playbackSpeed: speed })}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all btn-press ${
                      settings.playbackSpeed === speed
                        ? 'btn-gradient text-primary-foreground shadow-md'
                        : 'border border-border/50 bg-background/50 text-foreground hover:bg-accent'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 animate-fade-in" style={{ animationDelay: '260ms' }}>
            <ToggleRow
              icon={<Volume2 className="h-5 w-5 text-primary" />}
              title="Normalization"
              desc="Keeps loud and quiet tracks balanced."
              value={settings.normalization}
              onChange={(value) => updateSettings({ normalization: value })}
            />
            <ToggleRow
              icon={<Headphones className="h-5 w-5 text-primary" />}
              title="Gapless Playback"
              desc="Preloads the next track for smoother transitions."
              value={settings.gapless}
              onChange={(value) => updateSettings({ gapless: value })}
            />
            <ToggleRow
              icon={<Volume2 className="h-5 w-5 text-primary" />}
              title="Mono Audio"
              desc="Sends the same mix to both sides."
              value={settings.monoAudio}
              onChange={(value) => updateSettings({ monoAudio: value })}
            />
            <ToggleRow
              icon={<Waves className="h-5 w-5 text-primary" />}
              title="Spatial Audio"
              desc="Adds a light room-style spatial depth when supported."
              value={settings.spatialAudio}
              onChange={(value) => updateSettings({ spatialAudio: value })}
            />
            <ToggleRow
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              title="Reduce Motion"
              desc="Makes the interface calmer and lighter."
              value={settings.reducedMotion}
              onChange={(value) => updateSettings({ reducedMotion: value })}
            />
          </section>

          <section className="animate-fade-in" style={{ animationDelay: '320ms' }}>
            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground md:text-lg">Accent Color</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => updateSettings({ accentColor: color })}
                    className={`tap-target h-12 w-12 rounded-xl transition-all btn-press ${
                      settings.accentColor === color ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'hover:scale-105'
                    }`}
                    style={{ background: `hsl(${ACCENT_COLORS[color].hsl})` }}
                    title={ACCENT_COLORS[color].label}
                    aria-label={`Set accent to ${ACCENT_COLORS[color].label}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto] animate-fade-in" style={{ animationDelay: '380ms' }}>
            <div className="rounded-[2rem] border border-border/30 bg-card/50 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground md:text-lg">Install</h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                On mobile use your browser share menu and choose <strong>Add to Home Screen</strong>. On desktop use the install icon in the address bar.
              </p>
            </div>

            <DeveloperDialog />
          </section>
        </div>
      </div>
    </ScrollArea>
  );
};

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/30 bg-background/40 p-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  desc,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/30 bg-card/50 p-4">
      <div className="min-w-0 flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-background/50">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export default SettingsPage;
