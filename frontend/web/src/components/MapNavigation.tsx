'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Pause,
  Play,
  Volume2,
  VolumeX,
  AlertTriangle,
  LocateFixed,
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react';
import { HumedalRoute, PointOfInterest, WazeLiveAlert } from '../types';
import { HUMEDAL_ROUTES, resolveRouteId } from '../data/mockData';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import {
  RouteTrack,
  buildTrack,
  formatDistance,
  loadRouteTrack,
  pointAt,
  prefetchRouteTrack
} from '../lib/routeTracks';
import { WetlandWeatherWidget } from './WetlandWeatherWidget';
import { formatEventDateShort } from '../lib/eventDates';

interface MapNavigationProps {
  onOpenQRWithCode?: (code: string) => void;
  onOpenNotice?: (id: string) => void;
  targetCoordinates?: [number, number] | null;
  targetRouteId?: string | null;
  onGoToEvents?: () => void;
}

const INK = '#1c1917';
const IDLE_ROUTE = '#57534e';
const SIM_TICK_MS = 500;

const ALERT_TYPES: { id: WazeLiveAlert['type']; label: string }[] = [
  { id: 'fauna', label: 'Fauna en el sendero' },
  { id: 'resbaladizo', label: 'Pasarela resbalosa' },
  { id: 'corte', label: 'Sendero cortado' },
  { id: 'silencio', label: 'Zona de silencio' }
];

const ALERT_COLORS: Record<WazeLiveAlert['type'], string> = {
  fauna: 'bg-emerald-700',
  resbaladizo: 'bg-amber-600',
  corte: 'bg-rose-700',
  silencio: 'bg-stone-700'
};

const findRoute = (id: string | null | undefined) =>
  (id && HUMEDAL_ROUTES.find(r => r.id === resolveRouteId(id))) || null;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const recordedDate = (iso: string | null | undefined) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

// Silueta real del trazado, dibujada desde la vista general del GPX
const RouteShape: React.FC<{ route: HumedalRoute; active: boolean }> = ({ route, active }) => {
  const size = 44;
  const pad = 4;
  const cosLat = Math.cos((route.path[0][0] * Math.PI) / 180);
  const xs = route.path.map(p => p[1] * cosLat);
  const ys = route.path.map(p => -p[0]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const scale = (size - pad * 2) / Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  const offX = (size - (Math.max(...xs) - minX) * scale) / 2;
  const offY = (size - (Math.max(...ys) - minY) * scale) / 2;
  const pts = xs.map((x, i) => [offX + (x - minX) * scale, offY + (ys[i] - minY) * scale]);
  const color = active ? route.color : IDLE_ROUTE;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 rounded-md bg-stone-100" aria-hidden="true">
      <polyline
        points={pts.map(p => p.join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={pts[0][0]} cy={pts[0][1]} r={3} fill={INK} />
    </svg>
  );
};

export const MapNavigation: React.FC<MapNavigationProps> = ({
  onOpenQRWithCode,
  targetCoordinates,
  targetRouteId,
  onGoToEvents
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    () => findRoute(targetRouteId)?.id ?? HUMEDAL_ROUTES[0].id
  );
  const selectedRoute = findRoute(selectedRouteId) ?? HUMEDAL_ROUTES[0];

  // A route requested from another screen (an event) replaces the current selection
  const [lastTargetRouteId, setLastTargetRouteId] = useState(targetRouteId);
  if (targetRouteId !== lastTargetRouteId) {
    setLastTargetRouteId(targetRouteId);
    const found = findRoute(targetRouteId);
    if (found) setSelectedRouteId(found.id);
  }

  // Detailed track: the overview is drawn at once, the detail replaces it when it arrives
  const [detail, setDetail] = useState<{ routeId: string; track: RouteTrack } | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const overviewTrack = useMemo(() => buildTrack(selectedRoute.path), [selectedRoute]);
  const hasDetail = detail?.routeId === selectedRoute.id;
  const track = hasDetail ? detail.track : overviewTrack;
  const loadState: 'loading' | 'ready' | 'error' = hasDetail
    ? 'ready'
    : detailError === selectedRoute.id
    ? 'error'
    : 'loading';

  const [eventsVersion, setEventsVersion] = useState(0);
  const routeEvents = useMemo(
    () => storageService.getEventsByRoute(selectedRoute.id),
    // eventsVersion re-reads after a registration change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRoute.id, eventsVersion]
  );

  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  // Navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [traveledM, setTraveledM] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const reachedRef = useRef<Set<string>>(new Set());

  // Real GPS
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState<string | null>(null);

  // Community alerts
  const [liveAlerts, setLiveAlerts] = useState<WazeLiveAlert[]>(() => storageService.getLiveAlerts());
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlertType, setNewAlertType] = useState<WazeLiveAlert['type']>('fauna');
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertDesc, setNewAlertDesc] = useState('');

  // Layers
  const overviewLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const selectedLineRef = useRef<L.Polyline | null>(null);
  const checkpointsLayerRef = useRef<L.LayerGroup | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);
  const alertsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const rendererRef = useRef<L.Canvas | null>(null);
  const selectRouteRef = useRef<(id: string) => void>(() => {});

  const selectRoute = (id: string) => {
    if (id === selectedRouteId) return;
    setSelectedRouteId(id);
    setIsNavigating(false);
    setSimulating(false);
    setTraveledM(0);
    soundService.playNavChime();
  };
  // Leaflet handlers are bound once; they call the latest selectRoute through this ref
  useEffect(() => {
    selectRouteRef.current = selectRoute;
  });

  // Load the selected route's detailed track (cached per session)
  useEffect(() => {
    let cancelled = false;
    loadRouteTrack(selectedRoute)
      .then(t => {
        if (!cancelled) setDetail({ routeId: selectedRoute.id, track: t });
      })
      .catch(() => {
        if (!cancelled) setDetailError(selectedRoute.id);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRoute, retry]);

  // Map: created once, with every route drawn from its bundled overview
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const renderer = L.canvas({ tolerance: 10 });
    rendererRef.current = renderer;
    const allBounds = L.latLngBounds([]);
    HUMEDAL_ROUTES.forEach(r => r.bounds && allBounds.extend(r.bounds));

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      preferCanvas: true,
      renderer
    });
    map.fitBounds(allBounds, { padding: [32, 32] });
    map.attributionControl.setPrefix(false);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    HUMEDAL_ROUTES.forEach(route => {
      const line = L.polyline(route.path, {
        renderer,
        color: IDLE_ROUTE,
        weight: 4,
        opacity: 0.75,
        lineCap: 'round',
        lineJoin: 'round'
      })
        .bindTooltip(route.name, { sticky: true, direction: 'top', className: 'route-tooltip' })
        .on('click', () => selectRouteRef.current(route.id))
        .on('mouseover', () => prefetchRouteTrack(route))
        .addTo(map);
      overviewLinesRef.current.set(route.id, line);
    });

    checkpointsLayerRef.current = L.layerGroup().addTo(map);
    poisLayerRef.current = L.layerGroup().addTo(map);
    alertsLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // The other routes are a few KB: fetch them once the browser is idle so switching is instant
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const idleId = idle(() => HUMEDAL_ROUTES.forEach(prefetchRouteTrack));

    // El contenedor cambia de alto al cruzar el breakpoint de escritorio
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapContainerRef.current);

    const overviewLines = overviewLinesRef.current;
    return () => {
      (window.cancelIdleCallback ?? window.clearTimeout)(idleId);
      resizeObserver.disconnect();
      map.remove();
      overviewLines.clear();
      selectedLineRef.current = null;
      userMarkerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  // Selection: restyle the overview lines and frame the chosen route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    overviewLinesRef.current.forEach((line, id) => {
      const active = id === selectedRoute.id;
      line.setStyle({ opacity: active ? 0 : 0.75 });
    });
    if (selectedRoute.bounds) {
      map.flyToBounds(selectedRoute.bounds, { padding: [48, 48], duration: 0.6 });
    }
  }, [selectedRoute]);

  // The selected route's line (overview first, then the detailed track) and its checkpoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    const checkpointsLayer = checkpointsLayerRef.current;
    if (!map || !checkpointsLayer) return;

    if (selectedLineRef.current) {
      selectedLineRef.current.setLatLngs(track.path).setStyle({ color: selectedRoute.color });
    } else {
      selectedLineRef.current = L.polyline(track.path, {
        renderer: rendererRef.current ?? undefined,
        color: selectedRoute.color,
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }).addTo(map);
    }

    checkpointsLayer.clearLayers();
    selectedRoute.checkpoints.forEach((cp, idx) => {
      // On a loop the finish sits on the start: one marker is enough
      if (selectedRoute.isLoop && idx > 0 && cp.progress === 1) return;
      const icon = L.divIcon({
        className: 'checkpoint-marker',
        html: `<div class="w-7 h-7 rounded-full bg-stone-900 text-white border-2 border-white flex items-center justify-center text-sm font-semibold">${idx + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker(pointAt(track, cp.progress * track.totalM), { icon, keyboard: true, title: cp.name })
        .bindPopup(
          `<div class="text-sm"><strong class="block text-stone-900">${escapeHtml(cp.name)}</strong><span class="text-stone-700">${escapeHtml(cp.instruction)}</span></div>`
        )
        .addTo(checkpointsLayer);
    });
  }, [track, selectedRoute]);

  // Points of interest
  useEffect(() => {
    const poisLayer = poisLayerRef.current;
    if (!poisLayer) return;
    poisLayer.clearLayers();
    storageService.getPointsOfInterest().forEach(poi => {
      const icon = L.divIcon({
        className: 'custom-poi-marker',
        html: `<div class="w-7 h-7 rounded-full bg-white text-emerald-800 border-2 border-emerald-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker(poi.coordinates, { icon, title: poi.name })
        .bindTooltip(poi.name.split(':')[0], { direction: 'top', offset: [0, -14] })
        .on('click', () => {
          setSelectedPOI(poi);
          if (poi.soundKey) soundService.playBySoundKey(poi.soundKey);
        })
        .addTo(poisLayer);
    });
  }, []);

  // Community alerts
  useEffect(() => {
    const alertsLayer = alertsLayerRef.current;
    if (!alertsLayer) return;
    alertsLayer.clearLayers();
    liveAlerts.forEach(alert => {
      const icon = L.divIcon({
        className: 'custom-alert-marker',
        html: `<div class="w-6 h-6 rounded-full ${ALERT_COLORS[alert.type] ?? 'bg-amber-600'} text-white border-2 border-white flex items-center justify-center text-xs font-bold">!</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker(alert.coordinates, { icon, title: alert.title })
        .bindPopup(
          `<div class="text-sm max-w-[220px]"><strong class="block text-stone-900">${escapeHtml(alert.title)}</strong><span class="block text-stone-700 mt-1">${escapeHtml(alert.description)}</span><span class="block text-stone-500 text-xs mt-1">${escapeHtml(alert.reportedBy)} · ${escapeHtml(alert.timeAgo)}</span></div>`
        )
        .addTo(alertsLayer);
    });
  }, [liveAlerts]);

  // The visitor's position
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    if (!userMarkerRef.current) {
      const icon = L.divIcon({
        className: 'user-nav-marker',
        html: `<div class="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center"><div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      userMarkerRef.current = L.marker(userLocation, { icon, zIndexOffset: 1000, interactive: false }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (targetCoordinates && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(targetCoordinates, 17, { duration: 1.2 });
    }
  }, [targetCoordinates]);

  // Simulated walk along the real track (about a minute for the whole route)
  useEffect(() => {
    if (!isNavigating || !simulating) return;
    const stepM = Math.max(6, track.totalM / 120);
    const interval = setInterval(() => {
      setTraveledM(prev => Math.min(track.totalM, prev + stepM));
    }, SIM_TICK_MS);
    return () => clearInterval(interval);
  }, [isNavigating, simulating, track]);

  // Follow the walk: move the marker, announce checkpoints, finish at the end
  useEffect(() => {
    if (!isNavigating) return;
    const position = pointAt(track, traveledM);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserLocation(position);
    mapInstanceRef.current?.panTo(position, { animate: true, duration: 0.4 });

    const reached = selectedRoute.checkpoints.find(
      cp => !reachedRef.current.has(cp.id) && traveledM >= cp.progress * track.totalM
    );
    if (reached) {
      reachedRef.current.add(reached.id);
      soundService.playNavChime();
      if (voiceEnabled) soundService.speakGuidance(reached.instruction);
    }
    if (traveledM >= track.totalM) {
      setIsNavigating(false);
      setSimulating(false);
    }
  }, [traveledM, isNavigating, track, selectedRoute, voiceEnabled]);

  const startNavigation = () => {
    reachedRef.current = new Set();
    setTraveledM(0);
    setIsNavigating(true);
    setSimulating(true);
    soundService.playNavChime();
    if (voiceEnabled) soundService.speakGuidance(`Iniciando recorrido por ${selectedRoute.name}.`);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setSimulating(false);
  };

  const toggleRealGPS = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
      setGpsStatusText(null);
      return;
    }
    if (!navigator.geolocation) {
      setGpsStatusText('Tu navegador no permite usar la ubicación');
      return;
    }
    setGpsStatusText('Buscando señal GPS…');
    const id = navigator.geolocation.watchPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        mapInstanceRef.current?.panTo(coords, { animate: true });
        setGpsStatusText(`GPS activo · precisión ±${Math.round(pos.coords.accuracy || 10)} m`);
      },
      () => {
        const fallback = track.path[0];
        setUserLocation(fallback);
        mapInstanceRef.current?.panTo(fallback, { animate: true });
        setGpsStatusText('Sin permiso de ubicación: te mostramos en el inicio de la ruta');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    setGpsWatchId(id);
  };

  const handleToggleEvent = (eventId: string) => {
    storageService.toggleRegisterEvent(eventId);
    setEventsVersion(v => v + 1);
  };

  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle) return;
    storageService.addLiveAlert({
      type: newAlertType,
      title: newAlertTitle,
      description: newAlertDesc || 'Reporte de visitante en la ruta del humedal',
      coordinates: userLocation ?? track.path[0],
      reportedBy: 'Visitante'
    });
    setLiveAlerts(storageService.getLiveAlerts());
    setShowAlertModal(false);
    setNewAlertTitle('');
    setNewAlertDesc('');
    soundService.playNavChime();
  };

  // Every figure on screen comes from the route's length and time; the track only gives the share walked
  const progress = track.totalM > 0 ? Math.min(1, traveledM / track.totalM) : 0;
  const totalM = selectedRoute.distanceKm * 1000;
  const nextCheckpoint =
    selectedRoute.checkpoints.find(cp => cp.progress > progress) ??
    selectedRoute.checkpoints[selectedRoute.checkpoints.length - 1];
  const toNextM = Math.max(0, (nextCheckpoint.progress - progress) * totalM);
  const remainingMin = Math.max(1, Math.round(selectedRoute.estimatedMinutes * (1 - progress)));
  const progressPct = progress * 100;
  const source = selectedRoute.source;

  return (
    <div className="relative w-full flex flex-col bg-stone-50 min-h-screen text-stone-900 pb-20 lg:pb-0">
      {/* Navigation bar */}
      {isNavigating && (
        <div className="sticky top-0 z-30 bg-stone-950 text-white px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Navigation className="w-6 h-6 rotate-45 shrink-0 text-emerald-400" />
            <div className="min-w-0">
              <p className="text-sm text-stone-300 tabular-nums">En {formatDistance(toNextM)}</p>
              <p className="text-base font-semibold truncate">{nextCheckpoint.instruction}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setVoiceEnabled(v => !v)}
              aria-label={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
              aria-pressed={voiceEnabled}
              className="w-10 h-10 rounded-md bg-stone-800 hover:bg-stone-700 flex items-center justify-center active:scale-95 transition-transform"
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-stone-400" />}
            </button>
            <button
              type="button"
              onClick={() => setSimulating(s => !s)}
              aria-label={simulating ? 'Pausar recorrido' : 'Reanudar recorrido'}
              className="w-10 h-10 rounded-md bg-stone-800 hover:bg-stone-700 flex items-center justify-center active:scale-95 transition-transform"
            >
              {simulating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={stopNavigation}
              className="h-10 px-4 rounded-md bg-white text-stone-950 text-sm font-semibold hover:bg-stone-200 active:scale-95 transition-transform"
            >
              Salir
            </button>
          </div>
        </div>
      )}

      <div className="lg:flex lg:items-start">
        {/* Map */}
        <div
          className={`map-muted relative w-full h-[52vh] sm:h-[58vh] lg:flex-1 lg:sticky bg-stone-200 overflow-hidden ${
            isNavigating ? 'lg:top-16 lg:h-[calc(100vh-4rem)]' : 'lg:top-0 lg:h-screen'
          }`}
        >
          <div ref={mapContainerRef} className="w-full h-full z-10" aria-label="Mapa de senderos del Humedal Angachilla" />

          <div className="absolute top-3 left-3 z-20">
            <WetlandWeatherWidget />
          </div>

          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
            <button
              id="gps-toggle-btn"
              type="button"
              onClick={toggleRealGPS}
              aria-pressed={gpsWatchId !== null}
              aria-label={gpsWatchId !== null ? 'GPS activo' : 'Mi ubicación'}
              className={`h-10 min-w-10 justify-center px-2.5 sm:px-3 rounded-md text-sm font-semibold flex items-center gap-2 shadow-sm active:scale-95 transition-transform ${
                gpsWatchId !== null ? 'bg-blue-700 text-white' : 'bg-white text-stone-900 hover:bg-stone-100'
              }`}
            >
              <LocateFixed className={`w-4 h-4 ${gpsWatchId !== null ? 'text-white' : 'text-blue-700'}`} />
              <span className="hidden sm:inline">{gpsWatchId !== null ? 'GPS activo' : 'Mi ubicación'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAlertModal(true)}
              aria-label="Reportar en la ruta"
              className="h-10 min-w-10 justify-center px-2.5 sm:px-3 rounded-md bg-white text-stone-900 hover:bg-stone-100 text-sm font-semibold flex items-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Reportar</span>
            </button>
          </div>

          {gpsStatusText && (
            <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-5rem)] bg-stone-950 text-white text-sm px-3 py-2 rounded-md shadow-sm" role="status">
              {gpsStatusText}
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-8 space-y-8 lg:max-w-none lg:mx-0 lg:w-[26rem] xl:w-[30rem] lg:shrink-0 lg:px-6 lg:pt-8 lg:border-l lg:border-stone-200 lg:min-h-screen">
          <section aria-labelledby="senderos-titulo">
            <h1 id="senderos-titulo" className="text-2xl font-semibold tracking-tight">Senderos</h1>
            <p className="mt-1 text-sm text-stone-600">
              {HUMEDAL_ROUTES.length} rutas con trazado GPS real en el Humedal Angachilla. Toca una ruta en la lista o en el mapa.
            </p>

            <ul className="mt-4 bg-white border border-stone-200 rounded-lg divide-y divide-stone-200 overflow-hidden">
              {HUMEDAL_ROUTES.map(route => {
                const active = route.id === selectedRoute.id;
                return (
                  <li key={route.id}>
                    <button
                      type="button"
                      onClick={() => selectRoute(route.id)}
                      onPointerEnter={() => prefetchRouteTrack(route)}
                      onFocus={() => prefetchRouteTrack(route)}
                      aria-pressed={active}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                        active ? 'bg-stone-100' : 'hover:bg-stone-50'
                      }`}
                    >
                      <RouteShape route={route} active={active} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold text-stone-950">{route.name}</span>
                        <span className="block text-sm text-stone-600 tabular-nums">
                          {formatDistance(route.distanceKm * 1000)} · {route.estimatedMinutes} min ·{' '}
                          {route.isLoop ? 'circuito' : 'ida'}
                        </span>
                      </span>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${active ? 'text-stone-900' : 'text-stone-400'}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Selected route */}
          <section aria-labelledby="ruta-titulo">
            <h2 id="ruta-titulo" className="text-xl font-semibold tracking-tight">{selectedRoute.name}</h2>
            <p className="mt-2 text-base text-stone-800 leading-relaxed">{selectedRoute.description}</p>

            <dl className="mt-4 grid grid-cols-3 gap-px bg-stone-200 border border-stone-200 rounded-lg overflow-hidden">
              <div className="bg-white px-3 py-2">
                <dt className="text-sm text-stone-600">Distancia</dt>
                <dd className="text-lg font-semibold tabular-nums">{formatDistance(totalM)}</dd>
              </div>
              <div className="bg-white px-3 py-2">
                <dt className="text-sm text-stone-600">Tiempo</dt>
                <dd className="text-lg font-semibold tabular-nums">{selectedRoute.estimatedMinutes} min</dd>
              </div>
              <div className="bg-white px-3 py-2">
                <dt className="text-sm text-stone-600">Dificultad</dt>
                <dd className="text-lg font-semibold">{selectedRoute.difficulty}</dd>
              </div>
            </dl>

            {isNavigating ? (
              <div className="mt-4">
                <div className="flex items-baseline justify-between text-sm tabular-nums">
                  <span className="text-stone-900 font-semibold">
                    {formatDistance(progress * totalM)} de {formatDistance(totalM)}
                  </span>
                  <span className="text-stone-600">Quedan unos {remainingMin} min</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-stone-200 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: selectedRoute.color }} />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={startNavigation}
                className="mt-4 w-full h-11 rounded-md bg-stone-950 hover:bg-stone-800 text-white text-base font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Navigation className="w-4 h-4 rotate-45" />
                Iniciar recorrido
              </button>
            )}

            <div className="mt-3 text-sm text-stone-600" role="status">
              {loadState === 'loading' && 'Cargando el trazado detallado…'}
              {loadState === 'error' && (
                <>
                  No se pudo cargar el trazado detallado; se muestra la versión simplificada.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setDetailError(null);
                      setRetry(r => r + 1);
                    }}
                    className="font-semibold text-stone-900 underline underline-offset-2"
                  >
                    Reintentar
                  </button>
                </>
              )}
              {loadState === 'ready' && source?.author && (
                <>
                  Trazado GPS de{' '}
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-stone-900">
                      {source.author} en Wikiloc
                    </a>
                  ) : (
                    source.author
                  )}
                  {recordedDate(source.recordedAt) && `, ${recordedDate(source.recordedAt)}`}
                </>
              )}
            </div>

            <h3 className="mt-6 text-base font-semibold">Puntos del recorrido</h3>
            <ol className="mt-2 bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
              {selectedRoute.checkpoints.map((cp, idx) => {
                const atM = cp.progress * totalM;
                const passed = isNavigating && progress >= cp.progress;
                return (
                  <li key={cp.id} className="flex items-start gap-3 px-3 py-3">
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold ${
                        passed ? 'bg-stone-300 text-stone-700' : 'bg-stone-900 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-base font-semibold text-stone-950">{cp.name}</span>
                        <span className="text-sm text-stone-600 tabular-nums shrink-0">{formatDistance(atM)}</span>
                      </div>
                      {cp.alertMessage && <p className="mt-0.5 text-sm text-stone-700">{cp.alertMessage}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Events on this route */}
          <section aria-labelledby="eventos-titulo">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="eventos-titulo" className="text-base font-semibold">Actividades en esta ruta</h2>
              {onGoToEvents && (
                <button
                  type="button"
                  onClick={onGoToEvents}
                  className="text-sm font-semibold text-stone-900 hover:underline underline-offset-2 flex items-center gap-1"
                >
                  Ver todas
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {routeEvents.length > 0 ? (
              <ul className="mt-2 bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                {routeEvents.slice(0, 4).map(evt => {
                  const isFull = evt.registeredCount >= evt.capacity;
                  return (
                    <li key={evt.id} className="px-3 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-stone-950">{evt.title}</p>
                        <p className="text-sm text-stone-600">
                          {formatEventDateShort(evt.date)} · {evt.time} · {evt.locationName}
                        </p>
                        <p className="text-sm text-stone-600 tabular-nums">
                          {evt.registeredCount} de {evt.capacity} inscritos
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleEvent(evt.id)}
                        disabled={isFull && !evt.isRegistered}
                        className={`shrink-0 h-9 px-3 rounded-md text-sm font-semibold transition-colors ${
                          evt.isRegistered
                            ? 'bg-stone-200 text-stone-900 hover:bg-stone-300'
                            : isFull
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-stone-950 text-white hover:bg-stone-800'
                        }`}
                      >
                        {evt.isRegistered ? 'Inscrito' : isFull ? 'Sin cupos' : 'Inscribirme'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 px-3 py-3 rounded-lg border border-dashed border-stone-300 text-sm text-stone-600">
                No hay actividades programadas en esta ruta.
              </p>
            )}
          </section>

          {/* Point of interest tapped on the map */}
          {selectedPOI && (
            <section aria-labelledby="poi-titulo" className="bg-white border border-stone-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 id="poi-titulo" className="text-base font-semibold">{selectedPOI.name}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedPOI(null)}
                  aria-label="Cerrar punto de interés"
                  className="w-8 h-8 -mt-1 -mr-1 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 text-sm text-stone-700 leading-relaxed">{selectedPOI.description}</p>
              {selectedPOI.qrCode && onOpenQRWithCode && (
                <button
                  type="button"
                  onClick={() => onOpenQRWithCode(selectedPOI.qrCode)}
                  className="mt-3 h-9 px-3 rounded-md bg-stone-200 hover:bg-stone-300 text-sm font-semibold text-stone-900"
                >
                  Escanear tótem {selectedPOI.qrCode}
                </button>
              )}
            </section>
          )}

          {source?.url && (
            <p className="text-sm text-stone-600">
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-stone-900 underline underline-offset-2">
                Ver esta ruta en Wikiloc
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Report alert dialog */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/70" onClick={() => setShowAlertModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="alerta-titulo"
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-lg sm:rounded-lg p-5 w-full sm:max-w-sm shadow-xl text-stone-900"
          >
            <div className="flex items-center justify-between">
              <h2 id="alerta-titulo" className="text-lg font-semibold">Reportar en la ruta</h2>
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-stone-600">Se publica en tu ubicación actual o en el inicio de la ruta.</p>

            <form onSubmit={handleSubmitAlert} className="mt-4 space-y-4">
              <fieldset>
                <legend className="text-sm font-semibold text-stone-800 mb-2">Tipo</legend>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setNewAlertType(t.id)}
                      aria-pressed={newAlertType === t.id}
                      className={`min-h-11 px-3 py-2 rounded-md text-sm font-semibold text-left border transition-colors ${
                        newAlertType === t.id
                          ? 'bg-stone-950 text-white border-stone-950'
                          : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="block text-sm font-semibold text-stone-800 mb-1">Título breve</span>
                <input
                  type="text"
                  required
                  placeholder="Ej: Familia de cisnes cerca de la pasarela"
                  value={newAlertTitle}
                  onChange={e => setNewAlertTitle(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-white border border-stone-300 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-semibold text-stone-800 mb-1">Detalles</span>
                <textarea
                  rows={2}
                  placeholder="Ej: Mantener distancia."
                  value={newAlertDesc}
                  onChange={e => setNewAlertDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white border border-stone-300 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="h-10 px-4 rounded-md text-sm font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button type="submit" className="h-10 px-4 rounded-md text-sm font-semibold bg-stone-950 text-white hover:bg-stone-800">
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
