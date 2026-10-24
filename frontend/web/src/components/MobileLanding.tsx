'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { User } from '../types';
import { resolveMediaUrl } from '../lib/api';
import { AngachillaIcon } from './AngachillaIcon';
import { AppDownloadBanner } from './AppDownloadBanner';

export type GalleryItem =
  | { kind: 'station'; title: string; code: string; note: string; image: string }
  | { kind: 'species'; title: string; scientific: string; note: string; image: string };

export interface SummaryItem {
  tab: string;
  figure: string | null;
  label: string;
  text: string;
  action: string;
}

interface MobileLandingProps {
  currentUser: User | null;
  onEnterApp: (targetTab?: string) => void;
  onOpenAuth: () => void;
  summary: SummaryItem[];
  gallery: GalleryItem[];
}

/**
 * Welcome screen for phones. Light ground so the reserve's full-colour logo reads as it was drawn,
 * the logo as the page title, one photograph of the wetland and the two actions within thumb reach.
 */
export const MobileLanding: React.FC<MobileLandingProps> = ({ currentUser, onEnterApp, onOpenAuth, summary, gallery }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  // Entrance for the blocks below the first screen; content stays visible without script
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-shown');
            observer.unobserve(entry.target);
          }
        }),
      { rootMargin: '0px 0px -6% 0px' }
    );
    root.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="min-h-[100dvh] bg-[#f7f5f0] text-stone-900 flex flex-col">
      {/* Top: the app's mark and the session */}
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <span className="flex items-center gap-2">
          <AngachillaIcon className="w-9 h-9 rounded-[23%] ring-1 ring-stone-300" />
          <span className="text-sm font-semibold text-stone-800">Angachilla App</span>
        </span>
        {currentUser ? (
          <button type="button" onClick={() => onEnterApp('perfil')} className="h-10 px-1 text-sm font-medium text-stone-800 underline underline-offset-2">
            Hola, {currentUser.name.split(' ')[0]}
          </button>
        ) : (
          <button type="button" onClick={onOpenAuth} className="h-10 px-1 text-sm font-medium text-stone-800 underline underline-offset-2">
            Iniciar sesión
          </button>
        )}
      </header>

      {/* First screen */}
      <main className="px-5 pt-5">
        <h1>
          <img
            src={resolveMediaUrl('/api/media/slug/svg-logo-reserva-comunitaria')}
            alt="Reserva Comunitaria Bosque Humedal Angachilla"
            className="w-full max-w-[22rem] h-auto"
            fetchPriority="high"
          />
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-stone-800">
          20 hectáreas protegidas por la comunidad en Valdivia. Recorre sus senderos con GPS, escanea los tótems de cada
          estación y conoce sus especies.
        </p>

        <div className="mt-5 overflow-hidden rounded-md bg-stone-300 aspect-[16/10]">
          <img
            src={resolveMediaUrl('/api/media/slug/estacion-s2-foto-3')}
            alt="Laguna de los Pinos reflejando el cielo"
            className="w-full h-full object-cover slow-drift"
          />
        </div>

        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            onClick={() => onEnterApp('avisos')}
            className="h-12 rounded-md bg-emerald-900 active:bg-emerald-950 text-white text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            Entrar al humedal
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onEnterApp('mapa')}
            className="h-12 rounded-md border border-stone-400 bg-white active:bg-stone-100 text-stone-950 text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Compass className="w-5 h-5 text-stone-500" />
            Recorrer el mapa
          </button>
        </div>
      </main>

      {/* The wetland in figures */}
      <section aria-labelledby="cifras-titulo" className="px-5 pt-12">
        <h2 id="cifras-titulo" data-reveal className="text-xl font-semibold tracking-tight text-stone-950">
          El humedal en cifras
        </h2>
        <div data-reveal className="mt-3 grid grid-cols-2 gap-px rounded-md overflow-hidden bg-stone-300">
          {summary.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => onEnterApp(item.tab)}
              className="bg-white active:bg-stone-50 p-4 text-left flex flex-col min-h-[7.5rem]"
            >
              {item.figure ? (
                <span className="font-display text-[26px] font-semibold leading-none tracking-tight text-stone-950 tabular-nums">{item.figure}</span>
              ) : (
                <span aria-hidden="true" className="block h-[26px] w-12 rounded bg-stone-200" />
              )}
              <span className="mt-1.5 text-sm font-medium text-stone-800">{item.label}</span>
              <span className="mt-auto pt-2 text-[13px] font-semibold text-emerald-900 inline-flex items-center gap-1">
                {item.action}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Stations and species, by swipe */}
      <section aria-labelledby="galeria-movil-titulo" className="pt-12">
        <div className="px-5" data-reveal>
          <h2 id="galeria-movil-titulo" className="text-xl font-semibold tracking-tight text-stone-950">
            Estaciones y especies
          </h2>
          <p className="mt-1 text-base text-stone-700">Desliza para ver el sendero y quiénes viven en él.</p>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-5 px-5 pb-2 scrollbar-none">
          {gallery.map(item => {
            const isSpecies = item.kind === 'species';
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onEnterApp(isSpecies ? 'catalogo' : 'mapa')}
                className="snap-start shrink-0 w-[72%] text-left"
              >
                <span className={`block aspect-[4/3] rounded-md overflow-hidden ${isSpecies ? 'bg-[#eae5da]' : 'bg-stone-300'}`}>
                  <img
                    src={resolveMediaUrl(item.image)}
                    alt={isSpecies ? `Ilustración de ${item.title}` : `${item.code}: ${item.title}`}
                    loading="lazy"
                    draggable={false}
                    className={`w-full h-full ${isSpecies ? 'object-contain p-4' : 'object-cover'}`}
                  />
                </span>
                <span className="mt-2 block text-base font-semibold leading-snug text-stone-950">{item.title}</span>
                <span className={`block text-sm text-stone-600 ${isSpecies ? 'italic' : ''}`}>
                  {item.kind === 'species' ? item.scientific : item.code}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mt-12 px-5 pt-6 pb-8 bg-stone-200/60 text-sm text-stone-700 space-y-1">
        <p>Comité Ecológico Claro de Luna y Corporación Humedales de Angachilla · Valdivia</p>
        <p>Premio Valdivia Destaca 2026</p>
        <p className="pt-2">
          Desarrollado por{' '}
          <a href="https://strategiccode.cl" target="_blank" rel="noopener noreferrer" className="font-semibold text-stone-900 underline underline-offset-2">
            StrategicCode
          </a>
        </p>
      </footer>

      <AppDownloadBanner />
    </div>
  );
};
