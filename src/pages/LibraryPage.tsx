import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Album,
  ChevronRight,
  Disc3,
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
import { AlbumCard } from '@/components/MusicCards';
import { VirtualizedSongList } from '@/components/VirtualizedSongList';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { resolveSongCoverPath } from '@/lib/songMetadata';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const tabs = [
  { value: 'all', label: 'All Songs' },
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
  { value: 'liked', label: 'Liked' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'recent', label: 'Recent' },
  { value: 'mostPlayed', label: 'Most Played' },
  { value: 'downloaded', label: 'Downloaded' },
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
  const [activeTab, setActiveTab] = useState('all');

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

  const collections = [
    { value: 'all', label: 'All Songs', detail: `${allSongs.length} tracks`, icon: Music, accent: 'from-primary/20 via-primary/10 to-transparent' },
    { value: 'albums', label: 'Albums', detail: `${albums.length} collections`, icon: Album, accent: 'from-sky-500/20 via-sky-500/10 to-transparent' },
    { value: 'artists', label: 'Artists', detail: `${artists.length} creators`, icon: Mic2, accent: 'from-emerald-500/20 via-emerald-500/10 to-transparent' },
    { value: 'liked', label: 'Liked', detail: `${likedSongs.length} saved`, icon: Heart, accent: 'from-rose-500/20 via-rose-500/10 to-transparent' },
    { value: 'playlists', label: 'Playlists', detail: `${playlists.length} custom`, icon: ListMusic, accent: 'from-cyan-500/20 via-cyan-500/10 to-transparent' },
    { value: 'recent', label: 'Recent', detail: `${recentlyPlayedSongs.length} sessions`, icon: TimerReset, accent: 'from-amber-500/20 via-amber-500/10 to-transparent' },
    { value: 'mostPlayed', label: 'Most Played', detail: `${mostPlayedSongs.length} top picks`, icon: TrendingUp, accent: 'from-violet-500/20 via-violet-500/10 to-transparent' },
    { value: 'downloaded', label: 'Downloaded', detail: `${allSongs.length} local`, icon: Download, accent: 'from-teal-500/20 via-teal-500/10 to-transparent' },
  ];

  const activeCollection = collections.find((entry) => entry.value === activeTab) ?? collections[0];

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setDialogOpen(false);
  };

  return (
    <ScrollArea className="h-full">
      <SEO title="Library" description="Browse every song, artist, album, and playlist inside GT Music." path="/library" />
      <div className="mx-auto max-w-7xl px-4 pb-40 pt-4 md:px-6 md:pt-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Your Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">Collections, artists, albums, and every song in one place.</p>
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

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Songs" value={`${allSongs.length}`} />
          <MiniStat label="Albums" value={`${albums.length}`} />
          <MiniStat label="Artists" value={`${artists.length}`} />
          <MiniStat label="Liked" value={`${likedSongs.length}`} />
        </div>

        <div className="-mx-4 mb-4 overflow-x-auto no-scrollbar px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-3 pb-1">
            {collections.map(({ value, label, detail, icon: Icon, accent }) => {
              const active = activeTab === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={`relative min-w-[170px] overflow-hidden rounded-[1.6rem] border p-4 text-left transition-all duration-300 btn-press ${
                    active
                      ? 'border-primary/30 bg-card shadow-[0_22px_45px_-28px_hsl(var(--primary)/0.5)]'
                      : 'border-border/30 bg-card/55 hover:bg-card/80'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${accent} ${active ? 'opacity-100' : 'opacity-70'}`} />
                  <div className="relative">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-primary text-primary-foreground' : 'bg-background/60 text-primary'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 rounded-[1.7rem] border border-border/30 bg-card/55 p-4 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Now Browsing</p>
              <h2 className="truncate pt-1 text-lg font-bold text-foreground">{activeCollection.label}</h2>
              <p className="truncate text-xs text-muted-foreground">{activeCollection.detail}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="-mx-4 mb-4 overflow-x-auto no-scrollbar md:mx-0">
            <TabsList className="inline-flex w-max gap-2 bg-transparent px-4 md:px-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="whitespace-nowrap rounded-full border border-border/40 bg-card px-4 py-2 text-sm font-medium data-[state=active]:btn-gradient data-[state=active]:border-transparent data-[state=active]:text-primary-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all">
            <VirtualizedSongList songs={allSongs} maxHeightClassName="max-h-[58vh] md:max-h-[62vh]" />
          </TabsContent>

          <TabsContent value="albums">
            {albums.length === 0 ? (
              <EmptyState icon={<Album className="h-7 w-7 text-muted-foreground" />} title="No albums yet" detail="Albums will appear here as songs are grouped." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.name}
                    name={album.name}
                    artist={album.artist}
                    cover={album.cover}
                    onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="artists">
            {artists.length === 0 ? (
              <EmptyState icon={<Mic2 className="h-7 w-7 text-muted-foreground" />} title="No artists yet" detail="Artists will appear here from your imported songs." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {artists.map((artist) => (
                  <button
                    key={artist.name}
                    className="rounded-[1.6rem] border border-border/30 bg-card/55 p-3 text-left transition-colors hover:bg-card"
                    onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                  >
                    <div className="mb-3 aspect-square overflow-hidden rounded-full bg-muted">
                      <img
                        src={artist.cover}
                        alt={artist.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </div>
                    <p className="truncate text-sm font-semibold text-foreground">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.songCount} songs</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            {likedSongs.length === 0 ? (
              <EmptyState icon={<Heart className="h-7 w-7 text-muted-foreground" />} title="No liked songs yet" detail="Tap the heart on any song to build this collection." />
            ) : (
              <VirtualizedSongList songs={likedSongs} maxHeightClassName="max-h-[58vh] md:max-h-[62vh]" />
            )}
          </TabsContent>

          <TabsContent value="playlists">
            <div className="mb-4 flex cursor-pointer items-center gap-4 rounded-[1.6rem] border border-primary/10 bg-gradient-to-r from-primary/15 to-primary/5 p-4" onClick={() => navigate('/liked')}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl btn-gradient">
                <Heart className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground">Liked Songs</p>
                <p className="text-sm text-muted-foreground">{likedSongs.length} songs</p>
              </div>
            </div>

            {playlists.length === 0 ? (
              <EmptyState icon={<LibraryBig className="h-7 w-7 text-muted-foreground" />} title="No playlists yet" detail="Create a playlist to start organizing your library." />
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    className="flex w-full items-center gap-4 rounded-[1.35rem] border border-border/25 bg-card/45 p-3 text-left transition-all hover:border-border/40 hover:bg-card"
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/30 bg-card">
                      <ListMusic className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">{playlist.songIds.length} songs</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            {recentlyPlayedSongs.length === 0 ? (
              <EmptyState icon={<TimerReset className="h-7 w-7 text-muted-foreground" />} title="No recent songs yet" detail="Start playing to build your listening history." />
            ) : (
              <VirtualizedSongList songs={recentlyPlayedSongs} maxHeightClassName="max-h-[58vh] md:max-h-[62vh]" />
            )}
          </TabsContent>

          <TabsContent value="mostPlayed">
            {mostPlayedSongs.length === 0 ? (
              <EmptyState icon={<TrendingUp className="h-7 w-7 text-muted-foreground" />} title="No top tracks yet" detail="Your most-played songs will show up here after a few sessions." />
            ) : (
              <VirtualizedSongList songs={mostPlayedSongs} maxHeightClassName="max-h-[58vh] md:max-h-[62vh]" />
            )}
          </TabsContent>

          <TabsContent value="downloaded">
            <VirtualizedSongList songs={allSongs} maxHeightClassName="max-h-[58vh] md:max-h-[62vh]" />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-border/30 bg-card/50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
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
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[1.75rem] border border-border/30 bg-card/40 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default LibraryPage;
