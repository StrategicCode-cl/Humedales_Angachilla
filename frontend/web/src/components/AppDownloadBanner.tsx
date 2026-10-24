'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { AngachillaIcon } from './AngachillaIcon';

// Paste the store URLs here once the app is published. While a link is empty its button reads "Muy pronto".
export const STORE_LINKS = {
  android: '',
  ios: '',
};

const DISMISS_KEY = 'angachilla_app_banner_dismissed';
// Moss drawn with an SVG noise filter (public/texturas/musgo.svg, under 1 KB), after the "texturas vivas"
const MOSS = "bg-[#052e20] bg-[url('/texturas/musgo.svg')] text-white";
const DESKTOP_SECONDS = 35;

type Platform = 'android' | 'ios' | 'desktop';
type Mode = 'phone' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  // iPadOS reports itself as a Mac with touch
  if (/iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

function isInstalledApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    sessionStorage.setItem(DISMISS_KEY, 'true');
  } catch {
    // Private mode or blocked storage: the banner simply returns on the next page
  }
}

const StoreButton: React.FC<{ store: 'android' | 'ios'; compact?: boolean }> = ({ store, compact }) => {
  const href = STORE_LINKS[store];
  const name = store === 'android' ? 'Google Play' : 'App Store';
  const base = `inline-flex flex-col justify-center rounded-md px-3 text-left leading-tight shrink-0 ${compact ? 'h-11' : 'h-12'}`;
  if (!href) {
    return (
      <span className={`${base} bg-white/10 text-white/85 ring-1 ring-inset ring-white/25`} aria-disabled="true">
        <span className="text-[11px]">Muy pronto en</span>
        <span className="text-sm font-semibold">{name}</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-950 transition-colors`}
    >
      <span className="text-[11px] text-stone-600">Descargar en</span>
      <span className="text-sm font-semibold">{name}</span>
    </a>
  );
};

/**
 * Invitation to download Angachilla App. Drop it at the end of any screen:
 * on a phone it stays docked at the bottom until closed; on a computer it shows for 5 seconds
 * in the bottom-right corner (paused while the pointer or focus is on it).
 * Closing it hides it for the rest of the browser session. Hidden inside the installed app.
 */
export const AppDownloadBanner: React.FC<{ bottomOffsetClass?: string }> = ({ bottomOffsetClass = 'bottom-0' }) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DESKTOP_SECONDS * 1000);

  // Decide after mount (needs window); a short delay lets the page settle first
  useEffect(() => {
    if (readDismissed() || isInstalledApp()) return;
    const timer = window.setTimeout(() => {
      setPlatform(detectPlatform());
      setMode(window.matchMedia('(max-width: 767px)').matches ? 'phone' : 'desktop');
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    rememberDismissed();
    setLeaving(true);
    window.setTimeout(() => setMode(null), 200);
  };

  // Computer: hide after 5 seconds of being seen; hover or focus pauses the count
  useEffect(() => {
    if (mode !== 'desktop' || paused || leaving) return;
    const started = Date.now();
    const timer = window.setTimeout(() => {
      rememberDismissed();
      setLeaving(true);
      window.setTimeout(() => setMode(null), 200);
    }, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [mode, paused, leaving]);

  if (!mode) return null;

  const closeButton = (
    <button
      type="button"
      onClick={close}
      aria-label="Cerrar aviso de descarga"
      className="w-9 h-9 -mr-1 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white shrink-0"
    >
      <X className="w-4 h-4" />
    </button>
  );

  if (mode === 'phone') {
    const store: 'android' | 'ios' = platform === 'ios' ? 'ios' : 'android';
    return (
      <>
        {/* Keeps the end of the page reachable above the docked bar */}
        <div aria-hidden="true" className="h-20 shrink-0" />
        <aside
          aria-label="Descarga la app"
          className={`fixed inset-x-0 ${bottomOffsetClass} z-[55] ${MOSS} shadow-[0_-4px_16px_rgba(0,0,0,0.18)] pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
            leaving ? 'translate-y-full' : 'translate-y-0 animate-[app-banner-up_240ms_ease-out]'
          }`}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <AngachillaIcon className="w-11 h-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-tight">Angachilla App</p>
              <p className="mt-0.5 text-[13px] font-medium leading-snug text-white/90">Mapa sin señal, especies y tótems QR.</p>
            </div>
            <StoreButton store={store} compact />
            {closeButton}
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside
      aria-label="Descarga la app"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`fixed right-6 bottom-6 z-[55] w-[22rem] rounded-lg ${MOSS} shadow-2xl overflow-hidden transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
        leaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 animate-[app-banner-in_240ms_ease-out]'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <AngachillaIcon className="w-12 h-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight">Lleva el humedal en tu teléfono</p>
          <p className="mt-1 text-sm font-medium leading-snug text-white/90">
            Angachilla App: mapa de senderos sin señal, guía de especies y tótems QR.
          </p>
        </div>
        {closeButton}
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <StoreButton store="android" />
        <StoreButton store="ios" />
      </div>
      {/* Time left before it hides itself */}
      <div className="h-1 bg-black/25" aria-hidden="true">
        <div
          className="h-full bg-emerald-300 origin-left animate-[app-banner-timer_linear_forwards] motion-reduce:hidden"
          style={{ animationDuration: `${DESKTOP_SECONDS}s`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </div>
    </aside>
  );
};
