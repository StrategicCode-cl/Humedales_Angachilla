'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Compass,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogIn,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { User, WetlandEvent } from '../types';
import { ecosistemaApi, resolveMediaUrl } from '../lib/api';
import { HUMEDAL_ROUTES } from '../data/mockData';
import { dateKey, eventDateKey, formatEventDateShort } from '../lib/eventDates';
import { AppDownloadBanner } from './AppDownloadBanner';

interface LandingPageProps {
  currentUser: User | null;
  onEnterApp: (targetTab?: string) => void;
  onOpenAuth: () => void;
}

type GalleryItem =
  | { kind: 'station'; title: string; code: string; note: string; image: string }
  | { kind: 'species'; title: string; scientific: string; note: string; image: string };

// Station photographs alternate with the official species illustrations
const GALLERY: GalleryItem[] = [
  { kind: 'station', code: 'Estación 1', title: 'Mirador del Hualve', note: 'Restauración de bosque humedal y vista al pantano de Chequén.', image: '/api/media/slug/estacion-s1-foto-1' },
  { kind: 'species', title: 'Cisne de Cuello Negro', scientific: 'Cygnus melancoryphus', note: 'Símbolo de los ríos y humedales de Valdivia.', image: '/api/media/slug/ilustracion-cisne-de-cuello-negro' },
  { kind: 'station', code: 'Estación 2', title: 'Laguna de los Pinos', note: 'Laguna de anfibios y helechos costilla de vaca.', image: '/api/media/slug/estacion-s2-foto-1' },
  { kind: 'species', title: 'Siete Colores', scientific: 'Tachuris rubrigastra', note: 'Pequeña ave que anida en los totorales.', image: '/api/media/slug/ilustracion-siete-colores' },
  { kind: 'station', code: 'Estación 3', title: 'Mirador Espejo del Angachilla', note: 'Espejo de agua con cisnes, garzas, patos y coipos.', image: '/api/media/slug/estacion-s3-foto-1' },
  { kind: 'species', title: 'Rana Grande Chilena', scientific: 'Calyptocephalella gayi', note: 'El anfibio más grande de Chile, vulnerable.', image: '/api/media/slug/ilustracion-rana-grande-chilena' },
  { kind: 'station', code: 'Estación 4', title: 'Totoral del Santuario', note: 'Pajonal de batros, totoras y nidos colgantes.', image: '/api/media/slug/estacion-s4-foto-1' },
  { kind: 'species', title: 'Martín Pescador', scientific: 'Megaceryle torquata', note: 'Caza peces desde las ramas sobre el estero.', image: '/api/media/slug/ilustracion-martin-pescador' },
  { kind: 'station', code: 'Estación 5', title: 'Bosque Los Canelos', note: 'Bosque inundable de canelos, arrayanes, temus y pitras.', image: '/api/media/slug/estacion-s5-foto-1' },
  { kind: 'species', title: 'Garza Cuca', scientific: 'Ardea cocoi', note: 'La garza más grande de Chile.', image: '/api/media/slug/ilustracion-garza-cuca' },
  { kind: 'station', code: 'Estación 6', title: 'Vega de la Garza', note: 'Planicie de afloramiento y refugio de aves acuáticas.', image: '/api/media/slug/estacion-s6-foto-1' },
  { kind: 'species', title: 'Picaflor Chico', scientific: 'Sephanoides sephaniodes', note: 'Poliniza el copihue y el notro del bosque.', image: '/api/media/slug/ilustracion-picaflor-chico' },
];

const TRAIL_KM = HUMEDAL_ROUTES.reduce((sum, r) => sum + r.distanceKm, 0);

interface Facts {
  stations: number;
  species: number;
  nextEvent: WetlandEvent | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onEnterApp,
  onOpenAuth,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [facts, setFacts] = useState<Facts | null>(null);
  const [railEdge, setRailEdge] = useState({ start: true, end: false });

  // Live figures for the summary panel
  useEffect(() => {
    let cancelled = false;
    const today = dateKey(new Date());
    Promise.all([
      ecosistemaApi.getStations().catch(() => null),
      ecosistemaApi.getSpecies().catch(() => null),
      ecosistemaApi.getEvents().catch(() => null),
    ]).then(([stations, species, events]) => {
      if (cancelled) return;
      const upcoming = (events ?? [])
        .map(e => ({ e, key: eventDateKey(e.date) }))
        .filter((x): x is { e: WetlandEvent; key: string } => x.key !== null && x.key >= today)
        .sort((a, b) => a.key.localeCompare(b.key) || a.e.time.localeCompare(b.e.time));
      setFacts({
        stations: stations?.length ?? 0,
        species: species?.length ?? 0,
        nextEvent: upcoming[0]?.e ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Entrance for the summary panel and the gallery
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-shown');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -4% 0px' }
    );
    root.querySelectorAll('[data-reveal]:not(.is-shown)').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const updateRailEdge = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const start = el.scrollLeft < 8;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setRailEdge(prev => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  const scrollRail = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  const nextEvent = facts?.nextEvent ?? null;
  const summary = [
    {
      tab: 'mapa',
      figure: `${TRAIL_KM.toLocaleString('es-CL', { maximumFractionDigits: 1 })} km`,
      label: 'de senderos con GPS',
      text: 'Circuito Angachilla y Bosque Los Canelos, con guía paso a paso.',
      action: 'Abrir el mapa',
    },
    {
      tab: 'mapa',
      // Without a count (backend unreachable) the word stands in for the figure, never a zero
      figure: !facts ? null : facts.stations > 0 ? String(facts.stations) : 'Estaciones',
      label: facts && facts.stations > 0 ? 'estaciones con QR' : 'con código QR',
      text: 'Tótems en terreno con la historia y la botánica de cada sector.',
      action: 'Ver estaciones',
    },
    {
      tab: 'catalogo',
      figure: !facts ? null : facts.species > 0 ? String(facts.species) : 'Especies',
      label: facts && facts.species > 0 ? 'especies registradas' : 'del humedal',
      text: 'Aves, anfibios, flora y hongos con su estado de conservación.',
      action: 'Abrir la guía',
    },
    nextEvent
      ? {
          tab: 'eventos',
          figure: formatEventDateShort(nextEvent.date),
          label: 'próxima actividad',
          text: nextEvent.title,
          action: 'Ver el calendario',
        }
      : {
          tab: 'eventos',
          figure: facts ? 'Calendario' : null,
          label: 'de actividades',
          text: 'Caminatas guiadas, talleres y voluntariados del mes.',
          action: 'Ver el calendario',
        },
  ];

  return (
    <div ref={rootRef} className="relative w-full min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Background Hero Image with Organic Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={resolveMediaUrl('/api/media/slug/estacion-s3-foto-1')}
          alt="Humedales de Angachilla"
          className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-105 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/70 to-stone-950/95" />
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{
            backgroundImage: `url(${resolveMediaUrl('/api/media/slug/tex-5')})`,
            backgroundSize: '400px',
          }}
        />
      </div>

      {/* Top Bar Navigation */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/90 border border-emerald-600/50 p-1.5 flex items-center justify-center shadow-md">
            <img
              src={resolveMediaUrl('/api/media/slug/svg-simbolo-angachilla-app')}
              alt="Angachilla App"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Humedal Angachilla</span>
            </h1>
            <p className="text-[11px] text-stone-300">Reserva Comunitaria Valdivia</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-stone-900/90 backdrop-blur-md border border-stone-800 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-stone-200 font-semibold truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <button
                type="button"
                onClick={() => onEnterApp('avisos')}
                className="ml-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                Abrir App
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 text-stone-200 border border-stone-700/80 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Iniciar Sesión</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEnterApp('avisos')}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-900/40"
          >
            <span>Explorar Humedal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center text-center">
        

        {/* Title */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-display leading-[1.15]">
          Reserva Comunitaria <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-200">
            Bosque Humedal Angachilla
          </span>
        </h2>

        {/* Subtitle / Summary */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-stone-300 max-w-2xl leading-relaxed">
          Descubre 20 hectáreas de biodiversidad protegida en Valdivia. Recorre senderos autoguiados con GPS, escanea tótems interpretativos con QR, conoce la flora y fauna local y participa en las actividades de nuestra comunidad.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onEnterApp('mapa')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/60 transition-all border border-emerald-500/30"
          >
            <Compass className="w-5 h-5 text-emerald-200" />
            <span>Recorrer Mapa & Senderos</span>
          </button>

          <button
            type="button"
            onClick={() => onEnterApp('avisos')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-stone-100 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 border border-stone-700/80 transition-all"
          >
            <Users className="w-5 h-5 text-teal-400" />
            <span>Muro Comunitario & Actividades</span>
          </button>

          {!currentUser && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-stone-950/80 hover:bg-stone-900 text-stone-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-stone-800 transition-all"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Registrarse / Acceder</span>
            </button>
          )}
        </div>

        {/* The wetland in figures, each one opens its section */}
        <section
          aria-label="El humedal en cifras"
          data-reveal
          className="mt-12 sm:mt-16 w-full grid grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden bg-stone-950/80 text-left"
        >
          {summary.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => onEnterApp(item.tab)}
              className="group flex flex-col p-4 sm:p-6 text-left transition-colors hover:bg-white/[0.06] active:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400"
            >
              {item.figure ? (
                <span className="font-display text-2xl sm:text-4xl font-semibold tracking-tight leading-none text-white tabular-nums">
                  {item.figure}
                </span>
              ) : (
                <span aria-hidden="true" className="block h-6 sm:h-9 w-14 rounded bg-stone-800 animate-pulse" />
              )}
              <span className="mt-2 text-sm sm:text-base font-medium text-stone-100">{item.label}</span>
              <span className="mt-1.5 text-sm sm:text-base leading-snug text-stone-300 line-clamp-4 sm:line-clamp-3">{item.text}</span>
              <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
                {item.action}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </section>
      </main>

      {/* Stations and species of the trail */}
      <section aria-labelledby="galeria-titulo" className="relative z-20 w-full pt-10 sm:pt-14 pb-10 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-end justify-between gap-6">
          <div data-reveal>
            <h2 id="galeria-titulo" className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Estaciones y especies del sendero
            </h2>
            <p className="mt-2 max-w-xl text-base text-stone-300">
              Seis estaciones del recorrido y algunas de las especies que puedes encontrar en ellas.
            </p>
          </div>
          <div className="hidden sm:flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              disabled={railEdge.start}
              aria-label="Anteriores"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-stone-800 text-white hover:bg-stone-700 active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              disabled={railEdge.end}
              aria-label="Siguientes"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-stone-800 text-white hover:bg-stone-700 active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          onScroll={updateRailEdge}
          className="mt-6 sm:mt-8 flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-2 px-4 scroll-px-4 sm:px-[max(2rem,calc((100vw-80rem)/2+2rem))] sm:scroll-px-[max(2rem,calc((100vw-80rem)/2+2rem))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {GALLERY.map((item, i) => {
            const isSpecies = item.kind === 'species';
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onEnterApp(isSpecies ? 'catalogo' : 'mapa')}
                data-reveal
                style={{ '--reveal-delay': `${Math.min(i, 4) * 70}ms` } as React.CSSProperties}
                className="group snap-start shrink-0 w-[78%] sm:w-72 lg:w-80 text-left focus-visible:outline-none"
              >
                <span
                  className={`block aspect-[4/3] rounded-md overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-emerald-400 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-stone-950 ${
                    isSpecies ? 'bg-[#eeeae2]' : 'bg-stone-800'
                  }`}
                >
                  <img
                    src={resolveMediaUrl(item.image)}
                    alt={isSpecies ? `Ilustración de ${item.title}` : `${item.code}: ${item.title}`}
                    loading="lazy"
                    draggable={false}
                    className={`w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
                      isSpecies ? 'object-contain p-5' : 'object-cover'
                    }`}
                  />
                </span>
                <span className="mt-3 block text-base font-semibold text-white">{item.title}</span>
                <span className={`block text-sm text-stone-400 ${isSpecies ? 'italic' : ''}`}>
                  {item.kind === 'species' ? item.scientific : item.code}
                </span>
                <span className="mt-1.5 block text-base leading-snug text-stone-300">{item.note}</span>
                <span className="sr-only">{isSpecies ? 'Ver en la guía de especies' : 'Ver en el mapa'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="relative z-20 w-full bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm text-stone-400">
          <p>Comité Ecológico Claro de Luna y Corporación Humedales de Angachilla · Valdivia</p>
          <p>Premio Valdivia Destaca 2026 · 20 hectáreas protegidas</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-8 text-sm text-stone-400">
          <p>
            Desarrollado por <span className="font-semibold text-stone-200"><a href="https://strategiccode.cl" target="_blank" rel="noopener noreferrer">StrategicCode</a></span>
          </p>
        </div>
      </footer>

      <AppDownloadBanner />
    </div>
  );
};
