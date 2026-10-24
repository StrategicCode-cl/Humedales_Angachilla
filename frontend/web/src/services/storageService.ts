import {
  Suggestion,
  CommunityPhoto,
  Notice,
  WazeLiveAlert,
  WetlandEvent,
  PointOfInterest,
  Species,
  DonationRecord,
  SponsorAd,
  ModerationTicket,
  OfficialGalleryPhoto,
} from '../types';
import {
  INITIAL_NOTICES,
  INITIAL_SUGGESTIONS,
  INITIAL_COMMUNITY_PHOTOS,
  WAZE_LIVE_ALERTS,
  INITIAL_WETLAND_EVENTS,
  POINTS_OF_INTEREST,
  resolveRouteId,
  INITIAL_SPECIES,
  INITIAL_SPONSOR_ADS,
  INITIAL_MODERATION_TICKETS,
} from '../data/mockData';
import { apiFetch, ecosistemaApi, feedApi, resolveMediaUrl } from '../lib/api';

const STORAGE_KEYS = {
  SCANNED_QRS: 'angachilla_scanned_qrs_v2',
  SAVED_NOTICES: 'angachilla_saved_notices_v2',
  AD_FREE: 'angachilla_ad_free_status',
};

const LEGACY_KEYS_TO_PURGE = [
  'angachilla_notices',
  'angachilla_suggestions',
  'angachilla_photos',
  'angachilla_waze_alerts',
  'angachilla_events',
  'angachilla_registered_events',
  'angachilla_points_of_interest',
  'angachilla_species',
  'angachilla_donations',
  'angachilla_sponsor_ads',
  'angachilla_moderation_tickets',
];

class StorageService {
  private officialNotices: Notice[] = INITIAL_NOTICES;
  private feedPosts: Notice[] = [];
  private communityPhotos: CommunityPhoto[] = INITIAL_COMMUNITY_PHOTOS;
  private officialGallery: OfficialGalleryPhoto[] = [];
  private stations: PointOfInterest[] = POINTS_OF_INTEREST;
  private species: Species[] = INITIAL_SPECIES;
  private events: WetlandEvent[] = INITIAL_WETLAND_EVENTS;
  private suggestions: Suggestion[] = INITIAL_SUGGESTIONS;
  private donations: DonationRecord[] = [];
  private liveAlerts: WazeLiveAlert[] = WAZE_LIVE_ALERTS;
  private moderationTickets: ModerationTicket[] = INITIAL_MODERATION_TICKETS;
  private institutionalContents: Record<string, any> = {};
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Limpia cachés antiguos con datos/imágenes falsas de Unsplash
      for (const k of LEGACY_KEYS_TO_PURGE) {
        localStorage.removeItem(k);
      }
      this.syncAll();
    }
  }

  private notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('angachilla:sync'));
    }
  }

  async syncAll(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.initialized = true;
    try {
      const [
        stations,
        species,
        officialNotices,
        feedItems,
        events,
        officialGallery,
        contents,
        alerts,
        suggestionsRes,
        donationsRes,
      ] = await Promise.all([
        ecosistemaApi.getStations().catch(() => this.stations),
        ecosistemaApi.getSpecies().catch(() => this.species),
        ecosistemaApi.getOfficialNotices().catch(() => this.officialNotices),
        feedApi.getPosts().catch(() => []),
        ecosistemaApi.getEvents().catch(() => this.events),
        ecosistemaApi.getOfficialGallery().catch(() => []),
        ecosistemaApi.getContents().catch(() => ({})),
        feedApi.getRouteAlerts().catch(() => this.liveAlerts),
        apiFetch<{ suggestions: Suggestion[] }>('/api/sugerencias')
          .then(r => r.suggestions)
          .catch(() => this.suggestions),
        apiFetch<{ donations: DonationRecord[] }>('/api/donaciones')
          .then(r => r.donations)
          .catch(() => this.donations),
      ]);

      if (stations.length) this.stations = stations;
      if (species.length) this.species = species;
      if (officialNotices.length) this.officialNotices = officialNotices;
      if (events.length) this.events = events;
      this.officialGallery = officialGallery;
      if (Object.keys(contents).length) this.institutionalContents = contents;
      if (alerts.length) this.liveAlerts = alerts;
      this.suggestions = suggestionsRes;
      this.donations = donationsRes;

      if (feedItems.length) {
        this.feedPosts = feedItems.map((p: any) => ({
          id: p.id,
          type: p.type,
          title: p.title,
          summary: p.summary || p.description || '',
          fullText: p.fullText || p.description || '',
          image: p.image,
          category: p.category || 'comunidad',
          date: p.date,
          author: p.authorName || p.author || 'Comunidad',
          authorAvatar: p.authorAvatar,
          visitedPlace: p.visitedPlace,
          stationCodigo: p.stationCodigo,
          routeSlug: p.routeSlug,
          approved: true,
          isCommunity: true,
          likes: p.likes ?? 0,
          likedByMe: Boolean(p.likedByMe),
          isSaved: Boolean(p.isSaved),
          commentsCount: p.commentsCount ?? 0,
          comments: p.comments ?? [],
        }));

        // Only photo pins belong in the gallery; text posts stay in the Feed
        this.communityPhotos = feedItems.filter((p: { type?: string }) => p.type !== 'post').map((p: any) => ({
          id: p.id,
          title: p.title,
          visitedPlace: p.visitedPlace || 'Reserva Comunitaria Bosque Humedal Angachilla',
          stationCodigo: p.stationCodigo,
          imageUrl: p.imageUrl || p.image,
          authorName: p.authorName || p.author || 'Visitante',
          authorEmail: p.authorEmail || '',
          authorAvatar: p.authorAvatar,
          date: p.date,
          likes: p.likes ?? 0,
          likedByMe: Boolean(p.likedByMe),
          isSaved: Boolean(p.isSaved),
          approved: true,
          description: p.description || p.fullText || p.summary || '',
          tags: p.tags || ['Comunidad', 'Humedal'],
          aspectRatio: p.aspectRatio || 'tall',
          commentsCount: p.commentsCount ?? 0,
          comments: p.comments ?? [],
        }));
      }

      // Intentar cargar cola de moderación si el usuario es admin
      feedApi
        .getModerationQueue()
        .then(tickets => {
          this.moderationTickets = tickets;
          this.notify();
        })
        .catch(() => {});

      this.notify();
    } catch {
      // Silencioso en caso de modo offline
    }
  }

  getInstitutionalContents(): Record<string, any> {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.institutionalContents;
  }

  getOfficialGallery(): OfficialGalleryPhoto[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.officialGallery;
  }

  async uploadOfficialGalleryPhoto(data: {
    stationCode: string;
    title: string;
    description?: string;
    dataUrl: string;
  }): Promise<void> {
    await ecosistemaApi.uploadOfficialGalleryPhoto(data);
    await this.syncAll();
  }

  // --- Notices (Avisos Oficiales + Posts aprobados en MongoDB) ---
  getNotices(): Notice[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return [...this.officialNotices, ...this.feedPosts];
  }

  toggleLikeNotice(id: string): Notice[] {
    this.toggleLikePhoto(id);
    return this.getNotices();
  }

  getOfficialNoticesOnly(): Notice[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.officialNotices;
  }

  getFeedPostsOnly(): Notice[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.feedPosts;
  }

  getPostsByRoute(routeId: string): Notice[] {
    const rId = resolveRouteId(routeId);
    return this.getNotices().filter(n => {
      if (n.routeSlug && resolveRouteId(n.routeSlug) === rId) return true;
      if (rId === 'ruta-canelos') {
        return n.stationCodigo === 'S5' || n.visitedPlace?.toLowerCase().includes('canelos');
      } else {
        return (
          ['S1', 'S2', 'S3', 'S4', 'S6', 'E7', 'E8', 'E9'].includes(n.stationCodigo || '') ||
          !n.stationCodigo ||
          n.visitedPlace?.toLowerCase().includes('circuito')
        );
      }
    });
  }

  addNotice(notice: Omit<Notice, 'id' | 'date'>): Notice {
    const optimistic: Notice = {
      ...notice,
      id: 'not-' + Date.now(),
      image: resolveMediaUrl(notice.image),
      date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      approved: true,
    };
    this.officialNotices = [optimistic, ...this.officialNotices];
    this.notify();

    apiFetch('/api/avisos', {
      method: 'POST',
      body: JSON.stringify(notice),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return optimistic;
  }

  toggleApproveNotice(id: string): Notice[] {
    feedApi
      .moderatePost(id, 'aprobado')
      .then(() => this.syncAll())
      .catch(() => {});
    return this.getNotices();
  }

  deleteNotice(id: string) {
    this.officialNotices = this.officialNotices.filter(n => n.id !== id);
    this.feedPosts = this.feedPosts.filter(n => n.id !== id);
    this.notify();

    apiFetch(`/api/avisos/${id}`, { method: 'DELETE' })
      .catch(() => feedApi.deletePost(id))
      .finally(() => this.syncAll());
  }

  // --- Suggestions (PostgreSQL sugerencia) ---
  getSuggestions(): Suggestion[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.suggestions;
  }

  addSuggestion(data: {
    title: string;
    description: string;
    category: Suggestion['category'];
    authorName: string;
    authorEmail: string;
  }): Suggestion {
    const newSug: Suggestion = {
      id: 'sug-' + Date.now(),
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'pendiente',
      createdAt: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      authorName: data.authorName,
      authorEmail: data.authorEmail,
    };
    this.suggestions = [newSug, ...this.suggestions];
    this.notify();

    apiFetch('/api/sugerencias', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return newSug;
  }

  updateSuggestionStatus(id: string, status: 'aprobada' | 'rechazada', adminComment?: string) {
    this.suggestions = this.suggestions.map(s =>
      s.id === id ? { ...s, status, adminComment: adminComment || s.adminComment } : s
    );
    this.notify();

    apiFetch(`/api/sugerencias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminComment }),
    })
      .then(() => this.syncAll())
      .catch(() => {});
  }

  deleteSuggestion(id: string) {
    this.suggestions = this.suggestions.filter(s => s.id !== id);
    this.notify();

    apiFetch(`/api/sugerencias/${id}`, { method: 'DELETE' })
      .then(() => this.syncAll())
      .catch(() => {});
  }

  // --- Community Photos & Feed (MongoDB feed_posts) ---
  getCommunityPhotos(): CommunityPhoto[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.communityPhotos;
  }

  addCommunityPhoto(data: {
    title: string;
    visitedPlace: string;
    stationCodigo?: string;
    imageUrl: string;
    authorName: string;
    authorEmail: string;
    description: string;
    tags?: string[];
    aspectRatio?: 'tall' | 'wide' | 'square';
    authorAvatar?: string;
  }): CommunityPhoto {
    const newPhoto: CommunityPhoto = {
      id: 'photo-' + Date.now(),
      title: data.title,
      visitedPlace: data.visitedPlace,
      stationCodigo: data.stationCodigo,
      imageUrl: resolveMediaUrl(data.imageUrl),
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      authorAvatar: data.authorAvatar || resolveMediaUrl('/api/media/slug/svg-simbolo-angachilla-app'),
      date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      likes: 0,
      approved: false,
      status: 'pendiente',
      description: data.description,
      tags: data.tags || ['Comunidad', 'Humedal'],
      aspectRatio: data.aspectRatio || 'tall',
      commentsCount: 0,
      isSaved: false,
    };

    feedApi
      .createPost({
        type: 'photo_pin',
        ticketType: 'foto_comunidad',
        title: data.title,
        description: data.description,
        visitedPlace: data.visitedPlace,
        stationCodigo: data.stationCodigo,
        imageUrl: data.imageUrl,
        tags: data.tags,
        aspectRatio: data.aspectRatio,
      })
      .then(() => this.syncAll())
      .catch(() => {});

    return newPhoto;
  }

  toggleLikePhoto(photoId: string): number {
    let newLikes = 0;
    this.communityPhotos = this.communityPhotos.map(p => {
      if (p.id === photoId) {
        const liked = !p.likedByMe;
        newLikes = liked ? p.likes + 1 : Math.max(0, p.likes - 1);
        return { ...p, likedByMe: liked, likes: newLikes };
      }
      return p;
    });
    this.feedPosts = this.feedPosts.map(p => {
      if (p.id === photoId) {
        const liked = !p.likedByMe;
        return { ...p, likedByMe: liked, likes: liked ? (p.likes ?? 0) + 1 : Math.max(0, (p.likes ?? 0) - 1) };
      }
      return p;
    });
    this.notify();

    feedApi
      .toggleLike(photoId)
      .then(res => {
        this.communityPhotos = this.communityPhotos.map(p =>
          p.id === photoId ? { ...p, likedByMe: res.likedByMe, likes: res.likes } : p
        );
        this.feedPosts = this.feedPosts.map(p =>
          p.id === photoId ? { ...p, likedByMe: res.likedByMe, likes: res.likes } : p
        );
        this.notify();
      })
      .catch(() => {});

    return newLikes;
  }

  deleteCommunityPhoto(id: string) {
    this.communityPhotos = this.communityPhotos.filter(p => p.id !== id);
    this.feedPosts = this.feedPosts.filter(p => p.id !== id);
    this.notify();

    feedApi
      .deletePost(id)
      .then(() => this.syncAll())
      .catch(() => {});
  }

  // --- Saved notices & QR Badges ---
  getSavedNoticeIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_NOTICES) ?? '[]');
    } catch {
      return [];
    }
  }

  toggleSavedNotice(id: string): string[] {
    const current = this.getSavedNoticeIds();
    const updated = current.includes(id) ? current.filter(x => x !== id) : [id, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SAVED_NOTICES, JSON.stringify(updated));
    }
    feedApi.toggleSave(id).catch(() => {});
    this.notify();
    return updated;
  }

  getScannedQRs(): string[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.SCANNED_QRS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  saveScannedQR(qrCode: string): boolean {
    const list = this.getScannedQRs();
    if (!list.includes(qrCode)) {
      list.push(qrCode);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SCANNED_QRS, JSON.stringify(list));
      }
      this.notify();
      return true;
    }
    return false;
  }

  // --- Live Route Alerts (MongoDB route_alerts) ---
  getLiveAlerts(): WazeLiveAlert[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.liveAlerts;
  }

  addLiveAlert(alert: Omit<WazeLiveAlert, 'id' | 'timeAgo'>): WazeLiveAlert {
    const newAlert: WazeLiveAlert = {
      ...alert,
      id: 'al-' + Date.now(),
      timeAgo: 'Ahora mismo',
    };
    this.liveAlerts = [newAlert, ...this.liveAlerts];
    this.notify();

    feedApi
      .createRouteAlert(alert)
      .then(() => this.syncAll())
      .catch(() => {});

    return newAlert;
  }

  // --- Wetland Events (PostgreSQL evento + inscripcion_evento) ---
  getEvents(): WetlandEvent[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.events;
  }

  getEventsByRoute(routeId: string): WetlandEvent[] {
    return this.getEvents().filter(e => resolveRouteId(e.routeId) === routeId);
  }

  toggleRegisterEvent(eventId: string): { isRegistered: boolean; newCount: number } {
    let isRegistered = false;
    let newCount = 0;

    this.events = this.events.map(evt => {
      if (evt.id === eventId) {
        isRegistered = !evt.isRegistered;
        newCount = isRegistered ? evt.registeredCount + 1 : Math.max(0, evt.registeredCount - 1);
        return { ...evt, isRegistered, registeredCount: newCount };
      }
      return evt;
    });
    this.notify();

    ecosistemaApi
      .toggleRegisterEvent(eventId)
      .then(res => {
        this.events = this.events.map(evt =>
          evt.id === eventId
            ? { ...evt, isRegistered: res.isRegistered, registeredCount: res.registeredCount }
            : evt
        );
        this.notify();
      })
      .catch(() => {});

    return { isRegistered, newCount };
  }

  addEvent(eventData: Omit<WetlandEvent, 'id' | 'registeredCount' | 'isRegistered'>): WetlandEvent {
    const newEvent: WetlandEvent = {
      ...eventData,
      id: 'evt-' + Date.now(),
      image: resolveMediaUrl(eventData.image),
      registeredCount: 0,
      isRegistered: false,
    };
    this.events = [newEvent, ...this.events];
    this.notify();

    apiFetch('/api/eventos', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return newEvent;
  }

  updateEvent(id: string, eventData: Partial<WetlandEvent>): WetlandEvent[] {
    this.events = this.events.map(e => (e.id === id ? { ...e, ...eventData } : e));
    this.notify();

    apiFetch(`/api/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return this.events;
  }

  deleteEvent(id: string) {
    this.events = this.events.filter(e => e.id !== id);
    this.notify();

    apiFetch(`/api/eventos/${id}`, { method: 'DELETE' })
      .then(() => this.syncAll())
      .catch(() => {});
  }

  // --- Points of Interest / Stations (PostgreSQL + PostGIS estacion) ---
  getPointsOfInterest(): PointOfInterest[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.stations;
  }

  addPointOfInterest(poi: Omit<PointOfInterest, 'id'>): PointOfInterest {
    const newPoi: PointOfInterest = {
      ...poi,
      id: 'poi-' + Date.now(),
      image: resolveMediaUrl(poi.image),
    };
    this.stations = [...this.stations, newPoi];
    this.notify();

    apiFetch('/api/estaciones', {
      method: 'POST',
      body: JSON.stringify(poi),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return newPoi;
  }

  updatePointOfInterest(id: string, data: Partial<PointOfInterest>): PointOfInterest[] {
    this.stations = this.stations.map(p => (p.id === id ? { ...p, ...data } : p));
    this.notify();

    apiFetch(`/api/estaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return this.stations;
  }

  deletePointOfInterest(id: string) {
    this.stations = this.stations.filter(p => p.id !== id);
    this.notify();

    apiFetch(`/api/estaciones/${id}`, { method: 'DELETE' })
      .then(() => this.syncAll())
      .catch(() => {});
  }

  // --- Species Catalog CRUD (PostgreSQL especie) ---
  getSpecies(): Species[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.species;
  }

  addSpecies(speciesData: Omit<Species, 'id'>): Species {
    const newSpecies: Species = {
      ...speciesData,
      id: 'sp-' + Date.now(),
      image: resolveMediaUrl(speciesData.image),
    };
    this.species = [newSpecies, ...this.species];
    this.notify();

    apiFetch('/api/especies', {
      method: 'POST',
      body: JSON.stringify(speciesData),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return newSpecies;
  }

  updateSpecies(id: string, data: Partial<Species>): Species[] {
    this.species = this.species.map(s => (s.id === id ? { ...s, ...data } : s));
    this.notify();

    apiFetch(`/api/especies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
      .then(() => this.syncAll())
      .catch(() => {});

    return this.species;
  }

  deleteSpecies(id: string) {
    this.species = this.species.filter(s => s.id !== id);
    this.notify();

    apiFetch(`/api/especies/${id}`, { method: 'DELETE' })
      .then(() => this.syncAll())
      .catch(() => {});
  }

  // --- Donations (PostgreSQL donacion) ---
  getDonations(): DonationRecord[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.donations;
  }

  addDonation(record: Omit<DonationRecord, 'id' | 'date' | 'receiptNumber'>): DonationRecord {
    const newDonation: DonationRecord = {
      ...record,
      id: 'don-' + Date.now(),
      date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      receiptNumber: `ANG-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    this.donations = [newDonation, ...this.donations];
    this.notify();

    apiFetch<{ donation: DonationRecord }>('/api/donaciones', {
      method: 'POST',
      body: JSON.stringify(record),
    })
      .then(res => {
        if (res?.donation) {
          this.donations = [res.donation, ...this.donations.filter(d => d.id !== newDonation.id)];
          this.notify();
        }
      })
      .catch(() => {});

    return newDonation;
  }

  isAdFreeActive(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.AD_FREE) === 'true';
  }

  setAdFreeActive(active: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AD_FREE, active ? 'true' : 'false');
  }

  getSponsorAds(): SponsorAd[] {
    return INITIAL_SPONSOR_ADS;
  }

  // --- Moderation Tickets (MongoDB feed_posts cola de moderación) ---
  getModerationTickets(): ModerationTicket[] {
    if (!this.initialized && typeof window !== 'undefined') this.syncAll();
    return this.moderationTickets;
  }

  addModerationTicket(ticket: Omit<ModerationTicket, 'id' | 'submittedAt' | 'status'>): ModerationTicket {
    const newTicket: ModerationTicket = {
      ...ticket,
      id: 'tkt-' + Date.now(),
      submittedAt: 'Recién',
      status: 'pendiente',
    };
    this.moderationTickets = [newTicket, ...this.moderationTickets];
    this.notify();

    feedApi
      .createPost({
        type: ticket.type === 'foto_comunidad' ? 'photo_pin' : 'post',
        ticketType: ticket.type,
        title: ticket.title,
        description: ticket.description,
        imageUrl: ticket.imageUrl,
        visitedPlace: ticket.locationName,
      })
      .then(() => this.syncAll())
      .catch(() => {});

    return newTicket;
  }

  updateModerationTicket(id: string, updates: Partial<ModerationTicket>): ModerationTicket | null {
    let updatedTicket: ModerationTicket | null = null;
    this.moderationTickets = this.moderationTickets.map(t => {
      if (t.id === id) {
        updatedTicket = { ...t, ...updates };
        return updatedTicket;
      }
      return t;
    });
    this.notify();

    if (updates.status === 'aprobado' || updates.status === 'rechazado') {
      feedApi
        .moderatePost(id, updates.status, updates.adminFeedback)
        .then(() => this.syncAll())
        .catch(() => {});
    }

    return updatedTicket;
  }

  deleteModerationTicket(id: string): void {
    this.moderationTickets = this.moderationTickets.filter(t => t.id !== id);
    this.notify();

    feedApi
      .deletePost(id)
      .then(() => this.syncAll())
      .catch(() => {});
  }
}

export const storageService = new StorageService();
