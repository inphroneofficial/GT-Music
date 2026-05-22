import { lazy, Suspense, useState, useCallback } from "react";
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
import { Menu } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const AlbumPage = lazy(() => import("./pages/AlbumPage"));
const ArtistPage = lazy(() => import("./pages/ArtistPage"));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage"));
const LikedSongsPage = lazy(() => import("./pages/LikedSongsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const GenrePage = lazy(() => import("./pages/GenrePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
              <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground lg:block">
                Personal music universe
              </p>
            </div>
          </header>
          <main className="flex-1 overflow-hidden pl-safe pr-safe pt-safe md:pt-0 pb-[8.75rem] md:pb-28">
            <AnimatedPage>
              <Suspense fallback={<RouteFallback />}>
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
              </Suspense>
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

const RouteFallback = () => (
  <div className="h-full min-h-[40vh] bg-background">
    <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-border/30 bg-card/40 p-6 backdrop-blur-xl">
        <div className="mb-4 h-3 w-28 rounded-full bg-muted shimmer" />
        <div className="mb-3 h-10 w-2/3 rounded-2xl bg-muted shimmer" />
        <div className="h-24 rounded-[1.5rem] bg-muted shimmer" />
      </div>
    </div>
  </div>
);

export default App;
