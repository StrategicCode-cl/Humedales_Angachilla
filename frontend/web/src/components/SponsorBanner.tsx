'use client';

import React, { useState } from 'react';
import { Sparkles, ExternalLink, ShieldCheck, Check, Heart, X } from 'lucide-react';
import { SponsorAd } from '../types';
import { storageService } from '../services/storageService';

interface SponsorBannerProps {
  onOpenDonations?: () => void;
}

export const SponsorBanner: React.FC<SponsorBannerProps> = ({ onOpenDonations }) => {
  const [isAdFree, setIsAdFree] = useState<boolean>(storageService.isAdFreeActive());
  const [ads] = useState<SponsorAd[]>(storageService.getSponsorAds());
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const ad = ads[currentAdIndex] || ads[0];

  const handleToggleAdFree = () => {
    const newState = !isAdFree;
    storageService.setAdFreeActive(newState);
    setIsAdFree(newState);
    setShowSubscriptionModal(false);
  };

  if (isAdFree) {
    return (
      <div className="w-full bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs select-none shadow-xs">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Suscripción Amigo del Humedal:</strong> Navegando sin publicidad en apoyo a la conservación de Angachilla.
          </span>
        </div>
        <button
          onClick={() => setShowSubscriptionModal(true)}
          className="text-[11px] underline text-emerald-800 hover:text-emerald-950 font-bold ml-2 shrink-0"
        >
          Gestionar
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        id="sponsor-eco-banner"
        className="w-full bg-white text-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs transition-all hover:border-emerald-300"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <img
              src={ad.imageUrl}
              alt={ad.sponsorName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-stone-200 shrink-0 bg-stone-100"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {ad.badge}
                </span>
                <span className="text-xs text-stone-500 font-bold">
                  {ad.sponsorName}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-stone-900 font-display">
                {ad.title}
              </h4>
              <p className="text-xs text-stone-600 leading-snug line-clamp-2 max-w-xl">
                {ad.description}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {ads.length > 1 && (
              <button
                onClick={() => setCurrentAdIndex((currentAdIndex + 1) % ads.length)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                title="Siguiente patrocinador"
              >
                Siguiente
              </button>
            )}
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-stone-900 hover:text-emerald-700 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200/80 transition-colors flex items-center gap-1.5"
            >
              <span>Visitar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="text-xs font-semibold text-stone-400 hover:text-stone-700 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 transition-colors flex items-center gap-1"
              title="Quitar publicidad"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xs:inline">Sin avisos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Modal (RF-MON-2) */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-900">
            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
              RF-MON-2 • Autogestión
            </span>
            <h3 className="text-base font-black font-display mt-1 text-stone-900">
              Suscripción Amigo del Humedal
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Navega 100% libre de espacios publicitarios apoyando la mantención de la infraestructura digital y senderos del Humedal Angachilla.
            </p>

            <div className="my-4 p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Navegación limpia sin banners de terceros</span>
              </div>
              <div className="flex items-center gap-2 text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Insignia de “Amigo del Humedal” en tu perfil</span>
              </div>
              <div className="flex items-center gap-2 text-stone-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aporte directo a la conservación comunitaria</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleToggleAdFree}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
              >
                {isAdFree ? 'Desactivar Modo Sin Anuncios' : 'Activar Modo Sin Anuncios (Gratis en Demo)'}
              </button>
              {onOpenDonations && (
                <button
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    onOpenDonations();
                  }}
                  className="w-full py-2 rounded-2xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  <span>Realizar Aporte Voluntario</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
