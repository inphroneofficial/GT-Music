import { useEffect, useMemo, useState } from 'react';
import { Cloud, CloudOff, Wifi, WifiOff, Zap } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkStatusIndicator() {
  const status = useNetworkStatus();
  const [dismissedOnlineAt, setDismissedOnlineAt] = useState(0);
  const [seenFirstOnline, setSeenFirstOnline] = useState(false);

  useEffect(() => {
    if (!status.isOnline) {
      setDismissedOnlineAt(0);
      setSeenFirstOnline(false);
      return;
    }

    setSeenFirstOnline(false);
    const timer = window.setTimeout(() => setSeenFirstOnline(true), 4200);
    return () => window.clearTimeout(timer);
  }, [status.isOnline, status.lastChanged]);

  const label = status.isOnline ? 'Online' : 'Offline';
  const detail = useMemo(() => {
    if (!status.isOnline) return 'Local songs stay ready. Cloud features wait for internet.';
    if (status.saveData) return 'Data saver detected. GT Music keeps artwork lighter.';
    if (status.downlink && status.downlink < 1.5) return 'Connected, but network is slow.';
    return 'Cloud-ready connection. Streaming and artwork can refresh.';
  }, [status.downlink, status.isOnline, status.saveData]);

  const connectionLabel = status.isOnline
    ? status.effectiveType && status.effectiveType !== 'online'
      ? status.effectiveType.toUpperCase()
      : 'LIVE'
    : 'LOCAL';

  const shouldCompactOnline = status.isOnline && seenFirstOnline;
  const hiddenOnline = status.isOnline && dismissedOnlineAt >= status.lastChanged;

  if (hiddenOnline) return null;

  return (
    <aside
      className={`network-status-tab ${status.isOnline ? 'is-online' : 'is-offline'} ${shouldCompactOnline ? 'is-compact' : ''}`}
      aria-live="polite"
      aria-label={`Network status: ${label}`}
    >
      <div className="network-status-glow" aria-hidden="true" />
      <div className="network-status-icon" aria-hidden="true">
        {status.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.22em]">{label}</span>
          <span className="rounded-full bg-background/35 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {connectionLabel}
          </span>
        </div>
        <p className="network-status-detail">{detail}</p>
      </div>
      <div className="network-status-bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {status.isOnline ? (
        <button
          type="button"
          onClick={() => setDismissedOnlineAt(status.lastChanged)}
          className="network-status-action"
          aria-label="Hide online status"
        >
          <Cloud className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="network-status-action" aria-hidden="true">
          <CloudOff className="h-3.5 w-3.5" />
        </div>
      )}
      <Zap className="network-status-spark" aria-hidden="true" />
    </aside>
  );
}
