import type { HumedalRoute } from '../types';

export interface RouteTrack {
  path: [number, number][];
  cumulative: number[]; // metros recorridos hasta cada punto
  totalM: number;
}

const EARTH_RADIUS_M = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

function haversine(a: [number, number], b: [number, number]) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function buildTrack(path: [number, number][]): RouteTrack {
  const cumulative = [0];
  for (let i = 1; i < path.length; i++) {
    cumulative.push(cumulative[i - 1] + haversine(path[i - 1], path[i]));
  }
  return { path, cumulative, totalM: cumulative[cumulative.length - 1] ?? 0 };
}

// Punto interpolado a `meters` desde el inicio del trazado
export function pointAt(track: RouteTrack, meters: number): [number, number] {
  const { path, cumulative, totalM } = track;
  if (path.length === 0) return [0, 0];
  if (meters <= 0) return path[0];
  if (meters >= totalM) return path[path.length - 1];
  let lo = 0;
  let hi = cumulative.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] <= meters) lo = mid;
    else hi = mid;
  }
  const span = cumulative[hi] - cumulative[lo] || 1;
  const t = (meters - cumulative[lo]) / span;
  return [path[lo][0] + (path[hi][0] - path[lo][0]) * t, path[lo][1] + (path[hi][1] - path[lo][1]) * t];
}

// Una descarga por ruta y por sesión; los pedidos simultáneos comparten la misma promesa
const cache = new Map<string, Promise<RouteTrack>>();

export function loadRouteTrack(route: HumedalRoute): Promise<RouteTrack> {
  if (!route.detailUrl) return Promise.resolve(buildTrack(route.path));
  const cached = cache.get(route.id);
  if (cached) return cached;
  const request = fetch(route.detailUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<{ path: [number, number][] }>;
    })
    .then(data => buildTrack(data.path))
    .catch(err => {
      cache.delete(route.id);
      throw err;
    });
  cache.set(route.id, request);
  return request;
}

export function prefetchRouteTrack(route: HumedalRoute) {
  loadRouteTrack(route).catch(() => {});
}

const distanceFormat = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${distanceFormat.format(meters / 1000)} km`;
}
