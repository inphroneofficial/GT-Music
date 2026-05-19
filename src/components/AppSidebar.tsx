import { Home, Search, Library, Disc3, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useMusic } from '@/contexts/MusicContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Search', url: '/search', icon: Search },
  { title: 'Your Library', url: '/library', icon: Library },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { playlists } = useMusic();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar pt-6">
        {/* Logo */}
        <div className="px-5 pb-6 flex items-center gap-3 animate-fade-in">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center flex-shrink-0 shadow-lg glow-amber">
            <Disc3 className="w-5 h-5 text-primary-foreground animate-spin-slow" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <span className="block text-lg font-extrabold tracking-tight text-foreground">
                GT Music
              </span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Play anywhere
              </span>
            </div>
          ) : null}
          <ThemeToggle compact />
        </div>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, i) => (
                <SidebarMenuItem key={item.title} className="animate-fade-in" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-4 px-5 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-xl group/nav relative"
                      activeClassName="text-foreground font-semibold bg-sidebar-accent"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-full bg-primary transition-all duration-300 group-[.active]/nav:h-5" />
                      <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Playlists */}
        {!collapsed && playlists.length > 0 && (
          <div className="mt-6 px-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="h-px bg-border/50 mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 px-2">
              Playlists
            </p>
            <div className="space-y-0.5">
              {playlists.map((pl, i) => (
                <NavLink
                  key={pl.id}
                  to={`/playlist/${pl.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground truncate py-2 px-2 rounded-lg transition-all duration-200 hover:translate-x-1 animate-fade-in"
                  style={{ animationDelay: `${(i + 4) * 50}ms` }}
                  activeClassName="text-foreground bg-sidebar-accent"
                >
                  {pl.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
