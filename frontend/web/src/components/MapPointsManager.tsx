'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Layers, LocateFixed, MapPin, Plus, Trash2, Undo2, X } from 'lucide-react';
import { MapPoint, MapPointType, PointOfInterest, WetlandEvent } from '../types';
import { ApiError, MapPointInput, mapPointsApi } from '../lib/api';
import { HUMEDAL_ROUTES } from '../data/mockData';
import { dateKey, eventDateKey, formatEventDateShort } from '../lib/eventDates';
import { MAP_POINT_ICONS, MAP_POINT_TYPES, iconFor, mapPointMarkerHtml } from '../lib/mapPointIcons';
import { storageService } from '../services/storageService';

interface MapPointsManagerProps {
  stations: PointOfInterest[];
  events: WetlandEvent[];
  notify: (message: string) => void;
}

type Target = { kind: 'point' | 'station'; id: string };
type PendingMove = Target & { name: string; from: [number, number]; to: [number, number] };
type Draft = { id?: string; data: MapPointInput & { coordinates: [number, number] }; imagePreview: string | null };

const input =
  'w-full h-10 px-3 rounded-md bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';
const btnPrimary = 'h-9 px-3.5 rounded-md bg-stone-950 hover:bg-stone-800 disabled:bg-stone-400 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0';
const btnSecondary = 'h-9 px-3 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-900 text-sm font-semibold inline-flex items-center gap-1.5 shrink-0';
const btnGhost = 'h-9 px-2.5 rounded-md text-stone-700 hover:bg-stone-100 text-sm font-semibold inline-flex items-center gap-1.5 shrink-0';

const RESERVE_CENTER: [number, number] = [-39.8568, -73.2378];
const fmt = (c: [number, number]) => `${c[0].toFixed(5)}, ${c[1].toFixed(5)}`;

// Distance in metres between two coordinates (haversine)
function metres(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const stationIconHtml = (label: string, selected: boolean) =>
  `<div style="width:30px;height:30px;border-radius:999px;background:#1c1917;color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:600 11px system-ui;box-shadow:0 1px 4px rgba(0,0,0,.35);${
    selected ? 'outline:3px solid #fbbf24;outline-offset:1px;' : ''
  }">${label.replace(/[^A-Za-z0-9]/g, '')}</div>`;

const emptyDraft = (coordinates: [number, number], type: MapPointType = 'vista'): Draft => ({
  data: {
    name: '',
    type,
    icon: MAP_POINT_TYPES[type].defaultIcon,
    description: '',
    coordinates,
    routeId: null,
    eventId: null,
    published: true,
  },
  imagePreview: null,
});

export const MapPointsManager: React.FC<MapPointsManagerProps> = ({ stations, events, notify }) => {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Target | null>(null);
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(true);
  const [stationCoords, setStationCoords] = useState<Record<string, [number, number]>>({});

  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const placingRef = useRef(placing);
  const onMapClickRef = useRef<(c: [number, number]) => void>(() => {});

  useEffect(() => {
    placingRef.current = placing;
    containerRef.current?.classList.toggle('cursor-crosshair', placing);
  }, [placing]);

  const reload = useCallback(() => {
    mapPointsApi
      .list(true)
      .then(list => {
        setPoints(list);
        setLoadError(null);
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los puntos'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Map: created once, with the two routes drawn for reference
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(RESERVE_CENTER, 16);
    HUMEDAL_ROUTES.forEach(route => {
      L.polyline(route.path, { color: route.color, weight: 4, opacity: 0.9, interactive: false }).addTo(map);
    });
    const all = HUMEDAL_ROUTES.flatMap(r => r.path);
    if (all.length) map.fitBounds(L.latLngBounds(all), { padding: [24, 24] });
    markersRef.current = L.layerGroup().addTo(map);
    map.on('click', e => {
      if (placingRef.current) onMapClickRef.current([e.latlng.lat, e.latlng.lng]);
    });
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tilesRef.current?.remove();
    tilesRef.current = satellite
      ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution: 'Imágenes © Esri',
        }).addTo(map)
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution: '© OpenStreetMap',
        }).addTo(map);
    tilesRef.current.bringToBack();
  }, [satellite]);

  const coordsOfStation = useCallback(
    (st: PointOfInterest) => stationCoords[st.id] ?? st.coordinates,
    [stationCoords]
  );

  // Placing a new point: the click on the map opens the form there
  onMapClickRef.current = c => {
    setPlacing(false);
    setSelected(null);
    setPendingMove(null);
    setFormError(null);
    setDraft(emptyDraft(c));
  };

  // Markers: totems, saved points and the point being created; every one can be dragged
  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();

    stations.forEach(st => {
      const isSel = selected?.kind === 'station' && selected.id === st.id;
      const at = pendingMove?.kind === 'station' && pendingMove.id === st.id ? pendingMove.to : coordsOfStation(st);
      L.marker(at, {
        draggable: true,
        title: st.name,
        icon: L.divIcon({ className: '', html: stationIconHtml(st.code ?? '', isSel), iconSize: [30, 30], iconAnchor: [15, 15] }),
        zIndexOffset: isSel ? 900 : 0,
      })
        .bindTooltip(`${st.name} · arrastra para corregir`, { direction: 'top', offset: [0, -14] })
        .on('click', () => {
          setDraft(null);
          setSelected({ kind: 'station', id: st.id });
        })
        .on('dragend', e => {
          const ll = (e.target as L.Marker).getLatLng();
          setPendingMove({ kind: 'station', id: st.id, name: st.name, from: coordsOfStation(st), to: [ll.lat, ll.lng] });
          setSelected({ kind: 'station', id: st.id });
        })
        .addTo(layer);
    });

    points.forEach(p => {
      if (draft?.id === p.id) return; // drawn below with the draft's values
      const isSel = selected?.kind === 'point' && selected.id === p.id;
      const at = pendingMove?.kind === 'point' && pendingMove.id === p.id ? pendingMove.to : p.coordinates;
      L.marker(at, {
        draggable: true,
        title: p.name,
        icon: L.divIcon({ className: '', html: mapPointMarkerHtml(p, isSel), iconSize: [34, 34], iconAnchor: [17, 17] }),
        zIndexOffset: isSel ? 1000 : 100,
      })
        .bindTooltip(p.name, { direction: 'top', offset: [0, -16] })
        .on('click', () => openEdit(p))
        .on('dragend', e => {
          const ll = (e.target as L.Marker).getLatLng();
          setPendingMove({ kind: 'point', id: p.id, name: p.name, from: p.coordinates, to: [ll.lat, ll.lng] });
          setSelected({ kind: 'point', id: p.id });
        })
        .addTo(layer);
    });

    if (draft) {
      L.marker(draft.data.coordinates, {
        draggable: true,
        icon: L.divIcon({ className: '', html: mapPointMarkerHtml({ ...draft.data, published: draft.data.published }, true), iconSize: [34, 34], iconAnchor: [17, 17] }),
        zIndexOffset: 2000,
      })
        .on('dragend', e => {
          const ll = (e.target as L.Marker).getLatLng();
          setDraft(d => (d ? { ...d, data: { ...d.data, coordinates: [ll.lat, ll.lng] } } : d));
        })
        .addTo(layer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, points, selected, pendingMove, draft, coordsOfStation]);

  function openEdit(p: MapPoint) {
    setPlacing(false);
    setPendingMove(null);
    setConfirmDelete(false);
    setFormError(null);
    setSelected({ kind: 'point', id: p.id });
    setDraft({
      id: p.id,
      data: {
        name: p.name,
        type: p.type,
        icon: p.icon,
        description: p.description,
        coordinates: p.coordinates,
        routeId: p.routeId,
        eventId: p.eventId,
        published: p.published,
      },
      imagePreview: p.image,
    });
    mapRef.current?.panTo(p.coordinates);
  }

  const closeForm = () => {
    setDraft(null);
    setSelected(null);
    setConfirmDelete(false);
    setFormError(null);
  };

  const startPlacing = () => {
    closeForm();
    setPendingMove(null);
    setPlacing(true);
  };

  const placeAtMyLocation = () => {
    if (!navigator.geolocation) {
      notify('Este dispositivo no entrega su ubicación.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        mapRef.current?.setView(c, 18);
        onMapClickRef.current(c);
      },
      () => notify('No se pudo obtener tu ubicación. Revisa el permiso de ubicación del navegador.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveMove = async () => {
    if (!pendingMove) return;
    setSaving(true);
    try {
      if (pendingMove.kind === 'point') {
        const updated = await mapPointsApi.move(pendingMove.id, pendingMove.to);
        setPoints(list => list.map(p => (p.id === updated.id ? updated : p)));
      } else {
        await mapPointsApi.moveStation(pendingMove.id, pendingMove.to);
        setStationCoords(c => ({ ...c, [pendingMove.id]: pendingMove.to }));
        storageService.syncAll();
      }
      notify(`Ubicación de “${pendingMove.name}” guardada.`);
      setPendingMove(null);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'No se pudo guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setFormError(null);
    if (draft.data.name.trim().length < 2) {
      setFormError('Escribe un nombre de al menos 2 caracteres.');
      return;
    }
    setSaving(true);
    try {
      const body: MapPointInput = {
        ...draft.data,
        name: draft.data.name.trim(),
        eventId: draft.data.type === 'actividad' ? draft.data.eventId : null,
      };
      if (draft.id) {
        const updated = await mapPointsApi.update(draft.id, { ...body, coordinates: undefined });
        // A dragged draft of an existing point also saves its new place
        const original = points.find(p => p.id === draft.id);
        const moved = original && metres(original.coordinates, draft.data.coordinates) > 0;
        const final = moved ? await mapPointsApi.move(draft.id, draft.data.coordinates) : updated;
        setPoints(list => list.map(p => (p.id === final.id ? final : p)));
        notify(`“${final.name}” actualizado.`);
      } else {
        const created = await mapPointsApi.create(body);
        setPoints(list => [...list, created]);
        notify(`“${created.name}” agregado al mapa${created.published ? '' : ' como borrador'}.`);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el punto.');
    } finally {
      setSaving(false);
    }
  };

  const deletePoint = async () => {
    if (!draft?.id) return;
    setSaving(true);
    try {
      await mapPointsApi.remove(draft.id);
      setPoints(list => list.filter(p => p.id !== draft.id));
      notify(`“${draft.data.name}” eliminado del mapa.`);
      closeForm();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo eliminar.');
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setDraft(d => (d ? { ...d, imagePreview: url, data: { ...d.data, image: url } } : d));
    };
    reader.readAsDataURL(file);
  };

  const today = dateKey(new Date());
  const upcomingEvents = events
    .map(ev => ({ ev, key: eventDateKey(ev.date) }))
    .filter(x => x.key && x.key >= today)
    .sort((a, b) => (a.key! < b.key! ? -1 : 1))
    .map(x => x.ev);
  const linkedPastEvent =
    draft?.data.eventId && !upcomingEvents.some(ev => ev.id === draft.data.eventId)
      ? events.find(ev => ev.id === draft.data.eventId)
      : undefined;

  const selectedStation = selected?.kind === 'station' ? stations.find(s => s.id === selected.id) : undefined;
  const set = <K extends keyof Draft['data']>(key: K, value: Draft['data'][K]) =>
    setDraft(d => (d ? { ...d, data: { ...d.data, [key]: value } } : d));

  const groups = [...new Set(MAP_POINT_ICONS.map(i => i.group))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 items-start">
      {/* Map */}
      <div className="relative lg:sticky lg:top-6">
        <div ref={containerRef} className="h-[55vh] min-h-[360px] lg:h-[640px] rounded-lg border border-stone-200 overflow-hidden bg-stone-200" />
        <div className="absolute top-3 right-3 z-[500] flex flex-col items-end gap-2">
          <button type="button" onClick={() => setSatellite(s => !s)} className="h-9 px-3 rounded-md bg-white text-stone-900 text-sm font-semibold inline-flex items-center gap-1.5 shadow-md hover:bg-stone-50">
            <Layers className="w-4 h-4 text-stone-500" />
            {satellite ? 'Satelital' : 'Calles'}
          </button>
        </div>
        {placing && (
          <div className="absolute top-3 left-3 right-28 z-[500] rounded-md bg-stone-950 text-white px-3 py-2.5 text-sm shadow-lg flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-semibold">Toca el mapa donde va el punto</span>
            <button type="button" onClick={placeAtMyLocation} className="inline-flex items-center gap-1 underline underline-offset-2">
              <LocateFixed className="w-4 h-4" />
              Usar mi ubicación
            </button>
            <button type="button" onClick={() => setPlacing(false)} className="ml-auto underline underline-offset-2">
              Cancelar
            </button>
          </div>
        )}
        <p className="mt-2 text-sm text-stone-600">
          Arrastra cualquier pin o tótem para corregir su ubicación. Las líneas son las rutas.
        </p>
      </div>

      {/* Side panel */}
      <div className="space-y-4 min-w-0">
        {pendingMove && (
          <section className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4" aria-live="polite">
            <h3 className="text-[15px] font-semibold text-stone-950">Nueva ubicación para “{pendingMove.name}”</h3>
            <p className="mt-1 text-sm text-stone-700 tabular-nums">
              Se movió {metres(pendingMove.from, pendingMove.to)} m · {fmt(pendingMove.to)}
            </p>
            <p className="mt-1 text-sm text-stone-600">Solo cambia el lugar; el nombre y la información se mantienen.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={saveMove} disabled={saving} className={btnPrimary}>
                <MapPin className="w-4 h-4" />
                Guardar ubicación
              </button>
              <button type="button" onClick={() => setPendingMove(null)} className={btnSecondary}>
                <Undo2 className="w-4 h-4" />
                Deshacer
              </button>
            </div>
          </section>
        )}

        {draft ? (
          <form onSubmit={saveDraft} className="bg-white rounded-lg border border-stone-200 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-stone-950">{draft.id ? 'Editar punto' : 'Nuevo punto'}</h3>
                <p className="text-sm text-stone-600 tabular-nums">{fmt(draft.data.coordinates)} · arrastra el pin para ajustar</p>
              </div>
              <button type="button" onClick={closeForm} aria-label="Cerrar" className="w-9 h-9 -mr-1 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block">
              <span className="block text-sm font-semibold text-stone-800 mb-1">Nombre</span>
              <input
                className={input}
                value={draft.data.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Mirador de los cisnes"
                maxLength={120}
                autoFocus={!draft.id}
              />
            </label>

            <fieldset>
              <legend className="text-sm font-semibold text-stone-800 mb-1">Tipo</legend>
              <div className="grid grid-cols-2 p-0.5 gap-0.5 rounded-md bg-stone-200/80">
                {(Object.keys(MAP_POINT_TYPES) as MapPointType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={draft.data.type === t}
                    onClick={() =>
                      setDraft(d =>
                        d
                          ? {
                              ...d,
                              data: {
                                ...d.data,
                                type: t,
                                // Keep a chosen icon; switch only the default one
                                icon: d.data.icon === MAP_POINT_TYPES[d.data.type].defaultIcon ? MAP_POINT_TYPES[t].defaultIcon : d.data.icon,
                              },
                            }
                          : d
                      )
                    }
                    className={`h-9 rounded text-sm font-medium transition-colors ${
                      draft.data.type === t ? 'bg-white text-stone-950 ring-1 ring-stone-300' : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    {MAP_POINT_TYPES[t].label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-stone-800">
                Ícono <span className="font-normal text-stone-600">· {iconFor(draft.data.icon).label}</span>
              </legend>
              <div className="mt-1.5 space-y-2.5">
                {groups.map(g => (
                  <div key={g}>
                    <p className="text-[13px] text-stone-500">{g}</p>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                      {MAP_POINT_ICONS.filter(i => i.group === g).map(({ key, label, Icon }) => {
                        const active = draft.data.icon === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => set('icon', key)}
                            aria-pressed={active}
                            aria-label={label}
                            title={label}
                            className={`h-10 rounded-md flex items-center justify-center border transition-colors ${
                              active ? 'text-white border-transparent' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                            style={active ? { background: MAP_POINT_TYPES[draft.data.type].color } : undefined}
                          >
                            <Icon className="w-[18px] h-[18px]" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="block text-sm font-semibold text-stone-800 mb-1">
                Descripción <span className="font-normal text-stone-500">(opcional)</span>
              </span>
              <textarea
                className={`${input} h-auto py-2`}
                rows={3}
                value={draft.data.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Qué se ve o qué se hace aquí"
                maxLength={2000}
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-stone-800 mb-1">Ruta</span>
              <select className={input} value={draft.data.routeId ?? ''} onChange={e => set('routeId', e.target.value || null)}>
                <option value="">Sin ruta (punto suelto)</option>
                {HUMEDAL_ROUTES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>

            {draft.data.type === 'actividad' && (
              <label className="block">
                <span className="block text-sm font-semibold text-stone-800 mb-1">
                  Actividad del calendario <span className="font-normal text-stone-500">(opcional)</span>
                </span>
                <select className={input} value={draft.data.eventId ?? ''} onChange={e => set('eventId', e.target.value || null)}>
                  <option value="">Ninguna</option>
                  {linkedPastEvent && (
                    <option value={linkedPastEvent.id}>
                      {formatEventDateShort(linkedPastEvent.date)} · {linkedPastEvent.title} (finalizada)
                    </option>
                  )}
                  {upcomingEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {formatEventDateShort(ev.date)} · {ev.title}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[13px] text-stone-600">En el mapa, la ficha mostrará la fecha y llevará a la inscripción.</span>
              </label>
            )}

            <div>
              <span className="block text-sm font-semibold text-stone-800 mb-1">
                Foto <span className="font-normal text-stone-500">(opcional)</span>
              </span>
              {draft.imagePreview ? (
                <div className="relative overflow-hidden rounded-md bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.imagePreview} alt="" className="w-full aspect-[4/3] object-cover" />
                  <button
                    type="button"
                    onClick={() => setDraft(d => (d ? { ...d, imagePreview: null, data: { ...d.data, image: null } } : d))}
                    className="absolute top-2 right-2 h-8 px-2.5 rounded-md bg-white/95 text-sm font-medium text-stone-900 hover:bg-white"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-11 rounded-md border border-dashed border-stone-400 bg-stone-50 hover:bg-stone-100 text-sm font-medium text-stone-700 cursor-pointer">
                  <Camera className="w-4 h-4 text-stone-500" />
                  Elegir foto
                  <input type="file" accept="image/*" onChange={onPhoto} className="sr-only" />
                </label>
              )}
            </div>

            <label className="flex items-start gap-2.5 text-sm text-stone-800 cursor-pointer">
              <input type="checkbox" className="mt-0.5 w-4 h-4 accent-stone-900" checked={draft.data.published} onChange={e => set('published', e.target.checked)} />
              <span>
                <span className="font-semibold">Visible para visitantes</span>
                <span className="block text-stone-600">Desmárcalo para dejarlo como borrador, visible solo en este panel.</span>
              </span>
            </label>

            {formError && <p role="alert" className="text-sm text-rose-800 bg-rose-50 rounded-md px-3 py-2">{formError}</p>}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Guardando…' : draft.id ? 'Guardar cambios' : 'Agregar al mapa'}
              </button>
              <button type="button" onClick={closeForm} className={btnGhost}>
                Cancelar
              </button>
              {draft.id &&
                (confirmDelete ? (
                  <span className="ml-auto flex items-center gap-2 text-sm">
                    ¿Eliminar?
                    <button type="button" onClick={deletePoint} disabled={saving} className="h-9 px-3 rounded-md bg-rose-700 hover:bg-rose-800 text-white font-semibold">
                      Sí, eliminar
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className={btnGhost}>
                      No
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Eliminar punto" className="ml-auto w-9 h-9 rounded-md flex items-center justify-center text-stone-500 hover:bg-rose-50 hover:text-rose-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                ))}
            </div>
          </form>
        ) : selectedStation ? (
          <section className="bg-white rounded-lg border border-stone-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-stone-600">Tótem {selectedStation.qrCode}</p>
                <h3 className="text-base font-semibold text-stone-950">{selectedStation.name}</h3>
                <p className="mt-0.5 text-sm text-stone-600 tabular-nums">{fmt(coordsOfStation(selectedStation))}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar" className="w-9 h-9 -mr-1 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-stone-700">
              Arrastra el tótem en el mapa para corregir su ubicación. Los textos, la foto y el audio se editan en la sección Tótems QR.
            </p>
          </section>
        ) : (
          <>
            <section className="bg-white rounded-lg border border-stone-200">
              <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
                <h3 className="text-base font-semibold text-stone-950">
                  Puntos <span className="font-normal text-stone-500 tabular-nums">{points.length}</span>
                </h3>
                <button type="button" onClick={startPlacing} className={btnPrimary}>
                  <Plus className="w-4 h-4" />
                  Agregar punto
                </button>
              </div>
              {loadError ? (
                <p className="px-4 pb-4 text-sm text-rose-700">
                  {loadError}{' '}
                  <button type="button" onClick={reload} className="font-semibold underline underline-offset-2">
                    Reintentar
                  </button>
                </p>
              ) : points.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-stone-600">
                  Aún no hay puntos. Agrega miradores, lugares de actividades, accesos, bancas o estacionamientos.
                </p>
              ) : (
                <ul className="divide-y divide-stone-200 border-t border-stone-200">
                  {points.map(p => {
                    const { Icon } = iconFor(p.icon);
                    return (
                      <li key={p.id}>
                        <button type="button" onClick={() => openEdit(p)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
                          <span
                            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                            style={p.published ? { background: MAP_POINT_TYPES[p.type].color, color: '#fff' } : { border: `2px dashed ${MAP_POINT_TYPES[p.type].color}`, color: MAP_POINT_TYPES[p.type].color }}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-stone-950 truncate">{p.name}</span>
                            <span className="block text-[13px] text-stone-600 truncate">
                              {MAP_POINT_TYPES[p.type].label} · {p.routeName ?? 'Sin ruta'}
                              {!p.published && ' · Borrador'}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-lg border border-stone-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-stone-950">Tótems QR</h3>
              <p className="mt-0.5 text-sm text-stone-600">
                Los círculos negros del mapa. Arrástralos si alguno quedó mal ubicado; la corrección se conserva aunque se reinicie el servidor.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
