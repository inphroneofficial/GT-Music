interface EqualizerProps {
  playing?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Equalizer({ playing = true, size = 'sm', className = '' }: EqualizerProps) {
  const h = size === 'sm' ? 'h-3' : 'h-5';
  const w = size === 'sm' ? 'w-[3px]' : 'w-[3px]';
  const gap = size === 'sm' ? 'gap-[2px]' : 'gap-[3px]';

  return (
    <div className={`flex items-end ${gap} ${h} ${className}`}>
      {[
        'animate-eq-bar-1',
        'animate-eq-bar-2',
        'animate-eq-bar-3',
        'animate-eq-bar-4',
      ].map((anim, i) => (
        <div
          key={i}
          className={`${w} rounded-full bg-primary transition-all ${
            playing ? anim : ''
          }`}
          style={{
            height: playing ? undefined : '3px',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
