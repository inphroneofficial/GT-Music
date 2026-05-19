import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MusicProvider } from "@/contexts/MusicContext";
import { AppSidebar } from "@/components/AppSidebar";
import { NowPlayingBar } from "@/components/NowPlayingBar";
import { QueuePanel } from "@/components/QueuePanel";
import { FullScreenPlayer } from "@/components/FullScreenPlayer";
import { SplashScreen } from "@/components/SplashScreen";
import { AnimatedPage } from "@/components/AnimatedPage";
import { MobileNav } from "@/components/MobileNav";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu } from "lucide-react";

import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import AlbumPage from "./pages/AlbumPage";
import ArtistPage from "./pages/ArtistPage";
import PlaylistPage from "./pages/PlaylistPage";
import LikedSongsPage from "./pages/LikedSongsPage";
import SettingsPage from "./pages/SettingsPage";
import GenrePage from "./pages/GenrePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <SidebarProvider>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={`flex min-h-[100dvh] w-full transition-opacity duration-500 ${splashDone ? 'opacity-100' : 'opacity-0'}`}>
        {/* Sidebar hidden on mobile via CSS */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex min-h-[100dvh] flex-1 flex-col overflow-hidden bg-background">
          <header className="sticky top-0 z-30 hidden h-16 items-center border-b border-border/40 bg-background/75 px-4 backdrop-blur-xl md:flex lg:px-6 pt-safe">
            <div className="flex w-full items-center justify-between gap-4">
              <SidebarTrigger className="tap-target rounded-full text-muted-foreground transition-colors hover:text-foreground">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div className="flex items-center gap-3">
                <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground lg:block">
                  Personal music universe
                </p>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-hidden pl-safe pr-safe pt-safe md:pt-0 pb-[8.75rem] md:pb-28">
            <AnimatedPage>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/album/:name" element={<AlbumPage />} />
                <Route path="/artist/:name" element={<ArtistPage />} />
                <Route path="/playlist/:id" element={<PlaylistPage />} />
                <Route path="/liked" element={<LikedSongsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/genre/:name" element={<GenrePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatedPage>
          </main>
        </div>
      </div>
      <NowPlayingBar />
      <QueuePanel />
      <FullScreenPlayer />
      <MobileNav />
      <InstallPrompt />
      {/* Keyboard shortcuts helper - hidden component */}
      <div className="fixed bottom-20 right-4 z-40 hidden md:block">
        <KeyboardShortcuts />
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MusicProvider>
          <AppLayout />
        </MusicProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
