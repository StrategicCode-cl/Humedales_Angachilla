export type UserRole = 'visitante' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type SpeciesCategory =
  | 'ave_acuatica'
  | 'ave_bosque'
  | 'mamifero'
  | 'anfibio'
  | 'arbol_arbusto'
  | 'planta_acuatica'
  | 'hongo';

export type ConservationStatus =
  | 'En Peligro Crítico'
  | 'En Peligro'
  | 'Vulnerable'
  | 'Casi Amenazada'
  | 'Preocupación Menor';

export type SpeciesKingdom = 'Fauna' | 'Flora' | 'Reino Fungi' | 'Fungi';

export interface SpeciesStationRef {
  id: string;
  code: string;
  name: string;
  coordinates: [number, number];
  routeId?: string;
}

export interface Species {
  id: string;
  slug?: string;
  commonName: string;
  mapudungunName?: string;
  scientificName: string;
  kingdom?: SpeciesKingdom;
  group?: string;
  category: SpeciesCategory;
  conservationStatus: ConservationStatus;
  statusColor: string;
  habitat: string;
  description: string;
  funFact: string;
  image: string;
  illustrationUrl?: string;
  photoUrl?: string;
  stations?: (string | SpeciesStationRef)[];
  imageCredit?: {
    author: string;
    license: string;
    sourceUrl: string;
  };
  soundKey?: string;
  soundLabel?: string;
  approxLocation?: [number, number];
  ebirdUrl?: string;
  inaturalistUrl?: string;
}

export interface RouteCheckpoint {
  id: string;
  name: string;
  instruction: string;
  progress: number; // fracción de la distancia recorrida: 0 = inicio, 1 = fin
  alertType?: 'info' | 'warning' | 'viewpoint' | 'caution';
  alertMessage?: string;
  totemQrId?: string;
}

export interface RouteGeometry {
  distanceKm: number;
  recordedMinutes: number | null;
  isLoop: boolean;
  endGapM: number;
  bounds: [[number, number], [number, number]];
  overview: [number, number][];
  detailUrl: string;
  detailPoints: number;
  source: {
    author: string | null;
    url: string | null;
    recordedAt: string | null;
  };
}

export interface HumedalRoute {
  id: string;
  name: string;
  difficulty: 'Fácil' | 'Media' | 'Aventura';
  distanceKm: number;
  estimatedMinutes: number;
  description: string;
  color: string;
  highlight?: string;
  surfaceType?: string;
  path: [number, number][]; // vista general simplificada [lat, lng]
  detailUrl?: string; // trazado detallado, se descarga al seleccionar la ruta
  bounds?: [[number, number], [number, number]];
  isLoop?: boolean;
  source?: RouteGeometry['source'];
  checkpoints: RouteCheckpoint[];
}

export interface StationPhoto {
  id: string;
  mediaId?: string;
  title: string;
  description?: string;
  url: string;
  order?: number;
}

export interface PointOfInterest {
  id: string;
  code?: string;
  slug?: string;
  name: string;
  subtitle?: string;
  category: 'mirador' | 'pasarela' | 'totem_qr' | 'muelle' | 'torre' | 'bano_ecologico';
  coordinates: [number, number];
  description: string;
  rules?: string[];
  norms?: string[];
  qrCode: string;
  image: string;
  gallery?: string[];
  routeId?: string;
  order?: number;
  photos?: StationPhoto[];
  species?: Species[];
  speciesIds?: string[];
  soundKey?: string;
}

export interface FeedComment {
  id?: string;
  author: string;
  authorName?: string;
  authorAvatar?: string;
  text: string;
  date: string;
}

export interface Notice {
  id: string;
  type?: 'post' | 'photo_pin' | 'official';
  title: string;
  summary: string;
  fullText: string;
  image: string;
  category: 'alerta' | 'limpieza' | 'taller' | 'biodiversidad' | 'comunidad' | 'oficial';
  date: string;
  author: string;
  authorAvatar?: string;
  visitedPlace?: string;
  stationCodigo?: string;
  routeSlug?: string;
  pinned?: boolean;
  approved?: boolean;
  isCommunity?: boolean;
  likes?: number;
  likedByMe?: boolean;
  isSaved?: boolean;
  commentsCount?: number;
  comments?: FeedComment[];
}

export interface WetlandEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  locationName: string;
  coordinates: [number, number];
  routeId: string;
  routeName: string;
  stationCode?: string;
  category: 'avistamiento' | 'limpieza' | 'educativo' | 'fotografia' | 'kayak' | 'comunitario';
  capacity: number;
  registeredCount: number;
  image: string;
  organizer: string;
  isRegistered?: boolean;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'infraestructura' | 'fauna' | 'limpieza' | 'seguridad' | 'educacion';
  status: 'pendiente' | 'aprobada' | 'rechazada';
  createdAt: string;
  authorName: string;
  authorEmail: string;
  adminComment?: string;
}

export interface CommunityPhoto {
  id: string;
  title: string;
  visitedPlace: string;
  stationCodigo?: string;
  imageUrl: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  date: string;
  likes: number;
  likedByMe?: boolean;
  isSaved?: boolean;
  approved: boolean;
  status?: 'pendiente' | 'aprobado' | 'rechazado';
  description: string;
  tags?: string[];
  aspectRatio?: 'tall' | 'square' | 'wide';
  commentsCount?: number;
  comments?: FeedComment[];
}

export interface OfficialGalleryPhoto {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  stationId: string;
  stationCode: string;
  stationName: string;
  coordinates: [number, number];
  routeId: string;
  createdAt: string;
}

export interface InfographicPoster {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  imageUrl: string;
  rules: string[];
  description: string;
}

export interface WazeLiveAlert {
  id: string;
  type: 'fauna' | 'resbaladizo' | 'corte' | 'silencio';
  title: string;
  description: string;
  coordinates: [number, number];
  reportedBy: string;
  timeAgo: string;
}

export interface WetlandWeatherAlert {
  id: string;
  severity: 'warning' | 'caution' | 'info' | 'good';
  title: string;
  message: string;
  category: 'resbaladizo' | 'marea' | 'viento' | 'avistamiento' | 'uv' | 'general';
  iconType: string;
}

export interface DayForecast {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  rainProb: number;
  weatherCode: number;
  weatherLabel: string;
}

export interface WetlandWeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipitationProbability: number;
  uvIndex: number;
  weatherCode: number;
  weatherLabel: string;
  isDay: boolean;
  updatedAt: string;
  fetchedAt?: string;
  isCached?: boolean;
  dailyForecast: DayForecast[];
  wetlandAlerts: WetlandWeatherAlert[];
}

export interface DonationRecord {
  id: string;
  donorName: string;
  donorEmail: string;
  amountClp: number;
  purpose: 'mantenimiento_pasarelas' | 'reforestacion' | 'totems_qr' | 'monitoreo_fauna' | 'general';
  paymentMethod: 'webpay' | 'transferencia';
  date: string;
  receiptNumber: string;
}

export interface SponsorAd {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  linkUrl: string;
  imageUrl: string;
  badge: string;
  sponsorName: string;
}

export interface UserSubscription {
  isAdFree: boolean;
  tier: 'free' | 'amigo_humedal' | 'protector_valdivia';
  validUntil?: string;
}

export interface ModerationTicket {
  id: string;
  type: 'foto_comunidad' | 'aviso_novedad' | 'avistamiento_especie' | 'reporte_ambiental';
  authorName: string;
  authorEmail: string;
  submittedAt: string;
  title: string;
  description: string;
  imageUrl?: string;
  locationCoords?: [number, number];
  locationName?: string;
  speciesName?: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  adminNotes?: string;
  adminFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}
