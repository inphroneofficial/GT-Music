import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Music, Heart, LibraryBig } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { AlbumCard } from '@/components/MusicCards';
import { SongRow } from '@/components/SongRow';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { resolveSongCoverPath } from '@/lib/songMetadata';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { allSongs, playlists, likedSongIds, createPlaylist } = useMusic();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const likedSongs = useMemo(
    () => allSongs.filter(s => likedSongIds.includes(s.id)),
    [allSongs, likedSongIds]
  );

  const albums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; cover: string }>();
    allSongs.forEach(s => {
      if (!map.has(s.album)) map.set(s.album, { name: s.album, artist: s.artist, cover: resolveSongCoverPath(s.cover) });
    });
    return Array.from(map.values());
  }, [allSongs]);

  const artists = useMemo(() => {
    const map = new Map<string, { name: string; cover: string; songCount: number }>();
    allSongs.forEach(s => {
      if (!map.has(s.artist)) map.set(s.artist, { name: s.artist, cover: resolveSongCoverPath(s.cover), songCount: 0 });
      map.get(s.artist)!.songCount++;
    });
    return Array.from(map.values());
  }, [allSongs]);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setDialogOpen(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <SEO title="Library" description="Browse your playlists, albums, artists, and liked songs in GT Music." path="/library" />
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-40 max-w-full">
        <div className="flex items-center justify-between mb-5 md:mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Your Library</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-card btn-press tap-target">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 rounded-2xl animate-scale-in max-w-[92vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="bg-accent border-border/50 rounded-xl"
                  onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <Button onClick={handleCreatePlaylist} className="w-full btn-gradient text-primary-foreground rounded-xl border-0">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="playlists">
          <div className="-mx-4 md:mx-0 mb-5 md:mb-6 overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent gap-2 px-4 md:px-0 inline-flex w-max animate-fade-in" style={{ animationDelay: '100ms' }}>
              {['playlists', 'albums', 'artists', 'liked'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:btn-gradient data-[state=active]:text-primary-foreground data-[state=active]:border-0 bg-card border border-border/50 transition-all duration-200 btn-press whitespace-nowrap"
                >
                  {tab === 'liked' ? 'Liked Songs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="playlists">
            <div
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-gradient-to-r from-primary/15 to-primary/5 cursor-pointer hover:from-primary/20 transition-all duration-300 mb-4 border border-primary/10 animate-fade-in-scale"
              onClick={() => navigate('/liked')}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl btn-gradient flex items-center justify-center shadow-lg flex-shrink-0">
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground fill-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">Liked Songs</p>
                <p className="text-xs md:text-sm text-muted-foreground">{likedSongs.length} songs</p>
              </div>
            </div>

            {playlists.length === 0 && (
              <div className="text-center py-12 md:py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center animate-float">
                  <LibraryBig className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No playlists yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create one to get started</p>
              </div>
            )}
            <div className="space-y-1">
              {playlists.map((pl, i) => (
                <div
                  key={pl.id}
                  className="flex items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-card cursor-pointer transition-all duration-200 border border-transparent hover:border-border/30 animate-slide-in-left song-row-bar"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => navigate(`/playlist/${pl.id}`)}
                >
                  <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border/30 flex-shrink-0">
                    <Music className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">{pl.songIds.length} songs</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="albums">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {albums.map((a, i) => (
                <div key={a.name} className="animate-fade-in-scale" style={{ animationDelay: `${i * 50}ms` }}>
                  <AlbumCard
                    name={a.name}
                    artist={a.artist}
                    cover={a.cover}
                    onClick={() => navigate(`/album/${encodeURIComponent(a.name)}`)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="artists">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {artists.map((a, i) => (
                <div
                  key={a.name}
                  className="p-2.5 md:p-3 rounded-2xl bg-card/50 hover:bg-card transition-all cursor-pointer hover-card-lift animate-fade-in-scale"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => navigate(`/artist/${encodeURIComponent(a.name)}`)}
                >
                  <div className="w-full aspect-square rounded-full overflow-hidden mb-2 md:mb-3 bg-muted">
                    <img
                      src={a.cover}
                      alt={a.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-foreground truncate">{a.name}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{a.songCount} songs</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="liked">
            {likedSongs.length === 0 && (
              <div className="text-center py-12 md:py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-muted-foreground animate-pulse-glow" />
                </div>
                <p className="text-muted-foreground text-sm">No liked songs yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Start liking songs to see them here</p>
              </div>
            )}
            <div className="space-y-0.5">
              {likedSongs.map((song, i) => (
                <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${i * 40}ms` }}>
                  <SongRow song={song} index={i} context={likedSongs} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

export default LibraryPage;
