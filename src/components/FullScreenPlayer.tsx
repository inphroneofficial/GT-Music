import { useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, ChevronDown, ListMusic, Settings2, RotateCcw, RotateCw, SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '@/contexts/MusicContext';
import { Equalizer } from '@/components/Equalizer';
import { SleepTimer } from '@/components/SleepTimer';
import { ParticleField } from '@/components/ParticleField';
import { formatTime } from '@/lib/formatTime';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useSongCover } from '@/hooks/useSongCover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { SPEED_OPTIONS } from '@/types/music';

export function FullScreenPlayer() {
  const navigate = useNavigate();
  const {
    currentSong, isPlaying, togglePlay, nextTrack, prevTrack,
    shuffle, toggleShuffle, repeat, toggleRepeat,
    volume, setVolume, currentTime, duration, seek,
    isLiked, toggleLike, isFullScreen, setIsFullScreen,
    isQueueOpen, setIsQueueOpen, settings, updateSettings,
  } = useMusic();

  const [heartAnim, setHeartAnim] = useState(false);
  const coverSrc = useSongCover(currentSong);

  const swipeHandlers = useSwipeGesture({
    onSwipe: (dir) => {
      if (dir === 'down') setIsFullScreen(false);
      if (dir === 'left') nextTrack();
      if (dir === 'right') prevTrack();
    },
  });

  if (!isFullScreen || !currentSong) return null;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const repeatLabel = repeat === 'off' ? 'Off' : repeat === 'all' ? 'All' : 'One';

  const handleLike = () => {
    setHeartAnim(true);
    toggleLike(currentSong.id);
    setTimeout(() => setHeartAnim(false), 500);
  };

  const seekBy = (delta: number) => {
    seek(Math.max(0, Math.min(duration || 0, currentTime + delta)));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background animate-fade-in-scale"
      {...swipeHandlers}
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden bg-background">
        <img
          src={coverSrc}
          alt=""
          className="w-full h-full object-cover opacity-40 blur-[80px] scale-150"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        <div className="absolute inset-0 bg-background/85" />
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <ParticleField count={15} />
        <div className="absolute w-32 h-32 rounded-full bg-primary/10 animate-bokeh" style={{ top: '20%', left: '10%' }} />
        <div className="absolute w-24 h-24 rounded-full bg-primary/8 animate-bokeh" style={{ top: '60%', right: '15%', animationDelay: '3s' }} />
      </div>

      <div
        className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center overflow-y-auto px-4 pb-8 md:px-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}
      >
        {/* Top bar */}
        <div
          className="absolute left-0 right-0 flex items-center justify-between px-2 md:px-4"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <Button
            variant="ghost" size="icon"
            className="tap-target touch-manipulation h-10 w-10 rounded-full hover:bg-muted/30 btn-press"
            onClick={() => setIsFullScreen(false)}
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="tap-target touch-manipulation h-10 w-10 rounded-full btn-press text-muted-foreground"
              onClick={() => {
                setIsFullScreen(false);
                navigate('/settings');
              }}
              aria-label="Open settings"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <SleepTimer />
            <Button
              variant="ghost" size="icon"
              className="tap-target touch-manipulation h-10 w-10 rounded-full btn-press text-muted-foreground"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
            >
              <ListMusic className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Album art */}
        <div className="relative mb-6 mt-2 animate-fade-in-scale md:mb-10 md:mt-4" style={{ animationDelay: '100ms' }}>
          <div className={`absolute inset-0 -right-8 rounded-full bg-card vinyl-grooves ${isPlaying ? 'animate-vinyl-spin' : ''}`}
            style={{ width: '100%', height: '100%', borderRadius: '50%', zIndex: 0, transform: 'translateX(30px)' }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-muted/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-muted" />
          </div>
          <div className="relative z-10 h-[220px] w-[220px] overflow-hidden rounded-[2rem] shadow-2xl min-[380px]:h-[240px] min-[380px]:w-[240px] sm:h-[300px] sm:w-[300px] md:h-[340px] md:w-[340px]">
            <img
              src={coverSrc}
              alt={currentSong.title}
              className={`h-full w-full object-cover transition-transform ${isPlaying ? 'scale-105' : 'scale-100'}`}
              style={{ transitionDuration: '3000ms' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
          <div className="absolute inset-0 rounded-3xl blur-3xl opacity-40 -z-0 scale-110 animate-pulse-glow">
            <img src={coverSrc} alt="" className="w-full h-full object-cover rounded-3xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        </div>

        {/* Song info */}
        <div className="mb-5 flex w-full items-center justify-between animate-fade-in md:mb-8" style={{ animationDelay: '200ms' }}>
          <div className="min-w-0 flex items-center gap-3">
            <div>
              <h2 className="truncate text-xl font-bold text-foreground md:text-2xl">{currentSong.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{currentSong.artist}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">{currentSong.album}</p>
            </div>
            {isPlaying && <Equalizer playing={isPlaying} size="md" />}
          </div>
          <Button variant="ghost" size="icon" className={`rounded-full ${heartAnim ? 'animate-heart-pop' : ''}`} onClick={handleLike}>
            <Heart className={`w-6 h-6 transition-all ${isLiked(currentSong.id) ? 'fill-primary text-primary scale-110' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-5 w-full animate-fade-in md:mb-6" style={{ animationDelay: '300ms' }}>
          <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={([v]) => seek(v)} className="cursor-pointer" />
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 animate-fade-in sm:gap-6 md:gap-8" style={{ animationDelay: '400ms' }}>
          <Button variant="ghost" size="icon" className="tap-target touch-manipulation rounded-full btn-press" onClick={toggleShuffle}>
            <Shuffle className={`w-5 h-5 transition-colors ${shuffle ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="icon" className="tap-target touch-manipulation h-12 w-12 rounded-full btn-press" onClick={prevTrack}>
            <SkipBack className="w-6 h-6 fill-foreground text-foreground" />
          </Button>
          <button
            onClick={togglePlay}
            className="touch-manipulation flex h-16 w-16 items-center justify-center rounded-full btn-gradient shadow-xl transition-transform btn-press glow-amber animate-glow-pulse hover:scale-110 active:scale-90"
            data-no-swipe="true"
          >
            {isPlaying ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground ml-1" />}
          </button>
          <Button variant="ghost" size="icon" className="tap-target touch-manipulation h-12 w-12 rounded-full btn-press" onClick={nextTrack}>
            <SkipForward className="w-6 h-6 fill-foreground text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="tap-target touch-manipulation rounded-full btn-press" onClick={toggleRepeat}>
            <RepeatIcon className={`w-5 h-5 transition-colors ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        <div className="mt-6 grid w-full gap-3 animate-fade-in md:mt-10" style={{ animationDelay: '500ms' }}>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/40 bg-card/40 p-2 backdrop-blur-xl sm:grid-cols-4">
            <Button variant="ghost" className="touch-manipulation h-12 rounded-xl text-xs text-muted-foreground hover:text-foreground" onClick={() => seekBy(-10)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              -10s
            </Button>
            <Button variant="ghost" className="touch-manipulation h-12 rounded-xl text-xs text-muted-foreground hover:text-foreground" onClick={() => seekBy(10)}>
              <RotateCw className="mr-2 h-4 w-4" />
              +10s
            </Button>
            <Button
              variant="ghost"
              className="touch-manipulation h-12 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
            >
              <ListMusic className={`mr-2 h-4 w-4 ${isQueueOpen ? 'text-primary' : ''}`} />
              Queue
            </Button>
            <Button
              variant="ghost"
              className="touch-manipulation h-12 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsFullScreen(false);
                navigate('/settings');
              }}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Sound
            </Button>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                className="tap-target touch-manipulation flex h-11 w-11 items-center justify-center rounded-full bg-background/50 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                data-no-swipe="true"
              >
                <VolumeIcon className="h-4 w-4" />
              </button>
              <Slider value={[volume * 100]} max={100} step={1} onValueChange={([v]) => setVolume(v / 100)} className="flex-1 cursor-pointer" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Playback</span>
              <span>{repeatLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                    onClick={() => {
                      updateSettings({ playbackSpeed: speed });
                    }}
                  className={`touch-manipulation rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                    settings.playbackSpeed === speed
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-background/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
