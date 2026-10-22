'use client';

import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  ExternalLink,
  Bird,
  Leaf,
  CloudRain,
  Mic,
  QrCode,
  MessageSquarePlus,
  FileText,
  Sparkles,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { ecosistemaApi, resolveMediaUrl } from '../lib/api';
import { useApp } from './AppShell';

interface ComplementaryAppItem {
  name: string;
  category: string;
  description: string;
  url: string;
  tip?: string;
}

const DEFAULT_APPS: ComplementaryAppItem[] = [
  {
    name: 'eBird (Cornell Lab of Ornithology)',
    category: 'Ciencia Ciudadana · Avifauna',
    description:
      'Plataforma global para registrar listas de avistamientos de aves en el Hotspot oficial de la Reserva Comunitaria Humedal Angachilla.',
    url: 'https://ebird.org/hotspot/L11417032',
    tip: 'Ideal en las Estaciones 1, 2, 4 y 6 (Miradores y Lagunas) para registrar Cisne de cuello negro, Siete colores, Garza cuca y Taguas.'
  },
  {
    name: 'Merlin Bird ID',
    category: 'Identificación Acústica y Visual',
    description:
      'Identifica aves en tiempo real por su canto o fotografía utilizando inteligencia artificial entrenada con registros de Chile.',
    url: 'https://merlin.allaboutbirds.org/',
    tip: 'Úsala en la Estación 3 (Bosque Húmedo) y Estación 9 (Bosque Ribereño) para reconocer por oído al Chucao, Hued-hued y Rayadito sin perturbarlos.'
  },
  {
    name: 'iNaturalist Chile',
    category: 'Biodiversidad · Flora, Fauna y Reino Fungi',
    description:
      'Red de ciencia ciudadana del Ministerio del Medio Ambiente para registrar flora nativa, hongos, anfibios, insectos y mamíferos.',
    url: 'https://inaturalist.mma.gob.cl/',
    tip: 'Sube tus fotografías de hongos del bosque valdiviano, plantas palustres y anfibios para que especialistas validen la especie.'
  },
  {
    name: 'Windy',
    category: 'Meteorología, Viento y Mareas',
    description:
      'Pronóstico detallado de lluvias, ráfagas de viento y condiciones atmosféricas en la cuenca del río Angachilla y Valdivia.',
    url: 'https://www.windy.com/-39.856/-73.238',
    tip: 'Revisa el viento y precipitaciones antes de recorrer las pasarelas o navegar en kayak por el estero.'
  }
];

export const ComplementaryAppsSection: React.FC = () => {
  const app = useApp();
  const [apps, setApps] = useState<ComplementaryAppItem[]>(DEFAULT_APPS);

  useEffect(() => {
    ecosistemaApi
      .getContents()
      .then(data => {
        const remote = data?.apps_complementarias?.metadata?.apps;
        if (Array.isArray(remote) && remote.length > 0) {
          setApps(
            remote.map((item: any, idx: number) => ({
              ...DEFAULT_APPS[idx],
              ...item
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('ebird')) return <Bird className="w-6 h-6 text-emerald-700" />;
    if (lower.includes('merlin')) return <Mic className="w-6 h-6 text-teal-700" />;
    if (lower.includes('inaturalist')) return <Leaf className="w-6 h-6 text-lime-700" />;
    if (lower.includes('windy')) return <CloudRain className="w-6 h-6 text-sky-700" />;
    return <Smartphone className="w-6 h-6 text-emerald-700" />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-24 space-y-8">
      {/* Header Banner */}
      <header className="relative rounded-3xl overflow-hidden border border-emerald-900/20 bg-emerald-950 text-white p-6 sm:p-8 shadow-lg">
        <img
          src={resolveMediaUrl('/api/media/slug/tex-1')}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
            <Sparkles className="w-3.5 h-3.5" />
            Herramientas de Terreno · Ciencia Ciudadana
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-display">
            Apps Complementarias
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Potencia tu recorrido autoguiado por la <strong>Reserva Comunitaria Humedal Angachilla</strong> con estas aplicaciones gratuitas recomendadas por el Comité Ecológico para identificar cantos, registrar avistamientos científicos y consultar el clima.
          </p>
        </div>
      </header>

      {/* External Apps Grid */}
      <section aria-labelledby="apps-externas-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="apps-externas-heading" className="text-lg sm:text-xl font-black text-stone-900 font-display">
              Aplicaciones Científicas Recomendadas
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Tus registros aportan datos reales para proteger la biodiversidad del santuario.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map(item => (
            <article
              key={item.name}
              className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    {getIcon(item.name)}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                    {item.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-stone-900 font-display">
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.tip && (
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{item.tip}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500">
                  Gratuita · iOS / Android / Web
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <span>Abrir Plataforma</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Internal Reserve Tools */}
      <section aria-labelledby="herramientas-internas-heading" className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 id="herramientas-internas-heading" className="text-base sm:text-lg font-black text-stone-900 font-display">
            Herramientas Integradas de Angachilla App
          </h2>
          <p className="text-xs text-stone-600">
            Funciones propias de nuestra aplicación para usar durante tu visita a las 9 estaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={app.openQR}
            className="p-4 rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-all group"
          >
            <QrCode className="w-6 h-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs sm:text-sm font-extrabold text-stone-900">Escanear Tótem QR</h3>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Desbloquea la ficha interactiva de cada una de las 9 estaciones en terreno.
            </p>
          </button>

          <button
            type="button"
            onClick={() => app.setCurrentTab('mapa')}
            className="p-4 rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-all group"
          >
            <Compass className="w-6 h-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs sm:text-sm font-extrabold text-stone-900">Recorrido GPS Satelital</h3>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Verifica si estás dentro de la reserva y recorre los 2 senderos oficiales.
            </p>
          </button>

          <button
            type="button"
            onClick={() => app.setCurrentTab('sugerencias')}
            className="p-4 rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-all group"
          >
            <MessageSquarePlus className="w-6 h-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs sm:text-sm font-extrabold text-stone-900">Buzón y Contacto</h3>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Envía propuestas comunitarias o reportes de estado de pasarelas al Comité.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};
