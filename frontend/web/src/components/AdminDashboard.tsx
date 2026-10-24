'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  Suggestion,
  CommunityPhoto,
  Notice,
  User,
  PointOfInterest,
  Species,
  WetlandEvent,
  DonationRecord,
  ModerationTicket
} from '../types';
import { storageService } from '../services/storageService';
import { resolveMediaUrl } from '../lib/api';
import { HUMEDAL_ROUTES } from '../data/mockData';
import { eventDateKey, formatEventDate } from '../lib/eventDates';
import { MapPointsManager } from './MapPointsManager';

interface AdminDashboardProps {
  currentUser: User | null;
  onRefreshAll?: () => void;
}

type SectionId = 'tickets' | 'sugerencias' | 'eventos' | 'mapa' | 'totems' | 'especies' | 'avisos' | 'fotos' | 'donaciones';
type TicketFilter = 'pendiente' | 'aprobado' | 'rechazado' | 'todos';

const TICKET_TYPE: Record<ModerationTicket['type'], { label: string; approve: string }> = {
  aviso_novedad: { label: 'Aviso para el inicio', approve: 'Aprobar y publicar en el inicio' },
  foto_comunidad: { label: 'Foto para la galería', approve: 'Aprobar y publicar en la galería' },
  avistamiento_especie: { label: 'Avistamiento', approve: 'Marcar como revisado' },
  reporte_ambiental: { label: 'Reporte ambiental', approve: 'Marcar como revisado' }
};

const TICKET_STATUS: Record<ModerationTicket['status'], { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-50 text-amber-900' },
  aprobado: { label: 'Aprobado', className: 'bg-emerald-50 text-emerald-900' },
  rechazado: { label: 'Rechazado', className: 'bg-stone-100 text-stone-700' }
};

const SUGGESTION_STATUS: Record<Suggestion['status'], { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-50 text-amber-900' },
  aprobada: { label: 'Aprobada', className: 'bg-emerald-50 text-emerald-900' },
  rechazada: { label: 'No aprobada', className: 'bg-stone-100 text-stone-700' }
};

const SUGGESTION_CATEGORY: Record<Suggestion['category'], string> = {
  infraestructura: 'Infraestructura',
  fauna: 'Fauna',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  educacion: 'Educación'
};

const POI_CATEGORY: Record<PointOfInterest['category'], string> = {
  totem_qr: 'Tótem informativo',
  mirador: 'Mirador',
  pasarela: 'Pasarela',
  torre: 'Torre de observación',
  muelle: 'Muelle',
  bano_ecologico: 'Baño ecológico'
};

const SOUND_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Sin audio' },
  { value: 'siete_colores', label: 'Siete colores' },
  { value: 'cisne', label: 'Cisne de cuello negro' },
  { value: 'chucao', label: 'Chucao' },
  { value: 'tagua', label: 'Tagua' },
  { value: 'martin_pescador', label: 'Martín pescador' },
  { value: 'ranita_darwin', label: 'Ranita de Darwin' }
];

const EVENT_CATEGORY: Record<WetlandEvent['category'], string> = {
  avistamiento: 'Avistamiento de aves',
  limpieza: 'Jornada de limpieza',
  educativo: 'Charla o taller',
  fotografia: 'Fotografía de naturaleza',
  kayak: 'Salida en kayak',
  comunitario: 'Actividad comunitaria'
};

const SPECIES_CATEGORY: Record<Species['category'], string> = {
  ave_acuatica: 'Ave acuática',
  ave_totoral: 'Ave de totoral',
  ave_bosque: 'Ave de bosque',
  mamifero: 'Mamífero',
  anfibio: 'Anfibio',
  reptil: 'Reptil',
  hongo: 'Hongo',
  arbol_arbusto: 'Árbol o arbusto nativo',
  planta_acuatica: 'Planta acuática'
};

const CONSERVATION: { value: Species['conservationStatus']; dot: string; statusColor: string }[] = [
  { value: 'En Peligro Crítico', dot: 'bg-red-700', statusColor: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'En Peligro', dot: 'bg-red-500', statusColor: 'bg-rose-100 text-rose-800 border-rose-300' },
  { value: 'Vulnerable', dot: 'bg-amber-500', statusColor: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'Casi Amenazada', dot: 'bg-yellow-400', statusColor: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'Preocupación Menor', dot: 'bg-emerald-500', statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
];

const DONATION_PURPOSE: Record<DonationRecord['purpose'], string> = {
  mantenimiento_pasarelas: 'Mantenimiento de pasarelas',
  reforestacion: 'Reforestación',
  totems_qr: 'Tótems QR',
  monitoreo_fauna: 'Monitoreo de fauna',
  general: 'Aporte general'
};

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const today = () => new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });


const nextQrCode = (pois: PointOfInterest[]) => {
  const max = pois.reduce((m, p) => Math.max(m, Number(p.qrCode.match(/(\d+)$/)?.[1] ?? 0)), 0);
  return `ANG-QR-${String(max + 1).padStart(2, '0')}`;
};

const input =
  'w-full h-10 px-3 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';
const textarea =
  'w-full px-3 py-2 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';
const btnPrimary = 'h-9 px-3.5 rounded-md bg-stone-950 hover:bg-stone-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0';
const btnSecondary = 'h-9 px-3 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-900 text-sm font-semibold inline-flex items-center gap-1.5 shrink-0';
const btnGhost = 'h-9 px-2.5 rounded-md text-stone-700 hover:bg-stone-100 text-sm font-semibold inline-flex items-center gap-1.5 shrink-0';
const iconBtn = 'w-9 h-9 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 shrink-0';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-stone-800 mb-1">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-stone-600">{hint}</span>}
    </label>
  );
}

function Dialog({
  title,
  description,
  onClose,
  children,
  wide = false
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        onClick={e => e.stopPropagation()}
        className={`bg-white text-stone-900 w-full ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto rounded-t-lg sm:rounded-lg shadow-xl`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id="admin-dialog-title" className="text-lg font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-stone-600">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={`${iconBtn} -mr-2 -mt-1`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-5 pt-4">{children}</div>
      </div>
    </div>
  );
}

function DialogActions({ onCancel, submitLabel, danger = false }: { onCancel: () => void; submitLabel: string; danger?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className={btnGhost}>
        Cancelar
      </button>
      <button
        type="submit"
        className={danger ? 'h-9 px-3.5 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold' : btnPrimary}
      >
        {submitLabel}
      </button>
    </div>
  );
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-950">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-600 max-w-2xl">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-4 text-sm text-stone-600 border border-dashed border-stone-300 rounded-lg">{children}</p>;
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>{children}</span>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onRefreshAll }) => {
  const [section, setSection] = useState<SectionId>('tickets');
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('pendiente');

  // Datasets from storage (PostgreSQL + MongoDB)
  const [tickets, setTickets] = useState<ModerationTicket[]>(() => storageService.getModerationTickets());
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => storageService.getSuggestions());
  const [photos, setPhotos] = useState<CommunityPhoto[]>(() => storageService.getCommunityPhotos());
  const [notices, setNotices] = useState<Notice[]>(() => storageService.getNotices());
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(() => storageService.getPointsOfInterest());
  const [speciesList, setSpeciesList] = useState<Species[]>(() => storageService.getSpecies());
  const [eventsList, setEventsList] = useState<WetlandEvent[]>(() => storageService.getEvents());
  const [donationsList] = useState<DonationRecord[]>(() => storageService.getDonations());

  useEffect(() => {
    const onSync = () => {
      setTickets([...storageService.getModerationTickets()]);
      setSuggestions([...storageService.getSuggestions()]);
      setPhotos([...storageService.getCommunityPhotos()]);
      setNotices([...storageService.getNotices()]);
      setPointsOfInterest([...storageService.getPointsOfInterest()]);
      setSpeciesList([...storageService.getSpecies()]);
      setEventsList([...storageService.getEvents()]);
    };
    window.addEventListener('angachilla:sync', onSync);
    onSync();
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

  // Dialogs: one draft per kind, `id` set when editing an existing record
  const [totemDraft, setTotemDraft] = useState<{ id?: string; data: Omit<PointOfInterest, 'id'> } | null>(null);
  const [eventDraft, setEventDraft] = useState<{ id?: string; data: Omit<WetlandEvent, 'id' | 'registeredCount' | 'isRegistered'> } | null>(null);
  const [speciesDraft, setSpeciesDraft] = useState<{ id?: string; data: Omit<Species, 'id'> } | null>(null);
  const [approvingSuggestion, setApprovingSuggestion] = useState<Suggestion | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [reasonPrompt, setReasonPrompt] = useState<{ title: string; description: string; onSubmit: (reason: string) => void } | null>(null);
  const [reason, setReason] = useState('');
  const [confirmPrompt, setConfirmPrompt] = useState<{ title: string; description: string; confirmLabel: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const reviewer = currentUser?.name || 'Guardaparques';
  const pendingTickets = tickets.filter(t => t.status === 'pendiente');
  const pendingSuggestions = suggestions.filter(s => s.status === 'pendiente');
  const resolvedSuggestions = suggestions.filter(s => s.status !== 'pendiente');
  const totalDonationsClp = donationsList.reduce((acc, d) => acc + d.amountClp, 0);
  const waiting = pendingTickets.length + pendingSuggestions.length;
  const visibleTickets = tickets.filter(t => ticketFilter === 'todos' || t.status === ticketFilter);

  const done = (message: string) => {
    setToast(message);
    onRefreshAll?.();
  };

  const askConfirm = (title: string, description: string, confirmLabel: string, onConfirm: () => void) =>
    setConfirmPrompt({ title, description, confirmLabel, onConfirm });

  const askReason = (title: string, description: string, onSubmit: (reason: string) => void) => {
    setReason('');
    setReasonPrompt({ title, description, onSubmit });
  };

  // --- Moderation ---
  const handleApproveTicket = (ticket: ModerationTicket) => {
    if (ticket.type === 'aviso_novedad') {
      storageService.addNotice({
        title: ticket.title,
        summary: ticket.description.slice(0, 140),
        fullText: ticket.description,
        image: ticket.imageUrl || resolveMediaUrl('/api/media/slug/estacion-s1-foto-1'),
        category: 'comunidad',
        author: ticket.authorName
      });
      setNotices(storageService.getNotices());
    } else if (ticket.type === 'foto_comunidad' && ticket.imageUrl) {
      storageService.addCommunityPhoto({
        title: ticket.title,
        visitedPlace: ticket.locationName || 'Santuario Angachilla',
        imageUrl: ticket.imageUrl,
        authorName: ticket.authorName,
        authorEmail: ticket.authorEmail,
        description: ticket.description
      });
      setPhotos(storageService.getCommunityPhotos());
    }
    storageService.updateModerationTicket(ticket.id, { status: 'aprobado', reviewedBy: reviewer, reviewedAt: today() });
    setTickets(storageService.getModerationTickets());
    done(
      ticket.type === 'aviso_novedad'
        ? 'Aprobado y publicado en el inicio.'
        : ticket.type === 'foto_comunidad'
        ? 'Aprobado y publicado en la galería.'
        : 'Marcado como revisado.'
    );
  };

  const handleRejectTicket = (ticket: ModerationTicket) =>
    askReason('Rechazar envío', `“${ticket.title}”. El motivo queda registrado en el envío.`, feedback => {
      storageService.updateModerationTicket(ticket.id, {
        status: 'rechazado',
        reviewedBy: reviewer,
        reviewedAt: today(),
        adminFeedback: feedback || 'No se ajusta a las directrices del plan de manejo del santuario.'
      });
      setTickets(storageService.getModerationTickets());
      done('Envío rechazado.');
    });

  const handleDeleteTicket = (ticket: ModerationTicket) =>
    askConfirm('Eliminar envío', `“${ticket.title}” se eliminará definitivamente.`, 'Eliminar', () => {
      storageService.deleteModerationTicket(ticket.id);
      setTickets(storageService.getModerationTickets());
      done('Envío eliminado.');
    });

  // --- Suggestions ---
  const handleApproveSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingSuggestion) return;
    storageService.updateSuggestionStatus(
      approvingSuggestion.id,
      'aprobada',
      adminComment || 'Propuesta evaluada y aprobada por los guardaparques.'
    );
    setSuggestions(storageService.getSuggestions());
    setApprovingSuggestion(null);
    setAdminComment('');
    done('Sugerencia aprobada. La respuesta ya es visible en el buzón.');
  };

  const handleRejectSuggestion = (sug: Suggestion) =>
    askReason('No aprobar sugerencia', `“${sug.title}”. El motivo se muestra a quien la envió.`, text => {
      storageService.updateSuggestionStatus(sug.id, 'rechazada', text || 'No se ajusta al plan de manejo ecológico del humedal.');
      setSuggestions(storageService.getSuggestions());
      done('Sugerencia marcada como no aprobada.');
    });

  // --- Totems ---
  const newTotem = () =>
    setTotemDraft({
      data: {
        name: '',
        category: 'totem_qr',
        coordinates: HUMEDAL_ROUTES[0]?.path[0] ?? [-39.8565, -73.2385],
        description: '',
        qrCode: nextQrCode(pointsOfInterest),
        image: '',
        soundKey: ''
      }
    });

  const handleSaveTotem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totemDraft) return;
    if (totemDraft.id) {
      storageService.updatePointOfInterest(totemDraft.id, totemDraft.data);
      done('Tótem actualizado. El código impreso sigue siendo el mismo.');
    } else {
      storageService.addPointOfInterest(totemDraft.data);
      done(`Tótem ${totemDraft.data.qrCode} creado.`);
    }
    setPointsOfInterest(storageService.getPointsOfInterest());
    setTotemDraft(null);
  };

  const handleDeleteTotem = (poi: PointOfInterest) =>
    askConfirm('Eliminar tótem', `${poi.qrCode} · ${poi.name}. Su código QR dejará de abrir contenido.`, 'Eliminar', () => {
      storageService.deletePointOfInterest(poi.id);
      setPointsOfInterest(storageService.getPointsOfInterest());
      done('Tótem eliminado.');
    });

  // --- Events ---
  const newEvent = () => {
    const route = HUMEDAL_ROUTES[0];
    setEventDraft({
      data: {
        title: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        time: '10:00 - 12:00',
        locationName: 'Acceso al humedal',
        coordinates: route?.path[0] ?? [-39.8565, -73.2385],
        routeId: route?.id ?? '',
        routeName: route?.name ?? '',
        category: 'avistamiento',
        capacity: 20,
        image: resolveMediaUrl('/api/media/slug/estacion-s1-foto-1'),
        organizer: 'Comité Ecológico Angachilla'
      }
    });
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDraft) return;
    if (eventDraft.id) {
      // Only the edited fields: the registration count keeps its live value
      const { title, description, date, time, locationName, coordinates, routeId, routeName, category, capacity, image, organizer } =
        eventDraft.data;
      storageService.updateEvent(eventDraft.id, {
        title, description, date, time, locationName, coordinates, routeId, routeName, category, capacity, image, organizer
      });
      done('Evento actualizado.');
    } else {
      storageService.addEvent(eventDraft.data);
      done('Evento publicado en la cartelera.');
    }
    setEventsList(storageService.getEvents());
    setEventDraft(null);
  };

  const handleDeleteEvent = (evt: WetlandEvent) =>
    askConfirm(
      'Cancelar evento',
      `“${evt.title}” se eliminará de la cartelera${evt.registeredCount > 0 ? ` y de las ${evt.registeredCount} inscripciones` : ''}.`,
      'Eliminar evento',
      () => {
        storageService.deleteEvent(evt.id);
        setEventsList(storageService.getEvents());
        done('Evento eliminado.');
      }
    );

  // --- Species ---
  const newSpecies = () =>
    setSpeciesDraft({
      data: {
        commonName: '',
        mapudungunName: '',
        scientificName: '',
        category: 'ave_acuatica',
        conservationStatus: 'Preocupación Menor',
        statusColor: CONSERVATION[4].statusColor,
        habitat: '',
        description: '',
        funFact: '',
        image: ''
      }
    });

  const handleSaveSpecies = (e: React.FormEvent) => {
    e.preventDefault();
    if (!speciesDraft) return;
    const data = {
      ...speciesDraft.data,
      statusColor: CONSERVATION.find(c => c.value === speciesDraft.data.conservationStatus)?.statusColor ?? speciesDraft.data.statusColor
    };
    if (speciesDraft.id) {
      storageService.updateSpecies(speciesDraft.id, data);
      done('Ficha de especie actualizada.');
    } else {
      storageService.addSpecies(data);
      done(`${data.commonName} agregada al catálogo.`);
    }
    setSpeciesList(storageService.getSpecies());
    setSpeciesDraft(null);
  };

  const handleDeleteSpecies = (sp: Species) =>
    askConfirm('Eliminar especie', `${sp.commonName} se quitará del catálogo de biodiversidad.`, 'Eliminar', () => {
      storageService.deleteSpecies(sp.id);
      setSpeciesList(storageService.getSpecies());
      done('Especie eliminada.');
    });

  const handleDeleteNotice = (n: Notice) =>
    askConfirm('Eliminar aviso', `“${n.title}” dejará de mostrarse en el inicio.`, 'Eliminar', () => {
      storageService.deleteNotice(n.id);
      setNotices(storageService.getNotices());
      done('Aviso eliminado.');
    });

  const handleDeletePhoto = (p: CommunityPhoto) =>
    askConfirm('Eliminar foto', `“${p.title}” de ${p.authorName} se quitará de la galería.`, 'Eliminar', () => {
      storageService.deleteCommunityPhoto(p.id);
      setPhotos(storageService.getCommunityPhotos());
      done('Foto eliminada.');
    });

  const sections: { id: SectionId; label: string; count?: number; queue?: boolean }[] = [
    { id: 'tickets', label: 'Moderación', count: pendingTickets.length, queue: true },
    { id: 'sugerencias', label: 'Sugerencias', count: pendingSuggestions.length, queue: true },
    { id: 'eventos', label: 'Eventos', count: eventsList.length },
    { id: 'mapa', label: 'Puntos del mapa' },
    { id: 'totems', label: 'Tótems QR', count: pointsOfInterest.length },
    { id: 'especies', label: 'Especies', count: speciesList.length },
    { id: 'avisos', label: 'Avisos', count: notices.length },
    { id: 'fotos', label: 'Fotos de la galería', count: photos.length },
    { id: 'donaciones', label: 'Donaciones', count: donationsList.length }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-9 pb-24">
      {/* Title row */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Panel del guardaparques</h1>
          <p className="mt-0.5 text-sm text-stone-600">
            {waiting > 0 ? (
              <>
                <strong className="font-semibold text-stone-900">
                  {waiting === 1 ? '1 envío espera' : `${waiting} envíos esperan`} revisión
                </strong>{' '}
                ({pendingTickets.length} en moderación, {pendingSuggestions.length} en sugerencias)
              </>
            ) : (
              'No hay envíos pendientes de revisión.'
            )}
          </p>
        </div>
        <p className="text-sm text-stone-600">Sesión de {reviewer}</p>
      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8 lg:items-start">
        {/* Section navigation: a rail on desktop, a scrollable row on phones */}
        <nav aria-label="Secciones del panel" className="lg:sticky lg:top-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <ul className="flex lg:flex-col gap-1 pb-2 lg:pb-0">
            {sections.map(s => {
              const active = section === s.id;
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full h-9 px-3 rounded-md flex items-center justify-between gap-3 text-sm whitespace-nowrap transition-colors ${
                      active ? 'bg-stone-200 text-stone-950 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{s.label}</span>
                    {s.count === undefined ? null : s.queue ? (
                      s.count > 0 ? (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-stone-900 text-white text-xs font-semibold flex items-center justify-center tabular-nums">
                          {s.count}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500 tabular-nums">0</span>
                      )
                    ) : (
                      <span className="text-xs text-stone-500 tabular-nums">{s.count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-4 lg:mt-0 min-w-0 space-y-4">
          {/* MODERATION */}
          {section === 'tickets' && (
            <>
              <SectionHeader
                title="Moderación"
                description="Avisos, fotos, avistamientos y reportes enviados por visitantes. Nada se publica hasta que lo apruebes."
              />
              <div className="flex w-fit max-w-full overflow-x-auto gap-1 p-1 rounded-md bg-stone-200/70" role="group" aria-label="Filtrar por estado">
                {(['pendiente', 'aprobado', 'rechazado', 'todos'] as const).map(f => {
                  const count = f === 'todos' ? tickets.length : tickets.filter(t => t.status === f).length;
                  const label = { pendiente: 'Pendientes', aprobado: 'Aprobados', rechazado: 'Rechazados', todos: 'Todos' }[f];
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTicketFilter(f)}
                      aria-pressed={ticketFilter === f}
                      className={`h-8 px-3 rounded text-sm whitespace-nowrap shrink-0 transition-colors ${
                        ticketFilter === f ? 'bg-white text-stone-950 font-semibold' : 'text-stone-700 hover:text-stone-950'
                      }`}
                    >
                      {label} <span className="tabular-nums text-stone-500">{count}</span>
                    </button>
                  );
                })}
              </div>

              {visibleTickets.length === 0 ? (
                <EmptyRow>
                  {ticketFilter === 'pendiente' ? 'No hay envíos pendientes. Todo está revisado.' : 'No hay envíos en este estado.'}
                </EmptyRow>
              ) : (
                <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                  {visibleTickets.map(ticket => (
                    <li key={ticket.id} className="p-4 flex flex-col sm:flex-row gap-4">
                      {ticket.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ticket.imageUrl} alt="" className="w-full sm:w-36 aspect-[4/3] rounded-md object-cover bg-stone-200 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
                          <Pill className={TICKET_STATUS[ticket.status].className}>{TICKET_STATUS[ticket.status].label}</Pill>
                          <span>{TICKET_TYPE[ticket.type].label}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ticket.submittedAt}</span>
                        </div>
                        <h3 className="mt-1.5 text-base font-semibold text-stone-950">{ticket.title}</h3>
                        <p className="mt-0.5 text-sm text-stone-700 leading-relaxed">{ticket.description}</p>
                        <p className="mt-1.5 text-sm text-stone-600">
                          {ticket.authorName}
                          {ticket.authorEmail && ` · ${ticket.authorEmail}`}
                          {ticket.locationName && ` · ${ticket.locationName}`}
                        </p>
                        {ticket.reviewedBy && (
                          <p className="mt-1.5 text-sm text-stone-600">
                            {ticket.status === 'aprobado' ? 'Aprobado' : 'Rechazado'} por {ticket.reviewedBy}
                            {ticket.reviewedAt && ` el ${ticket.reviewedAt}`}
                            {ticket.adminFeedback && <span className="text-stone-800">: “{ticket.adminFeedback}”</span>}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {ticket.status === 'pendiente' && (
                            <>
                              <button type="button" onClick={() => handleApproveTicket(ticket)} className={btnPrimary}>
                                {TICKET_TYPE[ticket.type].approve}
                              </button>
                              <button type="button" onClick={() => handleRejectTicket(ticket)} className={btnSecondary}>
                                Rechazar
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(ticket)}
                            className={`${btnGhost} ${ticket.status === 'pendiente' ? 'sm:ml-auto' : ''}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* SUGGESTIONS */}
          {section === 'sugerencias' && (
            <>
              <SectionHeader
                title="Sugerencias"
                description="Propuestas del buzón ciudadano. Tu respuesta queda visible para quien la envió."
              />
              {pendingSuggestions.length === 0 ? (
                <EmptyRow>No hay sugerencias pendientes.</EmptyRow>
              ) : (
                <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                  {pendingSuggestions.map(sug => (
                    <li key={sug.id} className="p-4">
                      <p className="text-sm text-stone-600">
                        {SUGGESTION_CATEGORY[sug.category]} · {sug.createdAt} · {sug.authorName} ({sug.authorEmail})
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-stone-950">{sug.title}</h3>
                      <p className="mt-0.5 text-sm text-stone-700 leading-relaxed">{sug.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdminComment('');
                            setApprovingSuggestion(sug);
                          }}
                          className={btnPrimary}
                        >
                          Aprobar y responder
                        </button>
                        <button type="button" onClick={() => handleRejectSuggestion(sug)} className={btnSecondary}>
                          No aprobar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {resolvedSuggestions.length > 0 && (
                <>
                  <h3 className="pt-4 text-base font-semibold text-stone-950">Ya respondidas</h3>
                  <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                    {resolvedSuggestions.map(sug => (
                      <li key={sug.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base font-semibold text-stone-950">{sug.title}</p>
                          <Pill className={SUGGESTION_STATUS[sug.status].className}>{SUGGESTION_STATUS[sug.status].label}</Pill>
                        </div>
                        <p className="text-sm text-stone-600">
                          {SUGGESTION_CATEGORY[sug.category]} · {sug.createdAt} · {sug.authorName}
                        </p>
                        {sug.adminComment && <p className="mt-1 text-sm text-stone-700">Respuesta: {sug.adminComment}</p>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {/* EVENTS */}
          {section === 'eventos' && (
            <>
              <SectionHeader
                title="Eventos"
                description="Recorridos guiados, jornadas de limpieza y talleres publicados en la cartelera."
                action={
                  <button type="button" onClick={newEvent} className={btnPrimary}>
                    <Plus className="w-4 h-4" />
                    Crear evento
                  </button>
                }
              />
              {eventsList.length === 0 ? (
                <EmptyRow>No hay eventos publicados.</EmptyRow>
              ) : (
                <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                  {eventsList.map(evt => {
                    const full = evt.registeredCount >= evt.capacity;
                    return (
                      <li key={evt.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-stone-950">{evt.title}</h3>
                          <p className="text-sm text-stone-600">
                            {EVENT_CATEGORY[evt.category]} · {formatEventDate(evt.date)} · {evt.time}
                          </p>
                          <p className="text-sm text-stone-600">
                            {evt.locationName}
                            {evt.routeName && ` · ${evt.routeName}`}
                          </p>
                        </div>
                        <div className="sm:w-36 shrink-0">
                          <p className="text-sm tabular-nums text-stone-900">
                            <span className="font-semibold">{evt.registeredCount}</span> de {evt.capacity} inscritos
                          </p>
                          <div className="mt-1 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${full ? 'bg-amber-600' : 'bg-stone-700'}`}
                              style={{ width: `${Math.min(100, (evt.registeredCount / Math.max(1, evt.capacity)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            // The draft carries the whole event; the save merges it over the stored one
                            onClick={() => setEventDraft({ id: evt.id, data: evt })}
                            className={btnGhost}
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button type="button" onClick={() => handleDeleteEvent(evt)} aria-label={`Eliminar ${evt.title}`} className={iconBtn}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* TOTEMS */}
          {section === 'mapa' && (
            <>
              <SectionHeader
                title="Puntos del mapa"
                description="Miradores, lugares de actividades y servicios que ven los visitantes en el mapa, con o sin ruta. Arrastra cualquier pin o tótem para corregir dónde está."
              />
              <MapPointsManager stations={pointsOfInterest} events={eventsList} notify={done} />
            </>
          )}

          {section === 'totems' && (
            <>
              <SectionHeader
                title="Tótems QR"
                description="Lo que ve el visitante al escanear cada tótem. Puedes cambiar textos, foto, audio y ubicación sin reimprimir el código."
                action={
                  <button type="button" onClick={newTotem} className={btnPrimary}>
                    <Plus className="w-4 h-4" />
                    Nuevo tótem
                  </button>
                }
              />
              {pointsOfInterest.length === 0 ? (
                <EmptyRow>No hay tótems registrados.</EmptyRow>
              ) : (
                <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                  {pointsOfInterest.map(poi => (
                    <li key={poi.id} className="p-4 flex items-start gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={poi.image} alt="" className="w-20 aspect-[4/3] rounded-md object-cover bg-stone-200 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-stone-600">
                          <span className="font-semibold text-stone-900 tabular-nums">{poi.qrCode}</span> · {POI_CATEGORY[poi.category]}
                          {poi.soundKey && ` · Audio: ${SOUND_OPTIONS.find(o => o.value === poi.soundKey)?.label ?? poi.soundKey}`}
                        </p>
                        <h3 className="mt-0.5 text-base font-semibold text-stone-950">{poi.name}</h3>
                        <p className="mt-0.5 text-sm text-stone-700 line-clamp-2">{poi.description}</p>
                        <p className="mt-1 text-sm text-stone-600 tabular-nums">
                          {poi.coordinates[0].toFixed(5)}, {poi.coordinates[1].toFixed(5)}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const { id, ...data } = poi;
                            setTotemDraft({ id, data: { ...data, soundKey: data.soundKey ?? '' } });
                          }}
                          className={btnGhost}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button type="button" onClick={() => handleDeleteTotem(poi)} aria-label={`Eliminar ${poi.qrCode}`} className={iconBtn}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* SPECIES */}
          {section === 'especies' && (
            <>
              <SectionHeader
                title="Especies"
                description="Fichas del catálogo de biodiversidad: nombres, estado de conservación, hábitat y foto."
                action={
                  <button type="button" onClick={newSpecies} className={btnPrimary}>
                    <Plus className="w-4 h-4" />
                    Agregar especie
                  </button>
                }
              />
              <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                {speciesList.map(sp => (
                  <li key={sp.id} className="px-4 py-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sp.image} alt="" className="w-12 h-12 rounded-md object-cover bg-stone-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-stone-950 truncate">{sp.commonName}</p>
                      <p className="text-sm text-stone-600 truncate">
                        <span className="italic">{sp.scientificName}</span> · {SPECIES_CATEGORY[sp.category]}
                        {sp.mapudungunName && ` · ${sp.mapudungunName}`}
                      </p>
                    </div>
                    <span className="hidden md:inline-flex items-center gap-2 text-sm text-stone-700 shrink-0 w-44">
                      <span className={`w-2 h-2 rounded-full ${CONSERVATION.find(c => c.value === sp.conservationStatus)?.dot}`} aria-hidden="true" />
                      {sp.conservationStatus}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const { id, ...data } = sp;
                          setSpeciesDraft({ id, data });
                        }}
                        className={btnGhost}
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button type="button" onClick={() => handleDeleteSpecies(sp)} aria-label={`Eliminar ${sp.commonName}`} className={iconBtn}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* NOTICES */}
          {section === 'avisos' && (
            <>
              <SectionHeader title="Avisos" description="Publicaciones visibles en el inicio, oficiales y aprobadas desde moderación." />
              {notices.length === 0 ? (
                <EmptyRow>No hay avisos publicados.</EmptyRow>
              ) : (
                <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                  {notices.map(n => (
                    <li key={n.id} className="px-4 py-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.image} alt="" className="w-12 h-12 rounded-md object-cover bg-stone-200 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-stone-950 truncate">{n.title}</p>
                        <p className="text-sm text-stone-600 truncate">
                          {n.date} · {n.author}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleDeleteNotice(n)} aria-label={`Eliminar ${n.title}`} className={iconBtn}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* PHOTOS */}
          {section === 'fotos' && (
            <>
              <SectionHeader title="Fotos de la galería" description="Pines publicados por la comunidad." />
              {photos.length === 0 ? (
                <EmptyRow>No hay fotos en la galería.</EmptyRow>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {photos.map(p => (
                    <li key={p.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="w-full aspect-[4/3] object-cover bg-stone-200" />
                      <div className="p-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-950 truncate">{p.title}</p>
                          <p className="text-sm text-stone-600 truncate">{p.authorName}</p>
                        </div>
                        <button type="button" onClick={() => handleDeletePhoto(p)} aria-label={`Eliminar ${p.title}`} className={`${iconBtn} -mr-1.5 -mt-1`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* DONATIONS */}
          {section === 'donaciones' && (
            <>
              <SectionHeader
                title="Donaciones"
                description="Aportes recibidos para la conservación del santuario."
                action={
                  <p className="text-sm text-stone-600">
                    Total recaudado <span className="ml-1 text-xl font-semibold text-stone-950 tabular-nums">{clp.format(totalDonationsClp)}</span>
                  </p>
                }
              />
              {donationsList.length === 0 ? (
                <EmptyRow>Aún no hay donaciones registradas.</EmptyRow>
              ) : (
                <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-stone-600 border-b border-stone-200">
                        <th className="px-4 py-2.5 font-medium">Fecha</th>
                        <th className="px-4 py-2.5 font-medium">Donante</th>
                        <th className="px-4 py-2.5 font-medium">Destino</th>
                        <th className="px-4 py-2.5 font-medium">Medio</th>
                        <th className="px-4 py-2.5 font-medium">Comprobante</th>
                        <th className="px-4 py-2.5 font-medium text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {donationsList.map(d => (
                        <tr key={d.id}>
                          <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{d.date}</td>
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-stone-950">{d.donorName}</span>
                            <span className="block text-stone-600">{d.donorEmail}</span>
                          </td>
                          <td className="px-4 py-2.5 text-stone-800">{DONATION_PURPOSE[d.purpose]}</td>
                          <td className="px-4 py-2.5 text-stone-800">{d.paymentMethod === 'webpay' ? 'Webpay' : 'Transferencia'}</td>
                          <td className="px-4 py-2.5 text-stone-600 tabular-nums">{d.receiptNumber}</td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-stone-950">{clp.format(d.amountClp)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-stone-200">
                        <td colSpan={5} className="px-4 py-2.5 text-stone-600">
                          {donationsList.length === 1 ? '1 donación' : `${donationsList.length} donaciones`}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-stone-950">{clp.format(totalDonationsClp)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- Dialogs --- */}
      {totemDraft && (
        <Dialog
          title={totemDraft.id ? `Editar tótem ${totemDraft.data.qrCode}` : 'Nuevo tótem'}
          description={totemDraft.id ? 'El código impreso no cambia: el cartel en terreno sigue sirviendo.' : undefined}
          onClose={() => setTotemDraft(null)}
          wide
        >
          <form onSubmit={handleSaveTotem} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código QR">
                <input
                  type="text"
                  required
                  readOnly={!!totemDraft.id}
                  value={totemDraft.data.qrCode}
                  onChange={e => setTotemDraft({ ...totemDraft, data: { ...totemDraft.data, qrCode: e.target.value.toUpperCase() } })}
                  className={`${input} tabular-nums ${totemDraft.id ? 'bg-stone-100 text-stone-600' : ''}`}
                />
              </Field>
              <Field label="Tipo">
                <select
                  value={totemDraft.data.category}
                  onChange={e =>
                    setTotemDraft({ ...totemDraft, data: { ...totemDraft.data, category: e.target.value as PointOfInterest['category'] } })
                  }
                  className={input}
                >
                  {Object.entries(POI_CATEGORY).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Nombre">
              <input
                type="text"
                required
                placeholder="Tótem 7: Bosque de arrayanes"
                value={totemDraft.data.name}
                onChange={e => setTotemDraft({ ...totemDraft, data: { ...totemDraft.data, name: e.target.value } })}
                className={input}
              />
            </Field>
            <Field label="Texto para el visitante">
              <textarea
                rows={4}
                required
                value={totemDraft.data.description}
                onChange={e => setTotemDraft({ ...totemDraft, data: { ...totemDraft.data, description: e.target.value } })}
                className={textarea}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitud">
                <input
                  type="number"
                  required
                  step="any"
                  min={-90}
                  max={90}
                  value={totemDraft.data.coordinates[0]}
                  onChange={e =>
                    setTotemDraft({
                      ...totemDraft,
                      data: { ...totemDraft.data, coordinates: [Number(e.target.value), totemDraft.data.coordinates[1]] }
                    })
                  }
                  className={`${input} tabular-nums`}
                />
              </Field>
              <Field label="Longitud">
                <input
                  type="number"
                  required
                  step="any"
                  min={-180}
                  max={180}
                  value={totemDraft.data.coordinates[1]}
                  onChange={e =>
                    setTotemDraft({
                      ...totemDraft,
                      data: { ...totemDraft.data, coordinates: [totemDraft.data.coordinates[0], Number(e.target.value)] }
                    })
                  }
                  className={`${input} tabular-nums`}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Audio al escanear">
                <select
                  value={totemDraft.data.soundKey ?? ''}
                  onChange={e => setTotemDraft({ ...totemDraft, data: { ...totemDraft.data, soundKey: e.target.value } })}
                  className={input}
                >
                  {SOUND_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Foto (URL)">
                <input
                  type="text"
                  required
                  placeholder="/especies/cisne.jpg o https://…"
                  value={totemDraft.data.image}
                  onChange={e => setTotemDraft({ ...totemDraft, data: { ...totemDraft.data, image: e.target.value } })}
                  className={input}
                />
              </Field>
            </div>
            <DialogActions onCancel={() => setTotemDraft(null)} submitLabel={totemDraft.id ? 'Guardar cambios' : 'Crear tótem'} />
          </form>
        </Dialog>
      )}

      {eventDraft && (
        <Dialog title={eventDraft.id ? 'Editar evento' : 'Crear evento'} onClose={() => setEventDraft(null)} wide>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            <Field label="Título">
              <input
                type="text"
                required
                placeholder="Censo comunitario de aves de primavera"
                value={eventDraft.data.title}
                onChange={e => setEventDraft({ ...eventDraft, data: { ...eventDraft.data, title: e.target.value } })}
                className={input}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <input
                  type="date"
                  required
                  // Older events saved a written date; the input shows it as a calendar date
                  value={eventDateKey(eventDraft.data.date) ?? ''}
                  onChange={e => setEventDraft({ ...eventDraft, data: { ...eventDraft.data, date: e.target.value } })}
                  className={input}
                />
              </Field>
              <Field label="Horario">
                <input
                  type="text"
                  required
                  placeholder="09:30 - 12:00"
                  value={eventDraft.data.time}
                  onChange={e => setEventDraft({ ...eventDraft, data: { ...eventDraft.data, time: e.target.value } })}
                  className={input}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select
                  value={eventDraft.data.category}
                  onChange={e =>
                    setEventDraft({ ...eventDraft, data: { ...eventDraft.data, category: e.target.value as WetlandEvent['category'] } })
                  }
                  className={input}
                >
                  {Object.entries(EVENT_CATEGORY).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cupo">
                <input
                  type="number"
                  min={Math.max(1, eventDraft.id ? eventsList.find(x => x.id === eventDraft.id)?.registeredCount ?? 1 : 1)}
                  required
                  value={eventDraft.data.capacity}
                  onChange={e => setEventDraft({ ...eventDraft, data: { ...eventDraft.data, capacity: parseInt(e.target.value, 10) || 1 } })}
                  className={`${input} tabular-nums`}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Ruta">
                <select
                  value={eventDraft.data.routeId}
                  onChange={e => {
                    const route = HUMEDAL_ROUTES.find(r => r.id === e.target.value);
                    setEventDraft({
                      ...eventDraft,
                      data: {
                        ...eventDraft.data,
                        routeId: route?.id ?? e.target.value,
                        routeName: route?.name ?? eventDraft.data.routeName,
                        coordinates: route?.path[0] ?? eventDraft.data.coordinates
                      }
                    });
                  }}
                  className={input}
                >
                  {!HUMEDAL_ROUTES.some(r => r.id === eventDraft.data.routeId) && (
                    <option value={eventDraft.data.routeId}>{eventDraft.data.routeName || 'Sin ruta'}</option>
                  )}
                  {HUMEDAL_ROUTES.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Punto de encuentro">
                <input
                  type="text"
                  required
                  value={eventDraft.data.locationName}
                  onChange={e => setEventDraft({ ...eventDraft, data: { ...eventDraft.data, locationName: e.target.value } })}
                  className={input}
                />
              </Field>
            </div>
            <Field label="Descripción">
              <textarea
                rows={3}
                required
                value={eventDraft.data.description}
                onChange={e => setEventDraft({ ...eventDraft, data: { ...eventDraft.data, description: e.target.value } })}
                className={textarea}
              />
            </Field>
            <DialogActions onCancel={() => setEventDraft(null)} submitLabel={eventDraft.id ? 'Guardar cambios' : 'Publicar evento'} />
          </form>
        </Dialog>
      )}

      {speciesDraft && (
        <Dialog title={speciesDraft.id ? `Editar ${speciesDraft.data.commonName}` : 'Agregar especie'} onClose={() => setSpeciesDraft(null)} wide>
          <form onSubmit={handleSaveSpecies} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre común">
                <input
                  type="text"
                  required
                  placeholder="Huillín"
                  value={speciesDraft.data.commonName}
                  onChange={e => setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, commonName: e.target.value } })}
                  className={input}
                />
              </Field>
              <Field label="Nombre en mapudungun">
                <input
                  type="text"
                  placeholder="Opcional"
                  value={speciesDraft.data.mapudungunName ?? ''}
                  onChange={e => setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, mapudungunName: e.target.value } })}
                  className={input}
                />
              </Field>
            </div>
            <Field label="Nombre científico">
              <input
                type="text"
                required
                placeholder="Lontra provocax"
                value={speciesDraft.data.scientificName}
                onChange={e => setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, scientificName: e.target.value } })}
                className={`${input} italic`}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Grupo">
                <select
                  value={speciesDraft.data.category}
                  onChange={e =>
                    setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, category: e.target.value as Species['category'] } })
                  }
                  className={input}
                >
                  {Object.entries(SPECIES_CATEGORY).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado de conservación">
                <select
                  value={speciesDraft.data.conservationStatus}
                  onChange={e =>
                    setSpeciesDraft({
                      ...speciesDraft,
                      data: { ...speciesDraft.data, conservationStatus: e.target.value as Species['conservationStatus'] }
                    })
                  }
                  className={input}
                >
                  {CONSERVATION.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.value}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Hábitat en el humedal">
              <input
                type="text"
                required
                placeholder="Orillas del río y esteros protegidos"
                value={speciesDraft.data.habitat}
                onChange={e => setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, habitat: e.target.value } })}
                className={input}
              />
            </Field>
            <Field label="Descripción">
              <textarea
                rows={3}
                required
                value={speciesDraft.data.description}
                onChange={e => setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, description: e.target.value } })}
                className={textarea}
              />
            </Field>
            <Field label="Dato curioso">
              <textarea
                rows={2}
                required
                value={speciesDraft.data.funFact}
                onChange={e => setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, funFact: e.target.value } })}
                className={textarea}
              />
            </Field>
            <Field label="Foto (URL)" hint="Usa una foto de la especie con licencia libre y su crédito.">
              <input
                type="text"
                required
                placeholder="/especies/huillin.jpg o https://…"
                value={speciesDraft.data.image}
                onChange={e => setSpeciesDraft({ ...speciesDraft, data: { ...speciesDraft.data, image: e.target.value } })}
                className={input}
              />
            </Field>
            <DialogActions onCancel={() => setSpeciesDraft(null)} submitLabel={speciesDraft.id ? 'Guardar cambios' : 'Agregar al catálogo'} />
          </form>
        </Dialog>
      )}

      {approvingSuggestion && (
        <Dialog title="Aprobar sugerencia" description={`“${approvingSuggestion.title}”`} onClose={() => setApprovingSuggestion(null)}>
          <form onSubmit={handleApproveSuggestion} className="space-y-4">
            <Field label="Respuesta del comité" hint="Se muestra públicamente en el buzón ciudadano.">
              <textarea
                rows={3}
                value={adminComment}
                onChange={e => setAdminComment(e.target.value)}
                placeholder="Gracias por tu propuesta. La incorporamos al plan de mejoras…"
                className={textarea}
              />
            </Field>
            <DialogActions onCancel={() => setApprovingSuggestion(null)} submitLabel="Aprobar y publicar respuesta" />
          </form>
        </Dialog>
      )}

      {reasonPrompt && (
        <Dialog title={reasonPrompt.title} description={reasonPrompt.description} onClose={() => setReasonPrompt(null)}>
          <form
            onSubmit={e => {
              e.preventDefault();
              reasonPrompt.onSubmit(reason.trim());
              setReasonPrompt(null);
            }}
            className="space-y-4"
          >
            <Field label="Motivo">
              <textarea
                rows={3}
                autoFocus
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="No se ajusta a las directrices del plan de manejo del santuario."
                className={textarea}
              />
            </Field>
            <DialogActions onCancel={() => setReasonPrompt(null)} submitLabel="Confirmar" danger />
          </form>
        </Dialog>
      )}

      {confirmPrompt && (
        <Dialog title={confirmPrompt.title} description={confirmPrompt.description} onClose={() => setConfirmPrompt(null)}>
          <form
            onSubmit={e => {
              e.preventDefault();
              confirmPrompt.onConfirm();
              setConfirmPrompt(null);
            }}
          >
            <DialogActions onCancel={() => setConfirmPrompt(null)} submitLabel={confirmPrompt.confirmLabel} danger />
          </form>
        </Dialog>
      )}

      {toast && (
        <div
          role="status"
          className="fixed z-[70] left-1/2 -translate-x-1/2 bottom-24 lg:bottom-6 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-md bg-stone-950 text-white text-sm shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
