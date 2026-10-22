'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  MapPin,
  X,
  CheckCircle2,
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
  educativo: 'Educación ambiental',
  fotografia: 'Fotografía de naturaleza',
  kayak: 'Navegación en kayak',
  limpieza: 'Conservación y minga',
  comunitario: 'Encuentro comunitario',
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
const fillRatio = (evt: WetlandEvent) => Math.min(100, (evt.registeredCount / Math.max(1, evt.capacity)) * 100);

// Monday-first grid of 5 or 6 weeks covering the month
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

// "18 de 25 inscritos · quedan 7", or why there is no place
function capacityText(evt: WetlandEvent, past: boolean) {
  if (past) return `Finalizada · ${evt.registeredCount} de ${evt.capacity} asistentes`;
  const left = Math.max(0, evt.capacity - evt.registeredCount);
  return `${evt.registeredCount} de ${evt.capacity} inscritos · ${left === 0 ? 'sin cupos' : `quedan ${left}`}`;
}

const CapacityBar: React.FC<{ evt: WetlandEvent; past: boolean }> = ({ evt, past }) => (
  <div className="h-1 bg-stone-200" aria-hidden="true">
    <div className={`h-full ${past ? 'bg-stone-400' : 'bg-emerald-700'}`} style={{ width: `${fillRatio(evt)}%` }} />
  </div>
);

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

  // The dialog opens once its activity is in state
  useEffect(() => {
    const dialog = eventDialogRef.current;
    if (activeEventModal && dialog && !dialog.open) dialog.showModal();
  }, [activeEventModal]);

  const openEventDetail = (evt: WetlandEvent) => {
    setActiveEventModal(evt);
    setModalPhotoIdx(0);
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
  const upcomingKey = datedKeys.find(k => k >= todayKey);
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

  // List view: activities in date order, grouped by month; undated ones last
  const listGroups = useMemo(() => {
    const groups: { label: string; items: { evt: WetlandEvent; key: string | null }[] }[] = [];
    const sorted = filtered
      .map(evt => ({ evt, key: eventDateKey(evt.date) }))
      .sort((a, b) => {
        if (!a.key || !b.key) return a.key ? -1 : b.key ? 1 : 0;
        return a.key.localeCompare(b.key) || startMinutes(a.evt.time) - startMinutes(b.evt.time);
      });
    sorted.forEach(item => {
      const d = item.key ? parseEventDate(item.key) : null;
      const label = d ? monthLabel(d) : 'Sin fecha definida';
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(item);
      else groups.push({ label, items: [item] });
    });
    return groups;
  }, [filtered]);

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

  const summary =
    monthEvents > 0
      ? `${monthEvents === 1 ? '1 actividad' : `${monthEvents} actividades`} en ${monthName(month)}.`
      : `Sin actividades en ${monthName(month)}.`;
  const nextLine = upcomingKey
    ? ` La próxima es el ${formatEventDate(upcomingKey, { withYear: false }).toLowerCase()}.`
    : '';

  const modalKey = activeEventModal ? eventDateKey(activeEventModal.date) : null;
  const modalPast = modalKey ? modalKey < todayKey : false;
  const modalFull = activeEventModal ? activeEventModal.registeredCount >= activeEventModal.capacity : false;

  const viewButton = (mode: 'calendario' | 'lista', label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      aria-pressed={viewMode === mode}
      className={`h-8 px-3 rounded inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
        viewMode === mode
          ? 'bg-white text-stone-950 ring-1 ring-stone-300'
          : 'text-stone-600 hover:text-stone-950'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className={embedded ? 'w-full' : 'max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-9 pb-24'}>
      <header className="mb-4 sm:mb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">Calendario de actividades</h2>
          <p className="mt-1 text-sm sm:text-base text-stone-700">
            {summary}
            {nextLine}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-0.5 rounded-md bg-stone-200/80" role="group" aria-label="Forma de ver las actividades">
            {viewButton('calendario', 'Calendario', CalendarIcon)}
            {viewButton('lista', 'Lista', List)}
          </div>

          {categoriesInData.length > 1 && (
            <select
              value={category}
              onChange={e => setCategory(e.target.value as WetlandEvent['category'] | 'todas')}
              aria-label="Filtrar por tipo de actividad"
              className="h-9 px-2.5 rounded-md bg-white border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
            >
              <option value="todas">Todas las actividades</option>
              {categoriesInData.map(c => (
                <option key={c} value={c}>
                  {CATEGORY[c]}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {viewMode === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 lg:gap-5 items-start">
          {/* Month grid */}
          <section
            className="bg-white border border-stone-200 rounded-md overflow-hidden"
            aria-label={`Calendario de ${monthLabel(month)}`}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-200">
              <h3 className="text-base font-semibold text-stone-950" aria-live="polite">
                {monthLabel(month)}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goTo(todayKey)}
                  className="h-8 px-3 rounded-md text-sm font-medium text-stone-800 border border-stone-300 hover:bg-stone-50"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Mes anterior"
                  className="w-8 h-8 rounded-md flex items-center justify-center text-stone-700 hover:bg-stone-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Mes siguiente"
                  className="w-8 h-8 rounded-md flex items-center justify-center text-stone-700 hover:bg-stone-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-xs font-medium text-stone-500" aria-hidden="true">
              {WEEKDAYS.map(d => (
                <div key={d} className="px-1 sm:px-2 py-2 text-center sm:text-left">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-t border-stone-200">
              {monthGrid(month).map((day, i) => {
                const key = dateKey(day);
                const inMonth = day.getMonth() === month.getMonth();
                const weekend = i % 7 >= 5;
                const dayEvents = byDay.get(key) ?? [];
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const isPast = key < todayKey;
                const label = `${formatEventDate(key)}${
                  dayEvents.length
                    ? `, ${dayEvents.length === 1 ? '1 actividad' : `${dayEvents.length} actividades`}`
                    : ''
                }`;
                const select = () => {
                  if (inMonth) setSelectedKey(key);
                  else goTo(key);
                  if (dayEvents.length === 1) openEventDetail(dayEvents[0]);
                };
                return (
                  <div
                    key={key}
                    onClick={select}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        select();
                      }
                    }}
                    aria-label={label}
                    aria-pressed={isSelected}
                    className={`relative min-h-14 sm:min-h-24 p-1 sm:p-1.5 flex flex-col items-center sm:items-stretch gap-1 border-stone-200 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900
                      ${i % 7 !== 6 ? 'border-r' : ''} ${i >= 7 ? 'border-t' : ''}
                      ${isToday ? 'shadow-[inset_0_2px_0_#047857]' : ''}
                      ${
                        isSelected
                          ? 'bg-stone-100'
                          : !inMonth
                          ? 'bg-stone-50 hover:bg-stone-100'
                          : weekend
                          ? 'bg-stone-50/60 hover:bg-stone-100/70'
                          : 'hover:bg-stone-50'
                      }`}
                  >
                    <span
                      className={`h-6 min-w-6 px-1 rounded-sm self-center sm:self-start flex items-center justify-center text-sm tabular-nums
                        ${
                          isSelected
                            ? 'bg-stone-900 text-white font-semibold'
                            : isToday
                            ? 'text-emerald-800 font-semibold'
                            : !inMonth
                            ? 'text-stone-300'
                            : isPast
                            ? 'text-stone-400'
                            : 'text-stone-900'
                        }`}
                    >
                      {day.getDate()}
                    </span>

                    {/* Phone: one square mark per activity */}
                    {dayEvents.length > 0 && (
                      <span className="sm:hidden flex gap-0.5" aria-hidden="true">
                        {dayEvents.slice(0, 3).map(evt => (
                          <span key={evt.id} className={`w-1.5 h-1.5 ${isPast ? 'bg-stone-400' : 'bg-emerald-700'}`} />
                        ))}
                      </span>
                    )}

                    {/* Larger screens: the activities themselves */}
                    <div className="hidden sm:flex flex-col gap-0.5 min-w-0 w-full">
                      {dayEvents.slice(0, 2).map(evt => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedKey(key);
                            openEventDetail(evt);
                          }}
                          className={`w-full truncate text-left text-xs leading-5 pl-1.5 pr-1 border-l-2 rounded-r-sm transition-colors ${
                            isPast
                              ? 'border-stone-300 bg-stone-100 text-stone-500 hover:bg-stone-200'
                              : 'border-emerald-700 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                          }`}
                          title={evt.title}
                        >
                          <span className="font-semibold tabular-nums">{evt.time.slice(0, 5)}</span> {evt.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-xs font-medium text-stone-600 px-1.5">+{dayEvents.length - 2} más</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {monthEvents === 0 && (nextKey || prevKey) && (
              <div className="px-4 py-3 border-t border-stone-200 text-sm">
                <button
                  type="button"
                  onClick={() => goTo((nextKey ?? prevKey)!)}
                  className="font-medium text-stone-900 underline underline-offset-2 hover:text-emerald-800"
                >
                  {nextKey
                    ? `Ir a la próxima actividad: ${formatEventDate(nextKey)}`
                    : `Ver la última actividad: ${formatEventDate(prevKey!)}`}
                </button>
              </div>
            )}
          </section>

          {/* Selected day */}
          <section className="lg:sticky lg:top-20 bg-white border border-stone-200 rounded-md" aria-labelledby="dia-titulo">
            <div className="px-4 py-3 border-b border-stone-200">
              <h3 id="dia-titulo" className="text-base font-semibold text-stone-950">
                {formatEventDate(selectedKey, { withYear: false })}
                {selectedKey === todayKey && <span className="font-normal text-stone-500"> · hoy</span>}
              </h3>
              <p className="text-sm text-stone-600">
                {selectedEvents.length === 0
                  ? 'Sin actividades este día'
                  : selectedEvents.length === 1
                  ? '1 actividad'
                  : `${selectedEvents.length} actividades`}
              </p>
            </div>

            {selectedEvents.length > 0 ? (
              <ul className="divide-y divide-stone-200">
                {selectedEvents.map(evt => {
                  const past = selectedKey < todayKey;
                  return (
                    <li
                      key={evt.id}
                      id={`event-card-${evt.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEventDetail(evt)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openEventDetail(evt);
                        }
                      }}
                      className="group flex gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
                    >
                      <img
                        src={resolveMediaUrl(evt.image)}
                        alt=""
                        loading="lazy"
                        className="w-16 h-16 rounded-sm object-cover bg-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-stone-600">
                          <span className="font-semibold text-stone-900 tabular-nums">{evt.time}</span> ·{' '}
                          {CATEGORY[evt.category]}
                        </p>
                        <h4 className="mt-0.5 text-[15px] font-semibold leading-snug text-stone-950 group-hover:text-emerald-900 line-clamp-2">
                          {evt.title}
                        </h4>
                        <p className="mt-0.5 text-sm text-stone-600 truncate">{evt.locationName}</p>
                        <div className="mt-2.5">
                          <CapacityBar evt={evt} past={past} />
                          <p className="mt-1.5 text-xs text-stone-600 tabular-nums">
                            {capacityText(evt, past)}
                            {evt.isRegistered && !past && <span className="font-semibold text-emerald-800"> · Inscrito</span>}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="m-4 rounded-md border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-700">
                <p>No hay actividades programadas para esta fecha.</p>
                {nextAfterSelected && (
                  <button
                    type="button"
                    onClick={() => goTo(nextAfterSelected)}
                    className="mt-3 h-9 px-3 rounded-md bg-white border border-stone-300 hover:bg-stone-50 text-stone-900 text-sm font-medium"
                  >
                    Ir a la próxima: {formatEventDate(nextAfterSelected, { withYear: false })}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {viewMode === 'lista' && (
        <section className="bg-white border border-stone-200 rounded-md overflow-hidden" aria-label="Lista de actividades">
          {listGroups.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-700">No hay actividades de este tipo.</p>
          ) : (
            listGroups.map(group => (
              <div key={group.label}>
                <h3 className="px-4 py-2 bg-stone-50 border-b border-stone-200 text-sm font-semibold text-stone-700">
                  {group.label}
                </h3>
                <ul className="divide-y divide-stone-200 border-b border-stone-200 last:border-b-0">
                  {group.items.map(({ evt, key }) => {
                    const d = key ? parseEventDate(key) : null;
                    const past = key ? key < todayKey : false;
                    return (
                      <li key={evt.id}>
                        <button
                          type="button"
                          onClick={() => openEventDetail(evt)}
                          className="group w-full text-left grid grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[3.5rem_6rem_minmax(0,1fr)_11rem] gap-3 sm:gap-4 px-4 py-4 hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
                        >
                          <span className={`flex flex-col ${past ? 'text-stone-400' : 'text-stone-950'}`}>
                            <span className="text-2xl font-semibold leading-none tabular-nums">{d ? d.getDate() : '—'}</span>
                            <span className="mt-1 text-xs text-stone-500">
                              {d ? d.toLocaleDateString('es-CL', { weekday: 'short' }) : ''}
                            </span>
                          </span>
                          <img
                            src={resolveMediaUrl(evt.image)}
                            alt=""
                            loading="lazy"
                            className="hidden sm:block w-24 h-[4.5rem] rounded-sm object-cover bg-stone-200"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm text-stone-600">
                              <span className="font-semibold text-stone-900 tabular-nums">{evt.time}</span> · {CATEGORY[evt.category]}
                            </span>
                            <span className="mt-0.5 block text-[15px] font-semibold leading-snug text-stone-950 group-hover:text-emerald-900">
                              {evt.title}
                            </span>
                            <span className="mt-0.5 block text-sm text-stone-600">
                              {evt.locationName}
                              {evt.routeName ? ` · ${evt.routeName}` : ''}
                            </span>
                            <span className="sm:hidden mt-2 block">
                              <CapacityBar evt={evt} past={past} />
                              <span className="mt-1.5 block text-xs text-stone-600 tabular-nums">{capacityText(evt, past)}</span>
                            </span>
                          </span>
                          <span className="hidden sm:block self-center">
                            <CapacityBar evt={evt} past={past} />
                            <span className="mt-1.5 block text-xs text-stone-600 tabular-nums">{capacityText(evt, past)}</span>
                            {evt.isRegistered && !past && (
                              <span className="mt-0.5 block text-xs font-semibold text-emerald-800">Inscrito</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      )}

      {/* Activity detail */}
      <dialog
        ref={eventDialogRef}
        closedby="any"
        onClose={() => setActiveEventModal(null)}
        aria-labelledby="event-modal-title"
        className="m-auto w-[calc(100%-1.5rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg bg-white text-stone-900 p-0 shadow-2xl backdrop:bg-black/60"
      >
        {activeEventModal && (
          <div>
            <div className="relative h-56 sm:h-64 w-full bg-stone-900">
              <img
                src={modalPhotos[modalPhotoIdx] || resolveMediaUrl(activeEventModal.image)}
                alt={activeEventModal.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={closeEventDetail}
                aria-label="Cerrar"
                className="absolute top-3 right-3 w-9 h-9 rounded-md bg-white/90 hover:bg-white text-stone-900 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {modalPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setModalPhotoIdx((modalPhotoIdx - 1 + modalPhotos.length) % modalPhotos.length)}
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md bg-black/55 hover:bg-black/75 text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPhotoIdx((modalPhotoIdx + 1) % modalPhotos.length)}
                    aria-label="Foto siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md bg-black/55 hover:bg-black/75 text-white flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-sm bg-black/65 text-white text-xs tabular-nums">
                    {modalPhotoIdx + 1} / {modalPhotos.length}
                  </span>
                </>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-sm font-medium text-emerald-800">
                {modalKey ? formatEventDate(modalKey) : activeEventModal.date} · {activeEventModal.time}
              </p>
              <h3 id="event-modal-title" className="mt-1 text-xl font-semibold leading-snug text-stone-950">
                {activeEventModal.title}
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                {CATEGORY[activeEventModal.category]}
                {activeEventModal.routeName ? ` · ${activeEventModal.routeName}` : ''}
              </p>

              {modalPhotos.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none">
                  {modalPhotos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setModalPhotoIdx(idx)}
                      aria-label={`Foto ${idx + 1}`}
                      aria-pressed={idx === modalPhotoIdx}
                      className={`w-16 h-12 rounded-sm overflow-hidden shrink-0 transition-opacity ${
                        idx === modalPhotoIdx ? 'ring-2 ring-stone-900 ring-offset-1' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 py-4 border-y border-stone-200 text-sm">
                <div>
                  <dt className="text-stone-500">Punto de encuentro</dt>
                  <dd className="mt-0.5 font-medium text-stone-900">{activeEventModal.locationName}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Organiza</dt>
                  <dd className="mt-0.5 font-medium text-stone-900">{activeEventModal.organizer}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-stone-900">Descripción</h4>
                <p className="mt-1 text-[15px] leading-relaxed text-stone-700">{activeEventModal.description}</p>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-3 text-sm tabular-nums">
                  <span className="font-medium text-stone-900">
                    {activeEventModal.registeredCount} de {activeEventModal.capacity} personas inscritas
                  </span>
                  <span className="text-stone-600">
                    {modalPast
                      ? 'Finalizada'
                      : modalFull
                      ? 'Sin cupos'
                      : `Quedan ${Math.max(0, activeEventModal.capacity - activeEventModal.registeredCount)} cupos`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-stone-200" aria-hidden="true">
                  <div
                    className={`h-full transition-[width] duration-300 ${modalPast ? 'bg-stone-400' : 'bg-emerald-700'}`}
                    style={{ width: `${fillRatio(activeEventModal)}%` }}
                  />
                </div>
                {activeEventModal.isRegistered && !modalPast && (
                  <p className="mt-2 text-sm font-medium text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Tienes un cupo reservado en esta actividad.
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
                {onGoToMapLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      const coords = activeEventModal.coordinates;
                      const rId = activeEventModal.routeId;
                      closeEventDetail();
                      onGoToMapLocation(coords, rId);
                    }}
                    className="h-10 px-4 rounded-md border border-stone-300 hover:bg-stone-50 text-stone-900 text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-stone-500" />
                    Ver en el mapa
                  </button>
                )}

                <div className="ml-auto">
                  {modalPast ? (
                    <button
                      type="button"
                      disabled
                      className="h-10 px-4 rounded-md bg-stone-100 text-stone-500 text-sm font-medium"
                    >
                      Actividad finalizada
                    </button>
                  ) : activeEventModal.isRegistered ? (
                    <button
                      type="button"
                      onClick={() => handleToggleRegister(activeEventModal.id)}
                      className="h-10 px-4 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-900 text-sm font-medium transition-colors"
                    >
                      Inscrito · Cancelar cupo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleRegister(activeEventModal.id)}
                      disabled={modalFull}
                      className="h-10 px-4 rounded-md bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 disabled:bg-stone-200 disabled:text-stone-500 text-white text-sm font-semibold transition-colors"
                    >
                      {modalFull ? 'Sin cupos disponibles' : currentUser ? 'Inscribirme' : 'Inicia sesión para inscribirte'}
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
