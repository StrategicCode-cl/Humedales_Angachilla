'use client';

import React, { useState } from 'react';
import {
  MessageSquarePlus,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Send,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter
} from 'lucide-react';
import { Suggestion, User as UserType } from '../types';
import { storageService } from '../services/storageService';

interface SuggestionsPanelProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onSuggestionSubmitted?: () => void;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  currentUser,
  onOpenAuth,
  onSuggestionSubmitted
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(storageService.getSuggestions());
  const [activeTab, setActiveTab] = useState<'publicas' | 'mis_sugerencias'>('publicas');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittedAlert, setSubmittedAlert] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Suggestion['category']>('infraestructura');

  // Categories
  const categoryLabels: Record<Suggestion['category'], { label: string; color: string }> = {
    infraestructura: { label: 'Infraestructura & Pasarelas', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    fauna: { label: 'Protección de Fauna', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    limpieza: { label: 'Aseo & Residuos', color: 'bg-teal-100 text-teal-800 border-teal-300' },
    seguridad: { label: 'Seguridad & Convivencia', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    educacion: { label: 'Educación & Señalética', color: 'bg-purple-100 text-purple-800 border-purple-300' }
  };

  const handleOpenSubmit = () => {
    if (!currentUser) {
      onOpenAuth();
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !currentUser) return;

    storageService.addSuggestion({
      title,
      description,
      category,
      authorName: currentUser.name,
      authorEmail: currentUser.email
    });

    setSuggestions(storageService.getSuggestions());
    setShowSubmitModal(false);
    setTitle('');
    setDescription('');
    setSubmittedAlert(true);
    setTimeout(() => setSubmittedAlert(false), 6000);
    onSuggestionSubmitted?.();
  };

  const approvedSuggestions = suggestions.filter(s => s.status === 'aprobada');
  const mySuggestions = currentUser
    ? suggestions.filter(s => s.authorEmail.toLowerCase() === currentUser.email.toLowerCase())
    : [];

  const displayedSuggestions = activeTab === 'publicas' ? approvedSuggestions : mySuggestions;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 uppercase tracking-wider">
              Participación Ciudadana
            </span>
            <span className="text-xs text-stone-500 font-medium">Humedal Angachilla</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 font-display">
            Buzón de Sugerencias y Mejoras
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl mt-1 leading-relaxed">
            Propón ideas para cuidar los senderos, pasarelas, avifauna y limpieza del santuario. Cada sugerencia es revisada por los administradores y guardaparques antes de ser publicada oficialmente.
          </p>
        </div>

        <button
          onClick={handleOpenSubmit}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-transform active:scale-95"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Enviar Sugerencia</span>
        </button>
      </div>

      {/* Confirmation banner after sending */}
      {submittedAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start space-x-3 text-emerald-900 animate-scale-up">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm text-emerald-950">
              ¡Tu sugerencia fue enviada exitosamente a moderación!
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Los administradores del humedal revisarán tu propuesta y, una vez aprobada, se publicará en el muro ciudadano oficial. Puedes revisar su estado en la pestaña “Mis Sugerencias”.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('publicas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'publicas'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span>Sugerencias Aprobadas</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-700 text-white font-mono">
            {approvedSuggestions.length}
          </span>
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('mis_sugerencias')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'mis_sugerencias'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span>Mis Propuestas Enviadas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700 text-white font-mono">
              {mySuggestions.length}
            </span>
          </button>
        )}
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {displayedSuggestions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-sm">
            <HelpCircle className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-stone-800 font-display">
              {activeTab === 'publicas'
                ? 'No hay sugerencias aprobadas aún'
                : 'Aún no has enviado ninguna sugerencia'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'publicas'
                ? '¡Sé el primero en aportar con una idea para el Humedal Angachilla!'
                : 'Usa el botón "Enviar Sugerencia" para proponer mejoras en señalética, pasarelas o protección animal.'}
            </p>
          </div>
        ) : (
          displayedSuggestions.map(sug => {
            const catInfo = categoryLabels[sug.category] || {
              label: sug.category,
              color: 'bg-stone-100 text-stone-800'
            };

            return (
              <div
                key={sug.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3 hover:border-emerald-300 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${catInfo.color}`}
                    >
                      {catInfo.label}
                    </span>

                    {/* Status Badge */}
                    {sug.status === 'aprobada' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Aprobada</span>
                      </span>
                    )}
                    {sug.status === 'pendiente' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                        <span>En moderación admin</span>
                      </span>
                    )}
                    {sug.status === 'rechazada' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>No aprobada</span>
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-stone-400">{sug.createdAt}</span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-display">
                    {sug.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                    {sug.description}
                  </p>
                </div>

                {/* Author attribution */}
                <div className="flex items-center space-x-2 text-xs text-stone-500 pt-1">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>Propuesto por <strong className="text-stone-700">{sug.authorName}</strong></span>
                </div>

                {/* Admin Feedback Box */}
                {sug.adminComment && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-800 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Respuesta de los Guardaparques / Administración:</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed italic">
                      “{sug.adminComment}”
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- SUBMIT SUGGESTION MODAL --- */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquarePlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold font-display text-stone-900">
                  Enviar Sugerencia para el Humedal
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Tu propuesta será enviada al equipo de guardaparques y administradores para su evaluación. Solo las sugerencias aprobadas serán públicas en el muro.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as unknown as Suggestion['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="infraestructura">Infraestructura & Pasarelas</option>
                  <option value="fauna">Protección de Fauna & Nidos</option>
                  <option value="limpieza">Aseo & Basureros</option>
                  <option value="seguridad">Seguridad & Ruidos</option>
                  <option value="educacion">Educación & Señalética</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título breve de la propuesta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Instalar bancas con sombra cerca del Mirador 2"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Descripción fundamentada
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explica detalladamente por qué consideras que esta mejora beneficiará al humedal y a los visitantes..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
                <span>Remitente registrado: </span>
                <strong className="text-stone-800">{currentUser?.name}</strong> ({currentUser?.email})
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar a Moderación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
