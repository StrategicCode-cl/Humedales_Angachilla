'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, Compass, MessageSquarePlus } from 'lucide-react';
import { WetlandEvent } from '../types';
import { storageService } from '../services/storageService';
import { ecosistemaApi, resolveMediaUrl } from '../lib/api';
import { pathForTab } from '../lib/tabs';
import { dateKey, eventDateKey, formatEventDateShort } from '../lib/eventDates';

const quickLinks = [
  { id: 'mapa', label: 'Senderos y GPS', hint: 'Rutas, estaciones y navegación', icon: Compass },
  { id: 'catalogo', label: 'Guía de especies', hint: 'Fauna, flora y hongos', icon: BookOpen },
  { id: 'sugerencias', label: 'Buzón ciudadano', hint: 'Ideas y reportes', icon: MessageSquarePlus },
];

// Moss drawn in SVG (public/texturas/musgo.svg), shared with the download banner and the species guide
const MOSS = "bg-[#052e20] bg-[url('/texturas/musgo.svg')]";

const startMinutes = (time: string) => {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

// The next three activities from today on, in date and time order
function upcoming(list: WetlandEvent[]): WetlandEvent[] {
  const today = dateKey(new Date());
  return list
    .map(e => ({ e, key: eventDateKey(e.date) }))
    .filter((x): x is { e: WetlandEvent; key: string } => x.key !== null && x.key >= today)
    .sort((a, b) => a.key.localeCompare(b.key) || startMinutes(a.e.time) - startMinutes(b.e.time))
    .slice(0, 3)
    .map(x => x.e);
}

// Side column of the home screen, large screens only (lg+)
export const HomeSidebar: React.FC = () => {
  const [events, setEvents] = useState<WetlandEvent[]>(() => upcoming(storageService.getEvents()));

  useEffect(() => {
    ecosistemaApi
      .getEvents()
      .then((list: WetlandEvent[]) => setEvents(upcoming(list)))
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[8.5rem] space-y-4">
        {/* Upcoming activities */}
        <section className="bg-white rounded-md border border-stone-200" aria-labelledby="proximas-titulo">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <h2 id="proximas-titulo" className="text-[15px] font-semibold text-stone-950">
              Próximas actividades
            </h2>
            <Link href={pathForTab('eventos')} className="text-sm font-medium text-stone-700 hover:text-stone-950 underline underline-offset-2">
              Calendario
            </Link>
          </div>
          {events.length > 0 ? (
            <ul className="pb-1.5">
              {events.map(evt => (
                <li key={evt.id}>
                  <Link
                    href={pathForTab('eventos')}
                    className="group flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
                  >
                    <img
                      src={resolveMediaUrl(evt.image)}
                      alt=""
                      loading="lazy"
                      className="w-12 h-12 rounded-sm object-cover bg-stone-200 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-snug text-stone-950 line-clamp-2 group-hover:text-emerald-900">
                        {evt.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-stone-600 tabular-nums">
                        {formatEventDateShort(evt.date)} · {evt.time.slice(0, 5)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 pb-4 text-sm text-stone-600">No hay actividades programadas por ahora.</p>
          )}
        </section>

        {/* Quick links */}
        <nav aria-label="Accesos rápidos" className="bg-white rounded-md border border-stone-200 py-1.5">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.id}
                href={pathForTab(link.id)}
                className="group flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
              >
                <Icon className="w-5 h-5 text-stone-500 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-950">{link.label}</span>
                  <span className="block text-[13px] text-stone-600 truncate">{link.hint}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </nav>

        {/* Support */}
        <section className={`rounded-md p-4 text-white ${MOSS}`} aria-labelledby="apoyo-titulo">
          <h2 id="apoyo-titulo" className="text-[15px] font-bold">
            Cuida el santuario
          </h2>
          <p className="mt-1 text-sm font-medium leading-relaxed text-white/90">
            Tu aporte mantiene senderos, planta bosque nativo y protege a las aves del humedal.
          </p>
          <Link
            href={pathForTab('donar')}
            className="mt-3 inline-flex items-center h-9 px-3.5 rounded-md bg-white text-stone-950 text-sm font-semibold hover:bg-stone-100 transition-colors"
          >
            Hacer un aporte
          </Link>
        </section>

        <p className="px-1 text-[13px] text-stone-500 leading-relaxed">
          Santuario de la Naturaleza Humedal Angachilla · Valdivia, Chile
        </p>
      </div>
    </aside>
  );
};
