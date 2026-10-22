'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ZoomIn,
  PlusCircle,
  MapPin,
  CheckCircle2,
  X,
  ShieldCheck,
  Ticket,
  Calendar,
  Camera
} from 'lucide-react';
import { Notice, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { feedApi, resolveMediaUrl } from '../lib/api';
import { pathForTab } from '../lib/tabs';
import { RotatingNewsBanner } from './RotatingNewsBanner';
import { SanctuaryHistorySection } from './SanctuaryHistorySection';
import { EventsSection } from './EventsSection';
import { SponsorBanner } from './SponsorBanner';
import { HomeSidebar } from './HomeSidebar';

interface NoticeBoardProps {
  currentUser: UserType | null;
  onNoticeUpdated?: () => void;
  onOpenAuth?: () => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  initialCreateCategory?: Notice['category'];
  onOpenDonations?: () => void;
  onGoToMapLocation?: (coords: [number, number], routeId?: string) => void;
}

type TopSectionId = 'feed' | 'acerca' | 'calendario';

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  currentUser,
  onNoticeUpdated,
  onOpenAuth,
  isCreateModalOpen,
  onCloseCreateModal,
  initialCreateCategory,
  onOpenDonations,
  onGoToMapLocation
}) => {
  const [notices, setNotices] = useState<Notice[]>(() => storageService.getNotices());
  const [subSection, setSubSection] = useState<TopSectionId>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedNotice, setExpandedNotice] = useState<Notice | null>(null);
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sync with backend when storageService finishes fetching
  useEffect(() => {
    const onSync = () => {
      setNotices([...storageService.getNotices()]);
      setSavedPosts(
        Object.fromEntries(storageService.getSavedNoticeIds().map(id => [id, true]))
      );
    };
    window.addEventListener('angachilla:sync', onSync);
    onSync();
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

  useEffect(() => {
    if (isCreateModalOpen) {
      if (initialCreateCategory) {
        setNewCategory(initialCreateCategory);
      }
      setShowCreateModal(true);
    }
  }, [isCreateModalOpen, initialCreateCategory]);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    onCloseCreateModal?.();
  };

  // Likes & Saved state
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(storageService.getSavedNoticeIds().map(id => [id, true]))
  );
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, { author: string; text: string }[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);

  // Initialize likes & comments from loaded notices
  useEffect(() => {
    const nextLiked: Record<string, boolean> = {};
    const nextCounts: Record<string, number> = {};
    const nextComments: Record<string, { author: string; text: string }[]> = {};

    notices.forEach(n => {
      if (n.likedByMe !== undefined) nextLiked[n.id] = n.likedByMe;
      if (typeof n.likes === 'number') nextCounts[n.id] = n.likes;
      if (Array.isArray(n.comments)) {
        nextComments[n.id] = n.comments.map(c => ({
          author: c.authorName || 'Visitante',
          text: c.text
        }));
      }
    });

    setLikedPosts(prev => ({ ...nextLiked, ...prev }));
    setLikeCounts(prev => ({ ...nextCounts, ...prev }));
    setCommentsMap(prev => ({ ...nextComments, ...prev }));
  }, [notices]);

  // New Notice Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newFullText, setNewFullText] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newCategory, setNewCategory] = useState<Notice['category']>('comunidad');

  const categories = [
    { id: 'all', label: 'Todo el Feed' },
    { id: 'comunidad', label: 'Comunidad' },
    { id: 'biodiversidad', label: 'Biodiversidad y Estaciones' },
    { id: 'alerta', label: 'Alertas y Pasarelas' },
    { id: 'limpieza', label: 'Jornadas de Limpieza' },
    { id: 'taller', label: 'Educación Ambiental' }
  ];

  const filteredNotices = notices.filter(n => {
    if (selectedCategory === 'all') return true;
    return n.category === selectedCategory;
  });

  const toggleLike = (id: string) => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }
    const isLiked = !!likedPosts[id];
    const currentCount = likeCounts[id] ?? notices.find(n => n.id === id)?.likes ?? 1;
    setLikedPosts(prev => ({ ...prev, [id]: !isLiked }));
    setLikeCounts(prev => ({
      ...prev,
      [id]: Math.max(0, currentCount + (isLiked ? -1 : 1))
    }));
    storageService.toggleLikeNotice(id);
  };

  const handleDoubleTap = (id: string) => {
    if (!likedPosts[id]) {
      toggleLike(id);
    }
    setHeartAnimId(id);
    setTimeout(() => {
      setHeartAnimId(null);
    }, 800);
  };

  const toggleSave = (id: string) => {
    const saved = storageService.toggleSavedNotice(id);
    setSavedPosts(Object.fromEntries(saved.map(savedId => [savedId, true])));
  };

  const handleAddComment = (noticeId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }
    const text = newCommentText[noticeId]?.trim();
    if (!text) return;

    const author = currentUser?.name || 'Visitante';
    setCommentsMap(prev => ({
      ...prev,
      [noticeId]: [...(prev[noticeId] || []), { author, text }]
    }));
    setNewCommentText(prev => ({ ...prev, [noticeId]: '' }));

    feedApi.addComment(noticeId, text).catch(() => {});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSummary || !newFullText) return;

    const defaultStationImg = resolveMediaUrl('/api/media/slug/estacion-s1-foto-1');

    if (currentUser?.role === 'admin') {
      storageService.addNotice({
        title: newTitle,
        summary: newSummary,
        fullText: newFullText,
        image: newImage || defaultStationImg,
        category: newCategory,
        author: currentUser?.name || 'Guardaparques Humedal Angachilla'
      });
      setNotices(storageService.getNotices());
      onNoticeUpdated?.();
    } else {
      storageService.addModerationTicket({
        type: 'aviso_novedad',
        authorName: currentUser?.name || 'Vecino/a del Humedal',
        authorEmail: currentUser?.email || 'vecino@angachilla.cl',
        title: newTitle,
        description: `${newSummary} — ${newFullText}`,
        imageUrl: newImage || defaultStationImg,
        locationName: 'Reserva Comunitaria Humedal Angachilla'
      });
      setTicketSuccessMessage(
        '¡Tu publicación fue enviada a revisión! El Comité Ecológico la revisará antes de hacerla pública en el Feed.'
      );
      setTimeout(() => {
        setTicketSuccessMessage(null);
      }, 7000);
    }

    handleCloseCreateModal();
    setNewTitle('');
    setNewSummary('');
    setNewFullText('');
    setNewImage('');
  };

  const getCategoryBadgeClass = (category: Notice['category']) => {
    switch (category) {
      case 'alerta':
        return 'bg-rose-500 text-white';
      case 'biodiversidad':
        return 'bg-emerald-600 text-white';
      case 'limpieza':
        return 'bg-teal-600 text-white';
      case 'taller':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-stone-800 text-white';
    }
  };

  return (
    <div className="w-full min-h-screen pb-20">
      {/* Top 3 Horizontal Navigation Buttons inside Feed: Feed, Acerca de, Calendario */}
      <div className="bg-white/95 backdrop-blur-md border-b border-stone-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-xl lg:max-w-[58rem] mx-auto px-3 lg:px-4 py-2 lg:py-2.5 overflow-x-auto scrollbar-none">
          <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
            <button
              type="button"
              id="top-btn-feed"
              onClick={() => setSubSection('feed')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap ${
                subSection === 'feed'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Feed
            </button>
            <button
              type="button"
              id="top-btn-acerca"
              onClick={() => setSubSection('acerca')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap ${
                subSection === 'acerca'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Acerca de
            </button>
            <button
              type="button"
              id="top-btn-calendario"
              onClick={() => setSubSection('calendario')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap ${
                subSection === 'calendario'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Calendario
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Only visible when viewing Feed) */}
        {subSection === 'feed' && (
          <div className="px-3 py-2 overflow-x-auto scrollbar-none border-t border-stone-100">
            <div className="flex items-center space-x-2 min-w-max max-w-xl lg:max-w-[58rem] lg:px-1 mx-auto">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIEW: CALENDARIO DE ACTIVIDADES (VISTA CALENDARIO + VISTA LISTA + POPUP MODAL) */}
      {subSection === 'calendario' && (
        <div className="max-w-[66rem] mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-in fade-in duration-200 space-y-6">
          <EventsSection
            embedded
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onGoToMapLocation={onGoToMapLocation}
          />
        </div>
      )}

      {/* VIEW: ACERCA DE (RESERVA COMUNITARIA / COMITÉ ECOLÓGICO / ANGACHILLA APP) */}
      {subSection === 'acerca' && (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-in fade-in duration-200">
          <SanctuaryHistorySection
            initialSubTab="reserva"
            onOpenDonations={onOpenDonations}
          />
        </div>
      )}

      {/* VIEW: FEED + SIDEBAR */}
      {subSection === 'feed' && (
        <div className="lg:max-w-[58rem] lg:mx-auto lg:px-4 lg:py-6 lg:grid lg:grid-cols-[minmax(0,36rem)_20rem] lg:justify-between lg:gap-8">
          {/* Main Feed Container */}
          <div className="max-w-xl mx-auto lg:mx-0 lg:max-w-none px-2 sm:px-4 lg:px-0 py-3 sm:py-5 lg:py-0 space-y-4 sm:space-y-6">
            <>
              {/* Thin Rotating Official Notices Bar (Acta Reunión 3 App) */}
              <RotatingNewsBanner
                notices={notices}
                onSelectNotice={notice => setExpandedNotice(notice)}
              />

              {/* Toast / Alert for Citizen Ticket Submission */}
              {ticketSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm flex items-start gap-3 animate-fade-in">
                  <div className="p-2 rounded-xl bg-emerald-200 text-emerald-800 shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <h5 className="font-extrabold text-stone-900 font-display text-sm">
                      Publicación Enviada a Revisión
                    </h5>
                    <p className="mt-0.5 leading-relaxed text-emerald-950 font-medium">
                      {ticketSuccessMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => setTicketSuccessMessage(null)}
                    className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                    aria-label="Cerrar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Admin or user quick post prompt */}
              <div className="bg-white border sm:rounded-2xl border-stone-200/90 p-3 sm:p-4 shadow-sm flex items-center justify-between mx-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-900 p-1.5 flex items-center justify-center flex-shrink-0">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <img
                        src={resolveMediaUrl('/api/media/slug/svg-simbolo-angachilla-app')}
                        alt="Angachilla"
                        className="w-full h-full object-contain brightness-0 invert"
                      />
                    )}
                  </div>
                  <span className="text-xs text-stone-600 font-medium truncate max-w-[210px] sm:max-w-xs">
                    {currentUser
                      ? `Hola ${currentUser.name.split(' ')[0]}, ¿qué viste hoy en el humedal?`
                      : 'Comparte tu avistamiento o fotografía en el Feed comunitario'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!currentUser && onOpenAuth) {
                      onOpenAuth();
                    } else {
                      setShowCreateModal(true);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publicar</span>
                </button>
              </div>

              {/* --- FEED OF POSTS --- */}
              {filteredNotices.map((notice, index) => {
                  const isLiked = !!likedPosts[notice.id];
                  const isSaved = !!savedPosts[notice.id];
                  const likes = likeCounts[notice.id] ?? notice.likes ?? 24;
                  const comments = commentsMap[notice.id] || [];
                  const isCaptionExpanded = !!expandedCaptions[notice.id];

                  return (
                    <React.Fragment key={notice.id}>
                      <article className="bg-white border-y sm:border sm:rounded-3xl border-stone-200/90 shadow-xs overflow-hidden">
                        {/* Post Header */}
                        <div className="p-3 sm:p-3.5 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full p-1.5 bg-emerald-900 flex items-center justify-center shrink-0">
                              <img
                                src={resolveMediaUrl('/api/media/slug/svg-simbolo-angachilla-app')}
                                alt={notice.author}
                                className="w-full h-full object-contain brightness-0 invert"
                              />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 leading-none">
                                  {notice.author || 'Comité Ecológico Angachilla'}
                                </h4>
                                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white flex-shrink-0" />
                              </div>
                              <div className="flex items-center space-x-1 text-[11px] text-stone-500 mt-0.5">
                                <MapPin className="w-3 h-3 text-emerald-700" />
                                <span>Reserva Comunitaria Humedal Angachilla</span>
                                <span>•</span>
                                <span>{notice.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {(notice.category === 'comunidad' || notice.isCommunity) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span className="hidden sm:inline">Verificado</span>
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getCategoryBadgeClass(
                                notice.category
                              )}`}
                            >
                              {notice.category}
                            </span>
                            <button
                              onClick={() => setExpandedNotice(notice)}
                              className="p-1.5 text-stone-400 hover:text-stone-700"
                              title="Ver detalles"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Post Media (Double Tap to Like) */}
                        <div
                          className="relative w-full aspect-square sm:aspect-[4/3] bg-stone-900 overflow-hidden cursor-pointer select-none group"
                          onDoubleClick={() => handleDoubleTap(notice.id)}
                        >
                          <img
                            src={resolveMediaUrl(notice.image)}
                            alt={notice.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            loading={index === 0 ? undefined : 'lazy'}
                          />

                          {/* Double-tap animated heart pop */}
                          {heartAnimId === notice.id && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                              <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl animate-pulse" />
                            </div>
                          )}

                          {/* Lightbox zoom expand button */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setExpandedNotice(notice);
                            }}
                            className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all opacity-90 hover:scale-105"
                            title="Expandir imagen"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Action Row */}
                        <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleLike(notice.id)}
                              className="group transition-transform active:scale-125 focus:outline-none flex items-center gap-1.5"
                              title={isLiked ? 'Quitar Me gusta' : 'Me gusta'}
                            >
                              <Heart
                                className={`w-6 h-6 transition-colors ${
                                  isLiked
                                    ? 'fill-rose-500 text-rose-500'
                                    : 'text-stone-800 hover:text-rose-500'
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => setExpandedNotice(notice)}
                              className="text-stone-800 hover:text-emerald-600 transition-colors"
                              title="Comentar"
                            >
                              <MessageCircle className="w-6 h-6" />
                            </button>

                            <button
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: notice.title,
                                    text: notice.summary,
                                    url: window.location.href
                                  });
                                } else {
                                  navigator.clipboard?.writeText(window.location.href);
                                }
                              }}
                              className="text-stone-800 hover:text-emerald-600 transition-colors"
                              title="Compartir publicación"
                            >
                              <Send className="w-5 h-5 -rotate-12" />
                            </button>
                          </div>

                          <button
                            onClick={() => toggleSave(notice.id)}
                            className="text-stone-800 hover:text-emerald-600 transition-colors focus:outline-none"
                            title={isSaved ? 'Guardado en tu perfil' : 'Guardar publicación'}
                          >
                            <Bookmark
                              className={`w-6 h-6 ${
                                isSaved ? 'fill-stone-900 text-stone-900' : 'text-stone-800'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Likes counter */}
                        <div className="px-3.5 py-1">
                          <span className="text-xs font-black text-stone-900">
                            {likes.toLocaleString('es-CL')} Me gusta
                          </span>
                        </div>

                        {/* Post Title & Description / Caption */}
                        <div className="px-3.5 pb-2 text-xs text-stone-800 leading-relaxed">
                          <h3 className="font-extrabold text-sm text-stone-900 mb-1">
                            {notice.title}
                          </h3>
                          <p className="inline">
                            <span className="font-bold text-stone-900 mr-1.5">
                              {notice.author?.split(' ')[0] || 'Comité'}:
                            </span>
                            {notice.summary}{' '}
                          </p>

                          {notice.fullText && notice.fullText !== notice.summary && (
                            <>
                              {isCaptionExpanded ? (
                                <div className="mt-2 text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                                  {notice.fullText}
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setExpandedCaptions(prev => ({
                                      ...prev,
                                      [notice.id]: true
                                    }))
                                  }
                                  className="text-stone-400 font-semibold hover:text-stone-700 ml-1"
                                >
                                  más
                                </button>
                              )}
                            </>
                          )}

                          <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] font-semibold text-emerald-700">
                            <span>#HumedalAngachilla</span>
                            <span>#ReservaComunitaria</span>
                            <span>#Valdivia</span>
                            <span>#SantuarioNaturaleza</span>
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="px-3.5 pb-2.5 border-t border-stone-100 pt-2 space-y-1">
                          {comments.length > 0 && (
                            <div className="space-y-1">
                              {comments.slice(-3).map((c, i) => (
                                <p key={i} className="text-[11px] text-stone-700">
                                  <span className="font-bold text-stone-900">
                                    {c.author}:
                                  </span>{' '}
                                  {c.text}
                                </p>
                              ))}
                              {comments.length > 3 && (
                                <button
                                  onClick={() => setExpandedNotice(notice)}
                                  className="text-[11px] text-stone-400 font-medium hover:text-stone-700 block"
                                >
                                  Ver los {comments.length} comentarios
                                </button>
                              )}
                            </div>
                          )}

                          {/* Inline Comment Input */}
                          <form
                            onSubmit={e => handleAddComment(notice.id, e)}
                            className="flex items-center pt-1.5 gap-2"
                          >
                            <input
                              type="text"
                              placeholder="Añade un comentario..."
                              value={newCommentText[notice.id] || ''}
                              onChange={e =>
                                setNewCommentText(prev => ({
                                  ...prev,
                                  [notice.id]: e.target.value
                                }))
                              }
                              className="flex-1 text-xs bg-transparent text-stone-800 placeholder-stone-400 focus:outline-none"
                            />
                            {newCommentText[notice.id]?.trim() && (
                              <button
                                type="submit"
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                              >
                                Publicar
                              </button>
                            )}
                          </form>
                        </div>
                      </article>

                      {index === 1 && subSection === 'feed' && (
                        <div className="my-2">
                          <SponsorBanner onOpenDonations={onOpenDonations} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
            </>
          </div>

          <HomeSidebar />
        </div>
      )}

      {/* --- EXPANDED NOTICE MODAL / LIGHTBOX --- */}
      {expandedNotice && (
        <div
          id="expanded-notice-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setExpandedNotice(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-80 w-full bg-stone-900">
              <img
                src={resolveMediaUrl(expandedNotice.image)}
                alt={expandedNotice.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setExpandedNotice(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4">
                <span
                  className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${getCategoryBadgeClass(
                    expandedNotice.category
                  )}`}
                >
                  {expandedNotice.category}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-semibold text-stone-800">
                  {expandedNotice.author}
                </span>
                <span>{expandedNotice.date}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                {expandedNotice.title}
              </h2>

              <p className="text-sm font-semibold text-stone-700 bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl leading-relaxed">
                {expandedNotice.summary}
              </p>

              <div className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {expandedNotice.fullText}
              </div>

              {/* All Comments in Expanded View */}
              {(commentsMap[expandedNotice.id]?.length ?? 0) > 0 && (
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                    Comentarios de la Comunidad
                  </h4>
                  {commentsMap[expandedNotice.id].map((c, idx) => (
                    <div key={idx} className="text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                      <span className="font-bold text-stone-900">{c.author}: </span>
                      <span className="text-stone-700">{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-stone-200 flex justify-end">
                <button
                  onClick={() => setExpandedNotice(null)}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE NOTICE / FEED POST MODAL --- */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={handleCloseCreateModal}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Publicar en el Feed del Humedal
              </h3>
              <button
                onClick={handleCloseCreateModal}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título de la publicación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Avistamiento de Siete Colores en Estación 4"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Categoría
                </label>
                <select
                  value={newCategory}
                  onChange={e =>
                    setNewCategory(e.target.value as Notice['category'])
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="comunidad">Comunidad & Avistamientos</option>
                  <option value="biodiversidad">Biodiversidad & Nidos</option>
                  <option value="alerta">Alertas & Mantención de Pasarelas</option>
                  <option value="limpieza">Jornadas de Limpieza</option>
                  <option value="taller">Talleres & Educación Ambiental</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Resumen corto *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Breve descripción que se verá en el feed..."
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Relato completo y recomendaciones *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalles del lugar, estación visitada o recomendaciones de cuidado..."
                  value={newFullText}
                  onChange={e => setNewFullText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Fotografía
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Subir fotografía desde tu dispositivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {newImage && (
                  <div className="mt-2 h-32 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img src={newImage} alt="Vista previa" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  {currentUser?.role === 'admin' ? 'Publicar Ahora' : 'Enviar a Moderación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
