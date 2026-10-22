import type {
  User,
  PointOfInterest,
  Species,
  HumedalRoute,
  OfficialGalleryPhoto,
  Notice,
  WetlandEvent,
  Suggestion,
  DonationRecord,
  ModerationTicket,
  WazeLiveAlert,
} from '../types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return `${API_URL}/api/media/slug/estacion-s1-foto-1`;
  if (url.startsWith('/api/media')) return `${API_URL}${url}`;
  return url;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      // Envía y recibe la cookie de sesión aunque la API esté en otro puerto
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? 'Ocurrió un error inesperado', res.status);
  }
  return body as T;
}

export const authApi = {
  me: () => apiFetch<{ user: User | null }>('/api/auth/me').then(r => r.user),

  login: (email: string, password: string) =>
    apiFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(r => r.user),

  register: (name: string, email: string, password: string) =>
    apiFetch<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }).then(r => r.user),

  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
};

export const ecosistemaApi = {
  getTaxonomy: () =>
    apiFetch<{
      reinos: any[];
      grupos: any[];
      categoriasEspecie: any[];
      estadosConservacion: any[];
      categoriasEstacion: any[];
      categoriasEvento: any[];
      categoriasAviso: any[];
    }>('/api/taxonomia'),

  getStations: () =>
    apiFetch<{ stations: PointOfInterest[] }>('/api/estaciones').then(r =>
      r.stations.map(st => ({
        ...st,
        image: resolveMediaUrl(st.image),
        photos: st.photos?.map(p => ({ ...p, url: resolveMediaUrl(p.url) })) ?? [],
        species:
          st.species?.map(sp => ({
            ...sp,
            image: resolveMediaUrl(sp.image),
            illustrationUrl: sp.illustrationUrl ? resolveMediaUrl(sp.illustrationUrl) : undefined,
            photoUrl: sp.photoUrl ? resolveMediaUrl(sp.photoUrl) : undefined,
          })) ?? [],
      }))
    ),

  getSpecies: () =>
    apiFetch<{ species: Species[] }>('/api/especies').then(r =>
      r.species.map(sp => ({
        ...sp,
        image: resolveMediaUrl(sp.image),
        illustrationUrl: sp.illustrationUrl ? resolveMediaUrl(sp.illustrationUrl) : undefined,
        photoUrl: sp.photoUrl ? resolveMediaUrl(sp.photoUrl) : undefined,
      }))
    ),

  getRoutes: () =>
    apiFetch<{ routes: HumedalRoute[] }>('/api/senderos').then(r => r.routes),

  getOfficialGallery: (stationCode?: string) =>
    apiFetch<{ photos: OfficialGalleryPhoto[] }>(
      `/api/galeria-oficial${stationCode && stationCode !== 'todas' ? `?estacion=${encodeURIComponent(stationCode)}` : ''}`
    ).then(r =>
      r.photos.map(p => ({
        ...p,
        imageUrl: resolveMediaUrl(p.imageUrl),
      }))
    ),

  uploadOfficialGalleryPhoto: (data: {
    stationCode: string;
    title: string;
    description?: string;
    dataUrl: string;
  }) =>
    apiFetch<{ id: string; imageUrl: string }>('/api/galeria-oficial', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteOfficialGalleryPhoto: (id: string) =>
    apiFetch<void>(`/api/galeria-oficial/${id}`, { method: 'DELETE' }),

  getContents: () =>
    apiFetch<{ contents: Record<string, any> }>('/api/contenidos').then(r => r.contents),

  getOfficialNotices: () =>
    apiFetch<{ notices: Notice[] }>('/api/avisos').then(r =>
      r.notices.map(n => ({
        ...n,
        image: resolveMediaUrl(n.image),
      }))
    ),

  getEvents: () =>
    apiFetch<{ events: WetlandEvent[] }>('/api/eventos').then(r =>
      r.events.map(e => ({
        ...e,
        image: resolveMediaUrl(e.image),
      }))
    ),

  toggleRegisterEvent: (eventId: string) =>
    apiFetch<{ isRegistered: boolean; registeredCount: number }>(
      `/api/eventos/${eventId}/inscribir`,
      { method: 'POST' }
    ),

  submitContactInquiry: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) =>
    apiFetch<{ id: string; createdAt: string }>('/api/contacto', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const feedApi = {
  getPosts: (type?: 'post' | 'photo_pin') =>
    apiFetch<{ posts: any[] }>(`/api/feed${type ? `?type=${type}` : ''}`).then(r =>
      r.posts.map(p => ({
        ...p,
        image: resolveMediaUrl(p.image || p.imageUrl),
        imageUrl: resolveMediaUrl(p.imageUrl || p.image),
        authorAvatar: resolveMediaUrl(p.authorAvatar),
        comments:
          p.comments?.map((c: any) => ({
            ...c,
            authorAvatar: resolveMediaUrl(c.authorAvatar),
          })) ?? [],
      }))
    ),

  getModerationQueue: () =>
    apiFetch<{ tickets: ModerationTicket[] }>('/api/feed/moderacion').then(r =>
      r.tickets.map(t => ({
        ...t,
        imageUrl: resolveMediaUrl(t.imageUrl),
      }))
    ),

  getMyActivity: () =>
    apiFetch<{ myPosts: any[]; likedPosts: any[]; savedPosts: any[] }>('/api/feed/mis-datos').then(r => ({
      myPosts: r.myPosts.map(p => ({ ...p, image: resolveMediaUrl(p.image), imageUrl: resolveMediaUrl(p.imageUrl) })),
      likedPosts: r.likedPosts.map(p => ({ ...p, image: resolveMediaUrl(p.image), imageUrl: resolveMediaUrl(p.imageUrl) })),
      savedPosts: r.savedPosts.map(p => ({ ...p, image: resolveMediaUrl(p.image), imageUrl: resolveMediaUrl(p.imageUrl) })),
    })),

  createPost: (data: {
    type?: 'post' | 'photo_pin';
    ticketType?: ModerationTicket['type'];
    title: string;
    summary?: string;
    fullText?: string;
    description?: string;
    category?: string;
    imageUrl?: string;
    visitedPlace?: string;
    stationCodigo?: string;
    tags?: string[];
    aspectRatio?: 'tall' | 'square' | 'wide';
  }) =>
    apiFetch<{ post: any; requiresModeration: boolean }>('/api/feed', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleLike: (postId: string) =>
    apiFetch<{ likedByMe: boolean; likes: number }>(`/api/feed/${postId}/like`, {
      method: 'POST',
    }),

  toggleSave: (postId: string) =>
    apiFetch<{ isSaved: boolean }>(`/api/feed/${postId}/save`, {
      method: 'POST',
    }),

  addComment: (postId: string, text: string) =>
    apiFetch<{ comment: any; commentsCount: number }>(`/api/feed/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  moderatePost: (postId: string, status: 'aprobado' | 'rechazado', adminFeedback?: string) =>
    apiFetch<{ ok: boolean; status: string }>(`/api/feed/${postId}/moderar`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminFeedback }),
    }),

  deletePost: (postId: string) =>
    apiFetch<void>(`/api/feed/${postId}`, { method: 'DELETE' }),

  getRouteAlerts: () =>
    apiFetch<{ alerts: WazeLiveAlert[] }>('/api/feed/alertas-ruta').then(r => r.alerts),

  createRouteAlert: (data: Omit<WazeLiveAlert, 'id' | 'timeAgo'>) =>
    apiFetch<{ alert: WazeLiveAlert }>('/api/feed/alertas-ruta', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => r.alert),
};
