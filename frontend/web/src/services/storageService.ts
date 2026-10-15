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
  ModerationTicket
} from '../types';
import {
  INITIAL_NOTICES,
  INITIAL_SUGGESTIONS,
  INITIAL_COMMUNITY_PHOTOS,
  WAZE_LIVE_ALERTS,
  INITIAL_WETLAND_EVENTS,
  POINTS_OF_INTEREST,
  INITIAL_SPECIES,
  INITIAL_SPONSOR_ADS,
  INITIAL_MODERATION_TICKETS
} from '../data/mockData';

const STORAGE_KEYS = {
  NOTICES: 'angachilla_notices',
  SUGGESTIONS: 'angachilla_suggestions',
  COMMUNITY_PHOTOS: 'angachilla_photos',
  SCANNED_QRS: 'angachilla_scanned_qrs',
  WAZE_ALERTS: 'angachilla_waze_alerts',
  EVENTS: 'angachilla_events',
  REGISTERED_EVENTS: 'angachilla_registered_events',
  POINTS_OF_INTEREST: 'angachilla_points_of_interest',
  SPECIES: 'angachilla_species',
  DONATIONS: 'angachilla_donations',
  AD_FREE: 'angachilla_ad_free_status',
  SPONSOR_ADS: 'angachilla_sponsor_ads',
  MODERATION_TICKETS: 'angachilla_moderation_tickets'
};

class StorageService {
  // --- Notices ---
  getNotices(): Notice[] {
    if (typeof window === 'undefined') return INITIAL_NOTICES;
    const stored = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
      return INITIAL_NOTICES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTICES;
    }
  }

  addNotice(notice: Omit<Notice, 'id' | 'date'>): Notice {
    const notices = this.getNotices();
    const newNotice: Notice = {
      ...notice,
      id: 'not-' + Date.now(),
      date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    const updated = [newNotice, ...notices];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(updated));
    }
    return newNotice;
  }

  toggleApproveNotice(id: string): Notice[] {
    const notices = this.getNotices();
    const updated = notices.map(n => {
      if (n.id === id) {
        return { ...n, approved: !n.approved };
      }
      return n;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(updated));
    }
    return updated;
  }

  deleteNotice(id: string) {
    const notices = this.getNotices().filter(n => n.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    }
  }

  // --- Suggestions ---
  getSuggestions(): Suggestion[] {
    if (typeof window === 'undefined') return INITIAL_SUGGESTIONS;
    const stored = localStorage.getItem(STORAGE_KEYS.SUGGESTIONS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(INITIAL_SUGGESTIONS));
      return INITIAL_SUGGESTIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_SUGGESTIONS;
    }
  }

  addSuggestion(data: { title: string; description: string; category: Suggestion['category']; authorName: string; authorEmail: string }): Suggestion {
    const suggestions = this.getSuggestions();
    const newSug: Suggestion = {
      id: 'sug-' + Date.now(),
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'pendiente', // Requires admin moderation
      createdAt: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      authorName: data.authorName,
      authorEmail: data.authorEmail
    };
    const updated = [newSug, ...suggestions];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(updated));
    }
    return newSug;
  }

  updateSuggestionStatus(id: string, status: 'aprobada' | 'rechazada', adminComment?: string) {
    const suggestions = this.getSuggestions().map(s => {
      if (s.id === id) {
        return {
          ...s,
          status,
          adminComment: adminComment || s.adminComment
        };
      }
      return s;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
    }
  }

  deleteSuggestion(id: string) {
    const suggestions = this.getSuggestions().filter(s => s.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
    }
  }

  // --- Community Photos ---
  getCommunityPhotos(): CommunityPhoto[] {
    if (typeof window === 'undefined') return INITIAL_COMMUNITY_PHOTOS;
    const stored = localStorage.getItem(STORAGE_KEYS.COMMUNITY_PHOTOS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_PHOTOS, JSON.stringify(INITIAL_COMMUNITY_PHOTOS));
      return INITIAL_COMMUNITY_PHOTOS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_COMMUNITY_PHOTOS;
    }
  }

  addCommunityPhoto(data: {
    title: string;
    visitedPlace: string;
    imageUrl: string;
    authorName: string;
    authorEmail: string;
    description: string;
    tags?: string[];
    aspectRatio?: 'tall' | 'wide' | 'square';
    authorAvatar?: string;
  }): CommunityPhoto {
    const photos = this.getCommunityPhotos();
    const newPhoto: CommunityPhoto = {
      id: 'photo-' + Date.now(),
      title: data.title,
      visitedPlace: data.visitedPlace,
      imageUrl: data.imageUrl,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      authorAvatar: data.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.authorName)}`,
      date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      likes: 0,
      approved: true, // Visible in gallery
      description: data.description,
      tags: data.tags || ['Comunidad', 'Humedal'],
      aspectRatio: data.aspectRatio || 'tall',
      commentsCount: 0,
      isSaved: false
    };
    const updated = [newPhoto, ...photos];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_PHOTOS, JSON.stringify(updated));
    }
    return newPhoto;
  }

  toggleLikePhoto(photoId: string): number {
    const photos = this.getCommunityPhotos();
    let newLikes = 0;
    const updated = photos.map(p => {
      if (p.id === photoId) {
        const liked = !p.likedByMe;
        newLikes = liked ? p.likes + 1 : Math.max(0, p.likes - 1);
        return {
          ...p,
          likedByMe: liked,
          likes: newLikes
        };
      }
      return p;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_PHOTOS, JSON.stringify(updated));
    }
    return newLikes;
  }

  deleteCommunityPhoto(id: string) {
    const photos = this.getCommunityPhotos().filter(p => p.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_PHOTOS, JSON.stringify(photos));
    }
  }

  // --- Scanned QR Badges ---
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
      return true; // First time badge awarded!
    }
    return false;
  }

  // --- Waze Live Alerts ---
  getLiveAlerts(): WazeLiveAlert[] {
    if (typeof window === 'undefined') return WAZE_LIVE_ALERTS;
    const stored = localStorage.getItem(STORAGE_KEYS.WAZE_ALERTS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.WAZE_ALERTS, JSON.stringify(WAZE_LIVE_ALERTS));
      return WAZE_LIVE_ALERTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return WAZE_LIVE_ALERTS;
    }
  }

  addLiveAlert(alert: Omit<WazeLiveAlert, 'id' | 'timeAgo'>): WazeLiveAlert {
    const alerts = this.getLiveAlerts();
    const newAlert: WazeLiveAlert = {
      ...alert,
      id: 'al-' + Date.now(),
      timeAgo: 'Ahora mismo'
    };
    const updated = [newAlert, ...alerts];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.WAZE_ALERTS, JSON.stringify(updated));
    }
    return newAlert;
  }

  // --- Wetland Events ---
  getEvents(): WetlandEvent[] {
    if (typeof window === 'undefined') return INITIAL_WETLAND_EVENTS;
    const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const registeredIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTERED_EVENTS) || '[]');
    let eventsList = INITIAL_WETLAND_EVENTS;
    if (stored) {
      try {
        eventsList = JSON.parse(stored);
      } catch {
        eventsList = INITIAL_WETLAND_EVENTS;
      }
    }
    return eventsList.map(evt => ({
      ...evt,
      isRegistered: registeredIds.includes(evt.id)
    }));
  }

  getEventsByRoute(routeId: string): WetlandEvent[] {
    return this.getEvents().filter(e => e.routeId === routeId);
  }

  toggleRegisterEvent(eventId: string): { isRegistered: boolean; newCount: number } {
    if (typeof window === 'undefined') return { isRegistered: false, newCount: 0 };
    const registeredIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTERED_EVENTS) || '[]');
    const isCurrentlyReg = registeredIds.includes(eventId);
    let updatedIds: string[];
    if (isCurrentlyReg) {
      updatedIds = registeredIds.filter(id => id !== eventId);
    } else {
      updatedIds = [...registeredIds, eventId];
    }
    localStorage.setItem(STORAGE_KEYS.REGISTERED_EVENTS, JSON.stringify(updatedIds));

    // Update event registered count
    const events = this.getEvents();
    let newCount = 0;
    const updatedEvents = events.map(evt => {
      if (evt.id === eventId) {
        newCount = !isCurrentlyReg ? evt.registeredCount + 1 : Math.max(0, evt.registeredCount - 1);
        return {
          ...evt,
          registeredCount: newCount,
          isRegistered: !isCurrentlyReg
        };
      }
      return evt;
    });
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updatedEvents));
    return { isRegistered: !isCurrentlyReg, newCount };
  }

  addEvent(eventData: Omit<WetlandEvent, 'id' | 'registeredCount' | 'isRegistered'>): WetlandEvent {
    const events = this.getEvents();
    const newEvent: WetlandEvent = {
      ...eventData,
      id: 'evt-' + Date.now(),
      registeredCount: 0,
      isRegistered: false
    };
    const updated = [newEvent, ...events];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
    }
    return newEvent;
  }

  updateEvent(id: string, eventData: Partial<WetlandEvent>): WetlandEvent[] {
    const events = this.getEvents();
    const updated = events.map(e => e.id === id ? { ...e, ...eventData } : e);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
    }
    return updated;
  }

  deleteEvent(id: string) {
    const events = this.getEvents().filter(e => e.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }
  }

  // --- Points of Interest & QR Totems (RF-QR-2 & RF-ADM-2) ---
  getPointsOfInterest(): PointOfInterest[] {
    if (typeof window === 'undefined') return POINTS_OF_INTEREST;
    const stored = localStorage.getItem(STORAGE_KEYS.POINTS_OF_INTEREST);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.POINTS_OF_INTEREST, JSON.stringify(POINTS_OF_INTEREST));
      return POINTS_OF_INTEREST;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return POINTS_OF_INTEREST;
    }
  }

  addPointOfInterest(poi: Omit<PointOfInterest, 'id'>): PointOfInterest {
    const list = this.getPointsOfInterest();
    const newPoi: PointOfInterest = {
      ...poi,
      id: 'poi-' + Date.now()
    };
    const updated = [...list, newPoi];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POINTS_OF_INTEREST, JSON.stringify(updated));
    }
    return newPoi;
  }

  updatePointOfInterest(id: string, data: Partial<PointOfInterest>): PointOfInterest[] {
    const list = this.getPointsOfInterest();
    const updated = list.map(p => p.id === id ? { ...p, ...data } : p);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POINTS_OF_INTEREST, JSON.stringify(updated));
    }
    return updated;
  }

  deletePointOfInterest(id: string) {
    const list = this.getPointsOfInterest().filter(p => p.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POINTS_OF_INTEREST, JSON.stringify(list));
    }
  }

  // --- Species Catalog CRUD (RF-ADM-2 & RF-BIO-1) ---
  getSpecies(): Species[] {
    if (typeof window === 'undefined') return INITIAL_SPECIES;
    const stored = localStorage.getItem(STORAGE_KEYS.SPECIES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SPECIES, JSON.stringify(INITIAL_SPECIES));
      return INITIAL_SPECIES;
    }
    try {
      const parsed: Species[] = JSON.parse(stored);
      // Merge new initial species (like newly added fungi) if not yet in stored list
      const existingIds = new Set(parsed.map(s => s.id));
      const missing = INITIAL_SPECIES.filter(s => !existingIds.has(s.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(STORAGE_KEYS.SPECIES, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return INITIAL_SPECIES;
    }
  }

  addSpecies(speciesData: Omit<Species, 'id'>): Species {
    const list = this.getSpecies();
    const newSpecies: Species = {
      ...speciesData,
      id: 'sp-' + Date.now()
    };
    const updated = [newSpecies, ...list];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SPECIES, JSON.stringify(updated));
    }
    return newSpecies;
  }

  updateSpecies(id: string, data: Partial<Species>): Species[] {
    const list = this.getSpecies();
    const updated = list.map(s => s.id === id ? { ...s, ...data } : s);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SPECIES, JSON.stringify(updated));
    }
    return updated;
  }

  deleteSpecies(id: string) {
    const list = this.getSpecies().filter(s => s.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SPECIES, JSON.stringify(list));
    }
  }

  // --- Sustainability & Donations (RF-MON-1) ---
  getDonations(): DonationRecord[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.DONATIONS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  addDonation(record: Omit<DonationRecord, 'id' | 'date' | 'receiptNumber'>): DonationRecord {
    const donations = this.getDonations();
    const newDonation: DonationRecord = {
      ...record,
      id: 'don-' + Date.now(),
      date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      receiptNumber: 'ANG-' + Math.floor(100000 + Math.random() * 900000)
    };
    const updated = [newDonation, ...donations];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(updated));
    }
    return newDonation;
  }

  // --- Ad-free Subscription & Sponsors (RF-MON-2) ---
  isAdFreeActive(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.AD_FREE) === 'true';
  }

  setAdFreeActive(active: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AD_FREE, active ? 'true' : 'false');
  }

  getSponsorAds(): SponsorAd[] {
    if (typeof window === 'undefined') return INITIAL_SPONSOR_ADS;
    const stored = localStorage.getItem(STORAGE_KEYS.SPONSOR_ADS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SPONSOR_ADS, JSON.stringify(INITIAL_SPONSOR_ADS));
      return INITIAL_SPONSOR_ADS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_SPONSOR_ADS;
    }
  }

  // --- Moderation Tickets for Community Content (PDF 15-Sept-2026) ---
  getModerationTickets(): ModerationTicket[] {
    if (typeof window === 'undefined') return INITIAL_MODERATION_TICKETS;
    const stored = localStorage.getItem(STORAGE_KEYS.MODERATION_TICKETS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.MODERATION_TICKETS, JSON.stringify(INITIAL_MODERATION_TICKETS));
      return INITIAL_MODERATION_TICKETS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_MODERATION_TICKETS;
    }
  }

  addModerationTicket(ticket: Omit<ModerationTicket, 'id' | 'submittedAt' | 'status'>): ModerationTicket {
    const tickets = this.getModerationTickets();
    const newTicket: ModerationTicket = {
      ...ticket,
      id: 'tkt-' + Date.now(),
      submittedAt: 'Recién',
      status: 'pendiente'
    };
    const updated = [newTicket, ...tickets];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MODERATION_TICKETS, JSON.stringify(updated));
    }
    return newTicket;
  }

  updateModerationTicket(id: string, updates: Partial<ModerationTicket>): ModerationTicket | null {
    const tickets = this.getModerationTickets();
    let updatedTicket: ModerationTicket | null = null;
    const updated = tickets.map(t => {
      if (t.id === id) {
        updatedTicket = { ...t, ...updates };
        return updatedTicket;
      }
      return t;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MODERATION_TICKETS, JSON.stringify(updated));
    }
    return updatedTicket;
  }

  deleteModerationTicket(id: string): void {
    const tickets = this.getModerationTickets().filter(t => t.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MODERATION_TICKETS, JSON.stringify(tickets));
    }
  }
}

export const storageService = new StorageService();

