'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Heart,
  Award,
  TreeDeciduous,
  Droplets,
  Share2,
  Users
} from 'lucide-react';
import { SANCTUARY_COMMITTEE_INFO } from '../data/mockData';

interface SanctuaryHistorySectionProps {
  onOpenDonations?: () => void;
}

export const SanctuaryHistorySection: React.FC<SanctuaryHistorySectionProps> = ({ onOpenDonations }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const info = SANCTUARY_COMMITTEE_INFO;

  return (
    <section
      id="sanctuary-history-section"
      className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-stone-900 transition-all"
    >
      {/* Header Banner */}
      <div className="bg-stone-50 p-5 sm:p-6 border-b border-stone-200/80 text-stone-900 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 p-2 flex items-center justify-center shrink-0">
              <TreeDeciduous className="w-7 h-7 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                  Santuario de la Naturaleza
                </span>
                <span className="text-xs text-stone-500 font-medium">Valdivia, Región de Los Ríos</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-display mt-1 text-stone-900 leading-tight">
                {info.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenDonations && (
              <button
                onClick={onOpenDonations}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs active:scale-95 transition-all"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Apoyar al Comité</span>
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 transition-colors shadow-xs"
            >
              <span>{isExpanded ? 'Ver menos' : 'Conoce nuestra historia'}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-stone-200 text-xs">
          <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-xs text-center">
            <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">Superficie</span>
            <span className="font-extrabold text-stone-900 text-sm sm:text-base font-display">2.025+ Hectáreas</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-xs text-center">
            <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">Decreto Oficial</span>
            <span className="font-extrabold text-stone-900 text-sm sm:text-base font-display">Santuario D.S. 2021</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-xs text-center">
            <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">Comité Jurídico</span>
            <span className="font-extrabold text-stone-900 text-sm sm:text-base font-mono">65.213.206-5</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-xs text-center">
            <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">Gobernanza</span>
            <span className="font-extrabold text-emerald-800 text-sm sm:text-base font-display">Comunitaria</span>
          </div>
        </div>
      </div>

      {/* Expandable History and Mission Details */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 animate-fade-in bg-stone-50/70 border-t border-stone-200">
          {/* Narrative */}
          <div className="space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed max-w-4xl">
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Gesta Ciudadana y Rescate del Humedal</span>
            </h3>
            {info.historySummary.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Pillars */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Pilares de Trabajo del Comité
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {info.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-emerald-300 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center mb-2">
                    0{idx + 1}
                  </div>
                  <h5 className="font-extrabold text-xs text-stone-900 font-display">
                    {pillar.title}
                  </h5>
                  <p className="text-[11px] text-stone-600 mt-1 leading-normal">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Official Social Links & Contact */}
          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-600">
              <Users className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">Canales Oficiales del Comité:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={info.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Instagram {info.socialLinks.instagramHandle}</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={info.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-500 transition-colors"
              >
                <span>Facebook Oficial</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={`mailto:${info.socialLinks.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-stone-600" />
                <span>{info.socialLinks.email}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
