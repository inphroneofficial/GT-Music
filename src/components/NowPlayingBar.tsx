import { useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, ListMusic, Maximize2, Heart
} from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Equalizer } from '@/components/Equalizer';
import { SleepTimer } from '@/components/SleepTimer';
import { formatTime } from '@/lib/formatTime';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { SongCover } from '@/components/SongCover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { SPEED_OPTIONS } from '@/types/music';

export function NowPlayingBar() {
  const {
    currentSong, isPlaying, togglePlay, nextTrack, prevTrack,
    shuffle, toggleShuffle, repeat, toggleRepeat,
    volume, setVolume, currentTime, duration, seek,
    isLiked, toggleLike, setIsFullScreen, isQueueOpen, setIsQueueOpen,
    settings, updateSettings,
  } = useMusic();

  const [heartAnim, setHeartAnim] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);

  const swipeHandlers = useSwipeGesture({
    onSwipe: (dir) => {
      if (dir === 'up') setIsFullScreen(true);
    },
  });

  if (!currentSong) return null;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleLike = () => {
    setHeartAnim(true);
    toggleLike(currentSong.id);
    setTimeout(() => setHeartAnim(false), 500);
  };

  return (
    <>
      {/* MOBILE mini-bar — visible below md */}
      <div
        className="fixed bottom-16 left-2 right-2 z-50 md:hidden animate-slide-up sm:left-3 sm:right-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        {...swipeHandlers}
      >
        <div className="glass-strong overflow-hidden rounded-[1.35rem] shadow-2xl ring-1 ring-white/5">
          {/* Mini progress */}
          <div className="h-0.5 bg-muted/30 relative">
            <div className="absolute inset-y-0 left-0 btn-gradient" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex h-[62px] items-center gap-3 px-3.5">
            <button onClick={() => setIsFullScreen(true)} className="flex-shrink-0 rounded-xl">
              <SongCover
                song={currentSong}
                alt={currentSong.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
            </button>
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setIsFullScreen(true)}>
              <p className="truncate text-sm font-semibold text-foreground">{currentSong.title}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{currentSong.artist}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full btn-press" onClick={handleLike}>
              <Heart className={`w-4 h-4 ${isLiked(currentSong.id) ? 'fill-primary text-primary' : 'text-muted-foreground'} ${heartAnim ? 'animate-heart-pop' : ''}`} />
            </Button>
            <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full btn-gradient shadow-lg btn-press">
              {isPlaying ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP full bar — visible md and up */}
      <div className="fixed bottom-4 left-4 right-4 z-50 hidden md:block animate-slide-up">
        <div className="mx-auto max-w-[1800px]">
          <div className="glass-strong overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/5">
            {/* Progress bar */}
            <div className="h-1 bg-muted/30 relative group/progress cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * (duration || 0));
            }}>
              <div className="absolute inset-y-0 left-0 btn-gradient transition-all duration-150" style={{ width: `${progress}%` }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_hsla(24,95%,53%,0.6)] opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 lg:px-5">
              {/* Left: Song info */}
              <div className="flex min-w-0 items-center gap-3 md:w-[240px] xl:w-[280px]">
                <button onClick={() => setIsFullScreen(true)} className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity group/art">
                  <SongCover
                    song={currentSong}
                    alt={currentSong.title}
                    className={`h-full w-full object-cover transition-transform ${isPlaying ? 'scale-105' : 'scale-100'}`}
                    style={{ transitionDuration: '3000ms' }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4 text-foreground" />
                  </div>
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{currentSong.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className={`flex-shrink-0 h-8 w-8 rounded-full ${heartAnim ? 'animate-heart-pop' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 transition-colors ${isLiked(currentSong.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </Button>
              </div>

              {/* Center: Controls */}
              <div className="flex max-w-[560px] flex-1 flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full btn-press" onClick={toggleShuffle}>
                    <Shuffle className={`w-3.5 h-3.5 transition-colors ${shuffle ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full btn-press" onClick={prevTrack}>
                    <SkipBack className="w-4 h-4 fill-foreground text-foreground" />
                  </Button>
                  <button onClick={togglePlay} className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-lg btn-press">
                    {isPlaying ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />}
                  </button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full btn-press" onClick={nextTrack}>
                    <SkipForward className="w-4 h-4 fill-foreground text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full btn-press" onClick={toggleRepeat}>
                    <RepeatIcon className={`w-3.5 h-3.5 transition-colors ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] text-muted-foreground w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
                  <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={([v]) => seek(v)} className="flex-1 cursor-pointer" />
                  <span className="text-[10px] text-muted-foreground w-9 tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right: Volume, extras */}
              <div className="flex items-center justify-end gap-1.5 md:w-[210px] xl:w-[240px]">
                {isPlaying && <Equalizer playing={isPlaying} size="sm" className="mr-1" />}

                {/* Speed */}
                <div className="relative">
                  <Button
                    variant="ghost" size="icon"
                    className={`h-8 w-8 rounded-full btn-press ${settings.playbackSpeed !== 1 ? 'text-primary' : 'text-muted-foreground'}`}
                    onClick={() => setShowSpeed(!showSpeed)}
                  >
                    <span className="text-[10px] font-bold">{settings.playbackSpeed}x</span>
                  </Button>
                  {showSpeed && (
                    <div className="absolute bottom-full mb-2 right-0 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl p-2 shadow-2xl animate-scale-in">
                      {SPEED_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => { updateSettings({ playbackSpeed: s }); setShowSpeed(false); }}
                          className={`block w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            settings.playbackSpeed === s ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-card'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <SleepTimer />

                <Button
                  variant="ghost" size="icon" className="h-8 w-8 rounded-full btn-press"
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                >
                  <ListMusic className={`w-4 h-4 transition-colors ${isQueueOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
                <VolumeIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <Slider value={[volume * 100]} max={100} step={1} onValueChange={([v]) => setVolume(v / 100)} className="w-20 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
