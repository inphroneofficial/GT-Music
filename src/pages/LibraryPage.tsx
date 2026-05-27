import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Album,
  Download,
  Heart,
  LibraryBig,
  ListMusic,
  Mic2,
  Music,
  Plus,
  TimerReset,
  TrendingUp,
} from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { VirtualizedSongList } from '@/components/VirtualizedSongList';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolveSongCoverPath } from '@/lib/songMetadata';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type LibrarySection =
  | 'all'
  | 'albums'
  | 'artists'
  | 'liked'
  | 'playlists'
  | 'recent'
  | 'mostPlayed'
  | 'downloaded';

const sections: Array<{
  value: LibrarySection;
  label: string;
  shortLabel: string;
  icon: typeof Music;
  tone: string;
}> = [
  { value: 'all', label: 'All Songs', shortLabel: 'All', icon: Music, tone: 'from-primary/20 to-primary/5' },
  { value: 'albums', label: 'Albums', shortLabel: 'Albums', icon: Album, tone: 'from-sky-500/20 to-sky-500/5' },
  { value: 'artists', label: 'Artists', shortLabel: 'Artists', icon: Mic2, tone: 'from-emerald-500/20 to-emerald-500/5' },
  { value: 'liked', label: 'Liked Songs', shortLabel: 'Liked', icon: Heart, tone: 'from-rose-500/20 to-rose-500/5' },
  { value: 'playlists', label: 'Playlists', shortLabel: 'Playlists', icon: ListMusic, tone: 'from-cyan-500/20 to-cyan-500/5' },
  { value: 'recent', label: 'Recently Played', shortLabel: 'Recent', icon: TimerReset, tone: 'from-amber-500/20 to-amber-500/5' },
  { value: 'mostPlayed', label: 'Most Played', shortLabel: 'Top', icon: TrendingUp, tone: 'from-violet-500/20 to-violet-500/5' },
  { value: 'downloaded', label: 'Downloaded', shortLabel: 'Local', icon: Download, tone: 'from-teal-500/20 to-teal-500/5' },
];

const LibraryPage = () => {
  const navigate = useNavigate();
  const {
    allSongs,
    playlists,
    likedSongIds,
    createPlaylist,
    recentlyPlayed,
    playCounts,
  } = useMusic();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<LibrarySection>('all');

  const likedSongs = useMemo(
    () => allSongs.filter((song) => likedSongIds.includes(song.id)),
    [allSongs, likedSongIds],
  );

  const recentlyPlayedSongs = useMemo(
    () => recentlyPlayed.map((id) => allSongs.find((song) => song.id === id)).filter(Boolean) as typeof allSongs,
    [allSongs, recentlyPlayed],
  );

  const mostPlayedSongs = useMemo(() => {
    return [...allSongs]
      .sort((left, right) => (playCounts[right.id] || 0) - (playCounts[left.id] || 0))
      .filter((song) => (playCounts[song.id] || 0) > 0);
  }, [allSongs, playCounts]);

  const albums = useMemo(() => {
    const grouped = new Map<string, { name: string; artist: string; cover: string }>();
    allSongs.forEach((song) => {
      if (!grouped.has(song.album)) {
        grouped.set(song.album, {
          name: song.album,
          artist: song.artist,
          cover: resolveSongCoverPath(song.cover),
        });
      }
    });
    return Array.from(grouped.values());
  }, [allSongs]);

  const artists = useMemo(() => {
    const grouped = new Map<string, { name: string; cover: string; songCount: number }>();
    allSongs.forEach((song) => {
      if (!grouped.has(song.artist)) {
        grouped.set(song.artist, {
          name: song.artist,
          cover: resolveSongCoverPath(song.cover),
          songCount: 0,
        });
      }
      grouped.get(song.artist)!.songCount += 1;
    });
    return Array.from(grouped.values());
  }, [allSongs]);

  const sectionMeta = useMemo(() => ({
    all: { title: 'All Songs', detail: `${allSongs.length} tracks in your full music library` },
    albums: { title: 'Albums', detail: `${albums.length} album collections from your songs` },
    artists: { title: 'Artists', detail: `${artists.length} artists across your library` },
    liked: { title: 'Liked Songs', detail: `${likedSongs.length} songs you saved` },
    playlists: { title: 'Playlists', detail: `${playlists.length} custom playlists` },
    recent: { title: 'Recently Played', detail: `${recentlyPlayedSongs.length} songs from recent sessions` },
    mostPlayed: { title: 'Most Played', detail: `${mostPlayedSongs.length} tracks with real listening activity` },
    downloaded: { title: 'Downloaded', detail: `${allSongs.length} local tracks ready to play` },
  }), [albums.length, allSongs.length, artists.length, likedSongs.length, mostPlayedSongs.length, playlists.length, recentlyPlayedSongs.length]);

  const activeMeta = sectionMeta[activeSection];

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setDialogOpen(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SEO title="Library" description="Browse every song, artist, album, and playlist inside GT Music." path="/library" />

      <div className="flex-shrink-0 px-4 pt-4 md:px-6 md:pt-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Your Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">Songs, albums, artists, and playlists in one polished space.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="mt-1 h-11 w-11 rounded-full border border-border/30 bg-card/60 btn-press">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[92vw] rounded-2xl border-border/40 bg-card sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  value={newPlaylistName}
                  onChange={(event) => setNewPlaylistName(event.target.value)}
                  placeholder="Playlist name"
                  className="rounded-xl bg-accent/40"
                  onKeyDown={(event) => event.key === 'Enter' && handleCreatePlaylist()}
                />
                <Button onClick={handleCreatePlaylist} className="w-full rounded-xl border-0 btn-gradient text-primary-foreground">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2.5">
          <MiniStat label="Songs" value={`${allSongs.length}`} />
          <MiniStat label="Albums" value={`${albums.length}`} />
          <MiniStat label="Artists" value={`${artists.length}`} />
          <MiniStat label="Liked" value={`${likedSongs.length}`} />
        </div>

        <div className="-mx-4 mb-5 overflow-x-auto no-scrollbar px-4 md:mx-0 md:px-0 md:overflow-visible">
          <div className="flex w-max gap-2.5 pb-1 md:grid md:w-full md:grid-cols-4 md:gap-3 xl:grid-cols-8">
            {sections.map(({ value, label, shortLabel, icon: Icon, tone }) => {
              const active = activeSection === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveSection(value)}
                  className={`relative min-w-[132px] overflow-hidden rounded-[1.35rem] border px-3.5 py-3 text-left transition-all duration-300 btn-press md:min-w-0 md:px-4 md:py-4 ${
                    active
                      ? 'border-primary/30 bg-card shadow-[0_14px_30px_-24px_hsl(var(--primary)/0.45)]'
                      : 'border-border/30 bg-card/55 hover:bg-card/80'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tone} ${active ? 'opacity-100' : 'opacity-65'}`} />
                  <div className="relative">
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-primary text-primary-foreground' : 'bg-background/65 text-primary'}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground md:text-[15px]">{shortLabel}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground md:line-clamp-1">{label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5 rounded-[1.35rem] border border-border/30 bg-card/55 px-4 py-3 md:flex md:items-center md:justify-between md:px-5 md:py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Now Browsing</p>
          <div className="pt-1 md:flex-1 md:px-4 md:pt-0">
            <h2 className="text-lg font-bold text-foreground">{activeMeta.title}</h2>
            <p className="pt-0.5 text-xs text-muted-foreground md:text-sm">{activeMeta.detail}</p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:mt-0">
            <span>{activeSection === 'all' || activeSection === 'downloaded' ? `${allSongs.length} songs` : null}</span>
            <span>{activeSection === 'albums' ? `${albums.length} albums` : null}</span>
            <span>{activeSection === 'artists' ? `${artists.length} artists` : null}</span>
            <span>{activeSection === 'liked' ? `${likedSongs.length} liked` : null}</span>
            <span>{activeSection === 'playlists' ? `${playlists.length} playlists` : null}</span>
            <span>{activeSection === 'recent' ? `${recentlyPlayedSongs.length} recent` : null}</span>
            <span>{activeSection === 'mostPlayed' ? `${mostPlayedSongs.length} tracked` : null}</span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6 md:pb-10">
        {activeSection === 'all' && (
          <VirtualizedSongList
            songs={allSongs}
            maxHeightClassName="max-h-[62vh]"
            containerClassName="border border-border/25 bg-card/35 rounded-[1.4rem] px-2 py-2 md:px-3"
          />
        )}

        {activeSection === 'liked' && (
          likedSongs.length === 0 ? (
            <EmptyState icon={<Heart className="h-7 w-7 text-muted-foreground" />} title="No liked songs yet" detail="Tap the heart on any song to build this collection." />
          ) : (
            <VirtualizedSongList
              songs={likedSongs}
              maxHeightClassName="max-h-[62vh]"
              containerClassName="border border-border/25 bg-card/35 rounded-[1.4rem] px-2 py-2 md:px-3"
            />
          )
        )}

        {activeSection === 'recent' && (
          recentlyPlayedSongs.length === 0 ? (
            <EmptyState icon={<TimerReset className="h-7 w-7 text-muted-foreground" />} title="No recent songs yet" detail="Start playing to build your listening history." />
          ) : (
            <VirtualizedSongList
              songs={recentlyPlayedSongs}
              maxHeightClassName="max-h-[62vh]"
              containerClassName="border border-border/25 bg-card/35 rounded-[1.4rem] px-2 py-2 md:px-3"
            />
          )
        )}

        {activeSection === 'mostPlayed' && (
          mostPlayedSongs.length === 0 ? (
            <EmptyState icon={<TrendingUp className="h-7 w-7 text-muted-foreground" />} title="No top tracks yet" detail="Your most-played songs will show up here after a few sessions." />
          ) : (
            <VirtualizedSongList
              songs={mostPlayedSongs}
              maxHeightClassName="max-h-[62vh]"
              containerClassName="border border-border/25 bg-card/35 rounded-[1.4rem] px-2 py-2 md:px-3"
            />
          )
        )}

        {activeSection === 'downloaded' && (
          <VirtualizedSongList
            songs={allSongs}
            maxHeightClassName="max-h-[62vh]"
            containerClassName="border border-border/25 bg-card/35 rounded-[1.4rem] px-2 py-2 md:px-3"
          />
        )}

        {activeSection === 'albums' && (
          albums.length === 0 ? (
            <EmptyState icon={<Album className="h-7 w-7 text-muted-foreground" />} title="No albums yet" detail="Albums will appear here as songs are grouped." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {albums.map((album) => (
                <CompactMediaCard
                  key={album.name}
                  title={album.name}
                  subtitle={album.artist}
                  cover={album.cover}
                  onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
                />
              ))}
            </div>
          )
        )}

        {activeSection === 'artists' && (
          artists.length === 0 ? (
            <EmptyState icon={<Mic2 className="h-7 w-7 text-muted-foreground" />} title="No artists yet" detail="Artists will appear here from your imported songs." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {artists.map((artist) => (
                <CompactMediaCard
                  key={artist.name}
                  title={artist.name}
                  subtitle={`${artist.songCount} songs`}
                  cover={artist.cover}
                  circle
                  onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                />
              ))}
            </div>
          )
        )}

        {activeSection === 'playlists' && (
          playlists.length === 0 ? (
            <EmptyState icon={<LibraryBig className="h-7 w-7 text-muted-foreground" />} title="No playlists yet" detail="Create a playlist to start organizing your library." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {playlists.map((playlist) => (
                <CompactPlaylistCard
                  key={playlist.id}
                  name={playlist.name}
                  count={playlist.songIds.length}
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-border/30 bg-card/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{label}</p>
      <p className="pt-1 text-base font-bold text-foreground">{value}</p>
    </div>
  );
}

function CompactMediaCard({
  title,
  subtitle,
  cover,
  circle = false,
  onClick,
}: {
  title: string;
  subtitle: string;
  cover: string;
  circle?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[138px] flex-shrink-0 rounded-[1.2rem] border border-border/25 bg-card/50 p-2.5 text-left transition-colors hover:bg-card md:w-full"
    >
      <div className={`mb-2.5 overflow-hidden bg-muted ${circle ? 'rounded-full' : 'rounded-[1rem]'}`}>
        <img
          src={cover}
          alt={title}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full object-cover"
          onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
      </div>
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}

function CompactPlaylistCard({
  name,
  count,
  onClick,
}: {
  name: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[150px] flex-shrink-0 rounded-[1.2rem] border border-border/25 bg-card/50 p-3 text-left transition-colors hover:bg-card md:w-full"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
        <ListMusic className="h-5 w-5" />
      </div>
      <p className="truncate text-sm font-semibold text-foreground">{name}</p>
      <p className="truncate text-xs text-muted-foreground">{count} songs</p>
    </button>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-[1.6rem] border border-border/30 bg-card/40 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default LibraryPage;
