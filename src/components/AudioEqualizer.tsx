import { useMusic } from '@/contexts/MusicContext';
import { EQ_FREQUENCIES, EQ_PRESETS } from '@/types/music';
import type { EQPresetName } from '@/types/music';
import { Slider } from '@/components/ui/slider';

export function AudioEqualizer() {
  const { settings, updateSettings } = useMusic();
  const currentPreset = EQ_PRESETS.find(p => p.name === settings.eqPreset) || EQ_PRESETS[0];
  const bands = settings.eqPreset === 'custom' ? settings.eqCustomBands : currentPreset.bands;

  const handlePresetChange = (name: EQPresetName) => {
    updateSettings({ eqPreset: name });
  };

  const handleBandChange = (index: number, value: number) => {
    const newBands = [...settings.eqCustomBands];
    newBands[index] = value;
    updateSettings({ eqPreset: 'custom', eqCustomBands: newBands });
  };

  const formatFreq = (f: number) => f >= 1000 ? `${f / 1000}k` : `${f}`;

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {EQ_PRESETS.filter(p => p.name !== 'custom').map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetChange(preset.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
              settings.eqPreset === preset.name
                ? 'btn-gradient text-primary-foreground shadow-md'
                : 'bg-card text-foreground hover:bg-accent border border-border/50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Bands */}
      <div className="flex items-end gap-1 justify-between h-48 px-2">
        {EQ_FREQUENCIES.map((freq, i) => (
          <div key={freq} className="flex flex-col items-center gap-2 flex-1">
            <div className="h-36 flex items-center">
              <Slider
                orientation="vertical"
                value={[bands[i]]}
                min={-12}
                max={12}
                step={1}
                onValueChange={([v]) => handleBandChange(i, v)}
                className="h-full cursor-pointer"
              />
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">{formatFreq(freq)}</span>
            <span className="text-[9px] text-muted-foreground tabular-nums">{bands[i] > 0 ? '+' : ''}{bands[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
