import { Home, Search, Library, Disc3, Settings, Sparkles } from 'lucide-react';
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
  { title: 'Your Mood', url: '/mood', icon: Sparkles },
  { title: 'Your Library', url: '/library', icon: Library },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { playlists } = useMusic();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className={`bg-sidebar pt-6 ${collapsed ? 'items-center px-2' : ''}`}>
        {/* Logo */}
        <div className={`flex animate-fade-in items-center ${collapsed ? 'justify-center pb-5' : 'gap-3 px-5 pb-6'}`}>
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
          {!collapsed ? <ThemeToggle compact /> : null}
        </div>

        {/* Main nav */}
        <SidebarGroup className={collapsed ? 'w-full px-0' : undefined}>
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? 'items-center space-y-2' : 'space-y-2'}>
              {navItems.map((item, i) => (
                <SidebarMenuItem
                  key={item.title}
                  className={`animate-fade-in ${collapsed ? 'flex justify-center' : ''}`}
                  style={{ animationDelay: `${(i + 1) * 80}ms` }}
                >
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                    className={collapsed ? 'h-12 w-12 rounded-2xl p-0' : 'h-11'}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      aria-label={item.title}
                      className={`group/nav relative flex items-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground ${
                        collapsed ? 'h-12 w-12 justify-center px-0' : 'gap-4 px-5'
                      }`}
                      activeClassName="active text-foreground font-semibold bg-sidebar-accent shadow-sm"
                    >
                      <div
                        className={`absolute rounded-full bg-primary transition-all duration-300 ${
                          collapsed
                            ? 'right-2 top-2 h-1.5 w-1.5 opacity-0 group-[.active]/nav:opacity-100'
                            : 'left-0 top-1/2 h-0 w-1 -translate-y-1/2 group-[.active]/nav:h-5'
                        }`}
                      />
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
