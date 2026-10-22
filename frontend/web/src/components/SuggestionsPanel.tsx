'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Suggestion, User as UserType } from '../types';
import { storageService } from '../services/storageService';

interface SuggestionsPanelProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onSuggestionSubmitted?: () => void;
}

const CATEGORY: Record<Suggestion['category'], string> = {
  infraestructura: 'Infraestructura y pasarelas',
  fauna: 'Protección de fauna',
  limpieza: 'Aseo y residuos',
  seguridad: 'Seguridad y convivencia',
  educacion: 'Educación y señalética'
};

const STATUS: Record<Suggestion['status'], { label: string; className: string }> = {
  pendiente: { label: 'En revisión', className: 'bg-amber-50 text-amber-900' },
  aprobada: { label: 'Aprobada', className: 'bg-emerald-50 text-emerald-900' },
  rechazada: { label: 'No aprobada', className: 'bg-stone-100 text-stone-700' }
};

const TITLE_MAX = 120;
const DESCRIPTION_MIN = 30;
const DESCRIPTION_MAX = 1000;

const input =
  'w-full h-11 px-3 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  currentUser,
  onOpenAuth,
  onSuggestionSubmitted
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => storageService.getSuggestions());
  const [activeTab, setActiveTab] = useState<'publicas' | 'mis_sugerencias'>('publicas');
  const [categoryFilter, setCategoryFilter] = useState<Suggestion['category'] | 'todas'>('todas');
  const [formOpen, setFormOpen] = useState(false); // phones only; the form is always shown on desktop
  const [sent, setSent] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Suggestion['category']>('infraestructura');

  const approved = suggestions.filter(s => s.status === 'aprobada');
  const inReview = suggestions.filter(s => s.status === 'pendiente');
  const mine = currentUser ? suggestions.filter(s => s.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) : [];
  const base = activeTab === 'publicas' ? approved : mine;
  const shown = base.filter(s => categoryFilter === 'todas' || s.category === categoryFilter);
  const categoriesInView = (Object.keys(CATEGORY) as Suggestion['category'][])
    .map(id => ({ id, count: base.filter(s => s.category === id).length }))
    .filter(c => c.count > 0);

  const descriptionTooShort = description.trim().length < DESCRIPTION_MIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || descriptionTooShort) return;
    storageService.addSuggestion({
      title: title.trim(),
      description: description.trim(),
      category,
      authorName: currentUser.name,
      authorEmail: currentUser.email
    });
    setSuggestions(storageService.getSuggestions());
    setSent(title.trim());
    setTitle('');
    setDescription('');
    setActiveTab('mis_sugerencias');
    setCategoryFilter('todas');
    onSuggestionSubmitted?.();
  };

  const form = !currentUser ? (
    <div>
      <h2 className="text-base font-semibold text-stone-950">Envía una propuesta</h2>
      <p className="mt-1 text-sm text-stone-700">
        Necesitas una cuenta para enviar sugerencias, así el comité puede responderte.
      </p>
      <button
        type="button"
        onClick={onOpenAuth}
        className="mt-3 w-full h-11 rounded-md bg-stone-950 hover:bg-stone-800 text-white text-base font-semibold"
      >
        Iniciar sesión
      </button>
    </div>
  ) : sent ? (
    <div role="status">
      <h2 className="text-base font-semibold text-stone-950">Recibimos tu propuesta</h2>
      <p className="mt-1 text-sm text-stone-700">
        “{sent}” quedó en revisión. Cuando el comité responda, verás su respuesta en Mis propuestas.
      </p>
      <button
        type="button"
        onClick={() => setSent(null)}
        className="mt-3 h-10 px-4 rounded-md bg-stone-200 hover:bg-stone-300 text-sm font-semibold text-stone-900"
      >
        Enviar otra
      </button>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-stone-950">Envía una propuesta</h2>
        <p className="mt-0.5 text-sm text-stone-600">Se publica cuando el comité la aprueba.</p>
      </div>
      <label className="block">
        <span className="block text-sm font-semibold text-stone-800 mb-1">Tema</span>
        <select value={category} onChange={e => setCategory(e.target.value as Suggestion['category'])} className={input}>
          {(Object.keys(CATEGORY) as Suggestion['category'][]).map(id => (
            <option key={id} value={id}>
              {CATEGORY[id]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-semibold text-stone-800 mb-1">Título</span>
        <input
          type="text"
          required
          maxLength={TITLE_MAX}
          placeholder="Bancas con sombra cerca del mirador"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={input}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-semibold text-stone-800 mb-1">Qué propones y por qué</span>
        <textarea
          required
          rows={5}
          minLength={DESCRIPTION_MIN}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={e => setDescription(e.target.value)}
          aria-describedby="sug-desc-hint"
          className="w-full px-3 py-2 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          placeholder="Dónde, qué problema resuelve y a quién beneficia."
        />
        <span id="sug-desc-hint" className="mt-1 flex justify-between text-sm text-stone-600 tabular-nums">
          <span>{descriptionTooShort ? `Mínimo ${DESCRIPTION_MIN} caracteres` : 'Listo para enviar'}</span>
          <span>
            {description.length} / {DESCRIPTION_MAX}
          </span>
        </span>
      </label>
      <p className="text-sm text-stone-600">
        Se envía como <span className="font-semibold text-stone-900">{currentUser.name}</span>.
      </p>
      <button
        type="submit"
        disabled={!title.trim() || descriptionTooShort}
        className="w-full h-11 rounded-md bg-stone-950 hover:bg-stone-800 disabled:bg-stone-300 disabled:text-stone-600 text-white text-base font-semibold transition-colors"
      >
        Enviar a revisión
      </button>
    </form>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-9 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Buzón ciudadano</h1>
          <p className="mt-0.5 text-sm text-stone-600 max-w-2xl">
            Propón mejoras para senderos, pasarelas, fauna y limpieza del humedal. El comité revisa cada propuesta y responde
            públicamente.
          </p>
        </div>
        <p className="text-sm text-stone-600 tabular-nums shrink-0">
          {approved.length} aprobadas · {inReview.length} en revisión
        </p>
      </header>

      {/* Phone: the form opens in place under the title */}
      <button
        type="button"
        onClick={() => (currentUser ? setFormOpen(v => !v) : onOpenAuth())}
        aria-expanded={currentUser ? formOpen : undefined}
        aria-controls="buzon-form"
        className="lg:hidden mt-4 w-full h-11 rounded-md bg-stone-950 text-white text-base font-semibold flex items-center justify-center gap-2"
      >
        {currentUser ? 'Enviar una sugerencia' : 'Inicia sesión para enviar una sugerencia'}
        {currentUser && <ChevronDown className={`w-4 h-4 transition-transform ${formOpen ? 'rotate-180' : ''}`} />}
      </button>

      <div className="mt-4 lg:mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 lg:gap-8 items-start">
        <aside
          id="buzon-form"
          className={`${formOpen ? 'block' : 'hidden'} lg:block lg:order-2 lg:sticky lg:top-6 bg-white border border-stone-200 rounded-lg p-4`}
        >
          {form}
        </aside>

        <section className="lg:order-1 min-w-0" aria-label="Sugerencias">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            {!currentUser ? (
              <h2 className="text-base font-semibold text-stone-950">Sugerencias aprobadas</h2>
            ) : (
            <div className="flex gap-1 p-1 rounded-md bg-stone-200/70" role="group" aria-label="Qué sugerencias ver">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('publicas');
                  setCategoryFilter('todas');
                }}
                aria-pressed={activeTab === 'publicas'}
                className={`h-8 px-3 rounded text-sm whitespace-nowrap ${
                  activeTab === 'publicas' ? 'bg-white text-stone-950 font-semibold' : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                Aprobadas <span className="tabular-nums text-stone-500">{approved.length}</span>
              </button>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mis_sugerencias');
                    setCategoryFilter('todas');
                  }}
                  aria-pressed={activeTab === 'mis_sugerencias'}
                  className={`h-8 px-3 rounded text-sm whitespace-nowrap ${
                    activeTab === 'mis_sugerencias' ? 'bg-white text-stone-950 font-semibold' : 'text-stone-700 hover:text-stone-950'
                  }`}
                >
                  Mis propuestas <span className="tabular-nums text-stone-500">{mine.length}</span>
                </button>
              )}
            </div>
            )}

            {categoriesInView.length > 1 && (
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <span className="sr-only sm:not-sr-only">Tema</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as Suggestion['category'] | 'todas')}
                  className="h-9 px-2 rounded-md bg-white border border-stone-300 text-sm text-stone-900"
                >
                  <option value="todas">Todos los temas</option>
                  {categoriesInView.map(c => (
                    <option key={c.id} value={c.id}>
                      {CATEGORY[c.id]} ({c.count})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {shown.length === 0 ? (
            <p className="mt-3 px-4 py-4 text-sm text-stone-600 border border-dashed border-stone-300 rounded-lg">
              {activeTab === 'publicas'
                ? 'Todavía no hay sugerencias aprobadas. La tuya puede ser la primera.'
                : 'Aún no has enviado sugerencias.'}
            </p>
          ) : (
            <ul className="mt-3 bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
              {shown.map(sug => (
                <li key={sug.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-stone-950">{sug.title}</h2>
                    {activeTab === 'mis_sugerencias' && (
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS[sug.status].className}`}>
                        {STATUS[sug.status].label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600">
                    {CATEGORY[sug.category]} · {sug.createdAt}
                    {activeTab === 'publicas' && ` · ${sug.authorName}`}
                  </p>
                  <p className="mt-1.5 text-base text-stone-800 leading-relaxed">{sug.description}</p>
                  {sug.adminComment && (
                    <blockquote className="mt-3 pl-3 border-l-2 border-stone-300">
                      <p className="text-sm font-semibold text-stone-900">Respuesta del comité</p>
                      <p className="text-sm text-stone-700 leading-relaxed">{sug.adminComment}</p>
                    </blockquote>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
