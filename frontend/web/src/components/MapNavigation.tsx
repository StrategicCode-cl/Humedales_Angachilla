'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  MapPin,
  Clock,
  Layers,
  LocateFixed,
  ChevronRight,
  Radio,
  Calendar,
  CalendarCheck,
  CheckCircle,
  ExternalLink,
  Users,
  Route as RouteIcon,
  Sparkles
} from 'lucide-react';
import {
  HumedalRoute,
  PointOfInterest,
  WazeLiveAlert,
  RouteCheckpoint,
  WetlandEvent
} from '../types';
import {
  HUMEDAL_ROUTES,
  POINTS_OF_INTEREST,
  WAZE_LIVE_ALERTS
} from '../data/mockData';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import { WetlandWeatherWidget } from './WetlandWeatherWidget';

interface MapNavigationProps {
  onOpenQRWithCode?: (code: string) => void;
  onOpenNotice?: (id: string) => void;
  targetCoordinates?: [number, number] | null;
  targetRouteId?: string | null;
  onGoToEvents?: () => void;
}

export const MapNavigation: React.FC<MapNavigationProps> = ({
  onOpenQRWithCode,
  targetCoordinates,
  targetRouteId,
  onGoToEvents
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Active route state
  const [selectedRoute, setSelectedRoute] = useState<HumedalRoute>(() => {
    if (targetRouteId) {
      const found = HUMEDAL_ROUTES.find(r => r.id === targetRouteId);
      if (found) return found;
    }
    return HUMEDAL_ROUTES[0];
  });

  // Display mode: 'activa' (single route) or 'posibles' (all 3 routes rendered at once)
  const [routeViewMode, setRouteViewMode] = useState<'activa' | 'posibles'>('activa');

  // Route-filtered events
  const [routeEvents, setRouteEvents] = useState<WetlandEvent[]>([]);

  // Selected POI for detailed card
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  // Waze Turn-by-Turn Navigation States
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number]>(selectedRoute.path[0]);
  const [simulating, setSimulating] = useState(false);
  const [walkingSpeed, setWalkingSpeed] = useState(4.2); // km/h
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Real GPS watch tracking
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState<string | null>(null);

  // Live Community Alerts
  const [liveAlerts, setLiveAlerts] = useState<WazeLiveAlert[]>(storageService.getLiveAlerts());
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlertType, setNewAlertType] = useState<WazeLiveAlert['type']>('fauna');
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertDesc, setNewAlertDesc] = useState('');

  // Layer Refs
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const allRoutesLayerRef = useRef<L.LayerGroup | null>(null);
  const checkpointsLayerRef = useRef<L.LayerGroup | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);
  const alertsLayerRef = useRef<L.LayerGroup | null>(null);

  // Update route events whenever selectedRoute changes
  useEffect(() => {
    setRouteEvents(storageService.getEventsByRoute(selectedRoute.id));
  }, [selectedRoute]);

  // Handle incoming targetRouteId or targetCoordinates
  useEffect(() => {
    if (targetRouteId) {
      const found = HUMEDAL_ROUTES.find(r => r.id === targetRouteId);
      if (found) {
        setSelectedRoute(found);
        setRouteViewMode('activa');
      }
    }
    if (targetCoordinates && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(targetCoordinates, 17, { duration: 1.2 });
    }
  }, [targetRouteId, targetCoordinates]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = [-39.8525, -73.2265];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    allRoutesLayerRef.current = L.layerGroup().addTo(map);
    checkpointsLayerRef.current = L.layerGroup().addTo(map);
    poisLayerRef.current = L.layerGroup().addTo(map);
    alertsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // El contenedor cambia de alto al cruzar el breakpoint de escritorio
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw Points of Interest
  useEffect(() => {
    const map = mapInstanceRef.current;
    const poisLayer = poisLayerRef.current;
    if (!map || !poisLayer) return;

    poisLayer.clearLayers();
    const currentPois = storageService.getPointsOfInterest();

    currentPois.forEach(poi => {
      const poiIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-stone-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30">
              ${poi.name.split(':')[0]}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker(poi.coordinates, { icon: poiIcon });
      marker.on('click', () => {
        setSelectedPOI(poi);
        if (poi.soundKey) {
          soundService.playBySoundKey(poi.soundKey);
        }
      });
      marker.addTo(poisLayer);
    });
  }, []);

  // Draw Live Waze Alerts
  useEffect(() => {
    const map = mapInstanceRef.current;
    const alertsLayer = alertsLayerRef.current;
    if (!map || !alertsLayer) return;

    alertsLayer.clearLayers();

    liveAlerts.forEach(alert => {
      const colors = {
        fauna: 'bg-emerald-600',
        resbaladizo: 'bg-amber-600',
        corte: 'bg-rose-600',
        silencio: 'bg-indigo-600'
      };
      const alertColor = colors[alert.type] || 'bg-amber-600';

      const alertIcon = L.divIcon({
        className: 'custom-alert-marker',
        html: `
          <div class="relative animate-bounce">
            <div class="w-6 h-6 rounded-full ${alertColor} text-white flex items-center justify-center shadow-md border-2 border-white">
              <span class="text-[11px] font-black">!</span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(alert.coordinates, { icon: alertIcon });
      marker.bindPopup(`
        <div class="p-1 max-w-[200px]">
          <h4 class="font-bold text-xs text-stone-900">${alert.title}</h4>
          <p class="text-[11px] text-stone-600 mt-1">${alert.description}</p>
          <div class="text-[9px] text-stone-400 mt-1 font-semibold">${alert.reportedBy} • ${alert.timeAgo}</div>
        </div>
      `);
      marker.addTo(alertsLayer);
    });
  }, [liveAlerts]);

  // RENDER ROUTES: "Ruta a Utilizar" vs "Rutas Posibles (3)"
  useEffect(() => {
    const map = mapInstanceRef.current;
    const allRoutesLayer = allRoutesLayerRef.current;
    const checkpointsLayer = checkpointsLayerRef.current;
    if (!map || !allRoutesLayer || !checkpointsLayer) return;

    // Clear active polyline and layers
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    allRoutesLayer.clearLayers();
    checkpointsLayer.clearLayers();

    if (routeViewMode === 'posibles') {
      // Draw ALL 3 possible routes simultaneously on the map
      const bounds = L.latLngBounds([]);

      HUMEDAL_ROUTES.forEach(route => {
        const isSelected = route.id === selectedRoute.id;

        // Polyline
        const poly = L.polyline(route.path, {
          color: route.color,
          weight: isSelected ? 7 : 5,
          opacity: isSelected ? 1 : 0.75,
          dashArray: isSelected ? undefined : '6, 6',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(allRoutesLayer);

        poly.on('click', () => {
          setSelectedRoute(route);
          soundService.playNavChime();
        });

        // Start point badge
        const startPoint = route.path[0];
        const startIcon = L.divIcon({
          className: 'route-start-marker',
          html: `
            <div class="cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-md border border-white" style="background-color: ${route.color}">
              ${route.name.split(' ')[0]} ${route.name.split(' ')[1] || ''}
            </div>
          `,
          iconSize: [80, 20],
          iconAnchor: [40, 10]
        });

        const startMarker = L.marker(startPoint, { icon: startIcon });
        startMarker.on('click', () => {
          setSelectedRoute(route);
          soundService.playNavChime();
        });
        startMarker.addTo(allRoutesLayer);

        route.path.forEach(pt => bounds.extend(pt));
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else {
      // Draw only the selected "Ruta a Utilizar" with detailed checkpoints
      const polyline = L.polyline(selectedRoute.path, {
        color: selectedRoute.color,
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Fit map to selected route
      map.fitBounds(polyline.getBounds(), { padding: [45, 45] });

      // Draw Checkpoints
      selectedRoute.checkpoints.forEach((cp, idx) => {
        const point = selectedRoute.path[cp.pointIndex] || selectedRoute.path[0];
        const isStart = idx === 0;
        const isEnd = idx === selectedRoute.checkpoints.length - 1;

        const cpIcon = L.divIcon({
          className: 'checkpoint-marker',
          html: `
            <div class="relative group cursor-pointer">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shadow-md border-2 border-white ${
                isStart
                  ? 'bg-emerald-600'
                  : isEnd
                  ? 'bg-rose-600'
                  : 'bg-stone-800'
              }">
                ${isStart ? 'A' : isEnd ? 'B' : idx}
              </div>
              <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30 whitespace-nowrap">
                ${cp.instruction}
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const cpMarker = L.marker(point, { icon: cpIcon });
        cpMarker.bindPopup(`
          <div class="p-1">
            <h5 class="font-bold text-xs text-stone-900">${cp.instruction}</h5>
            <div class="text-[10px] text-stone-500 mt-0.5">Punto de control ${idx + 1}</div>
          </div>
        `);
        cpMarker.addTo(checkpointsLayer);
      });
    }
  }, [selectedRoute, routeViewMode]);

  // User location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'user-nav-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-blue-500/30 animate-ping absolute"></div>
            <div class="w-6 h-6 rounded-full bg-blue-600 border-3 border-white shadow-xl flex items-center justify-center text-white">
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      userMarkerRef.current = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userLocation);
    }
  }, [userLocation]);

  // Turn-by-Turn Navigation progress simulation
  useEffect(() => {
    if (!isNavigating || !simulating) return;

    const interval = setInterval(() => {
      setCurrentPointIndex(prev => {
        const next = prev + 1;
        if (next >= selectedRoute.path.length) {
          setIsNavigating(false);
          setSimulating(false);
          soundService.playNavChime();
          if (voiceEnabled) {
            soundService.speakGuidance(`Has llegado a tu destino en ${selectedRoute.name}. ¡Disfruta el humedal!`);
          }
          return prev;
        }

        const nextCoord = selectedRoute.path[next];
        setUserLocation(nextCoord);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(nextCoord, { animate: true, duration: 0.8 });
        }

        // Voice announcement on checkpoint
        const reachedCp = selectedRoute.checkpoints.find(cp => cp.pointIndex === next);
        if (reachedCp) {
          soundService.playNavChime();
          if (voiceEnabled) {
            soundService.speakGuidance(reachedCp.instruction);
          }
        }

        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [simulating, isNavigating, selectedRoute, voiceEnabled]);

  // Navigation handlers
  const startNavigation = () => {
    setIsNavigating(true);
    setSimulating(true);
    setCurrentPointIndex(0);
    setUserLocation(selectedRoute.path[0]);
    soundService.playNavChime();
    if (voiceEnabled) {
      soundService.speakGuidance(`Iniciando navegación Waze por ${selectedRoute.name}. Continúa recto.`);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setSimulating(false);
  };

  // Real device GPS tracking
  const toggleRealGPS = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
      setGpsStatusText(null);
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatusText('Geolocalización no soportada en tu navegador');
      return;
    }

    setGpsStatusText('Conectando señal GPS...');

    const id = navigator.geolocation.watchPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        if (pos.coords.speed) {
          setWalkingSpeed(Math.max(1, Math.round(pos.coords.speed * 3.6 * 10) / 10));
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(coords, { animate: true });
        }
        setGpsStatusText(`GPS Activo • ±${Math.round(pos.coords.accuracy || 10)}m`);
      },
      err => {
        // Fallback for simulation / denied permission: place user at route start
        const fallback = selectedRoute.path[0];
        setUserLocation(fallback);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(fallback, { animate: true });
        }
        setGpsStatusText('GPS Simulado en inicio del Sendero');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    setGpsWatchId(id);
  };

  // Handle Event Register
  const handleToggleEvent = (eventId: string) => {
    const result = storageService.toggleRegisterEvent(eventId);
    setRouteEvents(prev =>
      prev.map(e =>
        e.id === eventId
          ? { ...e, isRegistered: result.isRegistered, registeredCount: result.newCount }
          : e
      )
    );
  };

  // Submit Alert
  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle) return;

    storageService.addLiveAlert({
      type: newAlertType,
      title: newAlertTitle,
      description: newAlertDesc || 'Reporte de visitante en la ruta del humedal',
      coordinates: userLocation,
      reportedBy: 'Visitante'
    });

    setLiveAlerts(storageService.getLiveAlerts());
    setShowAlertModal(false);
    setNewAlertTitle('');
    setNewAlertDesc('');
    soundService.playNavChime();
  };

  const currentCheckpoint =
    selectedRoute.checkpoints.find(cp => cp.pointIndex >= currentPointIndex) ||
    selectedRoute.checkpoints[selectedRoute.checkpoints.length - 1];

  const totalPoints = selectedRoute.path.length;
  const progressPercent = Math.min(
    100,
    Math.round((currentPointIndex / Math.max(1, totalPoints - 1)) * 100)
  );
  const remainingDistanceKm = Math.max(
    0,
    Math.round(selectedRoute.distanceKm * (1 - progressPercent / 100) * 10) / 10
  );
  const remainingMinutes = Math.max(
    1,
    Math.round(selectedRoute.estimatedMinutes * (1 - progressPercent / 100))
  );

  return (
    <div className="relative w-full flex flex-col bg-stone-50 min-h-screen text-stone-900 pb-20 lg:pb-0">
      {/* --- TOP HUD BAR (During Waze navigation) --- */}
      {isNavigating && (
        <div className="sticky top-0 z-30 bg-stone-900 text-white px-4 py-3 shadow-lg flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white animate-pulse">
              <Navigation className="w-5 h-5 transform rotate-45" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                En {Math.max(20, Math.round((1 - progressPercent / 100) * 150))} m
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                {currentCheckpoint.instruction}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-xl border ${
                voiceEnabled ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300' : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSimulating(!simulating)}
              className="p-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200"
            >
              {simulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={stopNavigation}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {/* Desktop: mapa fijo a la izquierda + panel lateral */}
      <div className="lg:flex lg:items-start">
      {/* --- MAP CONTAINER --- */}
      <div
        className={`relative w-full h-[52vh] sm:h-[58vh] lg:flex-1 lg:sticky bg-stone-200 overflow-hidden shadow-inner ${
          isNavigating ? 'lg:top-16 lg:h-[calc(100vh-4rem)]' : 'lg:top-0 lg:h-screen'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Minimal Weather & Tidal Pill (Top Left) */}
        <div className="absolute top-3 left-3 z-20 pointer-events-auto">
          <WetlandWeatherWidget />
        </div>

        {/* Real-time GPS & Alert Controls (Top Right) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Real-time GPS Button */}
          <button
            id="gps-toggle-btn"
            onClick={toggleRealGPS}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border transition-all ${
              gpsWatchId !== null
                ? 'bg-blue-600 text-white border-blue-400 animate-pulse ring-2 ring-blue-300/60'
                : 'bg-white/95 text-stone-800 border-stone-200 hover:bg-white'
            }`}
            title="Activar o desactivar seguimiento GPS en tiempo real"
          >
            <LocateFixed className="w-4 h-4 text-blue-500" />
            <span>{gpsWatchId !== null ? 'GPS Activo' : 'GPS en Vivo'}</span>
          </button>

          {/* Quick Alert Report */}
          <button
            onClick={() => setShowAlertModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold shadow-md flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerta</span>
          </button>
        </div>

        {/* Floating GPS Status Toast */}
        {gpsStatusText && (
          <div className="absolute bottom-3 left-3 z-20 bg-stone-900/90 text-white text-[11px] font-medium px-3 py-1.5 rounded-full backdrop-blur-md border border-stone-700 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{gpsStatusText}</span>
          </div>
        )}
      </div>

      {/* --- SECTIONS BELOW THE MAP --- */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-4 space-y-5 lg:max-w-none lg:mx-0 lg:w-[26rem] xl:w-[30rem] lg:shrink-0 lg:px-5 lg:py-6 lg:border-l lg:border-stone-200 lg:min-h-screen">
        {/* 1. TOGGLE: "Ruta a Utilizar" vs "Rutas Posibles" */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Modo de Visualización
            </span>
            <div className="flex bg-stone-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setRouteViewMode('activa')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  routeViewMode === 'activa'
                    ? 'bg-stone-900 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ruta a Utilizar
              </button>
              <button
                onClick={() => setRouteViewMode('posibles')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  routeViewMode === 'posibles'
                    ? 'bg-stone-900 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Rutas Posibles (3)
              </button>
            </div>
          </div>

          {/* Quick Route Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {HUMEDAL_ROUTES.map(route => {
              const isSelected = route.id === selectedRoute.id;
              return (
                <button
                  key={route.id}
                  onClick={() => {
                    setSelectedRoute(route);
                    soundService.playNavChime();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{route.name}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: route.color }}
                    />
                  </div>
                  <div className={`flex items-center gap-2 mt-1 text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    <span>{route.distanceKm} km</span>
                    <span>•</span>
                    <span>~{route.estimatedMinutes} min</span>
                    <span>•</span>
                    <span>{route.difficulty}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Route Action Bar */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-stone-600">
              <strong className="text-stone-900">{selectedRoute.name}</strong> • Superficie: {selectedRoute.surfaceType}
            </div>
            {!isNavigating && (
              <button
                onClick={startNavigation}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 transform rotate-45" />
                <span>Iniciar Waze</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. EVENTOS SEGÚN LA RUTA SELECCIONADA */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Actividades en este Sendero
              </span>
              <h3 className="text-base font-black text-stone-900">
                Eventos en {selectedRoute.name}
              </h3>
            </div>

            {onGoToEvents && (
              <button
                onClick={onGoToEvents}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Ver todos los eventos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {routeEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {routeEvents.map(evt => {
                const spotsLeft = Math.max(0, evt.capacity - evt.registeredCount);
                const isFull = evt.registeredCount >= evt.capacity;

                return (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {evt.category}
                        </span>
                        <span className="text-[11px] font-medium text-stone-500">
                          {evt.time}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                        {evt.title}
                      </h4>
                      <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                        {evt.description}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-2">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{evt.locationName}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500">
                        {evt.registeredCount}/{evt.capacity} inscritos
                      </span>
                      <button
                        onClick={() => handleToggleEvent(evt.id)}
                        disabled={isFull && !evt.isRegistered}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          evt.isRegistered
                            ? 'bg-emerald-600 text-white'
                            : isFull
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-stone-900 text-white hover:bg-stone-800'
                        }`}
                      >
                        {evt.isRegistered ? 'Inscrito ✓' : 'Inscribirme'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-50 text-stone-500 text-xs text-center border border-dashed border-stone-200">
              No hay eventos específicos programados para este sendero hoy.
              {onGoToEvents && (
                <button
                  onClick={onGoToEvents}
                  className="block mx-auto mt-2 text-emerald-700 font-bold underline"
                >
                  Explorar la agenda general de eventos del humedal
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. SELECTED POI CARD (If tapped on map) */}
        {selectedPOI && (
          <div className="bg-white rounded-2xl border border-emerald-300 p-4 shadow-sm flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Punto de Interés Seleccionado
              </span>
              <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                {selectedPOI.name}
              </h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {selectedPOI.description}
              </p>
              {selectedPOI.qrCode && onOpenQRWithCode && (
                <button
                  onClick={() => onOpenQRWithCode(selectedPOI.qrCode!)}
                  className="mt-2.5 px-3 py-1 rounded-lg bg-stone-900 text-white text-xs font-semibold"
                >
                  Escanear Tótem {selectedPOI.qrCode}
                </button>
              )}
            </div>
            <button
              onClick={() => setSelectedPOI(null)}
              className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      </div>

      {/* --- REPORT ALERT MODAL --- */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-stone-900">
                  Reportar Alerta en Ruta
                </h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAlert} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'fauna', label: '🦭 Fauna silvestre' },
                    { id: 'resbaladizo', label: '⚠️ Pasarela resbalosa' },
                    { id: 'corte', label: '⛔ Sendero cortado' },
                    { id: 'silencio', label: '🤫 Zona de silencio' }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setNewAlertType(t.id as WazeLiveAlert['type'])}
                      className={`p-2 rounded-xl text-xs font-semibold border text-left ${
                        newAlertType === t.id
                          ? 'bg-amber-100 border-amber-400 text-amber-900'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título breve
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Familia de cisnes cerca de pasarela"
                  value={newAlertTitle}
                  onChange={e => setNewAlertTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Detalles
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Por favor mantener distancia."
                  value={newAlertDesc}
                  onChange={e => setNewAlertDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs"
                >
                  Publicar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
