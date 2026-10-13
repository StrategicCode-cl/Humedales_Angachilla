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
  Check,
  Camera,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  Bookmark,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { CommunityPhoto, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { POINTS_OF_INTEREST } from '../data/mockData';

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
  const [photos, setPhotos] = useState<CommunityPhoto[]>(storageService.getCommunityPhotos());
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPin, setSelectedPin] = useState<CommunityPhoto | null>(null);
  const [showCreatePinModal, setShowCreatePinModal] = useState(false);

  useEffect(() => {
    if (isCreatePinOpen) {
      setShowCreatePinModal(true);
    }
  }, [isCreatePinOpen]);

  const handleClosePinModal = () => {
    setShowCreatePinModal(false);
    onCloseCreatePin?.();
  };
  const [savedPinsMap, setSavedPinsMap] = useState<Record<string, boolean>>({
    'photo-1': true,
    'photo-3': true,
    'photo-5': true
  });

  // Comments for Pin Sheet
  const [pinComments, setPinComments] = useState<Record<string, { author: string; text: string; date: string }[]>>({
    'photo-1': [
      { author: 'Camila Rosas', text: '¡Qué luz tan maravillosa! ¿A qué hora fue tomada?', date: 'Ayer' },
      { author: 'Francisca Morales', text: 'Cerca de las 7:30 AM cuando la neblina comienza a subir.', date: 'Ayer' }
    ],
    'photo-2': [
      { author: 'Rodrigo Fuentes', text: 'Ver un huillín es un privilegio único en Valdivia.', date: 'Hace 3 días' }
    ]
  });
  const [newCommentInput, setNewCommentInput] = useState('');

  // Form State for new Pin
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinPlace, setNewPinPlace] = useState(POINTS_OF_INTEREST[0].name);
  const [newPinImageUrl, setNewPinImageUrl] = useState('');
  const [newPinDescription, setNewPinDescription] = useState('');
  const [newPinTag, setNewPinTag] = useState('Aves');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const sampleImages = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1518992028580-6d97bdca06c3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80'
  ];

  const filterTags = [
    { id: 'todos', label: '📌 Todos' },
    { id: 'Aves', label: '🦢 Aves & Cisnes' },
    { id: 'Atardeceres', label: '🌅 Atardeceres' },
    { id: 'Pasarelas', label: '🌉 Pasarelas' },
    { id: 'Kayak', label: '🚣 Kayak' },
    { id: 'Bosque', label: '🌿 Bosque & Hualves' },
    { id: 'guardados', label: '❤️ Mis Pines' }
  ];

  const handleToggleSavePin = (pinId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedPinsMap(prev => ({ ...prev, [pinId]: !prev[pinId] }));
  };

  const handleLikePin = (pinId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    storageService.toggleLikePhoto(pinId);
    setPhotos(storageService.getCommunityPhotos());
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

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const finalImage = newPinImageUrl || imagePreview || sampleImages[Math.floor(Math.random() * sampleImages.length)];
    const created = storageService.addCommunityPhoto({
      title: newPinTitle || 'Fotografía en Humedal Angachilla',
      visitedPlace: newPinPlace,
      imageUrl: finalImage,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      description: newPinDescription || 'Visita al Santuario Humedal Angachilla.',
      tags: [newPinTag, 'Comunidad'],
      aspectRatio: 'tall'
    });

    setPhotos(storageService.getCommunityPhotos());
    handleClosePinModal();
    setNewPinTitle('');
    setNewPinDescription('');
    setNewPinImageUrl('');
    setImagePreview(null);
  };

  const handleAddCommentToPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPin || !newCommentInput.trim()) return;

    setPinComments(prev => ({
      ...prev,
      [selectedPin.id]: [
        ...(prev[selectedPin.id] || []),
        {
          author: currentUser?.name || 'Visitante',
          text: newCommentInput.trim(),
          date: 'Ahora'
        }
      ]
    }));
    setNewCommentInput('');
  };

  // Filter photos
  const filteredPhotos = photos.filter(p => {
    if (selectedTag === 'guardados') {
      if (!savedPinsMap[p.id]) return false;
    } else if (selectedTag !== 'todos') {
      if (!p.tags?.includes(selectedTag) && !p.title.toLowerCase().includes(selectedTag.toLowerCase())) {
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
      {/* --- PINTEREST TOP SEARCH & ACTION BAR --- */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Search Input (Pinterest style pill) */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar pines: cisnes, pasarelas, atardeceres..."
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

          {/* Pinterest "Crear Pin" Red Button */}
          <button
            id="create-pin-button"
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setShowCreatePinModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-950/20 active:scale-95 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Crear Pin</span>
            <span className="sm:hidden">Pin</span>
          </button>
        </div>

        {/* Pinterest Filter Topic Pills */}
        <div className="max-w-7xl mx-auto mt-2.5 flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
          {filterTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedTag === tag.id
                  ? 'bg-stone-900 text-white shadow-sm scale-105'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- PINTEREST MASONRY GRID --- */}
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
              // Staggered heights for realistic Pinterest masonry
              const heightRatios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[1/1]', 'aspect-[9/16]', 'aspect-[4/3]'];
              const assignedRatio = photo.aspectRatio === 'tall' ? 'aspect-[3/4]' : photo.aspectRatio === 'wide' ? 'aspect-[4/3]' : heightRatios[index % heightRatios.length];

              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPin(photo)}
                  className="break-inside-avoid group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-zoom-in bg-stone-200 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Pin Image */}
                  <div className={`relative w-full ${assignedRatio} overflow-hidden bg-stone-100`}>
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Dark gradient overlay on hover / tap */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* TOP CONTROLS (Pinterest Red "Guardar" Button) */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 truncate max-w-[120px]">
                        <MapPin className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{photo.visitedPlace.split(' ')[0]}</span>
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

                    {/* BOTTOM CONTROLS ON HOVER */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-white text-[11px] font-medium max-w-[140px] truncate">
                        <img
                          src={photo.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={photo.authorName}
                          className="w-4 h-4 rounded-full object-cover"
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
                          title="Me gusta"
                        >
                          <Heart className={`w-3.5 h-3.5 ${photo.likedByMe ? 'fill-white' : ''}`} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (navigator.share) {
                              navigator.share({ title: photo.title, url: photo.imageUrl });
                            } else {
                              alert('Enlace del pin copiado.');
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

                  {/* Pin Caption underneath (Pinterest style) */}
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

      {/* --- PINTEREST DETAILED PIN MODAL (Split View Sheet) --- */}
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
            {/* Close Button Floating */}
            <button
              id="close-pin-modal-button"
              onClick={() => setSelectedPin(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: High-Res Pin Image */}
            <div className="relative md:w-1/2 bg-stone-950 flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[500px]">
              <img
                src={selectedPin.imageUrl}
                alt={selectedPin.title}
                className="w-full h-full object-cover max-h-[75vh]"
              />

              {/* Quick overlay buttons */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedPin.visitedPlace}</span>
                </span>

                <a
                  href={selectedPin.imageUrl}
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

            {/* Right Column: Pin Details & Community Conversation */}
            <div className="md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
              <div>
                {/* Top Action Row */}
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
                          alert('Enlace copiado.');
                        }
                      }}
                      className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                      title="Compartir Pin"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Red Pinterest Save Button */}
                  <button
                    onClick={() => handleToggleSavePin(selectedPin.id)}
                    className={`px-5 py-2 rounded-full text-xs font-extrabold shadow-md transition-all active:scale-95 ${
                      savedPinsMap[selectedPin.id]
                        ? 'bg-stone-900 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {savedPinsMap[selectedPin.id] ? 'Guardado en Mi Tablero' : 'Guardar Pin'}
                  </button>
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-3 my-4">
                  <img
                    src={selectedPin.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={selectedPin.authorName}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div className="flex-1">
                    <h5 className="font-extrabold text-sm text-stone-900 leading-none">
                      {selectedPin.authorName}
                    </h5>
                    <span className="text-[11px] text-stone-500">Fotógrafo de la Comunidad • {selectedPin.date}</span>
                  </div>
                </div>

                {/* Title & Description */}
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                  {selectedPin.title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  {selectedPin.description}
                </p>

                {/* Tags */}
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

                {/* Map Location Link (Waze Action) */}
                <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-emerald-900">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">{selectedPin.visitedPlace}</span>
                      <span className="text-[11px] text-emerald-700">Ruta guiada y punto Waze</span>
                    </div>
                  </div>

                  {onGoToMapLocation && (
                    <button
                      onClick={() => {
                        setSelectedPin(null);
                        onGoToMapLocation([-39.8515, -73.2260]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <span>Ver en Mapa</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Comments Section */}
                <div className="mt-5 pt-4 border-t border-stone-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Comentarios ({(pinComments[selectedPin.id] || []).length})
                  </h4>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {(pinComments[selectedPin.id] || []).map((c, i) => (
                      <div key={i} className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
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

              {/* Add Comment Input */}
              <form onSubmit={handleAddCommentToPin} className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe un comentario sobre este pin..."
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

      {/* --- CREATE PIN MODAL --- */}
      {showCreatePinModal && (
        <div
          id="create-pin-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
          onClick={handleClosePinModal}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Pin className="w-4 h-4 fill-rose-600" />
                </div>
                <h3 className="text-base font-extrabold text-stone-900">Crear un Nuevo Pin</h3>
              </div>
              <button
                onClick={handleClosePinModal}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePin} className="mt-4 space-y-3.5">
              {/* Image selection / Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Fotografía de tu visita *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="URL de la imagen (ej: https://...)"
                    value={newPinImageUrl}
                    onChange={e => {
                      setNewPinImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 border border-stone-300 flex-shrink-0">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Subir</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="h-36 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título del Pin *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pasarela de los cisnes al atardecer"
                  value={newPinTitle}
                  onChange={e => setNewPinTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Lugar visitado en el Humedal *
                </label>
                <select
                  value={newPinPlace}
                  onChange={e => setNewPinPlace(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {POINTS_OF_INTEREST.map(poi => (
                    <option key={poi.id} value={poi.name}>
                      {poi.name}
                    </option>
                  ))}
                  <option value="Sendero Los Cisnes">Sendero Los Cisnes</option>
                  <option value="Circuito Bosque de Hualves">Circuito Bosque de Hualves</option>
                  <option value="Río Angachilla Kayak">Río Angachilla Kayak</option>
                </select>
              </div>

              {/* Tag Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Categoría del Tablero
                </label>
                <select
                  value={newPinTag}
                  onChange={e => setNewPinTag(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Aves">🦢 Aves y Fauna</option>
                  <option value="Atardeceres">🌅 Atardeceres y Horizontes</option>
                  <option value="Pasarelas">🌉 Pasarelas y Miradores</option>
                  <option value="Kayak">🚣 Kayak y Río</option>
                  <option value="Bosque">🌿 Bosque y Flora Nativa</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Descripción o consejo de caminante
                </label>
                <textarea
                  rows={2}
                  placeholder="Comparte detalles de la visita, cómo llegar o qué especies viste..."
                  value={newPinDescription}
                  onChange={e => setNewPinDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-950/20"
                >
                  Publicar Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
