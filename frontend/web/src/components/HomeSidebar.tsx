'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, ChevronRight, Clock, Compass, Heart, MessageSquarePlus } from 'lucide-react';
import { WetlandEvent } from '../types';
import { storageService } from '../services/storageService';
import { ecosistemaApi } from '../lib/api';
import { pathForTab } from '../lib/tabs';
import { useApp } from './AppShell';
import { formatEventDateShort } from '../lib/eventDates';

const quickLinks = [
  { id: 'mapa', label: 'Senderos y GPS', hint: 'Rutas, estaciones y navegación', icon: Compass },
  { id: 'catalogo', label: 'Guía de Especies', hint: 'Fauna, Flora y Reino Fungi', icon: BookOpen },
  { id: 'sugerencias', label: 'Buzón ciudadano', hint: 'Ideas y reportes', icon: MessageSquarePlus },
];

// Columna lateral del inicio, visible solo en pantallas grandes (lg+).
export const HomeSidebar: React.FC = () => {
  const app = useApp();
  const [events, setEvents] = useState<WetlandEvent[]>(() => storageService.getEvents().slice(0, 3));

  useEffect(() => {
    ecosistemaApi.getEvents()
      .then((list: WetlandEvent[]) => {
        if (list.length > 0) setEvents(list.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[8.5rem] space-y-5">
        {/* Upcoming events */}
        <section className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-stone-900">Próximos eventos</h2>
            <Link
              href={pathForTab('eventos')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
            >
              Ver todos
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {events.length > 0 ? (
            <ul className="space-y-3">
              {events.map(evt => (
                <li key={evt.id}>
                  <button
                    onClick={() => app.goToMapLocation(evt.coordinates, evt.routeId)}
                    className="w-full flex items-center gap-3 text-left group"
                    title="Ver ubicación en el mapa"
                  >
                    <img
                      src={evt.image}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                        {evt.title}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span className="truncate">{formatEventDateShort(evt.date)}</span>
                        <Clock className="w-3 h-3 text-emerald-700 shrink-0 ml-1" />
                        <span className="shrink-0">{evt.time}</span>
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-stone-500">No hay actividades programadas.</p>
          )}
        </section>

        {/* Quick links */}
        <section className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-2">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.id}
                href={pathForTab(link.id)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-900">{link.label}</p>
                  <p className="text-[11px] text-stone-500 truncate">{link.hint}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </Link>
            );
          })}
        </section>

        {/* Support */}
        <section className="rounded-3xl p-5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 text-white shadow-md">
          <h2 className="text-sm font-black">Cuida el santuario</h2>
          <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
            Tu aporte voluntario ayuda a la conservación del Humedal Angachilla.
          </p>
          <button
            onClick={app.openDonations}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-900 text-xs font-bold hover:bg-emerald-50 transition-colors"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            Hacer un aporte
          </button>
        </section>

        <p className="px-2 text-[11px] text-stone-400 leading-relaxed">
          Santuario de la Naturaleza Humedal Angachilla · Valdivia, Chile
        </p>
      </div>
    </aside>
  );
};
