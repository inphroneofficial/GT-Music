import { Home, Search, Library, Music2, Settings, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMusic } from '@/contexts/MusicContext';

const tabs = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Sparkles, label: 'Mood', path: '/mood' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Music2, label: 'Playing', path: '/__now_playing__' },
];

export function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { currentSong, isPlaying, isFullScreen, setIsFullScreen, currentTime, duration } = useMusic();
  const progress = duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
      <div className="relative border-t border-border/30 bg-background/92 backdrop-blur-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {currentSong && (
          <div className="absolute inset-x-0 top-0 h-px bg-muted/40">
            <div
              className={`h-full btn-gradient transition-[width] duration-300 ${isPlaying ? 'shadow-[0_0_18px_hsl(var(--primary)/0.7)]' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="mx-auto grid h-16 max-w-screen-sm grid-cols-6 items-center gap-0.5 px-1.5">
          {tabs.map(({ icon: Icon, label, path }) => {
            const isNowPlaying = path === '/__now_playing__';
            const isActive = isNowPlaying
              ? Boolean(currentSong && isFullScreen)
              : path === '/mood'
                ? pathname.startsWith('/mood')
                : pathname === path || (path === '/' && pathname === '/');

            return (
              <button
                key={path}
                onClick={() => {
                  if (isNowPlaying) {
                    if (currentSong) setIsFullScreen(true);
                  } else {
                    navigate(path);
                  }
                }}
                className={`tap-target touch-manipulation relative flex min-w-0 flex-col items-center gap-0.5 overflow-hidden rounded-2xl px-1 py-2 transition-all duration-200 btn-press ${
                  isActive ? 'bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && <span className="absolute inset-x-4 top-1 h-0.5 rounded-full bg-primary" />}
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[9px] font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
