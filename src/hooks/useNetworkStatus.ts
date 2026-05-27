import { useEffect, useState } from 'react';

type NetworkInformationLike = EventTarget & {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
};

export type NetworkStatus = {
  isOnline: boolean;
  effectiveType: string;
  downlink: number | null;
  saveData: boolean;
  lastChanged: number;
};

const getConnection = () => {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as NavigatorWithConnection;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
};

const readNetworkStatus = (lastChanged = Date.now()): NetworkStatus => {
  const connection = getConnection();

  return {
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    effectiveType: connection?.effectiveType ?? 'online',
    downlink: typeof connection?.downlink === 'number' ? connection.downlink : null,
    saveData: Boolean(connection?.saveData),
    lastChanged,
  };
};

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(() => readNetworkStatus());

  useEffect(() => {
    const update = () => setStatus(readNetworkStatus());
    const updateConnectionOnly = () => setStatus((existing) => readNetworkStatus(existing.lastChanged));
    const connection = getConnection();

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    connection?.addEventListener?.('change', updateConnectionOnly);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      connection?.removeEventListener?.('change', updateConnectionOnly);
    };
  }, []);

  return status;
}
