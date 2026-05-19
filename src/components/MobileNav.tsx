import { Home, Search, Library, Music2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMusic } from '@/contexts/MusicContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const tabs = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: Music2, label: 'Playing', path: '/__now_playing__' },
];

export function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { currentSong, isFullScreen, setIsFullScreen } = useMusic();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
      <div className="border-t border-border/30 bg-background/92 backdrop-blur-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto flex h-16 max-w-screen-sm items-center gap-1 px-2">
          {tabs.map(({ icon: Icon, label, path }) => {
            const isNowPlaying = path === '/__now_playing__';
            const isActive = isNowPlaying ? Boolean(currentSong && isFullScreen) : pathname === path || (path === '/' && pathname === '/');

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
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition-all duration-200 btn-press ${
                  isActive ? 'bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]' : 'text-muted-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
          <div className="ml-1 flex-shrink-0">
            <ThemeToggle compact />
          </div>
        </div>
      </div>
    </nav>
  );
}
