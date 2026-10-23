'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Search, Volume2, MapPin, X, ExternalLink, Sparkles } from 'lucide-react';
import { ConservationStatus, Species, SpeciesCategory, SpeciesKingdom } from '../types';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import { resolveMediaUrl } from '../lib/api';

interface SpeciesCatalogProps {
  onGoToMapHabitat?: (coords: [number, number]) => void;
}

const CATEGORY_LABELS: Record<SpeciesCategory, string> = {
  ave_acuatica: 'Aves acuáticas',
  ave_totoral: 'Aves de totoral',
  ave_bosque: 'Aves de bosque y rapaces',
  mamifero: 'Mamíferos',
  anfibio: 'Anfibios, peces e invertebrados',
  reptil: 'Reptiles',
  hongo: 'Reino Fungi',
  arbol_arbusto: 'Árboles y arbustos nativos',
  planta_acuatica: 'Plantas acuáticas y palustres',
};

const CATEGORY_ORDER: SpeciesCategory[] = [
  'ave_acuatica',
  'ave_totoral',
  'ave_bosque',
  'mamifero',
  'anfibio',
  'reptil',
  'arbol_arbusto',
  'planta_acuatica',
  'hongo',
];

const FAUNA: SpeciesCategory[] = ['ave_acuatica', 'ave_totoral', 'ave_bosque', 'mamifero', 'anfibio', 'reptil'];

const GROUPS: { id: string; title: string; text: string; categories: SpeciesCategory[] }[] = [
  {
    id: 'aves',
    title: 'Aves del Humedal y del Bosque',
    text: 'Viven entre el totoral, los espejos de agua y el bosque ribereño de las 9 estaciones. Varias se reconocen antes por su canto que por la vista.',
    categories: ['ave_acuatica', 'ave_totoral', 'ave_bosque'],
  },
  {
    id: 'mamiferos-anfibios',
    title: 'Mamíferos, Anfibios, Peces e Invertebrados',
    text: 'Habitantes sigilosos de las riberas, aguas oxigenadas y suelos saturados del hualve.',
    categories: ['mamifero', 'anfibio', 'reptil'],
  },
  {
    id: 'flora',
    title: 'Flora: Bosque Húmedo (Hualve) y Plantas Palustres',
    text: 'El bosque pantanoso de pitras, temus y canelos junto a los totorales dan refugio y alimento a toda la reserva.',
    categories: ['arbol_arbusto', 'planta_acuatica'],
  },
  {
    id: 'hongos',
    title: 'Reino Fungi del Bosque Valdiviano',
    text: 'Descomponedores y simbiontes esenciales que fructifican con las lluvias sobre troncos y hojarasca húmeda.',
    categories: ['hongo'],
  },
];

const STATUS_DOT: Record<ConservationStatus, string> = {
  'En Peligro Crítico': 'bg-red-700',
  'En Peligro': 'bg-red-500',
  'Vulnerable': 'bg-amber-500',
  'Casi Amenazada': 'bg-yellow-400',
  'Preocupación Menor': 'bg-emerald-500',
};

const GRID_COLS: Record<number, string> = {
  1: 'lg:grid-cols-2',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
};

const noopSubscribe = () => () => {};

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function getSpeciesKingdom(sp: Species): SpeciesKingdom {
  if (sp.kingdom === 'Fungi' || sp.kingdom === 'Reino Fungi' || sp.category === 'hongo') return 'Reino Fungi';
  if (sp.kingdom === 'Flora' || sp.category === 'arbol_arbusto' || sp.category === 'planta_acuatica') return 'Flora';
  return 'Fauna';
}

const StatusLabel: React.FC<{ status: ConservationStatus }> = ({ status }) => (
  <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[status] || 'bg-emerald-500'}`} aria-hidden="true" />
    {status}
  </span>
);

export const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({ onGoToMapHabitat }) => {
  const [speciesList, setSpeciesList] = useState<Species[]>(() => storageService.getSpecies());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKingdom, setSelectedKingdom] = useState<SpeciesKingdom | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<SpeciesCategory | 'all'>('all');
  const [activeSpecies, setActiveSpecies] = useState<Species | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const day = useSyncExternalStore(noopSubscribe, () => dayOfYear(new Date()), () => null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Sync with PostgreSQL 67 real species when storageService finishes fetching
  useEffect(() => {
    const onSync = () => {
      setSpeciesList([...storageService.getSpecies()]);
    };
    window.addEventListener('angachilla:sync', onSync);
    onSync();
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

  const fauna = speciesList.filter(s => FAUNA.includes(s.category));
  const featuredPool = fauna.length > 0 ? fauna : speciesList;
  const featured = featuredPool.length > 0 ? featuredPool[(day ?? 0) % featuredPool.length] : null;

  const q = searchQuery.trim().toLowerCase();
  const isBrowsingAll = selectedKingdom === 'all' && selectedCategory === 'all' && q === '';

  const filteredSpecies = speciesList.filter(species => {
    const kingdom = getSpeciesKingdom(species);
    const matchesKingdom = selectedKingdom === 'all' || kingdom === selectedKingdom;
    const matchesCategory = selectedCategory === 'all' || species.category === selectedCategory;
    const matchesSearch =
      !q ||
      species.commonName.toLowerCase().includes(q) ||
      species.scientificName.toLowerCase().includes(q) ||
      (species.mapudungunName && species.mapudungunName.toLowerCase().includes(q)) ||
      (species.group && species.group.toLowerCase().includes(q)) ||
      species.habitat.toLowerCase().includes(q);
    return matchesKingdom && matchesCategory && matchesSearch;
  });

  const kingdomCounts = {
    all: speciesList.length,
    Fauna: speciesList.filter(s => getSpeciesKingdom(s) === 'Fauna').length,
    Flora: speciesList.filter(s => getSpeciesKingdom(s) === 'Flora').length,
    'Reino Fungi': speciesList.filter(s => getSpeciesKingdom(s) === 'Reino Fungi').length,
  };

  const categories = CATEGORY_ORDER.map(id => ({
    id,
    label: CATEGORY_LABELS[id],
    count: speciesList.filter(s => s.category === id).length,
  })).filter(c => c.count > 0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-shown');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    root.querySelectorAll('[data-reveal]:not(.is-shown)').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedKingdom, selectedCategory, searchQuery, day, speciesList.length]);

  useEffect(() => {
    if (!activeSpecies) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSpecies(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSpecies]);

  const handlePlaySound = (soundKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlayingKey(soundKey);
    soundService.playBySoundKey(soundKey);
    setTimeout(() => {
      setPlayingKey(null);
    }, 1500);
  };

  const reveal = (index: number) => ({
    'data-reveal': '',
    style: { '--reveal-delay': `${Math.min(index, 6) * 70}ms` } as React.CSSProperties,
  });

  const renderPlate = (species: Species, index: number, large = false) => {
    const isIllustration = species.image?.includes('ilustracion-');
    return (
      <article
        key={species.id}
        {...reveal(index)}
        className={`group flex flex-col bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all p-3 ${
          large ? 'sm:col-span-2 lg:row-span-2' : ''
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 via-emerald-50/40 to-stone-200/60 ${
            large ? 'aspect-[4/3] lg:aspect-auto lg:flex-1 lg:min-h-[360px]' : 'aspect-[4/3]'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveSpecies(species)}
            className="absolute inset-0 w-full h-full focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-emerald-500 p-2"
            aria-label={`Ver ficha de ${species.commonName}`}
          >
            <img
              src={resolveMediaUrl(species.image)}
              alt={species.commonName}
              loading="lazy"
              decoding="async"
              className={`w-full h-full ${
                isIllustration ? 'object-contain p-2 drop-shadow-md' : 'object-cover rounded-xl'
              } transition-transform duration-500 ease-out group-hover:scale-[1.05]`}
            />
          </button>

          {species.stations && species.stations.length > 0 && (
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 pointer-events-none">
              {species.stations.slice(0, 3).map(stRef => {
                const code = typeof stRef === 'string' ? stRef : stRef.code;
                return (
                  <span
                    key={code}
                    className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/80 text-white backdrop-blur-xs"
                  >
                    Est. {code}
                  </span>
                );
              })}
            </div>
          )}

          {species.soundKey && (
            <button
              type="button"
              onClick={e => handlePlaySound(species.soundKey!, e)}
              aria-label={`Escuchar ${species.soundLabel || 'canto'} de ${species.commonName}`}
              className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-105 ${
                playingKey === species.soundKey
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="pt-3 px-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              {species.group || CATEGORY_LABELS[species.category]}
            </span>
          </div>
          <h3
            className={`font-black text-stone-950 leading-tight tracking-tight mt-0.5 ${
              large ? 'text-2xl sm:text-3xl' : 'text-lg'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveSpecies(species)}
              className="text-left hover:text-emerald-800 transition-colors"
            >
              {species.commonName}
            </button>
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-600">
            {species.mapudungunName && <span>{species.mapudungunName} · </span>}
            <span className="italic">{species.scientificName}</span>
          </p>
          {large && (
            <p className="mt-2.5 text-sm text-stone-700 leading-relaxed max-w-xl line-clamp-3">
              {species.description}
            </p>
          )}
          <div className="mt-2">
            <StatusLabel status={species.conservationStatus} />
          </div>
        </div>
      </article>
    );
  };

  const renderGrid = (list: Species[], allowLarge: boolean) => {
    const withLarge = allowLarge && list.length >= 5 && (list.length - 5) % 4 === 0;
    const cols = withLarge || list.length > 3 ? 'lg:grid-cols-4' : GRID_COLS[list.length];
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-5`}>
        {list.map((s, i) => renderPlate(s, i, withLarge && i === 0))}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-24">
      {/* First screen: title and the species of the day */}
      <header>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Catálogo Oficial · 9 Estaciones de la Reserva Comunitaria
        </div>
        <h1
          {...reveal(0)}
          className="font-black text-stone-950 tracking-[-0.035em] leading-[0.95] text-[clamp(2.25rem,4.5vw,4.25rem)]"
        >
          Guía de Especies del Angachilla
        </h1>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-x-12 lg:gap-y-8">
          <p
            {...reveal(1)}
            className="lg:col-span-5 lg:row-start-1 text-base sm:text-lg text-stone-700 leading-relaxed max-w-lg"
          >
            Explora las <strong>{speciesList.length} especies</strong> de Fauna, Flora y Reino Fungi registradas en las 9 estaciones de la Reserva Comunitaria Humedal Angachilla con sus ilustraciones científicas y fichas de terreno.
          </p>

          {featured && (
            <figure
              {...reveal(1)}
              className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2"
            >
              <button
                type="button"
                onClick={() => setActiveSpecies(featured)}
                className="block w-full aspect-[4/3] rounded-3xl overflow-hidden bg-emerald-950 p-6 shadow-xl border border-emerald-700/40"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(6, 46, 34, 0.90), rgba(15, 72, 54, 0.82)), url(${resolveMediaUrl('/api/media/slug/tex-3')})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                aria-label={`Ver ficha de ${featured.commonName}`}
              >
                {/* LCP image: fetchPriority="high" without loading="lazy" per modern-web-guidance */}
                <img
                  src={resolveMediaUrl(featured.image)}
                  alt={featured.commonName}
                  fetchPriority="high"
                  className="w-full h-full object-contain drop-shadow-2xl slow-drift"
                />
              </button>
            </figure>
          )}

          {featured && (
            <div {...reveal(2)} className="lg:col-span-5 lg:row-start-2 lg:self-end">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                Especie Destacada del Día
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-stone-950 leading-none">
                {featured.commonName}
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-stone-700">
                {featured.mapudungunName && <span>{featured.mapudungunName} · </span>}
                <span className="italic">{featured.scientificName}</span>
              </p>
              <p className="mt-3 text-sm sm:text-base text-stone-700 leading-relaxed max-w-lg">
                {featured.description}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                {featured.soundKey && (
                  <button
                    type="button"
                    onClick={() => handlePlaySound(featured.soundKey!)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-transform active:scale-95 ${
                      playingKey === featured.soundKey
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Escuchar su canto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSpecies(featured)}
                  className="text-sm font-bold text-emerald-900 underline underline-offset-4 decoration-2 decoration-emerald-300 hover:decoration-emerald-700 transition-colors"
                >
                  Ver ficha completa ›
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Filters: Kingdoms + Specific Categories + Search */}
      <section className="mt-14 sm:mt-20 space-y-4" aria-labelledby="explorar-titulo">
        <h2 id="explorar-titulo" className="sr-only">
          Explorar especies por Reino y Categoría
        </h2>

        {/* Kingdom Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-3xl border border-stone-200/90 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Todas las Especies' },
                { id: 'Fauna', label: 'Fauna Silvestre' },
                { id: 'Flora', label: 'Flora Nativa' },
                ...(kingdomCounts['Reino Fungi'] > 0
                  ? [{ id: 'Reino Fungi' as const, label: 'Reino Fungi' }]
                  : []),
              ] as const
            ).map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setSelectedKingdom(k.id);
                  setSelectedCategory('all');
                }}
                aria-pressed={selectedKingdom === k.id}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
                  selectedKingdom === k.id
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Buscar especie</span>
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar: Cisne, Garza, Canelo, Arrayán…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-2xl bg-stone-100 focus:bg-white border border-transparent focus:border-emerald-600 text-xs sm:text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Borrar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            aria-pressed={selectedCategory === 'all'}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-200/70 hover:bg-stone-200 text-stone-800'
            }`}
          >
            Todas las categorías
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-200/70 hover:bg-stone-200 text-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Species Grid */}
      {filteredSpecies.length === 0 ? (
        <div className="mt-12 py-16 px-6 bg-white rounded-3xl border border-stone-200 text-center">
          <h2 className="text-xl font-bold text-stone-950">No encontramos esa especie</h2>
          <p className="mt-2 text-sm text-stone-600">
            Prueba con su nombre común, científico o en mapuzungun, como “Cisne”, “Garza”, “Arrayán” o “Pitra”.
          </p>
        </div>
      ) : isBrowsingAll ? (
        GROUPS.map(group => {
          const list = speciesList.filter(s => group.categories.includes(s.category));
          if (list.length === 0) return null;
          return (
            <section
              key={group.id}
              className="mt-14 sm:mt-20"
              aria-labelledby={`grupo-${group.id}`}
            >
              <div
                {...reveal(0)}
                className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-10 items-end mb-6"
              >
                <h2
                  id={`grupo-${group.id}`}
                  className="lg:col-span-5 text-2xl sm:text-3xl font-black tracking-tight text-stone-950 leading-none"
                >
                  {group.title}
                </h2>
                <p className="lg:col-span-7 text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
                  {group.text}
                </p>
              </div>
              {renderGrid(list, true)}
            </section>
          );
        })
      ) : (
        <section className="mt-10" aria-labelledby="resultados-titulo">
          <h2 id="resultados-titulo" className="mb-6 text-xl font-black text-stone-950">
            {selectedCategory !== 'all'
              ? CATEGORY_LABELS[selectedCategory]
              : selectedKingdom !== 'all'
              ? selectedKingdom
              : 'Resultados'}
          </h2>
          {renderGrid(filteredSpecies, false)}
        </section>
      )}

      {/* Species detail dialog */}
      {activeSpecies && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/80 backdrop-blur-xs"
          onClick={() => setActiveSpecies(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ficha-titulo"
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 overflow-hidden shrink-0 flex items-center justify-center p-4">
              <img
                src={resolveMediaUrl(activeSpecies.image)}
                alt={activeSpecies.commonName}
                className={`w-full h-full ${
                  activeSpecies.image?.includes('ilustracion-')
                    ? 'object-contain drop-shadow-2xl'
                    : 'object-cover'
                }`}
              />
              <button
                type="button"
                onClick={() => setActiveSpecies(null)}
                aria-label="Cerrar ficha"
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white text-stone-900 flex items-center justify-center hover:bg-stone-100 active:scale-90 transition-transform shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900">
                  {getSpeciesKingdom(activeSpecies)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
                  {activeSpecies.group || CATEGORY_LABELS[activeSpecies.category]}
                </span>
              </div>

              <h2
                id="ficha-titulo"
                className="mt-2.5 text-2xl sm:text-4xl font-black tracking-tight text-stone-950 leading-none"
              >
                {activeSpecies.commonName}
              </h2>
              <p className="mt-1.5 text-base sm:text-lg text-stone-700">
                {activeSpecies.mapudungunName && (
                  <span>{activeSpecies.mapudungunName} en mapudungun · </span>
                )}
                <span className="italic">{activeSpecies.scientificName}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                <StatusLabel status={activeSpecies.conservationStatus} />
                {activeSpecies.soundKey && (
                  <button
                    type="button"
                    onClick={() => handlePlaySound(activeSpecies.soundKey!)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-transform active:scale-95 ${
                      playingKey === activeSpecies.soundKey
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Escuchar {activeSpecies.soundLabel ? activeSpecies.soundLabel.toLowerCase() : 'canto'}
                  </button>
                )}
              </div>

              {/* Stations where this species is found */}
              {activeSpecies.stations && activeSpecies.stations.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
                    Estaciones del Recorrido donde se registra:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activeSpecies.stations.map(stRef => {
                      const code = typeof stRef === 'string' ? stRef : stRef.code;
                      const st = storageService
                        .getPointsOfInterest()
                        .find(p => p.code === code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            const coords = st?.coordinates || (typeof stRef !== 'string' ? stRef.coordinates : undefined);
                            if (onGoToMapHabitat && coords) {
                              onGoToMapHabitat(coords);
                              setActiveSpecies(null);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-950 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{st ? st.name : typeof stRef !== 'string' ? stRef.name : `Estación ${code}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="mt-5 text-sm sm:text-base text-stone-800 leading-relaxed">
                {activeSpecies.description}
              </p>

              <div className="mt-5 p-4 rounded-2xl bg-stone-100">
                <h3 className="text-sm font-bold text-stone-950">
                  Dónde vive en el Humedal Angachilla
                </h3>
                <p className="mt-1 text-sm text-stone-800 leading-relaxed">
                  {activeSpecies.habitat}
                </p>
              </div>

              {activeSpecies.funFact && (
                <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/60">
                  <h3 className="text-sm font-bold text-amber-950">
                    Dato ecológico y de conservación
                  </h3>
                  <p className="mt-1 text-sm text-amber-950 leading-relaxed">
                    {activeSpecies.funFact}
                  </p>
                </div>
              )}

              {(activeSpecies.ebirdUrl || activeSpecies.inaturalistUrl) && (
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                  {activeSpecies.ebirdUrl && (
                    <a
                      href={activeSpecies.ebirdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-900 underline underline-offset-4 decoration-2 decoration-emerald-300 hover:decoration-emerald-700"
                    >
                      Registros en eBird
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {activeSpecies.inaturalistUrl && (
                    <a
                      href={activeSpecies.inaturalistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-900 underline underline-offset-4 decoration-2 decoration-emerald-300 hover:decoration-emerald-700"
                    >
                      Ficha en iNaturalist
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {activeSpecies.approxLocation && onGoToMapHabitat && (
                <button
                  type="button"
                  onClick={() => {
                    onGoToMapHabitat(activeSpecies.approxLocation!);
                    setActiveSpecies(null);
                  }}
                  className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <MapPin className="w-4 h-4" />
                  Ver hábitat y estación en el Mapa Interactivo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
