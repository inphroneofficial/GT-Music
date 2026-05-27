import { useEffect, useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const DISMISS_KEY = 'gt-install-dismissed-v1';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;
    if (standalone) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setTimeout(() => setShow(true), 8000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (isIOS) {
      setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 8000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') dismiss();
    setDeferred(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-32 md:bottom-28 left-3 right-3 md:left-auto md:right-6 md:w-80 z-[70] animate-slide-up">
      <div className="glass-strong rounded-2xl shadow-2xl p-4 border border-primary/20">
        <button onClick={dismiss} className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/30">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <p className="font-semibold text-sm text-foreground">Install GT Music</p>
            {iosHint ? (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Tap <Share className="inline w-3 h-3 mx-0.5" /> then <span className="inline-flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add to Home Screen</span>.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Get full-screen, faster access — feels like a native app.
              </p>
            )}
            {!iosHint && (
              <Button size="sm" onClick={install} className="mt-3 btn-gradient text-primary-foreground h-8 px-3 text-xs">
                Install app
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
