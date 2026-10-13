'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  MessageSquare,
  Trash2,
  PlusCircle,
  Bell,
  Camera,
  Layers,
  Sparkles,
  AlertTriangle,
  QrCode,
  Calendar,
  BookOpen,
  Heart,
  Edit3,
  Plus,
  X,
  Save,
  MapPin,
  Volume2,
  Ticket,
  FileCheck,
  Eye,
  Check
} from 'lucide-react';
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

interface AdminDashboardProps {
  currentUser: User | null;
  onRefreshAll?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onRefreshAll }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'tickets' | 'sugerencias' | 'totems' | 'eventos' | 'especies' | 'donaciones' | 'avisos' | 'fotos'
  >('tickets');

  // Datasets from storage
  const [tickets, setTickets] = useState<ModerationTicket[]>(storageService.getModerationTickets());
  const [ticketFilter, setTicketFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(storageService.getSuggestions());
  const [photos, setPhotos] = useState<CommunityPhoto[]>(storageService.getCommunityPhotos());
  const [notices, setNotices] = useState<Notice[]>(storageService.getNotices());
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(storageService.getPointsOfInterest());
  const [speciesList, setSpeciesList] = useState<Species[]>(storageService.getSpecies());
  const [eventsList, setEventsList] = useState<WetlandEvent[]>(storageService.getEvents());
  const [donationsList, setDonationsList] = useState<DonationRecord[]>(storageService.getDonations());

  // Modals state
  const [selectedSugToApprove, setSelectedSugToApprove] = useState<Suggestion | null>(null);
  const [adminComment, setAdminComment] = useState('');

  // Editing Totem QR (RF-QR-2)
  const [editingTotem, setEditingTotem] = useState<PointOfInterest | null>(null);
  const [isNewTotemModalOpen, setIsNewTotemModalOpen] = useState(false);
  const [totemForm, setTotemForm] = useState<Omit<PointOfInterest, 'id'>>({
    name: '',
    category: 'totem_qr',
    coordinates: [-39.8510, -73.2250],
    description: '',
    qrCode: 'ANG-QR-06',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    soundKey: 'siete_colores'
  });

  // Editing Event (RF-ADM-2)
  const [editingEvent, setEditingEvent] = useState<WetlandEvent | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState<Omit<WetlandEvent, 'id' | 'registeredCount' | 'isRegistered'>>({
    title: '',
    description: '',
    date: '2026-10-15',
    time: '10:00 - 12:30',
    locationName: 'Portal Claro de Luna',
    coordinates: [-39.8495, -73.2260],
    routeId: 'ruta-cisnes',
    routeName: 'Sendero Los Cisnes',
    category: 'avistamiento',
    capacity: 20,
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=900&q=80',
    organizer: 'Comité Ecológico Angachilla'
  });

  // Editing Species (RF-ADM-2 / RF-BIO-1)
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null);
  const [isNewSpeciesModalOpen, setIsNewSpeciesModalOpen] = useState(false);
  const [speciesForm, setSpeciesForm] = useState<Omit<Species, 'id'>>({
    commonName: '',
    mapudungunName: '',
    scientificName: '',
    category: 'ave_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Lagunas y totorales del humedal',
    description: '',
    funFact: '',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80'
  });

  const pendingSuggestions = suggestions.filter(s => s.status === 'pendiente');
  const pendingTickets = tickets.filter(t => t.status === 'pendiente');
  const totalDonationsClp = donationsList.reduce((acc, d) => acc + d.amountClp, 0);

  // --- Handlers: Moderation Tickets (PDF Requisito 15-Sept-2026) ---
  const handleApproveTicket = (ticket: ModerationTicket) => {
    if (ticket.type === 'aviso_novedad') {
      storageService.addNotice({
        title: ticket.title,
        summary: ticket.description.slice(0, 140),
        fullText: ticket.description,
        image: ticket.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
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

    storageService.updateModerationTicket(ticket.id, {
      status: 'aprobado',
      reviewedBy: currentUser?.name || 'Guardaparques Humedal Angachilla',
      reviewedAt: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    setTickets(storageService.getModerationTickets());
    onRefreshAll?.();
  };

  const handleRejectTicket = (ticketId: string) => {
    const feedback = prompt('Motivo del rechazo de la solicitud:') || 'No se ajusta a las directrices del plan de manejo del santuario.';
    storageService.updateModerationTicket(ticketId, {
      status: 'rechazado',
      reviewedBy: currentUser?.name || 'Guardaparques Humedal Angachilla',
      reviewedAt: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      adminFeedback: feedback
    });
    setTickets(storageService.getModerationTickets());
    onRefreshAll?.();
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (!confirm('¿Deseas eliminar este ticket definitivamente?')) return;
    storageService.deleteModerationTicket(ticketId);
    setTickets(storageService.getModerationTickets());
    onRefreshAll?.();
  };

  // --- Handlers: Suggestions ---
  const handleApproveSuggestion = (id: string) => {
    storageService.updateSuggestionStatus(id, 'aprobada', adminComment || 'Propuesta evaluada y aprobada por los guardaparques.');
    setSuggestions(storageService.getSuggestions());
    setSelectedSugToApprove(null);
    setAdminComment('');
    onRefreshAll?.();
  };

  const handleRejectSuggestion = (id: string) => {
    const reason = prompt('Motivo del rechazo:') || 'No se ajusta al plan de manejo ecológico del humedal.';
    storageService.updateSuggestionStatus(id, 'rechazada', reason);
    setSuggestions(storageService.getSuggestions());
    onRefreshAll?.();
  };

  // --- Handlers: Totem QR (RF-QR-2) ---
  const handleSaveTotemEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTotem) return;
    storageService.updatePointOfInterest(editingTotem.id, editingTotem);
    setPointsOfInterest(storageService.getPointsOfInterest());
    setEditingTotem(null);
    alert('Contenido del Tótem QR actualizado con éxito. El código físico continúa siendo el mismo.');
    onRefreshAll?.();
  };

  const handleCreateTotem = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.addPointOfInterest(totemForm);
    setPointsOfInterest(storageService.getPointsOfInterest());
    setIsNewTotemModalOpen(false);
    alert('Nuevo hito informativo y código QR creado.');
    onRefreshAll?.();
  };

  const handleDeleteTotem = (id: string) => {
    if (confirm('¿Eliminar este tótem del sistema?')) {
      storageService.deletePointOfInterest(id);
      setPointsOfInterest(storageService.getPointsOfInterest());
      onRefreshAll?.();
    }
  };

  // --- Handlers: Events (RF-ADM-2) ---
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.addEvent(eventForm);
    setEventsList(storageService.getEvents());
    setIsNewEventModalOpen(false);
    alert('Evento publicado en la cartelera comunitaria.');
    onRefreshAll?.();
  };

  const handleSaveEventEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    storageService.updateEvent(editingEvent.id, editingEvent);
    setEventsList(storageService.getEvents());
    setEditingEvent(null);
    alert('Evento actualizado correctamente.');
    onRefreshAll?.();
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('¿Estás seguro de cancelar y eliminar este evento?')) {
      storageService.deleteEvent(id);
      setEventsList(storageService.getEvents());
      onRefreshAll?.();
    }
  };

  // --- Handlers: Species (RF-ADM-2) ---
  const handleCreateSpecies = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.addSpecies(speciesForm);
    setSpeciesList(storageService.getSpecies());
    setIsNewSpeciesModalOpen(false);
    alert('Especie incorporada al catálogo del humedal.');
    onRefreshAll?.();
  };

  const handleSaveSpeciesEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecies) return;
    storageService.updateSpecies(editingSpecies.id, editingSpecies);
    setSpeciesList(storageService.getSpecies());
    setEditingSpecies(null);
    alert('Ficha de especie actualizada.');
    onRefreshAll?.();
  };

  const handleDeleteSpecies = (id: string) => {
    if (confirm('¿Eliminar esta especie del catálogo?')) {
      storageService.deleteSpecies(id);
      setSpeciesList(storageService.getSpecies());
      onRefreshAll?.();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-stone-900 text-white p-6 rounded-3xl shadow-xl border border-stone-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-950/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-stone-950 uppercase tracking-widest">
                RF-ADM-1 • Guardaparques
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {currentUser?.email || 'admin@angachilla.cl'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">
              Panel de Administración y Gestión Integral
            </h1>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
            <span className="text-base font-black text-teal-400 font-mono">{pendingTickets.length}</span>
            <p className="text-[9px] text-stone-400">Tickets (PDF)</p>
          </div>
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
            <span className="text-base font-black text-amber-400 font-mono">{pendingSuggestions.length}</span>
            <p className="text-[9px] text-stone-400">Sugerencias</p>
          </div>
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
            <span className="text-base font-black text-emerald-400 font-mono">{pointsOfInterest.length}</span>
            <p className="text-[9px] text-stone-400">Tótems QR</p>
          </div>
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
            <span className="text-base font-black text-sky-400 font-mono">{speciesList.length}</span>
            <p className="text-[9px] text-stone-400">Especies</p>
          </div>
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
            <span className="text-base font-black text-rose-400 font-mono">${(totalDonationsClp / 1000).toFixed(0)}k</span>
            <p className="text-[9px] text-stone-400">Aportes CLP</p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 text-xs font-bold">
        {[
          { id: 'tickets', label: 'Tickets & Moderación (PDF)', count: pendingTickets.length, icon: Ticket },
          { id: 'totems', label: 'Tótems QR (RF-QR-2)', count: pointsOfInterest.length, icon: QrCode },
          { id: 'eventos', label: 'Eventos (RF-ADM-2)', count: eventsList.length, icon: Calendar },
          { id: 'especies', label: 'Especies (RF-BIO-1)', count: speciesList.length, icon: BookOpen },
          { id: 'donaciones', label: 'Donaciones (RF-MON-1)', count: donationsList.length, icon: Heart },
          { id: 'sugerencias', label: 'Sugerencias', count: pendingSuggestions.length, icon: MessageSquare },
          { id: 'avisos', label: 'Avisos Oficiales', count: notices.length, icon: Bell },
          { id: 'fotos', label: 'Fotos Galería', count: photos.length, icon: Camera },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as unknown as typeof activeAdminTab)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
                isActive
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 0: MODERACIÓN PREVIA DE CONTENIDOS CIUDADANOS / TICKETS (PDF REUNIÓN 15-SEPT-2026) --- */}
      {activeAdminTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-300">
                  Flujo de Moderación de la Comunidad
                </span>
                <span className="text-xs text-stone-500 font-medium">Requerimiento Reunión Comité</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 font-display mt-1 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-teal-700" />
                <span>Bandeja de Tickets y Solicitudes de Publicación</span>
              </h2>
              <p className="text-xs text-stone-600 max-w-2xl mt-0.5 leading-relaxed">
                Revisa, edita, aprueba o rechaza los avisos, fotos y avistamientos enviados por los visitantes y vecinos antes de que se hagan públicos en el humedal.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
              {(['todos', 'pendiente', 'aprobado', 'rechazado'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTicketFilter(f)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    ticketFilter === f ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {f} ({f === 'todos' ? tickets.length : tickets.filter(t => t.status === f).length})
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          {tickets.filter(t => ticketFilter === 'todos' || t.status === ticketFilter).length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
              <Ticket className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800 font-display">
                No hay tickets en este estado
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                Todas las solicitudes han sido gestionadas por el equipo de guardaparques.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets
                .filter(t => ticketFilter === 'todos' || t.status === ticketFilter)
                .map(ticket => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:border-teal-300 transition-all space-y-4"
                  >
                    <div>
                      {/* Ticket Top Meta */}
                      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ticket.status === 'pendiente'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : ticket.status === 'aprobado'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {ticket.status}
                          </span>
                          <span className="text-[11px] font-bold text-stone-500 capitalize">
                            {ticket.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-stone-400">
                          {ticket.submittedAt}
                        </span>
                      </div>

                      {/* Ticket Title & Body */}
                      <div className="mt-3">
                        <h4 className="text-sm sm:text-base font-extrabold text-stone-900 font-display">
                          {ticket.title}
                        </h4>
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Author & Location */}
                      <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase block font-bold">Autor(a)</span>
                          <span className="font-bold text-stone-800">{ticket.authorName}</span>
                          {ticket.authorEmail && (
                            <span className="text-stone-500 text-[11px] ml-1">({ticket.authorEmail})</span>
                          )}
                        </div>
                        {ticket.locationName && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{ticket.locationName}</span>
                          </div>
                        )}
                      </div>

                      {/* Image Preview if provided */}
                      {ticket.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-stone-100 border border-stone-200">
                          <img
                            src={ticket.imageUrl}
                            alt={ticket.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Review details */}
                      {ticket.reviewedBy && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            Dictamen Guardaparques ({ticket.reviewedAt})
                          </span>
                          <span className="font-semibold text-slate-800">
                            Revisado por: {ticket.reviewedBy}
                          </span>
                          {ticket.adminFeedback && (
                            <p className="text-stone-600 italic mt-0.5">
                              “{ticket.adminFeedback}”
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {ticket.status === 'pendiente' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectTicket(ticket.id)}
                            className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleApproveTicket(ticket)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar y Publicar</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-500 font-medium italic">
                          Ticket {ticket.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: TÓTEMS Y PANELES QR (RF-QR-2 & RF-ADM-2) */}
      {activeAdminTab === 'totems' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                Edición Dinámica de Paneles y Tótems QR (RF-QR-2)
              </h2>
              <p className="text-xs text-stone-500">
                Modifica textos, audios y fotografías asociadas a cada marcador QR físico en terreno sin tener que reimprimir el cartel.
              </p>
            </div>
            <button
              onClick={() => setIsNewTotemModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Hito / QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pointsOfInterest.map(poi => (
              <div
                key={poi.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="relative aspect-video">
                  <img src={poi.image} alt={poi.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-950/80 text-emerald-300 border border-emerald-400/30">
                    {poi.qrCode}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-stone-800 capitalize">
                    {poi.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-display">{poi.name}</h3>
                    <p className="text-xs text-stone-600 line-clamp-3 mt-1 leading-relaxed">
                      {poi.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {poi.coordinates[0].toFixed(4)}, {poi.coordinates[1].toFixed(4)}
                      </span>
                      {poi.soundKey && (
                        <span className="flex items-center gap-1 text-teal-700">
                          <Volume2 className="w-3 h-3" />
                          Audio: {poi.soundKey}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-2">
                    <button
                      onClick={() => setEditingTotem({ ...poi })}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                      <span>Editar Contenido</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTotem(poi.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar hito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE EVENTOS (RF-ADM-2) */}
      {activeAdminTab === 'eventos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-700" />
                Gestión y Creación de Eventos Comunitarios (RF-ADM-2)
              </h2>
              <p className="text-xs text-stone-500">
                Publica recorridos guiados, jornadas de limpieza y talleres de avistamiento de aves en los senderos.
              </p>
            </div>
            <button
              onClick={() => setIsNewEventModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold transition flex items-center gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Evento</span>
            </button>
          </div>

          <div className="space-y-3">
            {eventsList.map(evt => (
              <div
                key={evt.id}
                className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <img src={evt.image} alt={evt.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase">
                        {evt.category}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        {evt.date} • {evt.time}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-stone-900 mt-1">{evt.title}</h3>
                    <p className="text-xs text-stone-600 line-clamp-1">{evt.description}</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Lugar: <strong>{evt.locationName}</strong> ({evt.routeName}) • Cupos: {evt.registeredCount}/{evt.capacity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => setEditingEvent({ ...evt })}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CATÁLOGO DE ESPECIES (RF-ADM-2 & RF-BIO-1) */}
      {activeAdminTab === 'especies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                Catálogo de Biodiversidad y Fichas Científicas (RF-BIO-1)
              </h2>
              <p className="text-xs text-stone-500">
                Administra el inventario biológico con nombres en Mapudungun, estado de conservación oficial y hábitats.
              </p>
            </div>
            <button
              onClick={() => setIsNewSpeciesModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Especie</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {speciesList.map(sp => (
              <div
                key={sp.id}
                className="p-3 bg-white rounded-2xl border border-stone-200 shadow-sm flex items-start space-x-3"
              >
                <img src={sp.image} alt={sp.commonName} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">
                      {sp.category.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                      {sp.conservationStatus}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-stone-900 truncate mt-0.5">{sp.commonName}</h4>
                  <p className="text-[11px] text-stone-500 italic truncate">{sp.scientificName}</p>
                  {sp.mapudungunName && (
                    <p className="text-[10px] text-teal-700 font-medium">Mapudungun: {sp.mapudungunName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-stone-100">
                    <button
                      onClick={() => setEditingSpecies({ ...sp })}
                      className="text-[11px] font-bold text-stone-700 hover:text-stone-900"
                    >
                      Editar
                    </button>
                    <span className="text-stone-300">•</span>
                    <button
                      onClick={() => handleDeleteSpecies(sp.id)}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DONACIONES (RF-MON-1) */}
      {activeAdminTab === 'donaciones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-current" />
                Aportes y Donaciones Recaudadas (RF-MON-1)
              </h2>
              <p className="text-xs text-stone-500">
                Registro de aportes comunitarios recibidos para la conservación del Comité Ecológico Angachilla.
              </p>
            </div>
            <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl">
              <span className="text-xs text-rose-800 font-medium">Total Recaudado: </span>
              <strong className="text-rose-900 text-sm font-black">
                ${totalDonationsClp.toLocaleString('es-CL')} CLP
              </strong>
            </div>
          </div>

          {donationsList.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200">
              <Heart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500">
                Aún no hay donaciones registradas en el sistema. Puedes probar el botón de donación desde la barra superior.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 uppercase font-mono text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">N° Recibo</th>
                    <th className="p-3">Donante</th>
                    <th className="p-3">Monto (CLP)</th>
                    <th className="p-3">Destino</th>
                    <th className="p-3">Medio</th>
                    <th className="p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {donationsList.map(d => (
                    <tr key={d.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold text-stone-900">{d.receiptNumber}</td>
                      <td className="p-3 font-medium text-stone-800">{d.donorName} ({d.donorEmail})</td>
                      <td className="p-3 font-black text-emerald-700">${d.amountClp.toLocaleString('es-CL')}</td>
                      <td className="p-3 capitalize text-stone-600">{d.purpose.replace(/_/g, ' ')}</td>
                      <td className="p-3 uppercase text-stone-500">{d.paymentMethod}</td>
                      <td className="p-3 text-stone-400">{d.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUGERENCIAS */}
      {activeAdminTab === 'sugerencias' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-stone-900 font-display">
            Sugerencias Ciudadanas Pendientes ({pendingSuggestions.length})
          </h2>
          {pendingSuggestions.length === 0 ? (
            <div className="p-6 bg-stone-50 rounded-2xl text-center text-xs text-stone-500">
              No hay sugerencias pendientes de moderación.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSuggestions.map(sug => (
                <div key={sug.id} className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                      {sug.category} • {sug.createdAt}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedSugToApprove(sug)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectSuggestion(sug.id)}
                        className="px-3 py-1 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm">{sug.title}</h4>
                  <p className="text-xs text-stone-600">{sug.description}</p>
                  <p className="text-[10px] text-stone-400">Por {sug.authorName} ({sug.authorEmail})</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AVISOS OFICIALES */}
      {activeAdminTab === 'avisos' && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-stone-900 font-display">
            Avisos Oficiales Activos ({notices.length})
          </h2>
          {notices.map(n => (
            <div key={n.id} className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <img src={n.image} alt={n.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-stone-900">{n.title}</h4>
                  <p className="text-[11px] text-stone-500 line-clamp-1">{n.summary}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar aviso?')) {
                    storageService.deleteNotice(n.id);
                    setNotices(storageService.getNotices());
                    onRefreshAll?.();
                  }
                }}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 7: FOTOS GALERÍA */}
      {activeAdminTab === 'fotos' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden text-xs">
              <img src={p.imageUrl} alt={p.title} className="w-full aspect-video object-cover" />
              <div className="p-2.5 flex items-center justify-between">
                <div className="truncate">
                  <p className="font-bold truncate text-stone-900">{p.title}</p>
                  <p className="text-[10px] text-stone-400 truncate">{p.authorName}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar foto?')) {
                      storageService.deleteCommunityPhoto(p.id);
                      setPhotos(storageService.getCommunityPhotos());
                      onRefreshAll?.();
                    }
                  }}
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EDITAR CONTENIDO DE TÓTEM QR (RF-QR-2) */}
      {editingTotem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                  RF-QR-2 • Edición Sin Reimpresión
                </span>
                <h3 className="text-base font-black font-display text-stone-900 mt-1">
                  Editar Tótem {editingTotem.qrCode}
                </h3>
              </div>
              <button onClick={() => setEditingTotem(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTotemEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nombre del Hito</label>
                <input
                  type="text"
                  required
                  value={editingTotem.name}
                  onChange={e => setEditingTotem({ ...editingTotem, name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Descripción Ecológica / Reseña</label>
                <textarea
                  rows={4}
                  required
                  value={editingTotem.description}
                  onChange={e => setEditingTotem({ ...editingTotem, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tipo de Estructura</label>
                  <select
                    value={editingTotem.category}
                    onChange={e => setEditingTotem({ ...editingTotem, category: e.target.value as PointOfInterest['category'] })}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="totem_qr">Tótem Informativo</option>
                    <option value="mirador">Mirador de Aves</option>
                    <option value="pasarela">Pasarela de Madera</option>
                    <option value="torre">Torre de Observación</option>
                    <option value="muelle">Muelle Fluvial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Audio Asociado (Canto)</label>
                  <select
                    value={editingTotem.soundKey || ''}
                    onChange={e => setEditingTotem({ ...editingTotem, soundKey: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="siete_colores">Siete Colores</option>
                    <option value="cisne">Cisne de Cuello Negro</option>
                    <option value="chucao">Chucao del Bosque</option>
                    <option value="tagua">Tagua Común</option>
                    <option value="martin_pescador">Martín Pescador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">URL de Imagen Multimedia</label>
                <input
                  type="url"
                  required
                  value={editingTotem.image}
                  onChange={e => setEditingTotem({ ...editingTotem, image: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingTotem(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO TÓTEM QR */}
      {isNewTotemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-base font-black font-display text-stone-900">
                Crear Nuevo Hito / Marcador QR
              </h3>
              <button onClick={() => setIsNewTotemModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTotem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Identificador QR</label>
                  <input
                    type="text"
                    required
                    value={totemForm.qrCode}
                    onChange={e => setTotemForm({ ...totemForm, qrCode: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-300 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Categoría</label>
                  <select
                    value={totemForm.category}
                    onChange={e => setTotemForm({ ...totemForm, category: e.target.value as PointOfInterest['category'] })}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="totem_qr">Tótem QR</option>
                    <option value="mirador">Mirador</option>
                    <option value="pasarela">Pasarela</option>
                    <option value="torre">Torre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nombre del Hito</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tótem 6: Bosque de Arrayanes"
                  value={totemForm.name}
                  onChange={e => setTotemForm({ ...totemForm, name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Información que el visitante leerá al escanear con la cámara..."
                  value={totemForm.description}
                  onChange={e => setTotemForm({ ...totemForm, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Imagen URL</label>
                <input
                  type="url"
                  required
                  value={totemForm.image}
                  onChange={e => setTotemForm({ ...totemForm, image: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewTotemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                >
                  Crear Hito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EVENTO (RF-ADM-2) */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-base font-black font-display text-stone-900">
                Publicar Nuevo Evento o Voluntariado
              </h3>
              <button onClick={() => setIsNewEventModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Título del Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Censo Comunitario de Aves de Primavera"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Horario</label>
                  <input
                    type="text"
                    required
                    placeholder="09:30 - 12:00"
                    value={eventForm.time}
                    onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Categoría</label>
                  <select
                    value={eventForm.category}
                    onChange={e => setEventForm({ ...eventForm, category: e.target.value as WetlandEvent['category'] })}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="avistamiento">Avistamiento de Aves</option>
                    <option value="limpieza">Jornada de Limpieza</option>
                    <option value="educativo">Charla / Taller</option>
                    <option value="kayak">Salida en Kayak</option>
                    <option value="fotografia">Fotografía de Naturaleza</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Cupo Máximo</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={eventForm.capacity}
                    onChange={e => setEventForm({ ...eventForm, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Punto de Encuentro</label>
                <input
                  type="text"
                  required
                  placeholder="Portal Claro de Luna"
                  value={eventForm.locationName}
                  onChange={e => setEventForm({ ...eventForm, locationName: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold"
                >
                  Publicar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA ESPECIE (RF-BIO-1) */}
      {isNewSpeciesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-base font-black font-display text-stone-900">
                Agregar Especie al Catálogo
              </h3>
              <button onClick={() => setIsNewSpeciesModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpecies} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nombre Común</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Huillín"
                    value={speciesForm.commonName}
                    onChange={e => setSpeciesForm({ ...speciesForm, commonName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nombre en Mapudungun</label>
                  <input
                    type="text"
                    placeholder="Ej. Williñ"
                    value={speciesForm.mapudungunName}
                    onChange={e => setSpeciesForm({ ...speciesForm, mapudungunName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nombre Científico</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lontra provocax"
                  value={speciesForm.scientificName}
                  onChange={e => setSpeciesForm({ ...speciesForm, scientificName: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 italic"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Categoría</label>
                  <select
                    value={speciesForm.category}
                    onChange={e => setSpeciesForm({ ...speciesForm, category: e.target.value as Species['category'] })}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="ave_acuatica">Ave Acuática</option>
                    <option value="ave_bosque">Ave de Bosque</option>
                    <option value="mamifero">Mamífero</option>
                    <option value="anfibio">Anfibio</option>
                    <option value="arbol_arbusto">Árbol o Arbusto Nativo</option>
                    <option value="planta_acuatica">Planta Acuática</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Estado de Conservación</label>
                  <select
                    value={speciesForm.conservationStatus}
                    onChange={e => setSpeciesForm({ ...speciesForm, conservationStatus: e.target.value as Species['conservationStatus'] })}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="En Peligro Crítico">En Peligro Crítico</option>
                    <option value="En Peligro">En Peligro</option>
                    <option value="Vulnerable">Vulnerable</option>
                    <option value="Casi Amenazada">Casi Amenazada</option>
                    <option value="Preocupación Menor">Preocupación Menor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Hábitat</label>
                <input
                  type="text"
                  required
                  placeholder="Orillas del río y esteros protegidos..."
                  value={speciesForm.habitat}
                  onChange={e => setSpeciesForm({ ...speciesForm, habitat: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  required
                  value={speciesForm.description}
                  onChange={e => setSpeciesForm({ ...speciesForm, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Dato Curioso / Ecológico</label>
                <textarea
                  rows={2}
                  required
                  value={speciesForm.funFact}
                  onChange={e => setSpeciesForm({ ...speciesForm, funFact: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewSpeciesModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                >
                  Guardar Especie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APROBACIÓN DE SUGERENCIA */}
      {selectedSugToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-stone-900">
            <h3 className="text-base font-bold font-display text-stone-900">
              Aprobar y Publicar Sugerencia
            </h3>
            <p className="text-xs text-stone-600">
              Propuesta: <strong>“{selectedSugToApprove.title}”</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Respuesta del Comité (Visible al público)
              </label>
              <textarea
                rows={3}
                value={adminComment}
                onChange={e => setAdminComment(e.target.value)}
                placeholder="Agradecemos tu propuesta. Ha sido aprobada para ejecución..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSugToApprove(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleApproveSuggestion(selectedSugToApprove.id)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow"
              >
                Confirmar y Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
