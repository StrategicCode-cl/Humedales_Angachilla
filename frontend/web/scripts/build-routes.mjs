// Convierte los GPX de backend/Points_Route en datos livianos para el mapa:
//  - src/data/routeGeometry.generated.ts: vista general simplificada (~6 m) que va en el bundle,
//    para dibujar todas las rutas apenas carga el mapa.
//  - public/rutas/<id>.json: trazado detallado (~1,5 m) que se descarga solo al seleccionar la ruta.
// Uso: npm run routes

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GPX_DIR = join(ROOT, '..', '..', 'backend', 'Points_Route');

const ROUTES = [
  { id: 'ruta-circuito', file: 'angachilla-circuito.gpx' },
  { id: 'ruta-canelos', file: 'angachilla-bosque-los-canelo-circuito.gpx' },
];

const OVERVIEW_TOLERANCE_M = 6;
const DETAIL_TOLERANCE_M = 1.5;
const EARTH_RADIUS_M = 6371000;
const rad = d => (d * Math.PI) / 180;

function haversine(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function parseGpx(xml) {
  const text = tag => xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] ?? null;
  const points = [...xml.matchAll(/<trkpt lat="([-\d.]+)" lon="([-\d.]+)">(?:<ele>[-\d.]+<\/ele>)?(?:<time>([^<]+)<\/time>)?/g)].map(m => ({
    lat: Number(m[1]),
    lon: Number(m[2]),
    time: m[3] ? Date.parse(m[3]) : null,
  }));
  const author = xml.match(/<author><name>([^<]*)<\/name>/)?.[1] ?? null;
  const link = xml.match(/<metadata>[\s\S]*?<link href="([^"]+)"><text>[^<]*<\/text><\/link><time>/)?.[1] ?? null;
  return { name: text('name'), author, link, points };
}

// Suaviza el ruido del GPS con un promedio móvil de 3 puntos (conserva los extremos)
function smooth(path) {
  return path.map((p, i) => {
    if (i === 0 || i === path.length - 1) return p;
    const a = path[i - 1];
    const b = path[i + 1];
    return [(a[0] + p[0] + b[0]) / 3, (a[1] + p[1] + b[1]) / 3];
  });
}

// Douglas-Peucker en metros sobre una proyección equirectangular local
function simplify(path, toleranceM) {
  if (path.length < 3) return path;
  const lat0 = rad(path[0][0]);
  const xy = path.map(([lat, lon]) => [rad(lon) * Math.cos(lat0) * EARTH_RADIUS_M, rad(lat) * EARTH_RADIUS_M]);
  const keep = new Uint8Array(path.length);
  keep[0] = keep[path.length - 1] = 1;
  const stack = [[0, path.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const [ax, ay] = xy[first];
    const [bx, by] = xy[last];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = xy[i];
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const dist = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }
    if (maxDist > toleranceM && index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return path.filter((_, i) => keep[i]);
}

const round = path => path.map(([lat, lon]) => [Number(lat.toFixed(6)), Number(lon.toFixed(6))]);
const lengthM = path => path.reduce((sum, p, i) => (i === 0 ? 0 : sum + haversine(path[i - 1], p)), 0);

const geometry = {};
mkdirSync(join(ROOT, 'public', 'rutas'), { recursive: true });

for (const { id, file } of ROUTES) {
  const gpx = parseGpx(readFileSync(join(GPX_DIR, file), 'utf8'));
  const raw = gpx.points.map(p => [p.lat, p.lon]);
  const smoothed = smooth(raw);
  const detail = round(simplify(smoothed, DETAIL_TOLERANCE_M));
  const overview = round(simplify(smoothed, OVERVIEW_TOLERANCE_M));

  const lats = raw.map(p => p[0]);
  const lons = raw.map(p => p[1]);
  const times = gpx.points.map(p => p.time).filter(t => t !== null);
  const distanceKm = Math.round(lengthM(smoothed) / 10) / 100;
  const recordedMinutes = times.length > 1 ? Math.round((times[times.length - 1] - times[0]) / 60000) : null;
  const endGapM = Math.round(haversine(raw[0], raw[raw.length - 1]));

  writeFileSync(join(ROOT, 'public', 'rutas', `${id}.json`), JSON.stringify({ id, path: detail }));

  geometry[id] = {
    distanceKm,
    recordedMinutes,
    isLoop: endGapM <= 25,
    endGapM,
    bounds: [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ],
    overview,
    detailUrl: `/rutas/${id}.json`,
    detailPoints: detail.length,
    source: {
      author: gpx.author,
      url: gpx.link,
      recordedAt: times.length ? new Date(times[0]).toISOString().slice(0, 10) : null,
    },
  };

  console.log(
    `${id}: ${raw.length} puntos → ${detail.length} detalle / ${overview.length} vista general · ${distanceKm} km · ${recordedMinutes} min · cierre a ${endGapM} m`
  );
}

const ts = `// Generado por scripts/build-routes.mjs a partir de backend/Points_Route/*.gpx. No editar a mano.
import type { RouteGeometry } from '../types';

export const ROUTE_GEOMETRY: Record<string, RouteGeometry> = ${JSON.stringify(geometry, null, 2).replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, '[$1, $2]')};
`;
writeFileSync(join(ROOT, 'src', 'data', 'routeGeometry.generated.ts'), ts);
