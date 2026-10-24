import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Accessibility,
  Armchair,
  Binoculars,
  Bird,
  BookOpen,
  Camera,
  CircleParking,
  DoorOpen,
  Flower2,
  Footprints,
  Info,
  type LucideIcon,
  Music,
  Recycle,
  Sailboat,
  Sprout,
  Sunset,
  Tent,
  Toilet,
  Trees,
  Users,
  Waves,
} from 'lucide-react';
import type { MapPoint, MapPointType } from '../types';

// Preloaded icons the guardaparques picks from. Line icons instead of emoji: they look the same on
// every phone, take the pin's colour and match the rest of the app. Keys are stored in the database.
export const MAP_POINT_ICONS: { key: string; label: string; Icon: LucideIcon; group: string }[] = [
  { key: 'binoculars', label: 'Mirador', Icon: Binoculars, group: 'Observación' },
  { key: 'bird', label: 'Aves', Icon: Bird, group: 'Observación' },
  { key: 'camera', label: 'Fotografía', Icon: Camera, group: 'Observación' },
  { key: 'sunset', label: 'Atardecer', Icon: Sunset, group: 'Observación' },
  { key: 'waves', label: 'Espejo de agua', Icon: Waves, group: 'Observación' },
  { key: 'trees', label: 'Bosque', Icon: Trees, group: 'Observación' },
  { key: 'flower', label: 'Flora', Icon: Flower2, group: 'Observación' },
  { key: 'users', label: 'Encuentro', Icon: Users, group: 'Actividades' },
  { key: 'tent', label: 'Taller al aire libre', Icon: Tent, group: 'Actividades' },
  { key: 'sprout', label: 'Plantación o minga', Icon: Sprout, group: 'Actividades' },
  { key: 'book', label: 'Educación ambiental', Icon: BookOpen, group: 'Actividades' },
  { key: 'music', label: 'Música y arte', Icon: Music, group: 'Actividades' },
  { key: 'footprints', label: 'Caminata guiada', Icon: Footprints, group: 'Actividades' },
  { key: 'sailboat', label: 'Kayak', Icon: Sailboat, group: 'Actividades' },
  { key: 'door', label: 'Acceso', Icon: DoorOpen, group: 'Servicios' },
  { key: 'bench', label: 'Banca', Icon: Armchair, group: 'Servicios' },
  { key: 'parking', label: 'Estacionamiento', Icon: CircleParking, group: 'Servicios' },
  { key: 'toilet', label: 'Baño', Icon: Toilet, group: 'Servicios' },
  { key: 'accessibility', label: 'Acceso universal', Icon: Accessibility, group: 'Servicios' },
  { key: 'info', label: 'Información', Icon: Info, group: 'Servicios' },
  { key: 'recycle', label: 'Reciclaje', Icon: Recycle, group: 'Servicios' },
];

export const MAP_POINT_TYPES: Record<MapPointType, { label: string; color: string; defaultIcon: string }> = {
  vista: { label: 'Punto de vista', color: '#065f46', defaultIcon: 'binoculars' },
  actividad: { label: 'Punto de actividad', color: '#9a3412', defaultIcon: 'users' },
};

export const iconFor = (key: string) => MAP_POINT_ICONS.find(i => i.key === key) ?? MAP_POINT_ICONS[0];

const svgCache = new Map<string, string>();
function iconSvg(key: string, color: string) {
  const id = `${key}|${color}`;
  if (!svgCache.has(id)) {
    const { Icon } = iconFor(key);
    svgCache.set(id, renderToStaticMarkup(<Icon size={17} strokeWidth={2.2} color={color} aria-hidden="true" />));
  }
  return svgCache.get(id)!;
}

/**
 * HTML for a Leaflet divIcon: a square pin in the type's colour (white icon on colour when published,
 * colour on white with a dashed edge while it is a draft). `selected` adds a ring.
 */
export function mapPointMarkerHtml(point: Pick<MapPoint, 'type' | 'icon' | 'published'>, selected = false) {
  const { color } = MAP_POINT_TYPES[point.type];
  const draft = !point.published;
  const style = [
    'width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center;',
    draft ? `background:#fff;border:2px dashed ${color};` : `background:${color};border:2px solid #fff;`,
    'box-shadow:0 1px 4px rgba(0,0,0,.35);',
    selected ? `outline:3px solid #fbbf24;outline-offset:1px;` : '',
  ].join('');
  return `<div style="${style}">${iconSvg(point.icon, draft ? color : '#ffffff')}</div>`;
}
