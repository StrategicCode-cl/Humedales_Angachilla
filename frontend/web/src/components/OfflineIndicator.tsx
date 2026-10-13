'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-18 md:bottom-6 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-500/95 text-stone-950 px-3.5 py-2 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-300 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
    >
      <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
      <WifiOff className="w-4 h-4 text-stone-950 stroke-[2.5]" />
      <span>Modo Offline: Usando mapas y senderos en caché local sin señal celular.</span>
    </div>
  );
};
