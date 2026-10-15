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

export interface Species {
  id: string;
  commonName: string;
  mapudungunName?: string;
  scientificName: string;
  category: SpeciesCategory;
  conservationStatus: ConservationStatus;
  statusColor: string;
  habitat: string;
  description: string;
  funFact: string;
  image: string;
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
  pointIndex: number;
  alertType?: 'info' | 'warning' | 'viewpoint' | 'caution';
  alertMessage?: string;
  totemQrId?: string;
}

export interface HumedalRoute {
  id: string;
  name: string;
  difficulty: 'Fácil' | 'Media' | 'Aventura';
  distanceKm: number;
  estimatedMinutes: number;
  description: string;
  color: string;
  highlight: string;
  surfaceType: string;
  path: [number, number][]; // [lat, lng]
  checkpoints: RouteCheckpoint[];
}

export interface PointOfInterest {
  id: string;
  name: string;
  category: 'mirador' | 'pasarela' | 'totem_qr' | 'muelle' | 'torre' | 'bano_ecologico';
  coordinates: [number, number];
  description: string;
  qrCode: string;
  image: string;
  speciesIds?: string[];
  soundKey?: string;
}

export interface Notice {
  id: string;
  title: string;
  summary: string;
  fullText: string;
  image: string;
  category: 'alerta' | 'limpieza' | 'taller' | 'biodiversidad' | 'comunidad';
  date: string;
  author: string;
  pinned?: boolean;
  approved?: boolean;
  isCommunity?: boolean;
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
  imageUrl: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  date: string;
  likes: number;
  likedByMe?: boolean;
  isSaved?: boolean;
  approved: boolean;
  description: string;
  tags?: string[];
  aspectRatio?: 'tall' | 'square' | 'wide';
  commentsCount?: number;
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


