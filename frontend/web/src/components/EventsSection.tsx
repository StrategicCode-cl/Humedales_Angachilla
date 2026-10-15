'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Compass,
  CheckCircle,
  Share2,
  CalendarCheck,
  Tag
} from 'lucide-react';
import { WetlandEvent, User } from '../types';
import { storageService } from '../services/storageService';

interface EventsSectionProps {
  onGoToMapLocation?: (coords: [number, number], routeId?: string) => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  onGoToMapLocation,
  currentUser,
  onOpenAuth
}) => {
  const [events, setEvents] = useState<WetlandEvent[]>(() => storageService.getEvents());
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [registeredSuccessId, setRegisteredSuccessId] = useState<string | null>(null);

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
    if (result.isRegistered) {
      setRegisteredSuccessId(eventId);
      setTimeout(() => setRegisteredSuccessId(null), 3000);
    }
  };

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'avistamiento', label: 'Avistamiento' },
    { id: 'educativo', label: 'Educación' },
    { id: 'fotografia', label: 'Fotografía' },
    { id: 'kayak', label: 'Kayak' },
    { id: 'limpieza', label: 'Conservación' }
  ];

  const filteredEvents = events.filter(e => {
    if (selectedFilter === 'all') return true;
    return e.category === selectedFilter;
  });

  return (
    <div className="w-full min-h-screen bg-stone-50 text-stone-900 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 lg:px-8 pt-5 lg:pt-7 pb-4 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="max-w-2xl lg:max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Agenda Santuario
              </span>
              <h1 className="text-xl lg:text-2xl font-black text-stone-900 font-display">
                Eventos del Humedal
              </h1>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {filteredEvents.length} actividades
            </span>
          </div>

          {/* Minimal Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none mt-3.5 pt-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === cat.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-6 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-5 lg:items-stretch">
        {filteredEvents.map(evt => {
          const isFull = evt.registeredCount >= evt.capacity;
          const spotsLeft = Math.max(0, evt.capacity - evt.registeredCount);

          return (
            <article
              key={evt.id}
              id={`event-card-${evt.id}`}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Event Image */}
              <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-stone-100">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badge Category */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-stone-900 uppercase tracking-wide">
                    {evt.category}
                  </span>
                </div>

                {/* Route Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{evt.routeName}</span>
                  </div>
                  <span className="text-[11px] font-medium text-stone-200">
                    {evt.organizer}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                  {evt.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed line-clamp-2">
                  {evt.description}
                </p>

                {/* Metadata details */}
                <div className="mt-3.5 pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-semibold">{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{evt.locationName}</span>
                  </div>
                </div>

                {/* Capacity and Action buttons */}
                <div className="flex-1 min-h-4" />
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <Users className="w-4 h-4 text-stone-400" />
                    <span>
                      <strong className="text-stone-800">{evt.registeredCount}</strong> / {evt.capacity} inscritos
                    </span>
                    {spotsLeft <= 5 && spotsLeft > 0 && (
                      <span className="text-amber-600 font-semibold ml-1">
                        (¡Quedan {spotsLeft} cupos!)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onGoToMapLocation && (
                      <button
                        onClick={() => onGoToMapLocation(evt.coordinates, evt.routeId)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 hover:border-stone-400 text-stone-700 hover:text-stone-900 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Ver ubicación en el mapa"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Ver en Mapa</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleRegister(evt.id)}
                      disabled={isFull && !evt.isRegistered}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        evt.isRegistered
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : isFull
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                    >
                      {evt.isRegistered ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Inscrito</span>
                        </>
                      ) : isFull ? (
                        <span>Agotado</span>
                      ) : (
                        <>
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Inscribirme</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {registeredSuccessId === evt.id && (
                  <div className="mt-3 p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Te has inscrito exitosamente a esta actividad del humedal!</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
