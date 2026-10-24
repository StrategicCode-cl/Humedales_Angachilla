'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { useIsOnline } from '../lib/connectivity';

const OFFLINE_TOAST_MS = 5000;
const BACK_TOAST_MS = 2500;

/**
 * Short notice when the connection drops and when it returns. While offline, the lasting
 * signal is the small ConnectionStatus in the top bar, not a banner over the content.
 */
export const OfflineIndicator: React.FC = () => {
  const online = useIsOnline();
  const [toast, setToast] = useState<'offline' | 'back' | null>(null);

  // React to changes only: nothing shows on a normal page load
  const [previous, setPrevious] = useState(online);
  if (previous !== online) {
    setPrevious(online);
    setToast(online ? 'back' : 'offline');
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast === 'offline' ? OFFLINE_TOAST_MS : BACK_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[70] left-4 right-4 top-[4.25rem] sm:left-auto sm:right-6 sm:top-auto sm:bottom-6 sm:w-[22rem] lg:bottom-6 rounded-lg bg-stone-900 text-white shadow-2xl px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 sm:slide-in-from-bottom-2 duration-200 motion-reduce:animate-none"
    >
      {toast === 'offline' ? (
        <>
          <WifiOff className="w-5 h-5 mt-0.5 text-amber-300 shrink-0" />
          <p className="min-w-0 flex-1 text-sm leading-snug">
            <span className="block font-semibold">Sin conexión</span>
            <span className="text-stone-300">Lo que ya cargaste sigue a la vista. Fotos, mapa y publicaciones nuevas cargarán al volver la señal.</span>
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar aviso"
            className="w-8 h-8 -mr-2 -mt-1 rounded-md flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <Wifi className="w-5 h-5 mt-0.5 text-emerald-300 shrink-0" />
          <p className="text-sm font-semibold leading-snug">Conexión restablecida</p>
        </>
      )}
    </div>
  );
};

/** Lasting, quiet signal for the top bar while offline: an icon on phones, icon and words on wider screens */
export const ConnectionStatus: React.FC = () => {
  const online = useIsOnline();
  if (online) return null;
  return (
    <span
      role="status"
      title="Sin conexión a internet"
      className="inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold"
    >
      <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Sin conexión</span>
    </span>
  );
};
