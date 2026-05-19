import { Settings as SettingsIcon, Volume2, Palette, Gauge, Waves, Download, Sparkles, Headphones, Sun, Moon, Monitor } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import type { ThemeMode } from '@/types/music';
import { AudioEqualizer } from '@/components/AudioEqualizer';
import { ACCENT_COLORS, SPEED_OPTIONS } from '@/types/music';
import type { AccentColor } from '@/types/music';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEO } from '@/components/SEO';

const SettingsPage = () => {
  const { settings, updateSettings } = useMusic();

  return (
    <ScrollArea className="h-full">
      <SEO title="Settings" description="Customize your GT Music experience - equalizer, playback, appearance, and more." path="/settings" />
      <div className="mx-auto max-w-3xl px-4 pb-40 pt-4 md:px-6 md:pt-6">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground animate-fade-in md:mb-8 md:text-4xl">
          <SettingsIcon className="h-6 w-6 text-primary md:h-7 md:w-7" /> Settings
        </h1>

        <section className="mb-8 animate-fade-in md:mb-10" style={{ animationDelay: '50ms' }}>
          <div className="mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Theme</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
            {([
              { value: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
              { value: 'light' as ThemeMode, label: 'Light', icon: Sun },
              { value: 'system' as ThemeMode, label: 'System', icon: Monitor },
            ]).map(({ value, label, icon: Icon }) => {
              const active = settings.theme === value;
              return (
                <button
                  key={value}
                  onClick={() => updateSettings({ theme: value })}
                  className={`tap-target flex min-h-[76px] flex-row items-center justify-center gap-2 rounded-2xl border p-4 transition-all btn-press sm:flex-col ${
                    active
                      ? 'scale-[1.02] border-transparent btn-gradient text-primary-foreground shadow-md'
                      : 'border-border/40 bg-card/50 text-foreground hover:bg-card'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium md:text-sm">{label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">System follows your device preference.</p>
        </section>

        <section className="mb-8 animate-fade-in md:mb-10" style={{ animationDelay: '100ms' }}>
          <div className="mb-4 flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Equalizer</h2>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/50 p-5">
            <AudioEqualizer />
          </div>
        </section>

        <section className="mb-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Playback Speed</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                onClick={() => updateSettings({ playbackSpeed: speed })}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all btn-press ${
                  settings.playbackSpeed === speed
                    ? 'btn-gradient text-primary-foreground shadow-md'
                    : 'border border-border/50 bg-card text-foreground hover:bg-accent'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Crossfade</h2>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">{settings.crossfadeDuration}s</span>
          </div>
          <Slider
            value={[settings.crossfadeDuration]}
            min={0}
            max={12}
            step={1}
            onValueChange={([v]) => updateSettings({ crossfadeDuration: v })}
            className="cursor-pointer"
          />
          <p className="mt-2 text-xs text-muted-foreground">Smooth transition between tracks.</p>
        </section>

        <section className="mb-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between rounded-2xl border border-border/30 bg-card/50 p-4">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Audio Normalization</p>
                <p className="text-xs text-muted-foreground">Equalize volume levels across tracks.</p>
              </div>
            </div>
            <Switch
              checked={settings.normalization}
              onCheckedChange={(v) => updateSettings({ normalization: v })}
            />
          </div>
        </section>

        <section className="mb-10 space-y-3 animate-fade-in" style={{ animationDelay: '420ms' }}>
          <ToggleRow
            icon={<Headphones className="h-5 w-5 text-primary" />}
            title="Gapless playback"
            desc="Preload the next track for seamless transitions."
            value={settings.gapless}
            onChange={(v) => updateSettings({ gapless: v })}
          />
          <ToggleRow
            icon={<Volume2 className="h-5 w-5 text-primary" />}
            title="Mono audio"
            desc="Combine stereo channels into a single channel."
            value={settings.monoAudio}
            onChange={(v) => updateSettings({ monoAudio: v })}
          />
          <ToggleRow
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            title="Reduce motion"
            desc="Minimize animations and transitions."
            value={settings.reducedMotion}
            onChange={(v) => updateSettings({ reducedMotion: v })}
          />
        </section>

        <section className="mb-10 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Accent Color</h2>
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
        </section>

        <section className="mb-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Install &amp; About</h2>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/30 bg-card/50 p-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Install as an app</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                On mobile: open your browser share menu, then choose <strong>Add to Home Screen</strong>.
                <br />
                On desktop: use the install icon in the address bar.
              </p>
            </div>
            <div className="border-t border-border/30 pt-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">GT Music</span> · v1.0 - Your personal, ad-free music universe.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
};

function ToggleRow({ icon, title, desc, value, onChange }: { icon: React.ReactNode; title: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/30 bg-card/50 p-4">
      <div className="min-w-0 flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground sm:whitespace-normal">{desc}</p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export default SettingsPage;
