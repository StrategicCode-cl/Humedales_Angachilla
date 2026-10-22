'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  QrCode,
  BookOpen,
  Calendar,
  Users,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LogIn,
  UserCheck,
  Camera,
  Play,
  Pause
} from 'lucide-react';
import { User } from '../types';
import { resolveMediaUrl } from '../lib/api';

interface LandingPageProps {
  currentUser: User | null;
  onEnterApp: (targetTab?: string) => void;
  onOpenAuth: () => void;
}

// Carousel items mixing station trail photos and official species illustrations
const CAROUSEL_ITEMS = [
  {
    type: 'station',
    title: 'Estación 1: Placita de la Resistencia',
    subtitle: 'Acceso principal y mirador del hualve',
    imageUrl: '/api/media/slug/estacion-s1-foto-1',
    badge: 'Sendero',
  },
  {
    type: 'species',
    title: 'Chucao (Scelorchilus rubecula)',
    subtitle: 'Ave icónica del sotobosque valdiviano',
    imageUrl: '/api/media/slug/sp-chucao',
    badge: 'Fauna Nativa',
  },
  {
    type: 'station',
    title: 'Estación 2: Laguna de los Pinos',
    subtitle: 'Refugio de anfibios y plantas acuáticas',
    imageUrl: '/api/media/slug/estacion-s2-foto-1',
    badge: 'Sendero',
  },
  {
    type: 'species',
    title: 'Siete Colores (Tachuris rubrigastra)',
    subtitle: 'Joya alada de los totorales',
    imageUrl: '/api/media/slug/sp-siete-colores',
    badge: 'Ave de Totoral',
  },
  {
    type: 'station',
    title: 'Estación 3: Mirador Espejo del Angachilla',
    subtitle: 'Vista panorámica al río y humedal',
    imageUrl: '/api/media/slug/estacion-s3-foto-1',
    badge: 'Mirador',
  },
  {
    type: 'species',
    title: 'Cisne de Cuello Negro (Cygnus melancoryphus)',
    subtitle: 'Símbolo de los ríos y humedales de Valdivia',
    imageUrl: '/api/media/slug/sp-cisne-cuello-negro',
    badge: 'Fauna Protegida',
  },
  {
    type: 'station',
    title: 'Estación 4: Totoral del Santuario',
    subtitle: 'Ecosistema de pajonales y nidificación',
    imageUrl: '/api/media/slug/estacion-s4-foto-1',
    badge: 'Sendero',
  },
  {
    type: 'species',
    title: 'Rana Grande Chilena (Calyptocephalella gayi)',
    subtitle: 'Monumento natural y anfibio gigante',
    imageUrl: '/api/media/slug/sp-rana-chilena',
    badge: 'En Peligro (VU)',
  },
  {
    type: 'station',
    title: 'Estación 5: Bosque Los Canelos',
    subtitle: 'Hualve de canelos, arrayanes, temus y pitras',
    imageUrl: '/api/media/slug/estacion-s5-foto-1',
    badge: 'Bosque Pantanoso',
  },
  {
    type: 'species',
    title: 'Martín Pescador (Megaceryle torquata)',
    subtitle: 'Cazador experto en las orillas del río',
    imageUrl: '/api/media/slug/sp-martin-pescador',
    badge: 'Fauna Nativa',
  },
  {
    type: 'station',
    title: 'Estación 6: Vega de la Garza',
    subtitle: 'Planicie de inundación y avistamiento',
    imageUrl: '/api/media/slug/estacion-s6-foto-1',
    badge: 'Sendero',
  },
  {
    type: 'species',
    title: 'Garza Cuca (Ardea cocoi)',
    subtitle: 'La garza más grande de Chile',
    imageUrl: '/api/media/slug/sp-garza-cuca',
    badge: 'Fauna Nativa',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onEnterApp,
  onOpenAuth,
}) => {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Slow continuous moving carousel effect
  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;

    let animId: number;
    let lastTimestamp: number | null = null;
    const speedPixelsPerSecond = 24; // Movement speed: smooth and slow

    const step = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!isPaused && el) {
        el.scrollLeft += speedPixelsPerSecond * delta;
        // Infinite seamless loop when reaching halfway
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  return (
    <div className="relative w-full min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
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
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Sitio Ramsar
              </span>
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
        {/* Institutional Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Santuario de la Naturaleza · Acreditación Ramsar 2025</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-display leading-[1.15]">
          Reserva Comunitaria <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-200">
            Humedales de Angachilla
          </span>
        </h2>

        {/* Subtitle / Summary */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-stone-300 max-w-2xl leading-relaxed">
          Descubre 20 hectáreas de biodiversidad protegida en Valdivia. Recorre senderos autoguiados con GPS, escanea tótems interpretativos con QR, conoce 69 especies locales y participa en las actividades de nuestra comunidad.
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

        {/* 4 Feature Highlights Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          <button
            type="button"
            onClick={() => onEnterApp('mapa')}
            className="p-3.5 rounded-2xl bg-stone-900/70 hover:bg-stone-900/90 border border-stone-800/80 text-left transition-all group backdrop-blur-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700/40 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <p className="text-xs font-black text-white">Navegación GPS</p>
            <p className="text-[11px] text-stone-300 mt-0.5 line-clamp-2">
              Circuito Angachilla y Bosque Los Canelos con guía paso a paso.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onEnterApp('mapa')}
            className="p-3.5 rounded-2xl bg-stone-900/70 hover:bg-stone-900/90 border border-stone-800/80 text-left transition-all group backdrop-blur-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-950/80 border border-teal-700/40 flex items-center justify-center text-teal-400 mb-2.5 group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <p className="text-xs font-black text-white">Tótems & QR</p>
            <p className="text-[11px] text-stone-300 mt-0.5 line-clamp-2">
              9 estaciones en terreno con historias, audio e información botánica.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onEnterApp('catalogo')}
            className="p-3.5 rounded-2xl bg-stone-900/70 hover:bg-stone-900/90 border border-stone-800/80 text-left transition-all group backdrop-blur-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-700/40 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="text-xs font-black text-white">69 Especies</p>
            <p className="text-[11px] text-stone-300 mt-0.5 line-clamp-2">
              Ilustraciones botánicas, fauna nativa y conservación UICN.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onEnterApp('eventos')}
            className="p-3.5 rounded-2xl bg-stone-900/70 hover:bg-stone-900/90 border border-stone-800/80 text-left transition-all group backdrop-blur-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-950/80 border border-sky-700/40 flex items-center justify-center text-sky-400 mb-2.5 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xs font-black text-white">Actividades & Muro</p>
            <p className="text-[11px] text-stone-300 mt-0.5 line-clamp-2">
              Caminatas guiadas, voluntariados, noticias y avisos de vecinos.
            </p>
          </button>
        </div>
      </main>

      {/* CONTINUOUS SLOW-MOVING CAROUSEL OF PHOTOS & SPECIES */}
      <section className="relative z-20 w-full mt-2 pt-4 pb-6 bg-stone-950/80 border-t border-stone-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-extrabold text-stone-200 uppercase tracking-wider">
              Carrusel del Humedal · Fotos de Senderos y Especies
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-300">
            <button
              type="button"
              onClick={() => setIsPaused(p => !p)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700/70 text-stone-300 font-semibold text-[11px]"
            >
              {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
              <span>{isPaused ? 'Reanudar movimiento' : 'Pausar'}</span>
            </button>
            <span className="hidden sm:inline text-stone-300 font-mono text-[10px]">
              (Se mueve suavemente de forma automática)
            </span>
          </div>
        </div>

        {/* Marquee Ticker Track */}
        <div
          ref={tickerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex items-center gap-3.5 overflow-x-hidden scrollbar-none py-1 px-4 cursor-grab active:cursor-grabbing select-none"
        >
          {/* Duplicate the array to create a seamless infinite loop */}
          {[...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onEnterApp(item.type === 'station' ? 'mapa' : 'catalogo')}
              className="w-56 sm:w-64 shrink-0 rounded-2xl bg-stone-900/90 border border-stone-800/90 hover:border-emerald-500/60 p-2.5 transition-all duration-300 hover:scale-[1.02] shadow-sm flex flex-col justify-between cursor-pointer group"
            >
              <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-stone-950 flex items-center justify-center">
                <img
                  src={resolveMediaUrl(item.imageUrl)}
                  alt={item.title}
                  loading="lazy"
                  className={`w-full h-full ${
                    item.type === 'species' ? 'object-contain p-2 group-hover:scale-105' : 'object-cover group-hover:scale-105'
                  } transition-transform duration-500`}
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-stone-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                </div>
              </div>
              <div className="mt-2.5">
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[10px] text-stone-300 line-clamp-1 mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer info */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-300 border-t border-stone-900">
        <p>
          Comité Ecológico Claro de Luna & Corporación Humedales de Angachilla · Valdivia
        </p>
        <p className="mt-1 sm:mt-0 text-stone-300">
          Premio Valdivia Destaca 2026 · Protección de 20 Hectáreas
        </p>
      </footer>
    </div>
  );
};
