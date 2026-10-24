'use client';

import React, { useEffect, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  MapPin,
  Plus,
  Search,
  Share2,
  X,
} from 'lucide-react';
import { CommunityPhoto, OfficialGalleryPhoto, PointOfInterest, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { feedApi, resolveMediaUrl } from '../lib/api';

interface CommunityGalleryProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onGoToMapLocation?: (coords: [number, number]) => void;
  isCreatePinOpen?: boolean;
  onCloseCreatePin?: () => void;
}

const TOPICS = [
  { id: 'todos', label: 'Todas' },
  { id: 'Aves', label: 'Aves y fauna' },
  { id: 'Atardeceres', label: 'Paisajes' },
  { id: 'Pasarelas', label: 'Pasarelas y miradores' },
  { id: 'Bosque', label: 'Bosque y flora' },
  { id: 'guardados', label: 'Guardadas' },
];

const inputClass =
  'w-full h-11 px-3 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';
const labelClass = 'block text-sm font-semibold text-stone-800 mb-1';

// "Estación 1: Mirador del Hualve" -> "Mirador del Hualve"
const placeName = (name: string) => name.split(':').slice(-1)[0].trim();
// "S1" -> 1, "E7" -> 7, for "Estación 1"
const stationNumber = (code: string) => Number(code.replace(/\D/g, '')) || code;

const share = (title: string, url: string) => {
  if (navigator.share) navigator.share({ title, url }).catch(() => {});
  else navigator.clipboard?.writeText(url);
};

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  currentUser,
  onOpenAuth,
  onGoToMapLocation,
  isCreatePinOpen,
  onCloseCreatePin,
}) => {
  const [galleryMode, setGalleryMode] = useState<'oficial' | 'comunidad'>('oficial');
  const [officialPhotos, setOfficialPhotos] = useState<OfficialGalleryPhoto[]>(() => storageService.getOfficialGallery());
  const [photos, setPhotos] = useState<CommunityPhoto[]>(() => storageService.getCommunityPhotos());
  const [stations, setStations] = useState<PointOfInterest[]>(() => storageService.getPointsOfInterest());
  const [selectedStationCode, setSelectedStationCode] = useState<string>('todas');
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPin, setSelectedPin] = useState<CommunityPhoto | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showCreatePinModal, setShowCreatePinModal] = useState(false);

  useEffect(() => {
    const onSync = () => {
      setOfficialPhotos([...storageService.getOfficialGallery()]);
      setPhotos([...storageService.getCommunityPhotos()]);
      setStations([...storageService.getPointsOfInterest()]);
    };
    window.addEventListener('angachilla:sync', onSync);
    onSync();
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

  useEffect(() => {
    if (isCreatePinOpen) {
      setShowCreatePinModal(true);
    }
  }, [isCreatePinOpen]);

  const handleClosePinModal = () => {
    setShowCreatePinModal(false);
    onCloseCreatePin?.();
  };

  const [savedPinsMap, setSavedPinsMap] = useState<Record<string, boolean>>({});
  const [pinComments, setPinComments] = useState<Record<string, { author: string; text: string; date: string }[]>>({});
  const [newCommentInput, setNewCommentInput] = useState('');

  // Form state for a new pin or official photo
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinPlace, setNewPinPlace] = useState(stations[0]?.name || '');
  const [newPinStationCode, setNewPinStationCode] = useState('S1');
  const [newPinDescription, setNewPinDescription] = useState('');
  const [newPinTag, setNewPinTag] = useState('Aves');
  const [uploadAsOfficial, setUploadAsOfficial] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const stationList = [...stations]
    .filter(s => s.code)
    .sort((a, b) => (a.order ?? stationNumber(a.code!) as number) - (b.order ?? stationNumber(b.code!) as number));
  const stationByCode = new Map(stationList.map(s => [s.code!, s]));
  const stationForPin = (pin: CommunityPhoto) =>
    (pin.stationCodigo && stationByCode.get(pin.stationCodigo)) || stationList.find(s => s.name === pin.visitedPlace);

  const handleToggleSavePin = (pinId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedPinsMap(prev => ({ ...prev, [pinId]: !prev[pinId] }));
    feedApi.toggleSave(pinId).catch(() => {});
  };

  const handleLikePin = (pinId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    storageService.toggleLikePhoto(pinId);
    setPhotos([...storageService.getCommunityPhotos()]);
    if (selectedPin && selectedPin.id === pinId) {
      const updated = storageService.getCommunityPhotos().find(p => p.id === pinId);
      if (updated) setSelectedPin({ ...updated });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setFormError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    // A pin is the visitor's own picture: never stand in a reserve photo for it
    if (!imagePreview) {
      setFormError('Elige una fotografía desde tu dispositivo.');
      return;
    }

    if (currentUser.role === 'admin' && uploadAsOfficial) {
      await storageService.uploadOfficialGalleryPhoto({
        stationCode: newPinStationCode,
        title: newPinTitle || `Fotografía oficial · Estación ${newPinStationCode}`,
        description: newPinDescription || 'Fotografía oficial de la Reserva Comunitaria Humedal Angachilla.',
        dataUrl: imagePreview,
      });
      setOfficialPhotos([...storageService.getOfficialGallery()]);
      setGalleryMode('oficial');
    } else {
      storageService.addCommunityPhoto({
        title: newPinTitle || 'Fotografía en Humedal Angachilla',
        visitedPlace: newPinPlace,
        imageUrl: imagePreview,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        description: newPinDescription || 'Visita a la Reserva Comunitaria Humedal Angachilla.',
        tags: [newPinTag, 'Comunidad'],
        aspectRatio: 'tall',
      });
      setPhotos([...storageService.getCommunityPhotos()]);
      setGalleryMode('comunidad');
    }

    handleClosePinModal();
    setNewPinTitle('');
    setNewPinDescription('');
    setImagePreview(null);
  };

  const handleAddCommentToPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPin || !newCommentInput.trim()) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const text = newCommentInput.trim();
    setPinComments(prev => ({
      ...prev,
      [selectedPin.id]: [...(prev[selectedPin.id] || []), { author: currentUser.name || 'Visitante', text, date: 'Ahora' }],
    }));
    setNewCommentInput('');
    feedApi.addComment(selectedPin.id, text).catch(() => {});
  };

  const q = searchQuery.trim().toLowerCase();

  const filteredOfficialPhotos = officialPhotos.filter(p => {
    if (selectedStationCode !== 'todas' && p.stationCode !== selectedStationCode) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.stationName.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  // Official photos grouped by station, in trail order
  const officialGroups = stationList
    .map(st => ({ station: st, photos: filteredOfficialPhotos.filter(p => p.stationCode === st.code) }))
    .filter(g => g.photos.length > 0);
  const viewerList = officialGroups.flatMap(g => g.photos);
  const viewerPhoto = viewerIndex !== null ? viewerList[viewerIndex] : null;

  const filteredPhotos = photos.filter(p => {
    if (selectedTag === 'guardados') {
      if (!savedPinsMap[p.id]) return false;
    } else if (selectedTag !== 'todos') {
      if (!p.tags?.includes(selectedTag) && !p.title.toLowerCase().includes(selectedTag.toLowerCase())) return false;
    }
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.visitedPlace.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      !!p.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  const photoCountByStation = (code: string) => officialPhotos.filter(p => p.stationCode === code).length;

  // Keyboard for the open viewer or pin
  useEffect(() => {
    if (viewerIndex === null && !selectedPin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewerIndex(null);
        setSelectedPin(null);
      }
      if (viewerIndex !== null && viewerList.length > 1) {
        if (e.key === 'ArrowRight') setViewerIndex((viewerIndex + 1) % viewerList.length);
        if (e.key === 'ArrowLeft') setViewerIndex((viewerIndex - 1 + viewerList.length) % viewerList.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, viewerList.length, selectedPin]);

  const openUpload = () => {
    if (!currentUser) onOpenAuth();
    else setShowCreatePinModal(true);
  };

  const filterChip = (active: boolean) =>
    `h-9 px-3 rounded-md border text-sm font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
    }`;

  return (
    <div className="w-full pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-9">
        {/* Title row */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Galería</h1>
            <p className="mt-1 text-base text-stone-700">
              Fotografías de las 9 estaciones de la reserva y de quienes la visitan.
            </p>
          </div>
          <button
            id="create-pin-button"
            type="button"
            onClick={openUpload}
            className="h-10 px-4 rounded-md bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Subir foto
          </button>
        </header>

        {/* Official / community */}
        <div role="tablist" aria-label="Tipo de fotografías" className="mt-5 flex gap-6 border-b border-stone-300">
          {(
            [
              { id: 'oficial', label: 'Fotos oficiales', count: officialPhotos.length },
              { id: 'comunidad', label: 'De la comunidad', count: photos.length },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={galleryMode === tab.id}
              onClick={() => {
                setGalleryMode(tab.id);
                setSearchQuery('');
              }}
              className={`-mb-px py-2.5 border-b-2 text-sm font-medium transition-colors ${
                galleryMode === tab.id ? 'border-stone-900 text-stone-950' : 'border-transparent text-stone-600 hover:text-stone-950'
              }`}
            >
              {tab.label} <span className="text-stone-500 tabular-nums">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search, then one swipeable row of filters */}
        <div className="mt-4 flex flex-col gap-3">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Buscar fotografías</span>
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder={galleryMode === 'oficial' ? 'Buscar: laguna, mirador, bosque…' : 'Buscar por foto, lugar o autor…'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Borrar búsqueda"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </label>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 w-max pb-1" role="group" aria-label={galleryMode === 'oficial' ? 'Estación' : 'Tema'}>
              {galleryMode === 'oficial' ? (
                <>
                  <button type="button" onClick={() => setSelectedStationCode('todas')} aria-pressed={selectedStationCode === 'todas'} className={filterChip(selectedStationCode === 'todas')}>
                    Todas las estaciones
                  </button>
                  {stationList
                    .filter(st => photoCountByStation(st.code!) > 0)
                    .map(st => (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => setSelectedStationCode(st.code!)}
                        aria-pressed={selectedStationCode === st.code}
                        className={filterChip(selectedStationCode === st.code)}
                      >
                        {stationNumber(st.code!)} · {placeName(st.name)}
                      </button>
                    ))}
                </>
              ) : (
                TOPICS.map(tag => (
                  <button key={tag.id} type="button" onClick={() => setSelectedTag(tag.id)} aria-pressed={selectedTag === tag.id} className={filterChip(selectedTag === tag.id)}>
                    {tag.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Official photos, one block per station */}
        {galleryMode === 'oficial' &&
          (officialGroups.length === 0 ? (
            <div className="mt-8 rounded-md border border-dashed border-stone-300 px-4 py-8 text-center">
              <p className="text-base text-stone-700">No hay fotografías con ese filtro.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedStationCode('todas');
                  setSearchQuery('');
                }}
                className="mt-3 h-10 px-4 rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-sm font-medium text-stone-900"
              >
                Ver todas las estaciones
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-12">
              {officialGroups.map(({ station, photos: list }) => {
                // Layout by count so no row is left with a hole: 3 = one large and two stacked
                const lead = list.length === 3;
                const gridCols =
                  list.length === 1
                    ? 'grid-cols-1'
                    : list.length === 2
                    ? 'grid-cols-2'
                    : lead
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : list.length === 4
                    ? 'grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-2 lg:grid-cols-3';
                return (
                  <section key={station.code} aria-labelledby={`est-${station.code}`}>
                    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                      <div className="min-w-0">
                        <h2 id={`est-${station.code}`} className="text-xl font-semibold tracking-tight text-stone-950">
                          {placeName(station.name)}
                        </h2>
                        <p className="text-sm text-stone-600">
                          Estación {stationNumber(station.code!)}
                          {station.subtitle ? ` · ${station.subtitle}` : ''}
                        </p>
                      </div>
                      {onGoToMapLocation && (
                        <button
                          type="button"
                          onClick={() => onGoToMapLocation(station.coordinates)}
                          className="text-sm font-medium text-stone-900 underline underline-offset-2 hover:text-emerald-900 inline-flex items-center gap-1"
                        >
                          <MapPin className="w-4 h-4 text-stone-500" />
                          Ver en el mapa
                        </button>
                      )}
                    </div>
                    <div className={`mt-3 grid gap-2 sm:gap-3 ${gridCols}`}>
                      {list.map((photo, i) => {
                        const big = lead && i === 0;
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setViewerIndex(viewerList.indexOf(photo))}
                            aria-label={`Ampliar: ${photo.title}`}
                            className={`group relative overflow-hidden rounded-md bg-stone-200 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 ${
                              big ? 'col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto' : list.length === 1 ? 'aspect-[4/3] sm:aspect-[21/9]' : 'aspect-[4/3]'
                            }`}
                          >
                            <img
                              src={resolveMediaUrl(photo.imageUrl)}
                              alt={photo.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ))}

        {/* Community pins: masonry at each photo's own proportions, details always visible */}
        {galleryMode === 'comunidad' &&
          (filteredPhotos.length === 0 ? (
            <div className="mt-8 rounded-md border border-dashed border-stone-300 px-4 py-8 text-center">
              <p className="text-base text-stone-700">
                {selectedTag === 'guardados' ? 'Aún no guardas fotografías.' : 'No hay fotografías con ese filtro.'}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTag('todos');
                    setSearchQuery('');
                  }}
                  className="h-10 px-4 rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-sm font-medium text-stone-900"
                >
                  Ver todas
                </button>
                <button type="button" onClick={openUpload} className="h-10 px-4 rounded-md bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold">
                  Subir la primera
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
              {filteredPhotos.map(photo => (
                <article key={photo.id} className="group mb-5 break-inside-avoid">
                  <button
                    type="button"
                    onClick={() => setSelectedPin(photo)}
                    aria-label={`Ver: ${photo.title}`}
                    className="block w-full overflow-hidden rounded-md bg-stone-200 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900"
                  >
                    <img
                      src={resolveMediaUrl(photo.imageUrl)}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-auto transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </button>
                  <div className="mt-2 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-snug text-stone-950 line-clamp-2">{photo.title}</h3>
                      <p className="mt-0.5 text-[13px] text-stone-600 truncate">
                        {photo.authorName} · {placeName(photo.visitedPlace)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={e => handleLikePin(photo.id, e)}
                      aria-pressed={!!photo.likedByMe}
                      aria-label={`${photo.likedByMe ? 'Quitar me gusta' : 'Me gusta'} (${photo.likes})`}
                      className={`shrink-0 h-8 px-2 -mr-1 rounded-md inline-flex items-center gap-1 text-[13px] tabular-nums transition-colors ${
                        photo.likedByMe ? 'text-rose-700' : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${photo.likedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                      {photo.likes}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ))}
      </div>

      {/* Official photo viewer: whole picture on black, previous / next through the visible set */}
      {viewerPhoto && viewerIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewerPhoto.title}
          className="fixed inset-0 z-[60] bg-stone-950 flex flex-col"
          onClick={() => setViewerIndex(null)}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-stone-300 tabular-nums">
              {viewerIndex + 1} de {viewerList.length}
            </p>
            <button
              type="button"
              onClick={() => setViewerIndex(null)}
              aria-label="Cerrar"
              className="w-10 h-10 rounded-md flex items-center justify-center text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16">
            <img
              src={resolveMediaUrl(viewerPhoto.imageUrl)}
              alt={viewerPhoto.title}
              className="max-w-full max-h-full object-contain"
              onClick={e => e.stopPropagation()}
            />
            {viewerList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setViewerIndex((viewerIndex - 1 + viewerList.length) % viewerList.length);
                  }}
                  aria-label="Foto anterior"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setViewerIndex((viewerIndex + 1) % viewerList.length);
                  }}
                  aria-label="Foto siguiente"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          <div
            className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white pb-[max(1rem,env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="min-w-0">
              <p className="text-base font-semibold">
                {placeName(viewerPhoto.stationName)}{' '}
                <span className="font-normal text-stone-400">· Estación {stationNumber(viewerPhoto.stationCode)}</span>
              </p>
              {viewerPhoto.description && <p className="mt-0.5 text-sm text-stone-300">{viewerPhoto.description}</p>}
            </div>
            {onGoToMapLocation && (
              <button
                type="button"
                onClick={() => {
                  const coords = viewerPhoto.coordinates || stationByCode.get(viewerPhoto.stationCode)?.coordinates;
                  setViewerIndex(null);
                  if (coords) onGoToMapLocation(coords);
                }}
                className="h-10 px-4 rounded-md bg-white text-stone-950 hover:bg-stone-100 text-sm font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <MapPin className="w-4 h-4" />
                Ver en el mapa
              </button>
            )}
          </div>
        </div>
      )}

      {/* Community pin detail */}
      {selectedPin &&
        (() => {
          const pinStation = stationForPin(selectedPin);
          const comments = pinComments[selectedPin.id] || [];
          return (
            <div
              id="pinterest-pin-modal"
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6 bg-stone-950/75"
              onClick={() => setSelectedPin(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="pin-title"
                className="relative bg-white rounded-t-lg sm:rounded-lg max-w-4xl w-full max-h-[92dvh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                onClick={e => e.stopPropagation()}
              >
                <button
                  id="close-pin-modal-button"
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  aria-label="Cerrar"
                  className="absolute top-3 right-3 z-20 w-10 h-10 rounded-md bg-white/95 text-stone-900 hover:bg-white flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="md:w-1/2 bg-stone-950 flex items-center justify-center min-h-[240px] max-h-[45dvh] md:max-h-none">
                  <img src={resolveMediaUrl(selectedPin.imageUrl)} alt={selectedPin.title} className="w-full h-full max-h-[45dvh] md:max-h-[85dvh] object-contain" />
                </div>

                <div className="md:w-1/2 flex flex-col min-h-0">
                  <div className="p-5 sm:p-6 overflow-y-auto">
                    <p className="text-sm text-stone-600">
                      <span className="font-semibold text-stone-900">{selectedPin.authorName}</span> · {selectedPin.date}
                    </p>
                    <h2 id="pin-title" className="mt-1 pr-10 md:pr-0 text-xl sm:text-2xl font-semibold tracking-tight leading-snug text-stone-950">
                      {selectedPin.title}
                    </h2>
                    {selectedPin.description && <p className="mt-2 text-base leading-relaxed text-stone-700">{selectedPin.description}</p>}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLikePin(selectedPin.id)}
                        aria-pressed={!!selectedPin.likedByMe}
                        className={`h-10 px-3 rounded-md border text-sm font-medium inline-flex items-center gap-1.5 tabular-nums transition-colors ${
                          selectedPin.likedByMe ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-stone-300 text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${selectedPin.likedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                        {selectedPin.likes}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSavePin(selectedPin.id)}
                        aria-pressed={!!savedPinsMap[selectedPin.id]}
                        className={`h-10 px-3 rounded-md text-sm font-semibold transition-colors ${
                          savedPinsMap[selectedPin.id] ? 'bg-stone-900 text-white' : 'border border-stone-300 text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        {savedPinsMap[selectedPin.id] ? 'Guardada' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => share(selectedPin.title, resolveMediaUrl(selectedPin.imageUrl))}
                        aria-label="Compartir"
                        className="w-10 h-10 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center justify-center"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <a
                        href={resolveMediaUrl(selectedPin.imageUrl)}
                        target="_blank"
                        rel="noreferrer"
                        download
                        aria-label="Abrir imagen completa"
                        className="w-10 h-10 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center justify-center"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 rounded-md bg-stone-100 px-3.5 py-3">
                      <p className="min-w-0 text-sm">
                        <span className="block font-semibold text-stone-950">{placeName(selectedPin.visitedPlace)}</span>
                        <span className="text-stone-600">
                          {pinStation?.code ? `Estación ${stationNumber(pinStation.code)}` : 'Reserva Comunitaria Humedal Angachilla'}
                        </span>
                      </p>
                      {onGoToMapLocation && pinStation && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPin(null);
                            onGoToMapLocation(pinStation.coordinates);
                          }}
                          className="h-9 px-3 rounded-md bg-white border border-stone-300 hover:bg-stone-50 text-sm font-medium text-stone-900 inline-flex items-center gap-1.5 shrink-0"
                        >
                          <MapPin className="w-4 h-4 text-stone-500" />
                          Ver en el mapa
                        </button>
                      )}
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-stone-950">
                        Comentarios <span className="font-normal text-stone-500 tabular-nums">{comments.length}</span>
                      </h3>
                      {comments.length === 0 ? (
                        <p className="mt-1 text-sm text-stone-600">Sé la primera persona en comentar.</p>
                      ) : (
                        <ul className="mt-2 space-y-3">
                          {comments.map((c, i) => (
                            <li key={i} className="text-sm">
                              <span className="font-semibold text-stone-950">{c.author}</span>{' '}
                              <span className="text-stone-500">{c.date}</span>
                              <p className="mt-0.5 text-stone-700 leading-relaxed">{c.text}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <form
                    onSubmit={handleAddCommentToPin}
                    className="mt-auto px-5 sm:px-6 py-3 border-t border-stone-200 flex items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                  >
                    <label className="sr-only" htmlFor="pin-comment">
                      Escribe un comentario
                    </label>
                    <input
                      id="pin-comment"
                      type="text"
                      placeholder="Escribe un comentario"
                      value={newCommentInput}
                      onChange={e => setNewCommentInput(e.target.value)}
                      className={`${inputClass} h-10`}
                    />
                    <button
                      type="submit"
                      disabled={!newCommentInput.trim()}
                      className="h-10 px-4 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold disabled:bg-stone-300 shrink-0"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Upload a pin, or an official station photo for the guardaparques */}
      {showCreatePinModal && (
        <div
          id="create-pin-modal"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/75"
          onClick={handleClosePinModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            className="bg-white rounded-t-lg sm:rounded-lg max-w-lg w-full p-6 shadow-2xl max-h-[92dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="upload-title" className="text-xl font-semibold tracking-tight text-stone-950">
                  Subir una fotografía
                </h2>
                <p className="mt-0.5 text-sm text-stone-600">Comparte lo que viste en la reserva.</p>
              </div>
              <button
                type="button"
                onClick={handleClosePinModal}
                aria-label="Cerrar"
                className="w-8 h-8 -mr-1 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePin} className="mt-5 space-y-4">
              {currentUser?.role === 'admin' && (
                <label className="flex items-center gap-2.5 rounded-md bg-stone-100 px-3 py-2.5 text-sm font-medium text-stone-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadAsOfficial}
                    onChange={e => setUploadAsOfficial(e.target.checked)}
                    className="w-4 h-4 accent-stone-900"
                  />
                  Subir como fotografía oficial de una estación
                </label>
              )}

              <div>
                <span className={labelClass}>Fotografía</span>
                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-md bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Vista previa" className="w-full max-h-64 object-contain" />
                    <label className="absolute bottom-2 right-2 h-9 px-3 rounded-md bg-white/95 border border-stone-300 text-sm font-medium text-stone-900 inline-flex items-center gap-1.5 cursor-pointer hover:bg-white">
                      <Camera className="w-4 h-4 text-stone-500" />
                      Cambiar
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 h-36 rounded-md border border-dashed border-stone-400 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors">
                    <Camera className="w-6 h-6 text-stone-500" />
                    <span className="text-sm font-medium">Elegir desde tu dispositivo</span>
                    <span className="text-[13px] text-stone-500">o tomar una foto con la cámara</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
                  </label>
                )}
                {formError && <p className="mt-1.5 text-sm text-rose-700">{formError}</p>}
              </div>

              <label className="block">
                <span className={labelClass}>Título</span>
                <input
                  type="text"
                  required
                  placeholder="Cisnes en el Espejo del Angachilla"
                  value={newPinTitle}
                  onChange={e => setNewPinTitle(e.target.value)}
                  className={inputClass}
                />
              </label>

              {uploadAsOfficial && currentUser?.role === 'admin' ? (
                <label className="block">
                  <span className={labelClass}>Estación</span>
                  <select value={newPinStationCode} onChange={e => setNewPinStationCode(e.target.value)} className={inputClass}>
                    {stationList.map(s => (
                      <option key={s.code} value={s.code}>
                        {stationNumber(s.code!)} · {placeName(s.name)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className={labelClass}>Lugar</span>
                    <select value={newPinPlace} onChange={e => setNewPinPlace(e.target.value)} className={inputClass}>
                      {stationList.map(poi => (
                        <option key={poi.id} value={poi.name}>
                          {placeName(poi.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tema</span>
                    <select value={newPinTag} onChange={e => setNewPinTag(e.target.value)} className={inputClass}>
                      <option value="Aves">Aves y fauna</option>
                      <option value="Atardeceres">Paisajes y espejos de agua</option>
                      <option value="Pasarelas">Pasarelas y miradores</option>
                      <option value="Bosque">Bosque y flora nativa</option>
                    </select>
                  </label>
                </div>
              )}

              <label className="block">
                <span className={labelClass}>
                  Descripción <span className="font-normal text-stone-500">(opcional)</span>
                </span>
                <textarea
                  rows={3}
                  placeholder="Qué especie, a qué hora, cómo estaba el sendero…"
                  value={newPinDescription}
                  onChange={e => setNewPinDescription(e.target.value)}
                  className={`${inputClass} h-auto py-2`}
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={handleClosePinModal} className="h-11 px-4 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100">
                  Cancelar
                </button>
                <button type="submit" className="h-11 px-5 rounded-md bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold">
                  Publicar fotografía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
