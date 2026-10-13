'use client';

import React, { useState } from 'react';
import {
  FileText,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Download,
  Share2,
  ChevronRight
} from 'lucide-react';
import { INFOGRAPHIC_POSTERS } from '../data/mockData';
import { InfographicPoster } from '../types';

interface InfographicsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfographicsModal: React.FC<InfographicsModalProps> = ({ isOpen, onClose }) => {
  const [selectedPoster, setSelectedPoster] = useState<InfographicPoster>(INFOGRAPHIC_POSTERS[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up text-stone-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 border border-amber-400/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-stone-900">
                Posters Informativos & Decálogos del Humedal
              </h2>
              <p className="text-xs text-stone-500">
                Guía educativa y buenas prácticas de conservación en Valdivia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poster Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-stone-100 pb-2 overflow-x-auto">
          {INFOGRAPHIC_POSTERS.map(poster => (
            <button
              key={poster.id}
              onClick={() => setSelectedPoster(poster)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedPoster.id === poster.id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {poster.title}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Poster Art / Infographic Canvas */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-stone-200 shadow-md aspect-[3/4] bg-stone-900 group">
              <img
                src={selectedPoster.imageUrl}
                alt={selectedPoster.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow">
                  {selectedPoster.theme}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl font-black font-display leading-tight drop-shadow-md">
                  {selectedPoster.title}
                </h3>
                <p className="text-xs text-emerald-300 font-medium mt-1">
                  {selectedPoster.subtitle}
                </p>
              </div>
            </div>

            {/* Poster Rules & Actionable Points */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">
                  Reglas de Protección Ambiental
                </span>
                <h3 className="text-lg font-bold font-display text-stone-900 mt-0.5">
                  {selectedPoster.title}
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  {selectedPoster.description}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {selectedPoster.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start space-x-3 text-xs text-stone-800"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  Material avalado por Conaf y Red Ciudadana de Humedales
                </span>
                <button
                  onClick={() => alert('Poster guardado para lectura offline.')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Guardar Poster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
