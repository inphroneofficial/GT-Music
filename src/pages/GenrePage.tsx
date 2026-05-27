import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

const GENRE_COLORS: Record<string, string> = {
  pop: 'from-pink-500/30 to-violet-500/20',
  rock: 'from-red-500/30 to-orange-500/20',
  'hip-hop': 'from-yellow-500/30 to-amber-500/20',
  rap: 'from-yellow-600/30 to-amber-600/20',
  electronic: 'from-cyan-500/30 to-blue-500/20',
  jazz: 'from-amber-500/30 to-yellow-500/20',
  classical: 'from-slate-400/30 to-gray-500/20',
  'r&b': 'from-purple-500/30 to-pink-500/20',
  country: 'from-orange-500/30 to-yellow-500/20',
  indie: 'from-teal-500/30 to-emerald-500/20',
  metal: 'from-gray-600/30 to-red-600/20',
  blues: 'from-blue-600/30 to-indigo-500/20',
  soul: 'from-amber-600/30 to-orange-600/20',
  folk: 'from-green-600/30 to-emerald-600/20',
  reggae: 'from-green-500/30 to-yellow-500/20',
  latin: 'from-red-500/30 to-yellow-500/20',
  default: 'from-primary/20 to-primary/5',
};

const GenrePage = () => {
  const { name } = useParams<{ name: string }>();
  const genreName = decodeURIComponent(name || '');
  const { allSongs, playSong } = useMusic();

  const songs = useMemo(
    () => allSongs.filter(s => (s.genre || '').toLowerCase() === genreName.toLowerCase()),
    [allSongs, genreName]
  );

  const gradient = GENRE_COLORS[genreName.toLowerCase()] || GENRE_COLORS.default;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 pb-8 md:pb-10">
        {/* Header */}
        <div className={`rounded-3xl overflow-hidden mb-8 p-8 bg-gradient-to-br ${gradient} animate-fade-in`}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Genre</p>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight capitalize mb-4">{genreName}</h1>
          <p className="text-muted-foreground text-sm mb-5">{songs.length} songs</p>
          <Button
            className="btn-gradient text-primary-foreground rounded-full px-6 h-10 font-semibold border-0 btn-press"
            onClick={() => {
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              if (shuffled[0]) playSong(shuffled[0], shuffled);
            }}
          >
            <Shuffle className="w-4 h-4 mr-2" /> Shuffle Play
          </Button>
        </div>

        {/* Songs */}
        <div className="space-y-0.5">
          {songs.map((song, i) => (
            <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${i * 30}ms` }}>
              <SongRow song={song} index={i} context={songs} />
            </div>
          ))}
        </div>

        {songs.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-muted-foreground">No songs in this genre yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default GenrePage;
