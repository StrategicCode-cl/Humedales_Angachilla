'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Bell, Sparkles, X, ArrowRight, Pause, Play, AlertCircle } from 'lucide-react';
import { Notice } from '../types';

interface RotatingNewsBannerProps {
  notices: Notice[];
  onSelectNotice: (notice: Notice) => void;
}

export const RotatingNewsBanner: React.FC<RotatingNewsBannerProps> = ({ notices, onSelectNotice }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter urgent or official notices
  const bannerItems = notices.slice(0, 5);

  useEffect(() => {
    if (bannerItems.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % bannerItems.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [bannerItems.length, isPaused]);

  if (bannerItems.length === 0) return null;

  const current = bannerItems[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? bannerItems.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % bannerItems.length);
  };

  return (
    <div
      id="rotating-news-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-2xl bg-white text-stone-900 shadow-xs border border-stone-200/90 hover:border-emerald-300 transition-all cursor-pointer group select-none"
      onClick={() => onSelectNotice(current)}
    >
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
        {/* Left Side: Icon & Content */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                current.category === 'alerta'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {current.category === 'alerta' ? (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              ) : (
                <Bell className="w-4 h-4 text-emerald-700" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                  current.category === 'alerta'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                Aviso Oficial
              </span>
              <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
                {current.date} • {currentIndex + 1}/{bannerItems.length}
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate mt-0.5 font-display group-hover:text-emerald-700 transition-colors">
              {current.title}
            </h4>

            <p className="text-[11px] text-stone-500 truncate mt-0.5 hidden xs:block">
              {current.summary}
            </p>
          </div>
        </div>

        {/* Right Side Controls & CTA */}
        <div className="flex items-center space-x-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={handlePrev}
            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Anterior aviso"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            title={isPaused ? 'Reanudar rotación' : 'Pausar rotación'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-700" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleNext}
            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Siguiente aviso"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSelectNotice(current)}
            className="hidden sm:flex items-center gap-1 ml-1 px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95"
          >
            <span>Ver</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center space-x-1">
        {bannerItems.map((_, i) => (
          <span
            key={i}
            className={`h-0.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-4 bg-emerald-700' : 'w-1 bg-stone-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
