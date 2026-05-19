import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Shuffle, Trash2, Pencil, Plus, Clock, Music } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { SongCover } from '@/components/SongCover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/formatTime';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const PlaylistPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allSongs, playlists, playSong, deletePlaylist, renamePlaylist, addToPlaylist } = useMusic();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [addingSongs, setAddingSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const playlist = playlists.find(p => p.id === id);
  const songs = useMemo(
    () => playlist ? playlist.songIds.map(sid => allSongs.find(s => s.id === sid)).filter(Boolean) as typeof allSongs : [],
    [playlist, allSongs]
  );

  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0);

  const availableSongs = useMemo(() => {
    if (!playlist) return [];
    const q = searchQuery.toLowerCase();
    return allSongs
      .filter(s => !playlist.songIds.includes(s.id))
      .filter(s => !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  }, [allSongs, playlist, searchQuery]);

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground animate-fade-in">
        Playlist not found
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="pb-32">
        {/* Header */}
        <div className="relative p-6 pb-8 flex items-end gap-6 animate-fade-in">
          <div className="absolute inset-0 mesh-gradient" />
          <div className="relative z-10 flex items-end gap-6">
            <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] rounded-2xl bg-gradient-to-br from-primary/30 to-accent shadow-2xl flex items-center justify-center gradient-border animate-fade-in-scale">
              <Music className="w-14 h-14 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 animate-fade-in" style={{ animationDelay: '100ms' }}>Playlist</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight animate-fade-in" style={{ animationDelay: '150ms' }}>{playlist.name}</h1>
              <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
                {songs.length} songs{songs.length > 0 && ` · ${formatTime(totalDuration)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
          {songs.length > 0 && (
            <>
              <button
                onClick={() => playSong(songs[0], songs)}
                className="w-13 h-13 rounded-full btn-gradient flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg glow-amber animate-glow-pulse btn-press"
              >
                <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
              </button>
              <Button variant="ghost" className="rounded-full btn-press" onClick={() => {
                const shuffled = [...songs].sort(() => Math.random() - 0.5);
                if (shuffled[0]) playSong(shuffled[0], shuffled);
              }}>
                <Shuffle className="w-4 h-4 mr-2" /> Shuffle
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="rounded-full btn-press" onClick={() => { setNewName(playlist.name); setRenaming(true); }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full btn-press" onClick={() => setAddingSongs(true)}>
            <Plus className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full btn-press">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border/50 rounded-2xl animate-scale-in">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Delete playlist?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-accent border-0 rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground rounded-xl"
                  onClick={() => { deletePlaylist(playlist.id); navigate('/library'); }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Song list */}
        {songs.length > 0 ? (
          <div className="px-2">
            <div className="flex items-center gap-4 px-8 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] border-b border-border/30 mx-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Title</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            {songs.map((song, i) => (
              <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${(i * 40) + 350}ms` }}>
                <SongRow song={song} index={i} context={songs} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center animate-float">
              <Music className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="mb-4 text-sm text-muted-foreground">This playlist is empty</p>
            <Button onClick={() => setAddingSongs(true)} className="btn-gradient text-primary-foreground rounded-full border-0 btn-press">
              <Plus className="w-4 h-4 mr-2" /> Add Songs
            </Button>
          </div>
        )}

        {/* Rename dialog */}
        <Dialog open={renaming} onOpenChange={setRenaming}>
          <DialogContent className="bg-card border-border/50 rounded-2xl animate-scale-in">
            <DialogHeader>
              <DialogTitle className="text-foreground">Rename Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="bg-accent border-border/50 rounded-xl"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newName.trim()) {
                    renamePlaylist(playlist.id, newName.trim());
                    setRenaming(false);
                  }
                }}
              />
              <Button
                className="w-full btn-gradient text-primary-foreground rounded-xl border-0"
                onClick={() => { renamePlaylist(playlist.id, newName.trim()); setRenaming(false); }}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add songs dialog */}
        <Dialog open={addingSongs} onOpenChange={setAddingSongs}>
          <DialogContent className="bg-card border-border/50 max-w-lg max-h-[80vh] flex flex-col rounded-2xl animate-scale-in">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Songs</DialogTitle>
            </DialogHeader>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search songs..."
              className="bg-accent border-border/50 mb-2 rounded-xl"
            />
            <ScrollArea className="flex-1">
              <div className="space-y-0.5">
                {availableSongs.map((song, i) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent cursor-pointer transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => addToPlaylist(playlist.id, song.id)}
                  >
                    <SongCover
                      song={song}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-foreground">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};

export default PlaylistPage;
