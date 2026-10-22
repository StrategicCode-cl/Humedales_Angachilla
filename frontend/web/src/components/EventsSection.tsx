'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  MapPin,
  Route,
  Users,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { WetlandEvent, User } from '../types';
import { storageService } from '../services/storageService';
import { resolveMediaUrl } from '../lib/api';
import { dateKey, eventDateKey, formatEventDate, parseEventDate } from '../lib/eventDates';

interface EventsSectionProps {
  onGoToMapLocation?: (coords: [number, number], routeId?: string) => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  embedded?: boolean;
}

const CATEGORY: Record<WetlandEvent['category'], string> = {
  avistamiento: 'Avistamiento de aves',
  educativo: 'Educación Ambiental',
  fotografia: 'Fotografía de Naturaleza',
  kayak: 'Navegación en Kayak',
  limpieza: 'Conservación y Minga',
  comunitario: 'Encuentro Comunitario',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const monthLabel = (d: Date) => {
  const text = d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const monthName = (d: Date) => d.toLocaleDateString('es-CL', { month: 'long' });
const startMinutes = (time: string) => {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

// Monday-first grid of 5 or 6 weeks covering the month
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  onGoToMapLocation,
  currentUser,
  onOpenAuth,
  embedded = false,
}) => {
  const [events, setEvents] = useState<WetlandEvent[]>(() => storageService.getEvents());
  const [stations, setStations] = useState(() => storageService.getPointsOfInterest());
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario');
  const [category, setCategory] = useState<WetlandEvent['category'] | 'todas'>('todas');
  const [activeEventModal, setActiveEventModal] = useState<WetlandEvent | null>(null);
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0);
  const eventDialogRef = useRef<HTMLDialogElement>(null);

  const todayKey = dateKey(new Date());

  useEffect(() => {
    const onSync = () => {
      const updated = storageService.getEvents();
      setEvents([...updated]);
      setStations([...storageService.getPointsOfInterest()]);
    };
    window.addEventListener('angachilla:sync', onSync);
    onSync();
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

  // Light-dismiss dialog fallback for Safari
  useEffect(() => {
    const dialog = eventDialogRef.current;
    if (!dialog) return;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener('click', handleBackdropClick);
      return () => dialog.removeEventListener('click', handleBackdropClick);
    }
  }, [activeEventModal]);

  const openEventDetail = (evt: WetlandEvent) => {
    setActiveEventModal(evt);
    setModalPhotoIdx(0);
    setTimeout(() => {
      if (eventDialogRef.current && !eventDialogRef.current.open) {
        eventDialogRef.current.showModal();
      }
    }, 0);
  };

  const closeEventDetail = () => {
    eventDialogRef.current?.close();
    setActiveEventModal(null);
  };

  const filtered = useMemo(
    () => events.filter(e => category === 'todas' || e.category === category),
    [events, category]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, WetlandEvent[]>();
    filtered.forEach(evt => {
      const key = eventDateKey(evt.date);
      if (!key) return;
      map.set(key, [...(map.get(key) ?? []), evt]);
    });
    map.forEach(list => list.sort((a, b) => startMinutes(a.time) - startMinutes(b.time)));
    return map;
  }, [filtered]);

  const datedKeys = [...byDay.keys()].sort();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState(() => {
    const now = new Date();
    const prefix = dateKey(now).slice(0, 7);
    const upcoming = storageService
      .getEvents()
      .map(e => eventDateKey(e.date))
      .filter((k): k is string => !!k && k.startsWith(prefix) && k >= dateKey(now))
      .sort()[0];
    return upcoming ?? dateKey(now);
  });

  const monthPrefix = dateKey(month).slice(0, 7);
  const monthEvents = datedKeys
    .filter(k => k.startsWith(monthPrefix))
    .reduce((n, k) => n + (byDay.get(k)?.length ?? 0), 0);
  const nextKey = datedKeys.find(k => k > `${monthPrefix}-31`);
  const prevKey = [...datedKeys].reverse().find(k => k < `${monthPrefix}-01`);
  const nextAfterSelected = datedKeys.find(k => k > selectedKey);
  const selectedEvents = byDay.get(selectedKey) ?? [];

  const goTo = (key: string) => {
    const d = parseEventDate(key);
    if (!d) return;
    setMonth(startOfMonth(d));
    setSelectedKey(key);
  };

  const shiftMonth = (n: number) => {
    const target = addMonths(month, n);
    setMonth(target);
    const prefix = dateKey(target).slice(0, 7);
    setSelectedKey(datedKeys.find(k => k.startsWith(prefix)) ?? dateKey(target));
  };

  const handleToggleRegister = (eventId: string) => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }
    const result = storageService.toggleRegisterEvent(eventId);
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId
          ? { ...e, isRegistered: result.isRegistered, registeredCount: result.newCount }
          : e
      )
    );
    setActiveEventModal(prev =>
      prev && prev.id === eventId
        ? { ...prev, isRegistered: result.isRegistered, registeredCount: result.newCount }
        : prev
    );
  };

  const categoriesInData = (Object.keys(CATEGORY) as WetlandEvent['category'][]).filter(c =>
    events.some(e => e.category === c)
  );

  // Build trail photos gallery for the active event modal
  const modalPhotos = useMemo(() => {
    if (!activeEventModal) return [];
    const list: string[] = [];
    if (activeEventModal.image) {
      list.push(resolveMediaUrl(activeEventModal.image));
    }
    const matchedStation = stations.find(
      s =>
        (activeEventModal.stationCode && s.qrCode === activeEventModal.stationCode) ||
        activeEventModal.locationName.toLowerCase().includes(s.name.split(':')[0].toLowerCase())
    );
    if (matchedStation?.gallery && matchedStation.gallery.length > 0) {
      matchedStation.gallery.forEach(img => {
        const resolved = resolveMediaUrl(img);
        if (!list.includes(resolved)) list.push(resolved);
      });
    }
    if (list.length === 0) {
      list.push(resolveMediaUrl('/api/media/slug/estacion-s1-foto-1'));
    }
    return list;
  }, [activeEventModal, stations]);

  // Auto-advancing slow carousel for event trail photos in popup
  useEffect(() => {
    if (!activeEventModal || modalPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setModalPhotoIdx(prev => (prev + 1) % modalPhotos.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [activeEventModal, modalPhotos.length]);

  return (
    <div className={embedded ? 'w-full' : 'max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-9 pb-24'}>
      {/* Header Banner with Organic Texture */}
      <header
        className="rounded-3xl p-5 sm:p-6 text-white shadow-sm border border-emerald-900/30 mb-5"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 46, 34, 0.93), rgba(15, 62, 47, 0.86)), url(${resolveMediaUrl('/api/media/slug/tex-4')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
              <Sparkles className="w-3 h-3" />
              Programa de Actividades de la Reserva
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Calendario y Lista de Actividades
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-emerald-100/90">
              {monthEvents > 0
                ? `${monthEvents === 1 ? '1 actividad programada' : `${monthEvents} actividades programadas`} en ${monthName(month)}. Toca cualquier actividad para abrir su ficha completa, fotos del sendero e inscripciones.`
                : `Explora las actividades comunitarias, recorridos guiados y talleres en el humedal.`}
            </p>
          </div>

          {/* Two-View Toggle (Calendario vs Lista) + Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div
              className="inline-flex items-center bg-black/25 p-1 rounded-2xl border border-white/15"
              role="group"
              aria-label="Modo de visualización de actividades"
            >
              <button
                type="button"
                id="btn-vista-calendario"
                onClick={() => setViewMode('calendario')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  viewMode === 'calendario'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Vista Calendario</span>
              </button>
              <button
                type="button"
                id="btn-vista-lista"
                onClick={() => setViewMode('lista')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  viewMode === 'lista'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Vista Lista</span>
              </button>
            </div>

            {categoriesInData.length > 1 && (
              <select
                value={category}
                onChange={e => setCategory(e.target.value as WetlandEvent['category'] | 'todas')}
                aria-label="Filtrar por tipo de actividad"
                className="h-9 px-3 rounded-xl bg-white/95 text-stone-900 border border-white/20 text-xs font-bold focus:outline-none"
              >
                <option value="todas">Todas las categorías</option>
                {categoriesInData.map(c => (
                  <option key={c} value={c}>
                    {CATEGORY[c]}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* --- VIEW 1: VISTA CALENDARIO --- */}
      {viewMode === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_23rem] gap-4 lg:gap-6 items-start">
          {/* Month Grid */}
          <section
            className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs"
            aria-label={`Calendario de ${monthLabel(month)}`}
          >
            <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 bg-stone-50/70">
              <h3 className="text-base sm:text-lg font-extrabold text-stone-950" aria-live="polite">
                {monthLabel(month)}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goTo(todayKey)}
                  className="h-8 px-3 rounded-xl text-xs font-bold text-stone-800 bg-white border border-stone-200 hover:bg-stone-100"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Mes anterior"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-200/70"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Mes siguiente"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-200/70"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="grid grid-cols-7 border-t border-stone-200 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 bg-stone-50/40"
              aria-hidden="true"
            >
              {WEEKDAYS.map(d => (
                <div key={d} className="px-1 sm:px-2.5 py-2 text-center sm:text-left">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-t border-stone-200">
              {monthGrid(month).map((day, i) => {
                const key = dateKey(day);
                const inMonth = day.getMonth() === month.getMonth();
                const dayEvents = byDay.get(key) ?? [];
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const isPast = key < todayKey;
                const label = `${formatEventDate(key)}${
                  dayEvents.length
                    ? `, ${dayEvents.length === 1 ? '1 actividad' : `${dayEvents.length} actividades`}`
                    : ''
                }`;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (inMonth) setSelectedKey(key);
                      else goTo(key);
                      if (dayEvents.length === 1) {
                        openEventDetail(dayEvents[0]);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (inMonth) setSelectedKey(key);
                        else goTo(key);
                        if (dayEvents.length === 1) openEventDetail(dayEvents[0]);
                      }
                    }}
                    aria-label={label}
                    className={`relative min-h-16 sm:min-h-26 p-1 sm:p-2 text-left flex flex-col items-center sm:items-stretch gap-1 border-stone-200 transition-colors cursor-pointer
                      ${i % 7 !== 6 ? 'border-r' : ''} ${i >= 7 ? 'border-t' : ''}
                      ${
                        isSelected
                          ? 'bg-emerald-50/70'
                          : inMonth
                          ? 'hover:bg-stone-50'
                          : 'bg-stone-50/60 hover:bg-stone-100'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs sm:text-sm tabular-nums
                          ${
                            isSelected
                              ? 'bg-emerald-900 text-white font-bold'
                              : isToday
                              ? 'ring-2 ring-emerald-700 text-emerald-950 font-bold'
                              : ''
                          }
                          ${
                            !isSelected && !isToday
                              ? inMonth
                                ? isPast
                                  ? 'text-stone-400'
                                  : 'text-stone-900 font-semibold'
                                : 'text-stone-300'
                              : ''
                          }`}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="hidden sm:inline-block text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Phone: indicator pill */}
                    {dayEvents.length > 0 && (
                      <span className="sm:hidden flex flex-col items-center gap-0.5 mt-0.5" aria-hidden="true">
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-800 text-white text-[9px] font-bold leading-none">
                          {dayEvents.length} act.
                        </span>
                      </span>
                    )}

                    {/* Larger screens: clickable activity chips that open the popup modal */}
                    <div className="hidden sm:flex flex-col gap-1 min-w-0 w-full mt-0.5">
                      {dayEvents.slice(0, 2).map(evt => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedKey(key);
                            openEventDetail(evt);
                          }}
                          className={`w-full text-left truncate text-[11px] font-bold leading-5 px-2 py-0.5 rounded-lg transition-all ${
                            isPast
                              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              : 'bg-emerald-800 text-white hover:bg-emerald-700 shadow-2xs'
                          }`}
                          title={`${evt.title} (${evt.registeredCount}/${evt.capacity} inscritos) — Haz clic para ver más información`}
                        >
                          <span className="tabular-nums opacity-85">{evt.time.slice(0, 5)}</span>{' '}
                          {evt.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[11px] font-bold text-emerald-800 px-1.5">
                          +{dayEvents.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {monthEvents === 0 && (nextKey || prevKey) && (
              <div className="px-4 py-3 border-t border-stone-200 text-sm text-stone-700 bg-stone-50">
                {nextKey ? (
                  <button
                    type="button"
                    onClick={() => goTo(nextKey)}
                    className="font-bold text-emerald-900 underline underline-offset-2"
                  >
                    Ir a la próxima actividad: {formatEventDate(nextKey)}
                  </button>
                ) : (
                  prevKey && (
                    <button
                      type="button"
                      onClick={() => goTo(prevKey)}
                      className="font-bold text-emerald-900 underline underline-offset-2"
                    >
                      Ver la última actividad: {formatEventDate(prevKey)}
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          {/* Selected Day Panel */}
          <section className="lg:sticky lg:top-20 bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs" aria-labelledby="dia-titulo">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 id="dia-titulo" className="text-base font-extrabold text-stone-950">
                  {formatEventDate(selectedKey, { withYear: false })}
                </h3>
                <p className="text-xs font-semibold text-stone-500 mt-0.5">
                  {selectedEvents.length === 0
                    ? 'Sin actividades programadas este día'
                    : selectedEvents.length === 1
                    ? '1 actividad programada · Toca para abrir detalle'
                    : `${selectedEvents.length} actividades programadas`}
                  {selectedKey === todayKey && ' · Hoy'}
                </p>
              </div>
            </div>

            {selectedEvents.length > 0 ? (
              <ul className="mt-3.5 space-y-3">
                {selectedEvents.map(evt => {
                  const past = selectedKey < todayKey;
                  const full = evt.registeredCount >= evt.capacity;
                  const left = Math.max(0, evt.capacity - evt.registeredCount);
                  return (
                    <li
                      key={evt.id}
                      id={`event-card-${evt.id}`}
                      onClick={() => openEventDetail(evt)}
                      className="group rounded-2xl border border-stone-200 hover:border-emerald-500 bg-stone-50/60 hover:bg-white overflow-hidden transition-all cursor-pointer shadow-2xs hover:shadow-md"
                    >
                      <div className="relative h-32 w-full bg-stone-200 overflow-hidden">
                        <img
                          src={resolveMediaUrl(evt.image)}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/90 text-white">
                          {CATEGORY[evt.category]}
                        </span>
                        <span className="absolute bottom-2 left-2.5 right-2.5 text-white font-extrabold text-sm leading-snug line-clamp-1">
                          {evt.title}
                        </span>
                      </div>

                      <div className="p-3.5">
                        <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
                          <span className="inline-flex items-center gap-1 text-emerald-900 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {evt.time}
                          </span>
                          <span className="inline-flex items-center gap-1 text-stone-700 font-bold">
                            <Users className="w-3.5 h-3.5 text-emerald-700" />
                            {evt.registeredCount}/{evt.capacity} inscritos
                          </span>
                        </div>

                        <p className="mt-1.5 text-xs text-stone-600 flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{evt.locationName}</span>
                        </p>

                        <div className="mt-2.5">
                          <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${past ? 'bg-stone-400' : 'bg-emerald-700'}`}
                              style={{
                                width: `${Math.min(100, (evt.registeredCount / Math.max(1, evt.capacity)) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-emerald-800">
                              {full ? 'Cupos completos' : `Quedan ${left} cupos`}
                            </span>
                            <span className="font-extrabold text-stone-900 group-hover:text-emerald-800 underline underline-offset-2">
                              Ver fotos e inscribirme ›
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-3.5 px-4 py-6 text-center text-xs sm:text-sm text-stone-600 border border-dashed border-stone-300 rounded-2xl bg-stone-50/50">
                <p className="font-semibold text-stone-700">No hay actividades en esta fecha.</p>
                {nextAfterSelected ? (
                  <button
                    type="button"
                    onClick={() => goTo(nextAfterSelected)}
                    className="mt-2 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-900 text-white text-xs font-bold hover:bg-emerald-800"
                  >
                    <span>Ir a la próxima: {formatEventDate(nextAfterSelected, { withYear: false })}</span>
                  </button>
                ) : (
                  <p className="mt-1 text-xs text-stone-500">
                    Selecciona un día marcado en verde en el calendario o cambia a Vista Lista.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* --- VIEW 2: VISTA LISTA --- */}
      {viewMode === 'lista' && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center">
              <p className="text-sm font-bold text-stone-700">No hay actividades en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(evt => {
                const key = eventDateKey(evt.date);
                const past = key ? key < todayKey : false;
                const full = evt.registeredCount >= evt.capacity;
                const left = Math.max(0, evt.capacity - evt.registeredCount);

                return (
                  <article
                    key={evt.id}
                    onClick={() => openEventDetail(evt)}
                    className="group bg-white rounded-3xl border border-stone-200/90 hover:border-emerald-500 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row"
                  >
                    <div className="relative sm:w-48 h-44 sm:h-auto bg-stone-200 shrink-0 overflow-hidden">
                      <img
                        src={resolveMediaUrl(evt.image)}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950/90 text-white">
                        {CATEGORY[evt.category]}
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-800">
                          <span>{key ? formatEventDate(key, { withYear: false }) : evt.date}</span>
                          <span>·</span>
                          <span className="tabular-nums">{evt.time}</span>
                        </div>
                        <h3 className="mt-1 text-base font-black text-stone-950 group-hover:text-emerald-900 leading-snug">
                          {evt.title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-stone-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            {evt.locationName}
                            {evt.routeName ? ` · ${evt.routeName}` : ''}
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100">
                        <div className="flex items-center justify-between text-xs tabular-nums mb-1.5">
                          <span className="font-extrabold text-stone-900">
                            {evt.registeredCount} de {evt.capacity} inscritos
                          </span>
                          <span className="font-bold text-emerald-800">
                            {full ? 'Sin cupos' : `Quedan ${left} cupos`}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${past ? 'bg-stone-400' : 'bg-emerald-700'}`}
                            style={{
                              width: `${Math.min(100, (evt.registeredCount / Math.max(1, evt.capacity)) * 100)}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-stone-500 truncate">
                            Organiza: {evt.organizer}
                          </span>
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-900 text-white text-xs font-extrabold shrink-0 group-hover:bg-emerald-800">
                            Ver detalle e inscribirme
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- ACTIVITY DETAIL POPUP MODAL (<dialog>) --- */}
      <dialog
        ref={eventDialogRef}
        closedby="any"
        onClose={() => setActiveEventModal(null)}
        aria-labelledby="event-modal-title"
        className="m-auto w-[calc(100%-1.5rem)] max-w-xl rounded-3xl bg-white text-stone-900 p-0 shadow-2xl border border-stone-200 backdrop:bg-black/65 backdrop:backdrop-blur-xs overflow-hidden"
      >
        {activeEventModal && (
          <div>
            {/* Top Trail Photos Carousel inside Activity Popup */}
            <div className="relative h-56 sm:h-64 w-full bg-stone-900 overflow-hidden">
              <img
                src={modalPhotos[modalPhotoIdx] || resolveMediaUrl(activeEventModal.image)}
                alt={activeEventModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />

              <button
                type="button"
                onClick={closeEventDetail}
                aria-label="Cerrar detalle de actividad"
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-900/90 text-white backdrop-blur-md">
                  {CATEGORY[activeEventModal.category]}
                </span>
                {activeEventModal.routeName && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/90 text-emerald-950 backdrop-blur-md inline-flex items-center gap-1">
                    <Route className="w-3 h-3 text-emerald-800" />
                    {activeEventModal.routeName}
                  </span>
                )}
              </div>

              {modalPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setModalPhotoIdx((modalPhotoIdx - 1 + modalPhotos.length) % modalPhotos.length)
                    }
                    aria-label="Fotografía anterior del sendero"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPhotoIdx((modalPhotoIdx + 1) % modalPhotos.length)}
                    aria-label="Siguiente fotografía del sendero"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-14 right-4 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                    Foto del sendero {modalPhotoIdx + 1} / {modalPhotos.length}
                  </div>
                </>
              )}

              <div className="absolute bottom-3.5 left-4 right-4 text-white">
                <p className="text-xs font-bold text-emerald-200">
                  {eventDateKey(activeEventModal.date)
                    ? formatEventDate(eventDateKey(activeEventModal.date)!)
                    : activeEventModal.date}{' '}
                  · {activeEventModal.time}
                </p>
                <h3 id="event-modal-title" className="text-lg sm:text-xl font-black leading-tight mt-0.5">
                  {activeEventModal.title}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Thumbnail strip if multiple station trail photos exist */}
              {modalPhotos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {modalPhotos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setModalPhotoIdx(idx)}
                      className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        idx === modalPhotoIdx
                          ? 'border-emerald-700 scale-105 shadow-xs'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-500 block">Punto de encuentro</span>
                    <span className="font-extrabold text-stone-900">{activeEventModal.locationName}</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-500 block">Organiza</span>
                    <span className="font-extrabold text-stone-900">{activeEventModal.organizer}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-stone-700 leading-relaxed">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-1">
                  Descripción de la Actividad
                </h4>
                <p>{activeEventModal.description}</p>
              </div>

              {/* Registration / Cupos Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-black text-emerald-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-800" />
                    <span>
                      {activeEventModal.registeredCount} de {activeEventModal.capacity} personas inscritas
                    </span>
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white text-emerald-900 border border-emerald-200">
                    {activeEventModal.registeredCount >= activeEventModal.capacity
                      ? 'Cupos agotados'
                      : `Quedan ${Math.max(0, activeEventModal.capacity - activeEventModal.registeredCount)} cupos`}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-emerald-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-700 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (activeEventModal.registeredCount / Math.max(1, activeEventModal.capacity)) * 100
                      )}%`,
                    }}
                  />
                </div>
                {activeEventModal.isRegistered && (
                  <p className="mt-2 text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Tienes un cupo reservado en esta actividad.</span>
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                {onGoToMapLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      const coords = activeEventModal.coordinates;
                      const rId = activeEventModal.routeId;
                      closeEventDetail();
                      onGoToMapLocation(coords, rId);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>Ver ubicación en el Mapa</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {activeEventModal.isRegistered ? (
                    <button
                      type="button"
                      onClick={() => handleToggleRegister(activeEventModal.id)}
                      className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-extrabold transition-colors"
                    >
                      Inscrito · Cancelar cupo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleRegister(activeEventModal.id)}
                      disabled={activeEventModal.registeredCount >= activeEventModal.capacity}
                      className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:bg-stone-300 text-white text-xs font-extrabold shadow-sm transition-all"
                    >
                      {activeEventModal.registeredCount >= activeEventModal.capacity
                        ? 'Sin cupos disponibles'
                        : currentUser
                        ? 'Inscribirme en la actividad'
                        : 'Inicia sesión para inscribirte'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};
