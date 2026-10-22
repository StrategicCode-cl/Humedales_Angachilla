'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { WetlandEvent, User } from '../types';
import { storageService } from '../services/storageService';
import { dateKey, eventDateKey, formatEventDate, parseEventDate } from '../lib/eventDates';

interface EventsSectionProps {
  onGoToMapLocation?: (coords: [number, number], routeId?: string) => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

const CATEGORY: Record<WetlandEvent['category'], string> = {
  avistamiento: 'Avistamiento de aves',
  educativo: 'Charla o taller',
  fotografia: 'Fotografía',
  kayak: 'Kayak',
  limpieza: 'Conservación y limpieza',
  comunitario: 'Comunitaria'
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

export const EventsSection: React.FC<EventsSectionProps> = ({ onGoToMapLocation, currentUser, onOpenAuth }) => {
  const [events, setEvents] = useState<WetlandEvent[]>(() => storageService.getEvents());
  const [category, setCategory] = useState<WetlandEvent['category'] | 'todas'>('todas');
  const todayKey = dateKey(new Date());

  const filtered = useMemo(() => events.filter(e => category === 'todas' || e.category === category), [events, category]);

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
  const undated = filtered.filter(evt => !eventDateKey(evt.date));
  const datedKeys = [...byDay.keys()].sort();

  // Opens on this month, on the next day with activities (or today)
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
  const monthEvents = datedKeys.filter(k => k.startsWith(monthPrefix)).reduce((n, k) => n + (byDay.get(k)?.length ?? 0), 0);
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
      prev.map(e => (e.id === eventId ? { ...e, isRegistered: result.isRegistered, registeredCount: result.newCount } : e))
    );
  };

  const categoriesInData = (Object.keys(CATEGORY) as WetlandEvent['category'][]).filter(c => events.some(e => e.category === c));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-9 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Calendario</h1>
          <p className="mt-0.5 text-sm text-stone-600">
            {monthEvents > 0
              ? `${monthEvents === 1 ? '1 actividad' : `${monthEvents} actividades`} en ${monthName(month)}. Elige un día para ver el detalle.`
              : `No hay actividades en ${monthName(month)}.`}
          </p>
        </div>
        {categoriesInData.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <span className="sr-only sm:not-sr-only">Tipo</span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as WetlandEvent['category'] | 'todas')}
              className="h-9 px-2 rounded-md bg-white border border-stone-300 text-sm text-stone-900"
            >
              <option value="todas">Todas las actividades</option>
              {categoriesInData.map(c => (
                <option key={c} value={c}>
                  {CATEGORY[c]}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 lg:gap-6 items-start">
        {/* Month */}
        <section className="bg-white border border-stone-200 rounded-lg" aria-label={`Calendario de ${monthLabel(month)}`}>
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
            <h2 className="text-lg font-semibold text-stone-950" aria-live="polite">
              {monthLabel(month)}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goTo(todayKey)}
                className="h-9 px-3 rounded-md text-sm font-semibold text-stone-800 hover:bg-stone-100"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Mes anterior"
                className="w-9 h-9 rounded-md flex items-center justify-center text-stone-700 hover:bg-stone-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Mes siguiente"
                className="w-9 h-9 rounded-md flex items-center justify-center text-stone-700 hover:bg-stone-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-stone-200 text-xs text-stone-600" aria-hidden="true">
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
              const dayEvents = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              const isPast = key < todayKey;
              const label = `${formatEventDate(key)}${dayEvents.length ? `, ${dayEvents.length === 1 ? '1 actividad' : `${dayEvents.length} actividades`}` : ''}`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (inMonth ? setSelectedKey(key) : goTo(key))}
                  aria-label={label}
                  aria-pressed={isSelected}
                  className={`relative min-h-14 sm:min-h-24 p-1 sm:p-1.5 text-left flex flex-col items-center sm:items-stretch gap-1 border-stone-200 transition-colors
                    ${i % 7 !== 6 ? 'border-r' : ''} ${i >= 7 ? 'border-t' : ''}
                    ${isSelected ? 'bg-stone-100' : inMonth ? 'hover:bg-stone-50' : 'bg-stone-50/60 hover:bg-stone-100'}
                    focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stone-900`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm tabular-nums
                      ${isSelected ? 'bg-stone-950 text-white font-semibold' : isToday ? 'ring-1 ring-stone-900 text-stone-950 font-semibold' : ''}
                      ${!isSelected && !isToday ? (inMonth ? (isPast ? 'text-stone-500' : 'text-stone-900') : 'text-stone-400') : ''}`}
                  >
                    {day.getDate()}
                  </span>

                  {/* Phone: one dot per activity */}
                  {dayEvents.length > 0 && (
                    <span className="sm:hidden flex gap-0.5" aria-hidden="true">
                      {dayEvents.slice(0, 3).map(evt => (
                        <span key={evt.id} className={`w-1.5 h-1.5 rounded-full ${isPast ? 'bg-stone-400' : 'bg-emerald-700'}`} />
                      ))}
                    </span>
                  )}

                  {/* Larger screens: the activities themselves */}
                  <span className="hidden sm:flex flex-col gap-0.5 min-w-0 w-full" aria-hidden="true">
                    {dayEvents.slice(0, 2).map(evt => (
                      <span
                        key={evt.id}
                        className={`block truncate text-xs leading-5 px-1.5 rounded-sm ${
                          isPast ? 'bg-stone-100 text-stone-600' : 'bg-emerald-50 text-emerald-950'
                        }`}
                      >
                        <span className="tabular-nums">{evt.time.slice(0, 5)}</span> {evt.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && <span className="text-xs text-stone-600 px-1.5">+{dayEvents.length - 2} más</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {monthEvents === 0 && (nextKey || prevKey) && (
            <div className="px-4 py-3 border-t border-stone-200 text-sm text-stone-700">
              {nextKey ? (
                <button type="button" onClick={() => goTo(nextKey)} className="font-semibold text-stone-950 underline underline-offset-2">
                  Ir a la próxima actividad: {formatEventDate(nextKey)}
                </button>
              ) : (
                prevKey && (
                  <button type="button" onClick={() => goTo(prevKey)} className="font-semibold text-stone-950 underline underline-offset-2">
                    Ver la última actividad: {formatEventDate(prevKey)}
                  </button>
                )
              )}
            </div>
          )}
        </section>

        {/* Selected day */}
        <section className="lg:sticky lg:top-6" aria-labelledby="dia-titulo">
          <h2 id="dia-titulo" className="text-lg font-semibold text-stone-950">
            {formatEventDate(selectedKey, { withYear: false })}
          </h2>
          <p className="text-sm text-stone-600">
            {selectedEvents.length === 0
              ? 'Sin actividades este día.'
              : selectedEvents.length === 1
              ? '1 actividad'
              : `${selectedEvents.length} actividades`}
            {selectedKey === todayKey && ' · Hoy'}
          </p>

          {selectedEvents.length > 0 ? (
            <ul className="mt-3 bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
              {selectedEvents.map(evt => {
                const past = selectedKey < todayKey;
                const full = evt.registeredCount >= evt.capacity;
                const left = Math.max(0, evt.capacity - evt.registeredCount);
                return (
                  <li key={evt.id} id={`event-card-${evt.id}`} className="p-4">
                    <p className="text-sm font-semibold text-stone-900 tabular-nums">{evt.time}</p>
                    <h3 className="mt-0.5 text-base font-semibold text-stone-950">{evt.title}</h3>
                    <p className="text-sm text-stone-600">
                      {CATEGORY[evt.category]} · {evt.locationName}
                      {evt.routeName && ` · ${evt.routeName}`}
                    </p>
                    <p className="mt-1.5 text-sm text-stone-700 leading-relaxed">{evt.description}</p>

                    <div className="mt-3">
                      <div className="flex items-baseline justify-between text-sm tabular-nums">
                        <span className="text-stone-900">
                          <span className="font-semibold">{evt.registeredCount}</span> de {evt.capacity} inscritos
                        </span>
                        {!past && <span className={left <= 5 && left > 0 ? 'text-amber-800 font-semibold' : 'text-stone-600'}>
                          {full ? 'Sin cupos' : left === 1 ? 'Queda 1 cupo' : `Quedan ${left} cupos`}
                        </span>}
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${past ? 'bg-stone-400' : 'bg-emerald-700'}`}
                          style={{ width: `${Math.min(100, (evt.registeredCount / Math.max(1, evt.capacity)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {past ? (
                        <span className="h-9 px-3 rounded-md bg-stone-100 text-sm font-semibold text-stone-600 inline-flex items-center">
                          Finalizada
                        </span>
                      ) : evt.isRegistered ? (
                        <button
                          type="button"
                          onClick={() => handleToggleRegister(evt.id)}
                          className="h-9 px-3 rounded-md bg-stone-200 hover:bg-stone-300 text-sm font-semibold text-stone-900"
                          title="Cancelar inscripción"
                        >
                          Inscrito · Cancelar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleRegister(evt.id)}
                          disabled={full}
                          className="h-9 px-3.5 rounded-md bg-stone-950 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-500 text-white text-sm font-semibold"
                        >
                          {full ? 'Sin cupos' : currentUser ? 'Inscribirme' : 'Inicia sesión para inscribirte'}
                        </button>
                      )}
                      {onGoToMapLocation && (
                        <button
                          type="button"
                          onClick={() => onGoToMapLocation(evt.coordinates, evt.routeId)}
                          className="h-9 px-2.5 rounded-md text-sm font-semibold text-stone-800 hover:bg-stone-100 inline-flex items-center gap-1.5"
                        >
                          <MapPin className="w-4 h-4" />
                          Ver en el mapa
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-3 px-4 py-4 text-sm text-stone-600 border border-dashed border-stone-300 rounded-lg">
              {nextAfterSelected ? (
                <>
                  Próxima actividad:{' '}
                  <button
                    type="button"
                    onClick={() => goTo(nextAfterSelected)}
                    className="font-semibold text-stone-950 underline underline-offset-2"
                  >
                    {formatEventDate(nextAfterSelected, { withYear: false })}
                  </button>
                </>
              ) : (
                'No hay actividades programadas después de este día.'
              )}
            </div>
          )}

          {undated.length > 0 && (
            <p className="mt-3 text-sm text-stone-600">
              {undated.length === 1 ? '1 actividad' : `${undated.length} actividades`} sin fecha reconocible:{' '}
              {undated.map(e => e.title).join(', ')}.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
