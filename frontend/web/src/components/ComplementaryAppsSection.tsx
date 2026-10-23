'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, Compass, ExternalLink, MessageSquarePlus, QrCode } from 'lucide-react';
import { ecosistemaApi } from '../lib/api';
import { useApp } from './AppShell';

interface ComplementaryApp {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  urlAndroid?: string;
  urlIos?: string;
  urlWeb?: string;
}

interface AppsContent {
  titulo?: string;
  subtitulo?: string;
  apps?: ComplementaryApp[];
}

// Same list the backend serves under contenidos["apps-complementarias"]; used until it answers or if it cannot
const DEFAULT_CONTENT: Required<AppsContent> = {
  titulo: 'Apps complementarias',
  subtitulo: 'Herramientas recomendadas para potenciar la observación de naturaleza en tu recorrido por el humedal',
  apps: [
    {
      id: 'ebird',
      nombre: 'eBird',
      categoria: 'Avistamiento de aves',
      descripcion:
        'Registra tus listas de aves observadas en el humedal Angachilla y aporta datos reales para la conservación de la avifauna de Los Ríos.',
      urlAndroid: 'https://play.google.com/store/apps/details?id=edu.cornell.birds.ebird',
      urlIos: 'https://apps.apple.com/cl/app/ebird/id988799279',
      urlWeb: 'https://ebird.org/hotspot/L11417032',
    },
    {
      id: 'merlin',
      nombre: 'Merlin Bird ID',
      categoria: 'Identificación por canto y foto',
      descripcion:
        'Identifica en tiempo real los cantos de las aves del bosque y del totoral usando el micrófono de tu teléfono con el paquete de aves de Chile.',
      urlAndroid: 'https://play.google.com/store/apps/details?id=com.labs.merlinbirdid.app',
      urlIos: 'https://apps.apple.com/cl/app/merlin-bird-id-by-cornell-lab/id773457673',
      urlWeb: 'https://merlin.allaboutbirds.org/',
    },
    {
      id: 'inaturalist',
      nombre: 'iNaturalist Chile',
      categoria: 'Flora, fauna y reino Fungi',
      descripcion:
        'Comparte tus observaciones de plantas nativas, helechos, anfibios y hongos del humedal junto a la comunidad de naturalistas de Chile.',
      urlAndroid: 'https://play.google.com/store/apps/details?id=org.inaturalist.android',
      urlIos: 'https://apps.apple.com/cl/app/inaturalist/id421397028',
      urlWeb: 'https://inaturalist.mma.gob.cl/',
    },
    {
      id: 'windy',
      nombre: 'Windy Valdivia',
      categoria: 'Meteorología y lluvias',
      descripcion:
        'Consulta en vivo el radar de lluvias, viento y condiciones meteorológicas en el sector sur de Valdivia antes de recorrer los senderos.',
      urlAndroid: 'https://play.google.com/store/apps/details?id=com.windyty.android',
      urlIos: 'https://apps.apple.com/cl/app/windy-com-weather-radar/id1161387262',
      urlWeb: 'https://www.windy.com/-39.857/-73.238?rain,-39.857,-73.238,14',
    },
  ],
};



type Platform = 'android' | 'ios' | 'desktop';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

const primaryLink =
  'h-10 px-4 rounded-md bg-stone-950 hover:bg-stone-800 active:bg-black text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors';
const secondaryLink =
  'h-10 px-3 rounded-md border border-stone-300 hover:bg-stone-50 text-stone-900 text-sm font-medium inline-flex items-center gap-1.5 transition-colors';

const AppLinks: React.FC<{ app: ComplementaryApp; platform: Platform }> = ({ app, platform }) => {
  const links = [
    { key: 'android' as const, label: 'Google Play', href: app.urlAndroid },
    { key: 'ios' as const, label: 'App Store', href: app.urlIos },
    { key: 'web' as const, label: 'Abrir en la web', href: app.urlWeb },
  ].filter(l => l.href);
  // On a phone its own store leads; on a computer the website does
  const leadKey = platform === 'desktop' ? 'web' : platform;
  const ordered = [...links].sort((a, b) => Number(b.key === leadKey) - Number(a.key === leadKey));

  return (
    <div className="flex flex-wrap gap-2">
      {ordered.map((l, i) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={i === 0 ? primaryLink : secondaryLink}
          aria-label={`${l.label}: ${app.nombre} (se abre en otra pestaña)`}
        >
          {i === 0 && l.key !== 'web' ? `Descargar en ${l.label}` : l.label}
          {l.key === 'web' && <ExternalLink className={`w-3.5 h-3.5 ${i === 0 ? '' : 'text-stone-500'}`} />}
        </a>
      ))}
    </div>
  );
};

export const ComplementaryAppsSection: React.FC = () => {
  const app = useApp();
  const [content, setContent] = useState<Required<AppsContent>>(DEFAULT_CONTENT);
  const [platform] = useState<Platform>(detectPlatform);

  useEffect(() => {
    ecosistemaApi
      .getContents()
      .then(data => {
        const remote = data?.['apps-complementarias'] as AppsContent | undefined;
        if (Array.isArray(remote?.apps) && remote.apps.length > 0) {
          setContent({
            titulo: remote.titulo || DEFAULT_CONTENT.titulo,
            subtitulo: remote.subtitulo || DEFAULT_CONTENT.subtitulo,
            apps: remote.apps,
          });
        }
      })
      .catch(() => {});
  }, []);

  const tools = [
    {
      icon: QrCode,
      title: 'Escanear un tótem QR',
      text: 'Abre la ficha de cada una de las 9 estaciones cuando estés frente a su tótem.',
      onClick: app.openQR,
    },
    {
      icon: Compass,
      title: 'Recorrer con GPS',
      text: 'Sigue el Circuito Angachilla o el Bosque Los Canelos y ve dónde estás en el sendero.',
      onClick: () => app.setCurrentTab('mapa'),
    },
    {
      icon: MessageSquarePlus,
      title: 'Buzón ciudadano',
      text: 'Envía al Comité una propuesta o el reporte de una pasarela en mal estado.',
      onClick: () => app.setCurrentTab('sugerencias'),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-9 pb-24">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">{content.titulo}</h1>
        <p className="mt-1 max-w-[65ch] text-base text-stone-700">
          {content.subtitulo.replace(/\.\s*$/, '')}. Son gratuitas y tus registros sirven para cuidar la biodiversidad del santuario.
        </p>
      </header>

      <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.apps.map(item => {
          return (
            <li key={item.id} className="bg-white border border-stone-200 rounded-md p-5 flex flex-col">
              <h2 className="text-lg font-semibold text-stone-950">{item.nombre}</h2>
              <p className="text-sm text-stone-600">{item.categoria}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-stone-800">{item.descripcion}</p>
              
              <div className="mt-auto pt-5">
                <AppLinks app={item} platform={platform} />
              </div>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="herramientas-titulo" className="mt-10">
        <h2 id="herramientas-titulo" className="text-lg font-semibold text-stone-950">
          También en Angachilla App
        </h2>
        <p className="mt-0.5 text-sm text-stone-600">Funciones propias de esta app para usar durante tu visita.</p>
        <ul className="mt-3 bg-white border border-stone-200 rounded-md divide-y divide-stone-200">
          {tools.map(tool => (
            <li key={tool.title}>
              <button
                type="button"
                onClick={tool.onClick}
                className="group w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
              >
                <tool.icon className="w-5 h-5 text-stone-500 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-stone-950">{tool.title}</span>
                  <span className="block text-sm text-stone-600">{tool.text}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
