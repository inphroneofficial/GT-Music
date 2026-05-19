import { useNavigate } from 'react-router-dom';
import { Play, ListPlus, ListMusic, Heart, User, Disc3, Plus } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { toast } from 'sonner';
import type { Song } from '@/types/music';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

interface SongContextMenuProps {
  song: Song;
  children: React.ReactNode;
}

export function SongContextMenu({ song, children }: SongContextMenuProps) {
  const navigate = useNavigate();
  const { addToQueue, playNext, isLiked, toggleLike, playlists, addToPlaylist, createPlaylist } = useMusic();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl animate-scale-in">
        <ContextMenuItem
          className="gap-3 rounded-lg cursor-pointer"
          onClick={() => { playNext(song); toast.success('Playing next'); }}
        >
          <Play className="w-4 h-4" /> Play Next
        </ContextMenuItem>
        <ContextMenuItem
          className="gap-3 rounded-lg cursor-pointer"
          onClick={() => { addToQueue(song); toast.success('Added to queue'); }}
        >
          <ListMusic className="w-4 h-4" /> Add to Queue
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/30" />

        <ContextMenuItem
          className="gap-3 rounded-lg cursor-pointer"
          onClick={() => {
            toggleLike(song.id);
            toast.success(isLiked(song.id) ? 'Removed from Liked' : 'Added to Liked Songs');
          }}
        >
          <Heart className={`w-4 h-4 ${isLiked(song.id) ? 'fill-primary text-primary' : ''}`} />
          {isLiked(song.id) ? 'Remove from Liked' : 'Like'}
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/30" />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-3 rounded-lg cursor-pointer">
            <ListPlus className="w-4 h-4" /> Add to Playlist
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-popover/95 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl">
            <ContextMenuItem
              className="gap-3 rounded-lg cursor-pointer text-primary"
              onClick={() => {
                const pl = createPlaylist(`Playlist ${Date.now()}`);
                addToPlaylist(pl.id, song.id);
                toast.success('Created playlist & added song');
              }}
            >
              <Plus className="w-4 h-4" /> New Playlist
            </ContextMenuItem>
            {playlists.map(pl => (
              <ContextMenuItem
                key={pl.id}
                className="rounded-lg cursor-pointer"
                onClick={() => {
                  addToPlaylist(pl.id, song.id);
                  toast.success(`Added to ${pl.name}`);
                }}
              >
                {pl.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="bg-border/30" />

        <ContextMenuItem
          className="gap-3 rounded-lg cursor-pointer"
          onClick={() => navigate(`/artist/${encodeURIComponent(song.artist)}`)}
        >
          <User className="w-4 h-4" /> Go to Artist
        </ContextMenuItem>
        <ContextMenuItem
          className="gap-3 rounded-lg cursor-pointer"
          onClick={() => navigate(`/album/${encodeURIComponent(song.album)}`)}
        >
          <Disc3 className="w-4 h-4" /> Go to Album
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
