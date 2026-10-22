'use client';

import React, { useState, useEffect } from 'react';
import {
  Pin,
  Heart,
  MapPin,
  Share2,
  Download,
  Plus,
  X,
  Search,
  Camera,
  ArrowUpRight,
  ShieldCheck,
  Images,
  Users
} from 'lucide-react';
import { CommunityPhoto, OfficialGalleryPhoto, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { feedApi, resolveMediaUrl } from '../lib/api';

interface CommunityGalleryProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onGoToMapLocation?: (coords: [number, number]) => void;
  isCreatePinOpen?: boolean;
  onCloseCreatePin?: () => void;
}

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  currentUser,
  onOpenAuth,
  onGoToMapLocation,
  isCreatePinOpen,
  onCloseCreatePin
}) => {
  const [galleryMode, setGalleryMode] = useState<'oficial' | 'comunidad'>('oficial');
  const [officialPhotos, setOfficialPhotos] = useState<OfficialGalleryPhoto[]>(() =>
    storageService.getOfficialGallery()
  );
  const [selectedStationCode, setSelectedStationCode] = useState<string>('todas');
  const [photos, setPhotos] = useState<CommunityPhoto[]>(() =>
    storageService.getCommunityPhotos()
  );
  const [stations, setStations] = useState(() => storageService.getPointsOfInterest());
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPin, setSelectedPin] = useState<CommunityPhoto | null>(null);
  const [selectedOfficialPhoto, setSelectedOfficialPhoto] = useState<OfficialGalleryPhoto | null>(null);
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
  const [pinComments, setPinComments] = useState<
    Record<string, { author: string; text: string; date: string }[]>
  >({});
  const [newCommentInput, setNewCommentInput] = useState('');

  // Form State for new Pin / Official Photo
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinPlace, setNewPinPlace] = useState(
    stations[0]?.name || 'Estación 1: Mirador Humedal Angachilla'
  );
  const [newPinStationCode, setNewPinStationCode] = useState('S1');
  const [newPinImageUrl, setNewPinImageUrl] = useState('');
  const [newPinDescription, setNewPinDescription] = useState('');
  const [newPinTag, setNewPinTag] = useState('Aves');
  const [uploadAsOfficial, setUploadAsOfficial] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const realFallbackImages = [
    resolveMediaUrl('/api/media/slug/estacion-s1-foto-1'),
    resolveMediaUrl('/api/media/slug/estacion-s2-foto-1'),
    resolveMediaUrl('/api/media/slug/estacion-s3-foto-1'),
    resolveMediaUrl('/api/media/slug/estacion-s4-foto-1'),
    resolveMediaUrl('/api/media/slug/estacion-s5-foto-1'),
    resolveMediaUrl('/api/media/slug/estacion-s6-foto-1')
  ];

  const filterTags = [
    { id: 'todos', label: 'Todos' },
    { id: 'Aves', label: 'Aves y Fauna' },
    { id: 'Atardeceres', label: 'Paisajes' },
    { id: 'Pasarelas', label: 'Pasarelas y Miradores' },
    { id: 'Bosque', label: 'Bosque y Hualves' },
    { id: 'guardados', label: 'Guardados' }
  ];

  const stationFilters = [
    { code: 'todas', label: 'Todas las Estaciones' },
    { code: 'S1', label: 'Est. 1 · Mirador Humedal' },
    { code: 'S2', label: 'Est. 2 · Laguna de los Pinos' },
    { code: 'S3', label: 'Est. 3 · Espejo del Angachilla' },
    { code: 'S4', label: 'Est. 4 · Totoral del Santuario' },
    { code: 'S5', label: 'Est. 5 · Bosque Los Canelos' },
    { code: 'S6', label: 'Est. 6 · Vega de la Garza' },
    { code: 'E7', label: 'Est. 7 · Placita de la Resistencia' },
    { code: 'E8', label: 'Est. 8 · Auditorio Vivo' },
    { code: 'E9', label: 'Est. 9 · Espacio de Reflexión' }
  ];

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
        const result = reader.result as string;
        setImagePreview(result);
        setNewPinImageUrl(result);
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

    const finalImage =
      newPinImageUrl ||
      imagePreview ||
      realFallbackImages[Math.floor(Math.random() * realFallbackImages.length)];

    if (currentUser.role === 'admin' && uploadAsOfficial) {
      await storageService.uploadOfficialGalleryPhoto({
        stationCode: newPinStationCode,
        title: newPinTitle || `Fotografía Oficial · Estación ${newPinStationCode}`,
        description: newPinDescription || 'Fotografía oficial de la Reserva Comunitaria Humedal Angachilla.',
        dataUrl: finalImage
      });
      setOfficialPhotos([...storageService.getOfficialGallery()]);
      setGalleryMode('oficial');
    } else {
      storageService.addCommunityPhoto({
        title: newPinTitle || 'Fotografía en Humedal Angachilla',
        visitedPlace: newPinPlace,
        imageUrl: finalImage,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        description: newPinDescription || 'Visita a la Reserva Comunitaria Humedal Angachilla.',
        tags: [newPinTag, 'Comunidad'],
        aspectRatio: 'tall'
      });
      setPhotos([...storageService.getCommunityPhotos()]);
      setGalleryMode('comunidad');
    }

    handleClosePinModal();
    setNewPinTitle('');
    setNewPinDescription('');
    setNewPinImageUrl('');
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
      [selectedPin.id]: [
        ...(prev[selectedPin.id] || []),
        {
          author: currentUser.name || 'Visitante',
          text,
          date: 'Ahora'
        }
      ]
    }));
    setNewCommentInput('');
    feedApi.addComment(selectedPin.id, text).catch(() => {});
  };

  // Filter official gallery photos
  const filteredOfficialPhotos = officialPhotos.filter(p => {
    if (selectedStationCode !== 'todas' && p.stationCode !== selectedStationCode) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.stationName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter community photos
  const filteredPhotos = photos.filter(p => {
    if (selectedTag === 'guardados') {
      if (!savedPinsMap[p.id]) return false;
    } else if (selectedTag !== 'todos') {
      if (
        !p.tags?.includes(selectedTag) &&
        !p.title.toLowerCase().includes(selectedTag.toLowerCase())
      ) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchPlace = p.visitedPlace.toLowerCase().includes(q);
      const matchAuthor = p.authorName.toLowerCase().includes(q);
      const matchTag = p.tags?.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchPlace || matchAuthor || matchTag;
    }

    return true;
  });

  return (
    <div className="w-full min-h-screen bg-stone-50 pb-20">
      {/* --- TOP BAR: MODE SWITCHER (OFICIAL POR ESTACIÓN vs COMUNIDAD MONGODB) + SEARCH --- */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Segmented Toggle: Galería Oficial vs Pines de la Comunidad */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setGalleryMode('oficial')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                galleryMode === 'oficial'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>Galería Oficial por Estación</span>
            </button>
            <button
              type="button"
              onClick={() => setGalleryMode('comunidad')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                galleryMode === 'comunidad'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pines de la Comunidad</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  galleryMode === 'oficial'
                    ? 'Buscar por estación, mirador, laguna o bosque...'
                    : 'Buscar pines de la comunidad...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-full bg-stone-100 hover:bg-stone-200/80 focus:bg-white border border-transparent focus:border-stone-300 text-xs text-stone-800 placeholder-stone-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="create-pin-button"
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else setShowCreatePinModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Subir Foto</span>
            </button>
          </div>
        </div>

        {/* Station Filter Pills (when in Official Gallery mode) or Topic Pills (when in Community mode) */}
        <div className="max-w-7xl mx-auto mt-2.5 flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
          {galleryMode === 'oficial'
            ? stationFilters.map(st => (
                <button
                  key={st.code}
                  onClick={() => setSelectedStationCode(st.code)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedStationCode === st.code
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {st.label}
                </button>
              ))
            : filterTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedTag === tag.id
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
        </div>
      </div>

      {/* --- VIEW 1: GALERÍA OFICIAL DE LA RESERVA (19 FOTOS DE LAS 9 ESTACIONES) --- */}
      {galleryMode === 'oficial' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {filteredOfficialPhotos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
              <Camera className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">
                Sin fotografías en este filtro
              </h3>
              <button
                onClick={() => {
                  setSelectedStationCode('todas');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-bold"
              >
                Ver todas las estaciones
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredOfficialPhotos.map(photo => (
                <article
                  key={photo.id}
                  onClick={() => setSelectedOfficialPhoto(photo)}
                  className="group bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-zoom-in flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-stone-200 overflow-hidden">
                    <img
                      src={resolveMediaUrl(photo.imageUrl)}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950/85 text-white backdrop-blur-md">
                        Estación {photo.stationCode}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-stone-900 leading-snug">
                        {photo.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {photo.description || photo.stationName}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        Archivo Oficial Reserva Angachilla
                      </span>
                      <span>Ver foto ›</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- VIEW 2: PINTEREST MASONRY GRID (COMUNIDAD MONGODB) --- */}
      {galleryMode === 'comunidad' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
              <Camera className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No se encontraron pines</h3>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Prueba con otro filtro o sube la primera foto de este rincón del humedal.
              </p>
              <button
                onClick={() => {
                  setSelectedTag('todos');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-bold"
              >
                Ver todos los pines
              </button>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3.5 sm:gap-4 space-y-3.5 sm:space-y-4">
              {filteredPhotos.map((photo, index) => {
                const isSaved = !!savedPinsMap[photo.id];
                const heightRatios = [
                  'aspect-[3/4]',
                  'aspect-[4/5]',
                  'aspect-[1/1]',
                  'aspect-[4/3]'
                ];
                const assignedRatio =
                  photo.aspectRatio === 'tall'
                    ? 'aspect-[3/4]'
                    : photo.aspectRatio === 'wide'
                    ? 'aspect-[4/3]'
                    : heightRatios[index % heightRatios.length];

                return (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPin(photo)}
                    className="break-inside-avoid group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-zoom-in bg-stone-200 shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`relative w-full ${assignedRatio} overflow-hidden bg-stone-100`}>
                      <img
                        src={resolveMediaUrl(photo.imageUrl)}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 truncate max-w-[120px]">
                          <MapPin className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{photo.visitedPlace.split(':')[0]}</span>
                        </span>

                        <button
                          onClick={e => handleToggleSavePin(photo.id, e)}
                          className={`pointer-events-auto px-3 py-1.5 rounded-full text-xs font-black shadow-lg transition-transform active:scale-90 ${
                            isSaved
                              ? 'bg-stone-900 text-white hover:bg-black'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {isSaved ? 'Guardado' : 'Guardar'}
                        </button>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-white text-[11px] font-medium max-w-[140px] truncate">
                          <img
                            src={
                              photo.authorAvatar
                                ? resolveMediaUrl(photo.authorAvatar)
                                : resolveMediaUrl('/api/media/slug/svg-simbolo-angachilla-app')
                            }
                            alt={photo.authorName}
                            className="w-4 h-4 rounded-full object-cover bg-emerald-900"
                          />
                          <span className="truncate">{photo.authorName}</span>
                        </div>

                        <div className="flex items-center gap-1 pointer-events-auto">
                          <button
                            onClick={e => handleLikePin(photo.id, e)}
                            className={`p-1.5 rounded-full backdrop-blur-md transition-all active:scale-125 ${
                              photo.likedByMe
                                ? 'bg-rose-500 text-white'
                                : 'bg-white/80 text-stone-800 hover:bg-white'
                            }`}
                            title="Me gusta (1 por usuario)"
                          >
                            <Heart className={`w-3.5 h-3.5 ${photo.likedByMe ? 'fill-white' : ''}`} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (navigator.share) {
                                navigator.share({ title: photo.title, url: photo.imageUrl });
                              } else {
                                navigator.clipboard?.writeText(window.location.href);
                              }
                            }}
                            className="p-1.5 rounded-full bg-white/80 text-stone-800 hover:bg-white backdrop-blur-md transition-all active:scale-95"
                            title="Compartir"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 bg-white">
                      <h4 className="text-xs font-bold text-stone-900 line-clamp-1 leading-snug">
                        {photo.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-stone-500">
                        <span className="truncate max-w-[110px]">{photo.authorName}</span>
                        <span className="flex items-center gap-0.5 font-bold text-stone-700">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span>{photo.likes}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- OFFICIAL PHOTO LIGHTBOX MODAL --- */}
      {selectedOfficialPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedOfficialPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] bg-stone-950">
              <img
                src={resolveMediaUrl(selectedOfficialPhoto.imageUrl)}
                alt={selectedOfficialPhoto.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedOfficialPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 text-stone-900 hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  Estación {selectedOfficialPhoto.stationCode} · {selectedOfficialPhoto.stationName}
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1.5">
                  {selectedOfficialPhoto.title}
                </h3>
                {selectedOfficialPhoto.description && (
                  <p className="text-xs text-stone-600 mt-1">
                    {selectedOfficialPhoto.description}
                  </p>
                )}
              </div>
              {onGoToMapLocation && (
                <button
                  onClick={() => {
                    const st = stations.find(s => s.code === selectedOfficialPhoto.stationCode);
                    setSelectedOfficialPhoto(null);
                    onGoToMapLocation(st?.coordinates || [-39.8565, -73.2385]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Ir a esta Estación en el Mapa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PINTEREST DETAILED PIN MODAL --- */}
      {selectedPin && (
        <div
          id="pinterest-pin-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPin(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-stone-200 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              id="close-pin-modal-button"
              onClick={() => setSelectedPin(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative md:w-1/2 bg-stone-950 flex items-center justify-center overflow-hidden min-h-[280px] md:min-h-[480px]">
              <img
                src={resolveMediaUrl(selectedPin.imageUrl)}
                alt={selectedPin.title}
                className="w-full h-full object-cover max-h-[75vh]"
              />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedPin.visitedPlace}</span>
                </span>

                <a
                  href={resolveMediaUrl(selectedPin.imageUrl)}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 transition-colors"
                  title="Abrir imagen completa"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLikePin(selectedPin.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        selectedPin.likedByMe
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${selectedPin.likedByMe ? 'fill-rose-600' : ''}`} />
                      <span>{selectedPin.likes}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: selectedPin.title, url: selectedPin.imageUrl });
                        } else {
                          navigator.clipboard?.writeText(window.location.href);
                        }
                      }}
                      className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                      title="Compartir Pin"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleSavePin(selectedPin.id)}
                    className={`px-5 py-2 rounded-full text-xs font-extrabold shadow-md transition-all active:scale-95 ${
                      savedPinsMap[selectedPin.id]
                        ? 'bg-stone-900 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {savedPinsMap[selectedPin.id] ? 'Guardado' : 'Guardar Pin'}
                  </button>
                </div>

                <div className="flex items-center space-x-3 my-4">
                  <img
                    src={
                      selectedPin.authorAvatar
                        ? resolveMediaUrl(selectedPin.authorAvatar)
                        : resolveMediaUrl('/api/media/slug/svg-simbolo-angachilla-app')
                    }
                    alt={selectedPin.authorName}
                    className="w-10 h-10 rounded-full object-cover border bg-emerald-900 p-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-extrabold text-sm text-stone-900 leading-none">
                      {selectedPin.authorName}
                    </h5>
                    <span className="text-[11px] text-stone-500">
                      Comunidad Humedal Angachilla • {selectedPin.date}
                    </span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                  {selectedPin.title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  {selectedPin.description}
                </p>

                {selectedPin.tags && selectedPin.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedPin.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-emerald-900">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">{selectedPin.visitedPlace}</span>
                      <span className="text-[11px] text-emerald-700">Reserva Comunitaria Humedal Angachilla</span>
                    </div>
                  </div>

                  {onGoToMapLocation && (
                    <button
                      onClick={() => {
                        setSelectedPin(null);
                        onGoToMapLocation([-39.8562, -73.2392]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <span>Ver en Mapa</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Comentarios ({(pinComments[selectedPin.id] || []).length})
                  </h4>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {(pinComments[selectedPin.id] || []).map((c, i) => (
                      <div
                        key={i}
                        className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100"
                      >
                        <div className="flex items-center justify-between font-bold text-stone-900 mb-0.5">
                          <span>{c.author}</span>
                          <span className="text-[10px] text-stone-400 font-normal">{c.date}</span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleAddCommentToPin}
                className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Escribe un comentario sobre esta fotografía..."
                  value={newCommentInput}
                  onChange={e => setNewCommentInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-full bg-stone-100 border border-transparent focus:border-stone-300 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newCommentInput.trim()}
                  className="px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold disabled:opacity-40"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE PIN / UPLOAD OFFICIAL STATION PHOTO MODAL --- */}
      {showCreatePinModal && (
        <div
          id="create-pin-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
          onClick={handleClosePinModal}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Pin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Subir Fotografía a la Galería
                </h3>
              </div>
              <button
                onClick={handleClosePinModal}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePin} className="mt-4 space-y-3.5">
              {currentUser?.role === 'admin' && (
                <label className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadAsOfficial}
                    onChange={e => setUploadAsOfficial(e.target.checked)}
                    className="rounded text-emerald-700"
                  />
                  <span>
                    Subir como Fotografía Oficial de Estación
                  </span>
                </label>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Fotografía desde tu dispositivo *
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer w-full px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 border border-stone-300">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Seleccionar archivo de imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {imagePreview && (
                <div className="h-36 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título de la fotografía *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cisnes de cuello negro en el Espejo del Angachilla"
                  value={newPinTitle}
                  onChange={e => setNewPinTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {uploadAsOfficial && currentUser?.role === 'admin' ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Estación Oficial Asociada *
                  </label>
                  <select
                    value={newPinStationCode}
                    onChange={e => setNewPinStationCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {stationFilters
                      .filter(s => s.code !== 'todas')
                      .map(s => (
                        <option key={s.code} value={s.code}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Estación o Sendero visitado *
                  </label>
                  <select
                    value={newPinPlace}
                    onChange={e => setNewPinPlace(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {stations.map(poi => (
                      <option key={poi.id} value={poi.name}>
                        {poi.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!uploadAsOfficial && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newPinTag}
                    onChange={e => setNewPinTag(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Aves">Aves y Fauna</option>
                    <option value="Atardeceres">Paisajes y Espejos de Agua</option>
                    <option value="Pasarelas">Pasarelas y Miradores</option>
                    <option value="Bosque">Bosque y Flora Nativa</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Comparte detalles de la estación o especie fotografiada..."
                  value={newPinDescription}
                  onChange={e => setNewPinDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleClosePinModal}
                  className="px-4 py-2 rounded-full bg-stone-100 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md"
                >
                  Guardar Fotografía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
