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
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Layers,
  QrCode,
  ShieldCheck,
  Sparkles,
  Camera,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  Heart,
  Route as RouteIcon,
  CheckCircle2,
} from 'lucide-react';
import { HumedalRoute, Notice, PointOfInterest, Species, WazeLiveAlert, WetlandEvent } from '../types';
import { HUMEDAL_ROUTES, resolveRouteId } from '../data/mockData';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import { resolveMediaUrl } from '../lib/api';
import {
  RouteTrack,
  buildTrack,
  formatDistance,
  loadRouteTrack,
  pointAt,
  prefetchRouteTrack,
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
const IDLE_ROUTE = '#d6d3d1';
const SIM_TICK_MS = 500;

// Perímetro de la Reserva Comunitaria Humedal Angachilla
const RESERVE_BOUNDS: [[number, number], [number, number]] = [
  [-39.8635, -73.2465],
  [-39.8505, -73.2315],
];

function isInsideReserve([lat, lng]: [number, number]): boolean {
  return (
    lat >= RESERVE_BOUNDS[0][0] &&
    lat <= RESERVE_BOUNDS[1][0] &&
    lng >= RESERVE_BOUNDS[0][1] &&
    lng <= RESERVE_BOUNDS[1][1]
  );
}

const ALERT_TYPES: { id: WazeLiveAlert['type']; label: string }[] = [
  { id: 'fauna', label: 'Fauna en el sendero' },
  { id: 'resbaladizo', label: 'Pasarela resbalosa' },
  { id: 'corte', label: 'Sendero cortado' },
  { id: 'silencio', label: 'Zona de silencio' },
];

const ALERT_COLORS: Record<WazeLiveAlert['type'], string> = {
  fauna: 'bg-emerald-700',
  resbaladizo: 'bg-amber-600',
  corte: 'bg-rose-700',
  silencio: 'bg-stone-700',
};

const findRoute = (id: string | null | undefined) =>
  (id && HUMEDAL_ROUTES.find(r => r.id === resolveRouteId(id))) || null;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const recordedDate = (iso: string | null | undefined) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

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
  const color = active ? route.color : '#57534e';
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
  onGoToEvents,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<'satellite' | 'osm'>('satellite');
  const [stations, setStations] = useState<PointOfInterest[]>(() =>
    storageService.getPointsOfInterest()
  );
  const [allSpecies, setAllSpecies] = useState<Species[]>(() =>
    storageService.getSpecies()
  );

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    () => findRoute(targetRouteId)?.id ?? HUMEDAL_ROUTES[0].id
  );
  const selectedRoute = findRoute(selectedRouteId) ?? HUMEDAL_ROUTES[0];

  const [lastTargetRouteId, setLastTargetRouteId] = useState(targetRouteId);
  if (targetRouteId !== lastTargetRouteId) {
    setLastTargetRouteId(targetRouteId);
    const found = findRoute(targetRouteId);
    if (found) setSelectedRouteId(found.id);
  }

  const [sheetState, setSheetState] = useState<'collapsed' | 'expanded'>('collapsed');
  const [activeStationPhotoIdx, setActiveStationPhotoIdx] = useState(0);
  const [isPausedStationPhotos, setIsPausedStationPhotos] = useState(false);
  const [isPausedStationSpecies, setIsPausedStationSpecies] = useState(false);
  const stationSpeciesStripRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number>(0);
  const sheetContentRef = useRef<HTMLDivElement>(null);

  // Sync stations, species and route alerts from backend
  useEffect(() => {
    const onSync = () => {
      const updatedStations = storageService.getPointsOfInterest();
      setStations([...updatedStations]);
      setAllSpecies([...storageService.getSpecies()]);
      setLiveAlerts([...storageService.getLiveAlerts()]);
      setSelectedPOI(prev => {
        if (!prev) return null;
        return updatedStations.find(s => s.id === prev.id || s.code === prev.code) ?? prev;
      });
    };
    window.addEventListener('angachilla:sync', onSync);
    onSync();
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

  const [detail, setDetail] = useState<{ routeId: string; track: RouteTrack } | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRoute.id, eventsVersion]
  );

  const routePosts = useMemo(
    () => storageService.getPostsByRoute(selectedRoute.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRoute.id, eventsVersion]
  );

  // Selected Station for the Bottom Sheet + Selected Species inside the Station Sheet
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [selectedStationSpecies, setSelectedStationSpecies] = useState<Species | null>(null);
  const [zoomedStationPhoto, setZoomedStationPhoto] = useState<string | null>(null);

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
    if (id === selectedRouteId && !selectedPOI) {
      setSheetState('expanded');
      return;
    }
    setSelectedRouteId(id);
    setSelectedPOI(null);
    setSheetState('expanded');
    setIsNavigating(false);
    setSimulating(false);
    setTraveledM(0);
    soundService.playNavChime();
  };

  useEffect(() => {
    selectRouteRef.current = selectRoute;
  });

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
  }, [selectedRoute]);

  // Initialize Leaflet Map bounded to Reserva Comunitaria Humedal Angachilla
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const renderer = L.canvas({ tolerance: 10 });
    rendererRef.current = renderer;
    const allBounds = L.latLngBounds([]);
    HUMEDAL_ROUTES.forEach(r => r.bounds && allBounds.extend(r.bounds));

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      preferCanvas: true,
      renderer,
      maxBounds: L.latLngBounds(RESERVE_BOUNDS).pad(0.35),
      minZoom: 14,
      maxZoom: 19,
    });
    map.fitBounds(allBounds, { padding: [36, 36] });
    map.attributionControl.setPrefix(false);
    L.control.zoom({ position: 'topright' }).addTo(map);

    const satLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Imagery © Esri · Reserva Comunitaria Humedal Angachilla',
      }
    ).addTo(map);
    tileLayerRef.current = satLayer;

    HUMEDAL_ROUTES.forEach(route => {
      const line = L.polyline(route.path, {
        renderer,
        color: IDLE_ROUTE,
        weight: 4,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      })
        .bindTooltip(route.name, { sticky: true, direction: 'top', className: 'route-tooltip' })
        .on('click', () => {
          selectRouteRef.current(route.id);
        })
        .on('mouseover', () => prefetchRouteTrack(route))
        .addTo(map);
      overviewLinesRef.current.set(route.id, line);
    });

    checkpointsLayerRef.current = L.layerGroup().addTo(map);
    poisLayerRef.current = L.layerGroup().addTo(map);
    alertsLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const idleId = idle(() => HUMEDAL_ROUTES.forEach(prefetchRouteTrack));

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
      tileLayerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch between Satellite and OSM Street Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    tileLayerRef.current?.remove();
    if (mapStyle === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Imagery © Esri · Reserva Comunitaria Humedal Angachilla',
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);
    }
  }, [mapStyle]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    overviewLinesRef.current.forEach((line, id) => {
      const active = id === selectedRoute.id;
      line.setStyle({ opacity: active ? 0 : 0.8 });
    });
    if (selectedRoute.bounds) {
      map.flyToBounds(selectedRoute.bounds, { padding: [48, 48], duration: 0.6 });
    }
  }, [selectedRoute]);

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
        interactive: false,
      }).addTo(map);
    }

    checkpointsLayer.clearLayers();
  }, [track, selectedRoute]);

  // Render the 9 Official Stations on the Map
  useEffect(() => {
    const poisLayer = poisLayerRef.current;
    if (!poisLayer) return;
    poisLayer.clearLayers();
    stations.forEach((poi, index) => {
      const badgeLabel = poi.code || `E${index + 1}`;
      const isSelected = selectedPOI?.id === poi.id;
      const icon = L.divIcon({
        className: 'custom-poi-marker',
        html: `<div class="w-9 h-9 rounded-full ${
          isSelected
            ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-300/60 scale-110'
            : 'bg-emerald-900 text-white hover:bg-emerald-700'
        } border-2 border-white shadow-lg flex items-center justify-center text-xs font-black transition-transform cursor-pointer">${escapeHtml(
          badgeLabel
        )}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker(poi.coordinates, { icon, title: poi.name })
        .bindTooltip(poi.name, { direction: 'top', offset: [0, -16] })
        .on('click', () => {
          setSelectedPOI(poi);
          setActiveStationPhotoIdx(0);
          setSheetState('expanded');
          if (poi.soundKey) soundService.playBySoundKey(poi.soundKey);
          mapInstanceRef.current?.flyTo(poi.coordinates, 17, { duration: 0.6 });
        })
        .addTo(poisLayer);
    });
  }, [stations, selectedPOI]);

  // Community alerts
  useEffect(() => {
    const alertsLayer = alertsLayerRef.current;
    if (!alertsLayer) return;
    alertsLayer.clearLayers();
    liveAlerts.forEach(alert => {
      const icon = L.divIcon({
        className: 'custom-alert-marker',
        html: `<div class="w-6 h-6 rounded-full ${ALERT_COLORS[alert.type] ?? 'bg-amber-600'} text-white border-2 border-white flex items-center justify-center text-xs font-bold shadow">!</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker(alert.coordinates, { icon, title: alert.title })
        .bindPopup(
          `<div class="text-sm max-w-[220px]"><strong class="block text-stone-900">${escapeHtml(alert.title)}</strong><span class="block text-stone-700 mt-1">${escapeHtml(alert.description)}</span><span class="block text-stone-500 text-xs mt-1">${escapeHtml(alert.reportedBy)} · ${escapeHtml(alert.timeAgo)}</span></div>`
        )
        .addTo(alertsLayer);
    });
  }, [liveAlerts]);

  // Visitor position
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
        html: `<div class="w-8 h-8 rounded-full bg-blue-600/25 flex items-center justify-center"><div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      userMarkerRef.current = L.marker(userLocation, { icon, zIndexOffset: 1000, interactive: false }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (targetCoordinates && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(targetCoordinates, 17, { duration: 1.0 });
      const matchingStation = stations.find(
        s =>
          Math.abs(s.coordinates[0] - targetCoordinates[0]) < 0.0005 &&
          Math.abs(s.coordinates[1] - targetCoordinates[1]) < 0.0005
      );
      if (matchingStation) {
        setSelectedPOI(matchingStation);
        setActiveStationPhotoIdx(0);
        setSheetState('expanded');
      }
    }
  }, [targetCoordinates, stations]);

  // Simulated walk along the real GPX track
  useEffect(() => {
    if (!isNavigating || !simulating) return;
    const stepM = Math.max(6, track.totalM / 120);
    const interval = setInterval(() => {
      setTraveledM(prev => Math.min(track.totalM, prev + stepM));
    }, SIM_TICK_MS);
    return () => clearInterval(interval);
  }, [isNavigating, simulating, track]);

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
    setSheetState('collapsed');
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
      setGpsStatusText('Tu dispositivo no permite usar la ubicación');
      return;
    }
    setGpsStatusText('Localizando respecto a la Reserva Comunitaria…');
    const id = navigator.geolocation.watchPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (isInsideReserve(coords)) {
          setUserLocation(coords);
          mapInstanceRef.current?.panTo(coords, { animate: true });
          setGpsStatusText(
            `Dentro de la Reserva Comunitaria · GPS ±${Math.round(pos.coords.accuracy || 10)} m`
          );
        } else {
          setUserLocation(track.path[0]);
          setGpsStatusText(
            'Ubicación fuera del perímetro del humedal · Mostrando inicio del sendero'
          );
        }
      },
      () => {
        const fallback = track.path[0];
        setUserLocation(fallback);
        mapInstanceRef.current?.panTo(fallback, { animate: true });
        setGpsStatusText('Ubicación en el acceso principal de la Reserva');
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
      reportedBy: 'Visitante',
    });
    setLiveAlerts(storageService.getLiveAlerts());
    setShowAlertModal(false);
    setNewAlertTitle('');
    setNewAlertDesc('');
    soundService.playNavChime();
  };

  // Resolve full species list for the currently selected station
  const stationSpeciesList = useMemo(() => {
    if (!selectedPOI) return [];
    if (selectedPOI.species && selectedPOI.species.length > 0) {
      return selectedPOI.species;
    }
    const code = selectedPOI.code || selectedPOI.qrCode;
    if (code) {
      const matched = allSpecies.filter(sp =>
        sp.stations?.some(s => (typeof s === 'string' ? s : s.code) === code)
      );
      if (matched.length > 0) return matched;
    }
    return allSpecies.slice(0, 8);
  }, [selectedPOI, allSpecies]);

  // Resolve trail photographs list for the currently selected station (using official station photos + gallery)
  const stationPhotosList = useMemo(() => {
    if (!selectedPOI) return [];
    const list: { id: string; url: string; title: string }[] = [];

    if (selectedPOI.gallery && selectedPOI.gallery.length > 0) {
      selectedPOI.gallery.forEach((url, i) => {
        list.push({
          id: `${selectedPOI.id}-gal-${i}`,
          url,
          title: `Fotografía ${i + 1} · ${selectedPOI.name}`,
        });
      });
    }

    if (selectedPOI.photos && selectedPOI.photos.length > 0) {
      selectedPOI.photos.forEach(p => {
        if (!list.some(item => item.url === p.url)) list.push(p);
      });
    }

    if (list.length === 0 && selectedPOI.image) {
      list.push({ id: selectedPOI.id, url: selectedPOI.image, title: selectedPOI.name });
    }
    return list;
  }, [selectedPOI]);

  // 1. Auto-advancing slow carousel for station trail photos
  useEffect(() => {
    if (!selectedPOI || stationPhotosList.length <= 1 || isPausedStationPhotos) return;
    const timer = setInterval(() => {
      setActiveStationPhotoIdx(prev => (prev + 1) % stationPhotosList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [selectedPOI, stationPhotosList.length, isPausedStationPhotos]);

  // 2. Slow continuous glide for station species in the bottom sheet
  useEffect(() => {
    const el = stationSpeciesStripRef.current;
    if (!el || stationSpeciesList.length <= 2) return;
    let animId: number;
    let lastTime: number | null = null;
    const speed = 20; // 20 px/sec: gentle, slow, legible
    const step = (t: number) => {
      if (lastTime === null) lastTime = t;
      const delta = (t - lastTime) / 1000;
      lastTime = t;
      if (!isPausedStationSpecies && el) {
        el.scrollLeft += speed * delta;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [stationSpeciesList.length, isPausedStationSpecies]);

  // Touch Swipe Gesture Handlers (Swipe Up / Down curtain)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    // Swiped up: expand sheet
    if (deltaY < -35 && sheetState === 'collapsed') {
      setSheetState('expanded');
    }
    // Swiped down: collapse sheet
    else if (deltaY > 45 && sheetState === 'expanded') {
      if (sheetContentRef.current && sheetContentRef.current.scrollTop <= 5) {
        setSheetState('collapsed');
      }
    }
  };

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
    <div className="relative w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden bg-stone-900 select-none">
      {/* Turn-by-turn Navigation bar when actively walking */}
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-stone-950/95 backdrop-blur-md text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg border-b border-stone-800">
          <div className="flex items-center gap-3 min-w-0">
            <Navigation className="w-5 h-5 rotate-45 shrink-0 text-emerald-400 animate-pulse" />
            <div className="min-w-0">
              <p className="text-xs text-stone-300 tabular-nums font-mono">En {formatDistance(toNextM)}</p>
              <p className="text-xs sm:text-sm font-extrabold truncate">{nextCheckpoint.instruction}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setVoiceEnabled(v => !v)}
              aria-label={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>
            <button
              type="button"
              onClick={() => setSimulating(s => !s)}
              aria-label={simulating ? 'Pausar recorrido' : 'Reanudar recorrido'}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center"
            >
              {simulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={stopNavigation}
              className="h-8 px-3 rounded-xl bg-white text-stone-950 text-xs font-bold hover:bg-stone-200"
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {/* 100% FULLSCREEN LEAFLET MAP VIEWPORT */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-10"
        aria-label="Mapa interactivo a pantalla completa de las 9 estaciones de la Reserva Comunitaria Humedal Angachilla"
      />

      {/* Floating Weather Widget (Top Left) */}
      <div className={`absolute left-3 z-20 transition-all ${isNavigating ? 'top-14' : 'top-3'}`}>
        <WetlandWeatherWidget />
      </div>

      {/* Floating Route Quick-Switch Tabs (Top Center) */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl transition-all ${
          isNavigating ? 'top-14' : 'top-3'
        }`}
      >
        {HUMEDAL_ROUTES.map(route => {
          const isActive = route.id === selectedRoute.id;
          return (
            <button
              key={route.id}
              type="button"
              onClick={() => selectRoute(route.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <RouteIcon className="w-3.5 h-3.5" />
              <span>{route.name}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Map Controls (Top Right): Satellite/OSM + Real GPS + Report Alert */}
      <div className={`absolute right-3 z-20 flex flex-col items-end gap-2 transition-all ${isNavigating ? 'top-14' : 'top-3'}`}>
        <button
          type="button"
          onClick={() => setMapStyle(prev => (prev === 'satellite' ? 'osm' : 'satellite'))}
          className="h-9 px-3 rounded-xl bg-white/95 backdrop-blur-md text-stone-900 hover:bg-white text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
          title="Cambiar vista de mapa"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-800" />
          <span className="hidden sm:inline">{mapStyle === 'satellite' ? 'Satelital' : 'Callejero'}</span>
        </button>

        <button
          id="gps-toggle-btn"
          type="button"
          onClick={toggleRealGPS}
          aria-pressed={gpsWatchId !== null}
          className={`h-9 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform ${
            gpsWatchId !== null ? 'bg-blue-700 text-white' : 'bg-white/95 text-stone-900 hover:bg-white'
          }`}
        >
          <LocateFixed className={`w-3.5 h-3.5 ${gpsWatchId !== null ? 'text-white' : 'text-blue-700'}`} />
          <span className="hidden sm:inline">{gpsWatchId !== null ? 'GPS Activo' : 'Mi Ubicación'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAlertModal(true)}
          className="h-9 px-3 rounded-xl bg-white/95 text-stone-900 hover:bg-white text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Reportar</span>
        </button>
      </div>

      {/* GPS Status Toast */}
      {gpsStatusText && (
        <div
          className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-xs z-20 bg-stone-950/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl shadow-md border border-white/10"
          role="status"
        >
          {gpsStatusText}
        </div>
      )}

      {/* Quick Station Chips above the curtain handle (only when collapsed) */}
      {sheetState === 'collapsed' && (
        <div className="absolute bottom-16 sm:bottom-18 left-3 right-3 z-30 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {stations.map((st, idx) => {
            const code = st.code || `E${idx + 1}`;
            const isSelected = selectedPOI?.id === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedPOI(st);
                  setActiveStationPhotoIdx(0);
                  setSheetState('expanded');
                  mapInstanceRef.current?.flyTo(st.coordinates, 17, { duration: 0.6 });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap shadow-md transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-stone-950 scale-105 ring-2 ring-white'
                    : 'bg-emerald-950/90 text-white hover:bg-emerald-900 backdrop-blur-md border border-white/15'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">
                  {code}
                </span>
                <span>{st.name.split(':')[1]?.trim() || st.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* --- SWIPE-UP / SWIPE-DOWN BOTTOM SHEET (CORTINA DESLIZANTE DE OPCIONES, SENDEROS, TÓTEMS Y EVENTOS) --- */}
      <div
        id="map-options-bottom-sheet"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed left-0 right-0 lg:left-20 bottom-16 lg:bottom-0 z-40 bg-white/98 text-stone-900 backdrop-blur-2xl rounded-t-[2rem] shadow-2xl border-t border-stone-200/90 transition-all duration-300 ease-out flex flex-col ${
          sheetState === 'expanded'
            ? 'h-[80vh] sm:h-[76vh] translate-y-0'
            : 'h-14 sm:h-16 translate-y-0 cursor-pointer hover:bg-white'
        }`}
      >
        {/* Tactile Drag Handle Bar & Peek Banner */}
        <div
          onClick={() => setSheetState(prev => (prev === 'expanded' ? 'collapsed' : 'expanded'))}
          className="pt-2 pb-2 px-4 sm:px-6 flex flex-col items-center justify-center shrink-0 border-b border-stone-100/80 cursor-pointer select-none group"
          title={sheetState === 'expanded' ? 'Desliza hacia abajo para ocultar' : 'Desliza hacia arriba para ver opciones'}
        >
          {/* Visual pill handle */}
          <div className="w-12 h-1.5 bg-stone-300 group-hover:bg-emerald-700 rounded-full transition-colors mb-1.5" />

          {sheetState === 'collapsed' ? (
            <div className="w-full flex items-center justify-between text-xs font-extrabold text-stone-800">
              <span className="flex items-center gap-2">
                <ChevronUp className="w-4 h-4 text-emerald-700 animate-bounce" />
                <span className="text-emerald-950 font-black">Desliza hacia arriba</span>
                <span className="hidden sm:inline text-stone-500 font-medium">· Opciones, senderos, tótems y eventos</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900">
                {selectedPOI ? selectedPOI.name : selectedRoute.name}
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-xs font-extrabold text-stone-600">
              <span className="flex items-center gap-1.5 text-stone-800">
                <ChevronDown className="w-4 h-4 text-emerald-700" />
                <span>Desliza hacia abajo o toca aquí para ver mapa completo</span>
              </span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setSheetState('collapsed');
                }}
                className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold"
              >
                Minimizar
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content inside Bottom Sheet */}
        {sheetState === 'expanded' && (
          <div
            ref={sheetContentRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6"
          >
            {/* --- MODE 1: STATION DETAILS WHEN A STATION IS SELECTED --- */}
            {selectedPOI ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Station Top Bar with Back Button */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPOI(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-extrabold text-stone-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Volver a las Rutas y Actividades</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedPOI.soundKey && (
                      <button
                        type="button"
                        onClick={() => soundService.playBySoundKey(selectedPOI.soundKey!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Escuchar sonido</span>
                      </button>
                    )}
                    {selectedPOI.qrCode && onOpenQRWithCode && (
                      <button
                        type="button"
                        onClick={() => onOpenQRWithCode(selectedPOI.qrCode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs font-bold"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Escanear QR</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. CARRUSEL DE FOTOS DEL SENDERO DE LA ESTACIÓN (FOTOS REALES) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>Fotografías de la Estación ({activeStationPhotoIdx + 1}/{stationPhotosList.length})</span>
                    </h3>
                    {stationPhotosList.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStationPhotoIdx(
                              (activeStationPhotoIdx - 1 + stationPhotosList.length) % stationPhotosList.length
                            )
                          }
                          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-800"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStationPhotoIdx(
                              (activeStationPhotoIdx + 1) % stationPhotosList.length
                            )
                          }
                          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-800"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Hero Photo of the Station (Carrusel en movimiento lento) */}
                  <div
                    onClick={() =>
                      setZoomedStationPhoto(resolveMediaUrl(stationPhotosList[activeStationPhotoIdx]?.url || selectedPOI.image))
                    }
                    onMouseEnter={() => setIsPausedStationPhotos(true)}
                    onMouseLeave={() => setIsPausedStationPhotos(false)}
                    onTouchStart={() => setIsPausedStationPhotos(true)}
                    onTouchEnd={() => setIsPausedStationPhotos(false)}
                    className="relative h-52 sm:h-64 rounded-3xl overflow-hidden bg-stone-900 border border-stone-200 cursor-zoom-in group shadow-xs"
                  >
                    <img
                      src={resolveMediaUrl(stationPhotosList[activeStationPhotoIdx]?.url || selectedPOI.image)}
                      alt={selectedPOI.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3.5 right-4">
                      {stationPhotosList.length > 1 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-emerald-300 backdrop-blur-md border border-white/20">
                          {isPausedStationPhotos ? 'Pausado' : 'Carrusel en movimiento'}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3.5 left-4 right-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-stone-950 uppercase tracking-wider">
                          Estación {selectedPOI.code || 'Oficial'}
                        </span>
                        {selectedPOI.qrCode && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white">
                            Tótem {selectedPOI.qrCode}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg sm:text-xl font-black leading-tight">
                        {selectedPOI.name}
                      </h2>
                    </div>
                  </div>

                  {/* Horizontal Thumbnail Strip for Station Photos */}
                  {stationPhotosList.length > 1 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {stationPhotosList.map((ph, idx) => (
                        <button
                          key={ph.id}
                          type="button"
                          onClick={() => setActiveStationPhotoIdx(idx)}
                          className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                            idx === activeStationPhotoIdx
                              ? 'border-emerald-700 scale-105 shadow-xs'
                              : 'border-transparent opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img src={resolveMediaUrl(ph.url)} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Narrative Description */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    Relato Interpretativo de la Estación
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {selectedPOI.description}
                  </p>
                </div>

                {/* 2. CARRUSEL DE AVES, FAUNA Y FLORA DE ESTA ESTACIÓN */}
                {stationSpeciesList.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>Biodiversidad de la Estación ({stationSpeciesList.length} especies)</span>
                      </h4>
                      <span className="text-[11px] text-emerald-800 font-bold">
                        Toca para abrir ficha ›
                      </span>
                    </div>

                    <div
                      ref={stationSpeciesStripRef}
                      onMouseEnter={() => setIsPausedStationSpecies(true)}
                      onMouseLeave={() => setIsPausedStationSpecies(false)}
                      onTouchStart={() => setIsPausedStationSpecies(true)}
                      onTouchEnd={() => setIsPausedStationSpecies(false)}
                      className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none cursor-grab active:cursor-grabbing"
                    >
                      {stationSpeciesList.map(sp => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setSelectedStationSpecies(sp)}
                          className="w-36 sm:w-40 shrink-0 rounded-2xl bg-gradient-to-b from-stone-50 to-emerald-50/40 border border-stone-200 hover:border-emerald-500 p-2.5 text-left transition-all group flex flex-col justify-between shadow-2xs hover:shadow-md"
                        >
                          <div className="w-full h-24 rounded-xl bg-white flex items-center justify-center p-1.5 overflow-hidden border border-stone-100">
                            <img
                              src={resolveMediaUrl(sp.illustrationUrl || sp.image)}
                              alt={sp.commonName}
                              loading="lazy"
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-sm"
                            />
                          </div>
                          <div className="mt-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 block truncate">
                              {sp.group || sp.kingdom || 'Fauna'}
                            </span>
                            <p className="text-xs font-extrabold text-stone-900 truncate mt-0.5">
                              {sp.commonName}
                            </p>
                            <p className="text-[10px] italic text-stone-500 truncate">
                              {sp.scientificName}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Station Care Rules */}
                {selectedPOI.rules && selectedPOI.rules.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      Recomendaciones en este Punto
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-emerald-950">
                      {selectedPOI.rules.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="font-bold text-emerald-700">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              /* --- MODE 2: ROUTE OPTIONS, GPX METRICS, ROUTE EVENTS & POSTS --- */
              <div className="space-y-6">
                {/* Route Selector Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-stone-950 font-display">
                      {selectedRoute.name}
                    </h2>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {selectedRoute.description}
                    </p>
                  </div>

                  {!isNavigating && (
                    <button
                      type="button"
                      onClick={startNavigation}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95 transition-all"
                    >
                      <Navigation className="w-4 h-4 rotate-45" />
                      <span>Iniciar Recorrido Guiado</span>
                    </button>
                  )}
                </div>

                {/* GPX Metric Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <span className="text-[11px] font-bold text-stone-500 block">Distancia</span>
                    <span className="text-base font-black text-stone-900 tabular-nums">
                      {formatDistance(totalM)}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <span className="text-[11px] font-bold text-stone-500 block">Tiempo Est.</span>
                    <span className="text-base font-black text-stone-900 tabular-nums">
                      {selectedRoute.estimatedMinutes} min
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <span className="text-[11px] font-bold text-stone-500 block">Dificultad</span>
                    <span className="text-base font-black text-emerald-800">
                      {selectedRoute.difficulty}
                    </span>
                  </div>
                </div>

                {/* ACTIVIDADES Y EVENTOS PERTENECIENTES A ESTA RUTA (Acta Reunión 3) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span>Actividades en esta Ruta ({routeEvents.length})</span>
                    </h3>
                    {onGoToEvents && (
                      <button
                        type="button"
                        onClick={onGoToEvents}
                        className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                      >
                        Ver Calendario Completo ›
                      </button>
                    )}
                  </div>

                  {routeEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {routeEvents.map(evt => {
                        const isFull = evt.registeredCount >= evt.capacity;
                        return (
                          <div
                            key={evt.id}
                            className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={resolveMediaUrl(evt.image)}
                                alt={evt.title}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-stone-950 leading-snug line-clamp-1">
                                  {evt.title}
                                </h4>
                                <p className="text-[11px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatEventDateShort(evt.date)} · {evt.time}</span>
                                </p>
                                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                  {evt.locationName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-200/70 text-xs">
                              <span className="font-extrabold text-stone-700 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{evt.registeredCount}/{evt.capacity} inscritos</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleEvent(evt.id)}
                                disabled={isFull && !evt.isRegistered}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                                  evt.isRegistered
                                    ? 'bg-stone-200 text-stone-900'
                                    : isFull
                                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                    : 'bg-emerald-800 text-white hover:bg-emerald-700'
                                }`}
                              >
                                {evt.isRegistered ? 'Inscrito' : isFull ? 'Sin cupos' : 'Inscribirme'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-stone-300 text-xs text-stone-500 text-center">
                      No hay actividades programadas en esta ruta para los próximos días.
                    </div>
                  )}
                </div>

                {/* POSTS Y PUBLICACIONES DE LA COMUNIDAD EN ESTA RUTA */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-700" />
                      <span>Publicaciones de la Comunidad en esta Ruta ({routePosts.length})</span>
                    </h3>
                  </div>

                  {routePosts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {routePosts.slice(0, 4).map((post: Notice) => (
                        <div
                          key={post.id}
                          className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3"
                        >
                          <img
                            src={resolveMediaUrl(post.image)}
                            alt={post.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-stone-400 block truncate">
                              {post.author} · {post.date}
                            </span>
                            <h4 className="text-xs font-black text-stone-900 line-clamp-1 mt-0.5">
                              {post.title}
                            </h4>
                            <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">
                              {post.summary}
                            </p>
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                              <Heart className="w-3 h-3 fill-rose-600" />
                              <span>{post.likes ?? 0}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-stone-300 text-xs text-stone-500 text-center">
                      Aún no hay publicaciones comunitarias para esta ruta.
                    </div>
                  )}
                </div>

                {/* LISTA INTERACTIVA DE LAS 9 ESTACIONES DE LA RESERVA */}
                <div className="space-y-2.5">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-500">
                    Estaciones Interpretativas en el Recorrido (Toca para ver carrusel de fotos y aves)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {stations.map((st, idx) => {
                      const code = st.code || `E${idx + 1}`;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedPOI(st);
                            setActiveStationPhotoIdx(0);
                            mapInstanceRef.current?.flyTo(st.coordinates, 17, { duration: 0.6 });
                          }}
                          className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-300 text-left flex items-center gap-3 transition-colors"
                        >
                          <span className="w-8 h-8 rounded-xl bg-emerald-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                            {code}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-stone-900 truncate">{st.name}</p>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">
                              {st.subtitle || st.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- QUICK SPECIES FICHA MODAL WHEN TAPPED FROM STATION CAROUSEL --- */}
      {selectedStationSpecies && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedStationSpecies(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-56 bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 flex items-center justify-center p-4">
              <img
                src={resolveMediaUrl(selectedStationSpecies.illustrationUrl || selectedStationSpecies.image)}
                alt={selectedStationSpecies.commonName}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setSelectedStationSpecies(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white text-stone-900 flex items-center justify-center shadow"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900">
                  {selectedStationSpecies.kingdom || 'Fauna'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                  {selectedStationSpecies.conservationStatus}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black text-stone-950">{selectedStationSpecies.commonName}</h3>
                <p className="text-xs italic text-stone-600">{selectedStationSpecies.scientificName}</p>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {selectedStationSpecies.description}
              </p>
              {selectedStationSpecies.habitat && (
                <p className="text-xs text-emerald-950 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <strong>Hábitat:</strong> {selectedStationSpecies.habitat}
                </p>
              )}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStationSpecies(null)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
                >
                  Volver a la Estación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ZOOMED STATION PHOTO LIGHTBOX --- */}
      {zoomedStationPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90"
          onClick={() => setZoomedStationPhoto(null)}
        >
          <img
            src={zoomedStationPhoto}
            alt="Fotografía de estación"
            className="max-w-full max-h-[88vh] rounded-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => setZoomedStationPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-stone-900 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Report alert dialog */}
      {showAlertModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/70"
          onClick={() => setShowAlertModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="alerta-titulo"
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-xl text-stone-900"
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
            <p className="mt-1 text-sm text-stone-600">
              Se guarda en tu ubicación actual dentro del sendero.
            </p>

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
                <button
                  type="submit"
                  className="h-10 px-4 rounded-md text-sm font-semibold bg-stone-950 text-white hover:bg-stone-800"
                >
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
