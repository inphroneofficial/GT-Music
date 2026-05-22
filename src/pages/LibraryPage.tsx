import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Album, Disc3, Download, Heart, LibraryBig, ListMusic, Mic2, Music, Plus, TimerReset, TrendingUp } from 'lucide-react';
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
  { value: 'recent', label: 'Recently Played' },
  { value: 'mostPlayed', label: 'Most Played' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'liked', label: 'Liked' },
  { value: 'downloaded', label: 'Downloaded' },
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
  { value: 'playlists', label: 'Playlists' },
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

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setDialogOpen(false);
  };

  const collections = [
    { value: 'all', label: 'All Songs', detail: `${allSongs.length} tracks`, icon: Music, accent: 'from-primary/20 to-primary/5' },
    { value: 'albums', label: 'Albums', detail: `${albums.length} collections`, icon: Album, accent: 'from-sky-500/20 to-sky-500/5' },
    { value: 'artists', label: 'Artists', detail: `${artists.length} creators`, icon: Mic2, accent: 'from-emerald-500/20 to-emerald-500/5' },
    { value: 'liked', label: 'Liked', detail: `${likedSongs.length} saved`, icon: Heart, accent: 'from-rose-500/20 to-rose-500/5' },
    { value: 'favorites', label: 'Favorites', detail: `${likedSongs.length} quick picks`, icon: Disc3, accent: 'from-fuchsia-500/20 to-fuchsia-500/5' },
    { value: 'recent', label: 'Recent', detail: `${recentlyPlayedSongs.length} sessions`, icon: TimerReset, accent: 'from-amber-500/20 to-amber-500/5' },
    { value: 'mostPlayed', label: 'Most Played', detail: `${mostPlayedSongs.length} trending for you`, icon: TrendingUp, accent: 'from-violet-500/20 to-violet-500/5' },
    { value: 'playlists', label: 'Playlists', detail: `${playlists.length} custom lists`, icon: ListMusic, accent: 'from-cyan-500/20 to-cyan-500/5' },
    { value: 'downloaded', label: 'Downloaded', detail: `${allSongs.length} offline-ready`, icon: Download, accent: 'from-teal-500/20 to-teal-500/5' },
  ];

  return (
    <ScrollArea className="h-full">
      <SEO title="Library" description="Browse every song, artist, album, and playlist inside GT Music." path="/library" />
      <div className="px-4 pb-40 pt-4 md:px-6 md:pt-6">
        <div className="mb-5 flex items-center justify-between gap-3 md:mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Your Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">Everything imported, organized, and ready to play.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full btn-press">
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

        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Music className="h-5 w-5 text-primary" />} label="All Songs" value={`${allSongs.length}`} detail="Full imported catalog" />
          <StatCard icon={<TimerReset className="h-5 w-5 text-primary" />} label="Recent" value={`${recentlyPlayedSongs.length}`} detail="Last listening sessions" />
          <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Most Played" value={`${mostPlayedSongs.length}`} detail="Based on your real history" />
          <StatCard icon={<Download className="h-5 w-5 text-primary" />} label="Downloaded" value={`${allSongs.length}`} detail="Available locally in GT Music" />
        </div>

        <div className="-mx-4 mb-5 overflow-x-auto no-scrollbar px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-3 pb-1">
            {collections.map(({ value, label, detail, icon: Icon, accent }) => {
              const active = activeTab === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={`group relative min-w-[168px] overflow-hidden rounded-[1.7rem] border px-4 py-4 text-left transition-all duration-300 btn-press ${
                    active
                      ? 'border-primary/30 bg-card shadow-[0_24px_50px_-28px_hsl(var(--primary)/0.55)]'
                      : 'border-border/30 bg-card/55 hover:bg-card/80'
                  }`}
                >
                  <div className={`absolute inset-0 rounded-[1.7rem] bg-gradient-to-br ${accent} ${active ? 'opacity-100' : 'opacity-70'}`} />
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="-mx-4 mb-5 overflow-x-auto no-scrollbar md:mx-0">
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
            <VirtualizedSongList songs={allSongs} />
          </TabsContent>

          <TabsContent value="recent">
            {recentlyPlayedSongs.length === 0 ? <EmptyState icon={<TimerReset className="h-7 w-7 text-muted-foreground" />} title="No recent songs yet" detail="Start playing to build your history." /> : <VirtualizedSongList songs={recentlyPlayedSongs} />}
          </TabsContent>

          <TabsContent value="mostPlayed">
            {mostPlayedSongs.length === 0 ? <EmptyState icon={<TrendingUp className="h-7 w-7 text-muted-foreground" />} title="No play analytics yet" detail="Your most-played tracks will appear here after a few sessions." /> : <VirtualizedSongList songs={mostPlayedSongs} />}
          </TabsContent>

          <TabsContent value="favorites">
            {likedSongs.length === 0 ? <EmptyState icon={<Heart className="h-7 w-7 text-muted-foreground" />} title="No favorites yet" detail="Tap the heart on any song to save it here." /> : <VirtualizedSongList songs={likedSongs} />}
          </TabsContent>

          <TabsContent value="liked">
            {likedSongs.length === 0 ? <EmptyState icon={<Heart className="h-7 w-7 text-muted-foreground" />} title="No liked songs yet" detail="Liked songs will appear here as their own collection." /> : <VirtualizedSongList songs={likedSongs} />}
          </TabsContent>

          <TabsContent value="downloaded">
            <VirtualizedSongList songs={allSongs} />
          </TabsContent>

          <TabsContent value="albums">
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
          </TabsContent>

          <TabsContent value="artists">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {artists.map((artist) => (
                <button
                  key={artist.name}
                  className="rounded-2xl border border-border/30 bg-card/50 p-3 text-left transition-colors hover:bg-card"
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
          </TabsContent>

          <TabsContent value="playlists">
            <div
              className="mb-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/15 to-primary/5 p-4"
              onClick={() => navigate('/liked')}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl btn-gradient">
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
              <div className="space-y-1">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    className="flex w-full items-center gap-4 rounded-xl border border-transparent p-3 text-left transition-all hover:border-border/30 hover:bg-card"
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/30 bg-card">
                      <Music className="h-5 w-5 text-muted-foreground" />
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
        </Tabs>
      </div>
    </ScrollArea>
  );
};

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-border/30 bg-card/50 p-4">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-background/50">
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
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
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.75rem] border border-border/30 bg-card/40 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default LibraryPage;
