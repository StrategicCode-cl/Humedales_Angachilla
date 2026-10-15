'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Share2,
  ZoomIn,
  PlusCircle,
  MapPin,
  Sparkles,
  CheckCircle2,
  X,
  ChevronRight,
  ShieldCheck,
  Ticket,
  Clock
} from 'lucide-react';
import { Notice, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { RotatingNewsBanner } from './RotatingNewsBanner';
import { SanctuaryHistorySection } from './SanctuaryHistorySection';
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
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  currentUser,
  onNoticeUpdated,
  onOpenAuth,
  isCreateModalOpen,
  onCloseCreateModal,
  initialCreateCategory,
  onOpenDonations
}) => {
  const [notices, setNotices] = useState<Notice[]>(storageService.getNotices());
  const [subSection, setSubSection] = useState<'feed' | 'historia' | 'oficiales'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedNotice, setExpandedNotice] = useState<Notice | null>(null);
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Instagram interactions state
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({
    'not-1': 142,
    'not-2': 98,
    'not-3': 76,
    'not-4': 114
  });
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, string[]>>({
    'not-1': ['¡Qué hermosa iniciativa!', 'Estaremos presentes con la familia el sábado.'],
    'not-2': ['Gracias por el aviso, cuidemos a los cisnes.', 'Hermosa foto del nido.'],
    'not-3': ['Excelente, nos sumamos a la jornada de limpieza.'],
    'not-4': ['Importante precaución por las mareas.']
  });
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);

  // New Notice Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newFullText, setNewFullText] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newCategory, setNewCategory] = useState<Notice['category']>('comunidad');

  const categories = [
    { id: 'all', label: '🔥 Todo' },
    { id: 'comunidad', label: '👥 Noticias Comunidad (Aprobadas)' },
    { id: 'biodiversidad', label: '🦢 Biodiversidad & Cisnes' },
    { id: 'alerta', label: '🚨 Alertas & Pasarelas' },
    { id: 'limpieza', label: '🧹 Jornadas de Limpieza' },
    { id: 'taller', label: '🌱 Talleres & Educación' }
  ];

  const filteredNotices = notices.filter(n => {
    if (selectedCategory === 'all') return true;
    return n.category === selectedCategory;
  });

  const toggleLike = (id: string) => {
    const isLiked = !!likedPosts[id];
    setLikedPosts(prev => ({ ...prev, [id]: !isLiked }));
    setLikeCounts(prev => ({
      ...prev,
      [id]: (prev[id] || 80) + (isLiked ? -1 : 1)
    }));
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
    setSavedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (noticeId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentText[noticeId]?.trim();
    if (!text) return;

    setCommentsMap(prev => ({
      ...prev,
      [noticeId]: [...(prev[noticeId] || []), `${currentUser?.name || 'Visitante'}: ${text}`]
    }));
    setNewCommentText(prev => ({ ...prev, [noticeId]: '' }));
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSummary || !newFullText) return;

    const fallbackImg =
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';

    if (currentUser?.role === 'admin') {
      storageService.addNotice({
        title: newTitle,
        summary: newSummary,
        fullText: newFullText,
        image: newImage || fallbackImg,
        category: newCategory,
        author: currentUser?.name || 'Guardaparques Humedal Angachilla'
      });
      setNotices(storageService.getNotices());
      onNoticeUpdated?.();
    } else {
      // PDF 15-Sept-2026: Flujo de moderación previa mediante tickets para aportes ciudadanos
      storageService.addModerationTicket({
        type: 'aviso_novedad',
        authorName: currentUser?.name || 'Vecino/a del Humedal',
        authorEmail: currentUser?.email || 'vecino@angachilla.cl',
        title: newTitle,
        description: `${newSummary} — ${newFullText}`,
        imageUrl: newImage || fallbackImg,
        locationName: 'Santuario de la Naturaleza Humedal Angachilla'
      });
      setTicketSuccessMessage(
        '¡Tu publicación ha sido enviada al Comité como solicitud/ticket! Los administradores y guardaparques la revisarán antes de hacerla pública.'
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
    <div className="w-full min-h-screen bg-stone-50 pb-20">
      {/* Top Segmented Sub-navigation (Tactile Surface) */}
      <div className="bg-white border-b border-stone-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-xl lg:max-w-[58rem] mx-auto px-3 lg:px-4 py-2 lg:py-3">
          <div className="lg:max-w-xl flex items-center justify-between gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setSubSection('feed')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                subSection === 'feed'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Feed Humedal
            </button>
            <button
              onClick={() => setSubSection('historia')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                subSection === 'historia'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Historia & Comité
            </button>
            <button
              onClick={() => setSubSection('oficiales')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                subSection === 'oficiales'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Avisos Oficiales
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

      {/* Desktop: feed + columna lateral */}
      <div className="lg:max-w-[58rem] lg:mx-auto lg:px-4 lg:py-6 lg:grid lg:grid-cols-[minmax(0,36rem)_20rem] lg:justify-between lg:gap-8">
      {/* Main Feed Container */}
      <div className="max-w-xl mx-auto lg:mx-0 lg:max-w-none px-2 sm:px-4 lg:px-0 py-3 sm:py-5 lg:py-0 space-y-4 sm:space-y-6">
        {/* VIEW: HISTORIA Y COMITÉ */}
        {subSection === 'historia' && (
          <div className="animate-in fade-in duration-200">
            <SanctuaryHistorySection onOpenDonations={onOpenDonations} />
          </div>
        )}

        {/* VIEW: FEED & OFICIALES */}
        {subSection !== 'historia' && (
          <>
            {/* Compact Alert Bar */}
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
                Solicitud / Ticket Enviado Exitosamente
              </h5>
              <p className="mt-0.5 leading-relaxed text-emerald-950 font-medium">
                {ticketSuccessMessage}
              </p>
            </div>
            <button
              onClick={() => setTicketSuccessMessage(null)}
              className="text-stone-400 hover:text-stone-700 text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Admin or user quick post prompt */}
        {currentUser && (
          <div className="bg-white border sm:rounded-2xl border-stone-200/90 p-3 sm:p-4 shadow-sm flex items-center justify-between mx-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] flex-shrink-0">
                <img
                  src={
                    currentUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <span className="text-xs text-stone-500 font-medium truncate max-w-[180px]">
                ¿Qué novedades hay en el humedal?
              </span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar</span>
            </button>
          </div>
        )}

            {/* --- FEED OF INSTAGRAM POSTS --- */}
            {filteredNotices
              .filter(n => (subSection === 'oficiales' ? (n.category === 'alerta' || !n.isCommunity) : true))
              .map((notice, index) => {
                const isLiked = !!likedPosts[notice.id];
                const isSaved = !!savedPosts[notice.id];
                const likes = likeCounts[notice.id] || 85;
                const comments = commentsMap[notice.id] || [];
                const isCaptionExpanded = !!expandedCaptions[notice.id];

                return (
                  <React.Fragment key={notice.id}>
                    <article
                      className="bg-white border-y sm:border sm:rounded-3xl border-stone-200/90 shadow-xs overflow-hidden"
                    >
              {/* Post Header */}
              <div className="p-3 sm:p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-emerald-500 to-teal-400">
                    <img
                      src="https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=200&q=80"
                      alt={notice.author}
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 leading-none">
                        {notice.author || 'Guardaparques Angachilla'}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white flex-shrink-0" />
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-stone-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>Humedal Angachilla, Valdivia</span>
                      <span>•</span>
                      <span>{notice.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {(notice.category === 'comunidad' || notice.isCommunity) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Aprobada por Admin</span>
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
                className="relative w-full aspect-square sm:aspect-[4/3] bg-stone-950 overflow-hidden cursor-pointer select-none group"
                onDoubleClick={() => handleDoubleTap(notice.id)}
              >
                <img
                  src={notice.image}
                  alt={notice.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
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

              {/* Instagram Action Row */}
              <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleLike(notice.id)}
                    className="group transition-transform active:scale-125 focus:outline-none"
                    title={isLiked ? 'Ya no me gusta' : 'Me gusta'}
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
                        alert('Enlace del aviso copiado al portapapeles.');
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
                  {likes.toLocaleString()} Me gusta
                </span>
              </div>

              {/* Post Title & Description / Caption */}
              <div className="px-3.5 pb-2 text-xs text-stone-800 leading-relaxed">
                <h3 className="font-extrabold text-sm text-stone-900 mb-1">
                  {notice.title}
                </h3>
                <p className="inline">
                  <span className="font-bold text-stone-900 mr-1.5">
                    {notice.author?.split(' ')[0] || 'Guardaparques'}:
                  </span>
                  {notice.summary}{' '}
                </p>

                {/* Expand full text toggle */}
                {notice.fullText && (
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

                {/* Hashtags */}
                <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] font-semibold text-emerald-700">
                  <span>#HumedalAngachilla</span>
                  <span>#Valdivia</span>
                  <span>#CisnesDeCuelloNegro</span>
                  <span>#SantuarioNaturaleza</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="px-3.5 pb-2 border-t border-stone-100 pt-2 space-y-1">
                {comments.length > 0 && (
                  <div className="space-y-1">
                    {comments.slice(-2).map((c, i) => (
                      <p key={i} className="text-[11px] text-stone-700">
                        <span className="font-bold text-stone-900">
                          {c.split(':')[0]}:
                        </span>{' '}
                        {c.split(':')[1]}
                      </p>
                    ))}
                    {comments.length > 2 && (
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
                  className="flex items-center pt-2 gap-2"
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
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Publicar
                    </button>
                  )}
                </form>
              </div>
            </article>

            {/* Local Sponsor card placed naturally in feed */}
            {index === 1 && subSection === 'feed' && (
              <div className="my-2">
                <SponsorBanner onOpenDonations={onOpenDonations} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  )}
</div>
      <HomeSidebar />
      </div>

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
                src={expandedNotice.image}
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

      {/* --- CREATE NOTICE MODAL --- */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={handleCloseCreateModal}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Publicar Novedad o Aviso Oficial
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
                  Título del post *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Nacimiento de cisnes en el meandro sur"
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
                  <option value="biodiversidad">Biodiversidad & Nidos</option>
                  <option value="alerta">Alertas & Mantención</option>
                  <option value="limpieza">Jornadas de Limpieza</option>
                  <option value="taller">Talleres Ambientales</option>
                  <option value="comunidad">Comunidad & Vecinos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Resumen corto (Caption inicial) *
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
                  Texto completo y recomendaciones *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalles extendidos para quienes expandan la publicación..."
                  value={newFullText}
                  onChange={e => setNewFullText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImage}
                  onChange={e => setNewImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/10"
                >
                  Publicar en Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
