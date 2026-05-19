import { useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, ChevronDown, ListMusic, Settings
} from 'lucide-react';
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
  const {
    currentSong, isPlaying, togglePlay, nextTrack, prevTrack,
    shuffle, toggleShuffle, repeat, toggleRepeat,
    volume, setVolume, currentTime, duration, seek,
    isLiked, toggleLike, isFullScreen, setIsFullScreen,
    isQueueOpen, setIsQueueOpen, settings, updateSettings,
  } = useMusic();

  const [heartAnim, setHeartAnim] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
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

  const handleLike = () => {
    setHeartAnim(true);
    toggleLike(currentSong.id);
    setTimeout(() => setHeartAnim(false), 500);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in-scale bg-background"
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

      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 pb-8 pt-safe md:px-8">
        {/* Top bar */}
        <div className="absolute left-0 right-0 top-4 flex items-center justify-between px-2 md:top-6">
          <Button
            variant="ghost" size="icon"
            className="h-10 w-10 rounded-full hover:bg-muted/30 btn-press"
            onClick={() => setIsFullScreen(false)}
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-1">
            <SleepTimer />
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 rounded-full btn-press text-muted-foreground"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
            >
              <ListMusic className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Album art */}
        <div className="relative mb-7 animate-fade-in-scale md:mb-10" style={{ animationDelay: '100ms' }}>
          <div className={`absolute inset-0 -right-8 rounded-full bg-card vinyl-grooves ${isPlaying ? 'animate-vinyl-spin' : ''}`}
            style={{ width: '100%', height: '100%', borderRadius: '50%', zIndex: 0, transform: 'translateX(30px)' }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-muted/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-muted" />
          </div>
          <div className="relative z-10 h-[260px] w-[260px] overflow-hidden rounded-[2rem] shadow-2xl sm:h-[300px] sm:w-[300px] md:h-[340px] md:w-[340px]">
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
        <div className="mb-6 flex w-full items-center justify-between animate-fade-in md:mb-8" style={{ animationDelay: '200ms' }}>
          <div className="min-w-0 flex items-center gap-3">
            <div>
              <h2 className="truncate text-xl font-bold text-foreground md:text-2xl">{currentSong.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{currentSong.artist}</p>
            </div>
            {isPlaying && <Equalizer playing={isPlaying} size="md" />}
          </div>
          <Button variant="ghost" size="icon" className={`rounded-full ${heartAnim ? 'animate-heart-pop' : ''}`} onClick={handleLike}>
            <Heart className={`w-6 h-6 transition-all ${isLiked(currentSong.id) ? 'fill-primary text-primary scale-110' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {/* Progress */}
        <div className="w-full mb-5 md:mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={([v]) => seek(v)} className="cursor-pointer" />
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 animate-fade-in sm:gap-6 md:gap-8" style={{ animationDelay: '400ms' }}>
          <Button variant="ghost" size="icon" className="rounded-full btn-press" onClick={toggleShuffle}>
            <Shuffle className={`w-5 h-5 transition-colors ${shuffle ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full btn-press" onClick={prevTrack}>
            <SkipBack className="w-6 h-6 fill-foreground text-foreground" />
          </Button>
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-xl glow-amber animate-glow-pulse btn-press"
          >
            {isPlaying ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground ml-1" />}
          </button>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full btn-press" onClick={nextTrack}>
            <SkipForward className="w-6 h-6 fill-foreground text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full btn-press" onClick={toggleRepeat}>
            <RepeatIcon className={`w-5 h-5 transition-colors ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {/* Speed + Volume */}
        <div className="mt-8 flex w-full items-center justify-center gap-4 animate-fade-in md:mt-10" style={{ animationDelay: '500ms' }}>
          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeed(!showSpeed)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${settings.playbackSpeed !== 1 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {settings.playbackSpeed}x
            </button>
            {showSpeed && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl p-2 shadow-2xl animate-scale-in">
                {SPEED_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { updateSettings({ playbackSpeed: s }); setShowSpeed(false); }}
                    className={`block w-full text-center px-4 py-1.5 rounded-lg text-xs font-medium ${
                      settings.playbackSpeed === s ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-card'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <VolumeIcon className="w-4 h-4 text-muted-foreground" />
          <Slider value={[volume * 100]} max={100} step={1} onValueChange={([v]) => setVolume(v / 100)} className="w-28 md:w-36 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
