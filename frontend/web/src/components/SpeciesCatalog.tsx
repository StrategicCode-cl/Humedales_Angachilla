'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Search, Volume2, MapPin, X, ExternalLink } from 'lucide-react';
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

// Moss drawn in SVG (public/texturas/musgo.svg), shared with the app download banner
const MOSS = "bg-[#052e20] bg-[url('/texturas/musgo.svg')]";

type KingdomFilter = 'all' | 'Fauna' | 'Flora' | 'Reino Fungi';

const KINGDOMS: { id: KingdomFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'Fauna', label: 'Fauna' },
  { id: 'Flora', label: 'Flora' },
  { id: 'Reino Fungi', label: 'Hongos' },
];

const KINGDOM_OF_CATEGORY = (c: SpeciesCategory): KingdomFilter =>
  c === 'hongo' ? 'Reino Fungi' : c === 'arbol_arbusto' || c === 'planta_acuatica' ? 'Flora' : 'Fauna';

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

  const kingdomCounts: Record<KingdomFilter, number> = {
    all: speciesList.length,
    Fauna: speciesList.filter(s => getSpeciesKingdom(s) === 'Fauna').length,
    Flora: speciesList.filter(s => getSpeciesKingdom(s) === 'Flora').length,
    'Reino Fungi': speciesList.filter(s => getSpeciesKingdom(s) === 'Reino Fungi').length,
  };

  const categories = CATEGORY_ORDER.filter(id => selectedKingdom === 'all' || KINGDOM_OF_CATEGORY(id) === selectedKingdom)
    .map(id => ({
      id,
      label: CATEGORY_LABELS[id],
      count: speciesList.filter(s => s.category === id).length,
    }))
    .filter(c => c.count > 0);

  const kingdoms = KINGDOMS.filter(k => k.id === 'all' || kingdomCounts[k.id] > 0);

  const clearFilters = () => {
    setSelectedKingdom('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

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

  // A natural-history plate: the picture on paper (illustrations) or full bleed (photographs), caption below
  const renderPlate = (species: Species, index: number, large = false) => {
    const isIllustration = species.image?.includes('ilustracion-');
    const stationCodes = (species.stations ?? []).map(st => (typeof st === 'string' ? st : st.code));
    return (
      <article
        key={species.id}
        {...reveal(index)}
        className={`group flex flex-col ${large ? 'sm:col-span-2 lg:row-span-2' : ''}`}
      >
        <div
          className={`relative overflow-hidden rounded-md ${isIllustration ? 'bg-[#eeeae2]' : 'bg-stone-200'} ${
            large ? 'aspect-[4/3] lg:aspect-auto lg:flex-1 lg:min-h-[360px]' : 'aspect-[4/3]'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveSpecies(species)}
            className="absolute inset-0 w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
            aria-label={`Ver ficha de ${species.commonName}`}
          >
            <img
              src={resolveMediaUrl(species.image)}
              alt={species.commonName}
              loading="lazy"
              decoding="async"
              className={`w-full h-full ${isIllustration ? 'object-contain p-5' : 'object-cover'} transition-transform duration-500 ease-out group-hover:scale-[1.04]`}
            />
          </button>

          {species.soundKey && (
            <button
              type="button"
              onClick={e => handlePlaySound(species.soundKey!, e)}
              aria-label={`Escuchar ${species.soundLabel || 'canto'} de ${species.commonName}`}
              className={`absolute bottom-2 right-2 w-9 h-9 rounded-md flex items-center justify-center border transition-colors active:scale-95 ${
                playingKey === species.soundKey
                  ? 'bg-emerald-800 border-emerald-800 text-white'
                  : 'bg-white/95 border-stone-200 text-stone-900 hover:bg-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="pt-3">
          <h3 className={`font-semibold leading-snug tracking-tight text-stone-950 ${large ? 'text-2xl sm:text-3xl' : 'text-[17px]'}`}>
            <button type="button" onClick={() => setActiveSpecies(species)} className="text-left hover:text-emerald-900 transition-colors">
              {species.commonName}
            </button>
          </h3>
          <p className="mt-0.5 text-sm text-stone-600">
            {species.mapudungunName && <span>{species.mapudungunName} · </span>}
            <span className="italic">{species.scientificName}</span>
          </p>
          {large && <p className="mt-2.5 max-w-xl text-base leading-relaxed text-stone-700 line-clamp-3">{species.description}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusLabel status={species.conservationStatus} />
            {stationCodes.length > 0 && (
              <span className="text-sm text-stone-500">
                {stationCodes.length === 1 ? 'Estación' : 'Estaciones'} {stationCodes.slice(0, 3).join(', ')}
                {stationCodes.length > 3 ? '…' : ''}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderGrid = (list: Species[], allowLarge: boolean) => {
    const withLarge = allowLarge && list.length >= 5 && (list.length - 5) % 4 === 0;
    const cols = withLarge || list.length > 3 ? 'lg:grid-cols-4' : GRID_COLS[list.length];
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-x-5 gap-y-8`}>
        {list.map((s, i) => renderPlate(s, i, withLarge && i === 0))}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-24">
      {/* First screen: title and the species of the day */}
      <header>
        <h1
          {...reveal(0)}
          className="font-bold text-stone-950 tracking-[-0.03em] leading-[0.95] text-[clamp(2.25rem,4.5vw,4.25rem)]"
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
                className={`block w-full aspect-[4/3] rounded-md overflow-hidden p-6 ${MOSS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900`}
                aria-label={`Ver ficha de ${featured.commonName}`}
              >
                {/* LCP image: fetchPriority="high" without loading="lazy" per modern-web-guidance */}
                <img
                  src={resolveMediaUrl(featured.image)}
                  alt={featured.commonName}
                  fetchPriority="high"
                  className="w-full h-full object-contain slow-drift"
                />
              </button>
            </figure>
          )}

          {featured && (
            <div {...reveal(2)} className="lg:col-span-5 lg:row-start-2 lg:self-end">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-950 leading-tight">
                {featured.commonName}
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-stone-700">
                Especie del día · {featured.mapudungunName && <span>{featured.mapudungunName} · </span>}
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
                    className={`inline-flex items-center gap-2 h-11 px-5 rounded-md text-sm font-semibold transition-colors active:scale-[0.98] ${
                      playingKey === featured.soundKey
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Escuchar su canto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSpecies(featured)}
                  className="text-sm font-semibold text-stone-950 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
                >
                  Ver ficha completa
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Filters. Phone order: search, kingdom, then one swipeable row of categories */}
      <section className="mt-14 sm:mt-20" aria-labelledby="explorar-titulo">
        <h2 id="explorar-titulo" className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-950">
          Explorar especies
        </h2>

        <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <label className="relative block w-full lg:w-80 lg:order-2">
            <span className="sr-only">Buscar especie</span>
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar especie: cisne, canelo…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-10 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Borrar búsqueda"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </label>

          <div
            role="group"
            aria-label="Reino"
            className="lg:order-1 grid sm:inline-grid sm:w-auto p-0.5 gap-0.5 rounded-md bg-stone-200/80"
            style={{ gridTemplateColumns: `repeat(${kingdoms.length}, minmax(0, 1fr))` }}
          >
            {kingdoms.map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setSelectedKingdom(k.id);
                  setSelectedCategory('all');
                }}
                aria-pressed={selectedKingdom === k.id}
                className={`h-10 px-3 sm:px-4 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedKingdom === k.id ? 'bg-white text-stone-950 ring-1 ring-stone-300' : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                {k.label}
                <span className="ml-1.5 text-stone-500 tabular-nums">{kingdomCounts[k.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
            <div className="flex sm:flex-wrap gap-2 w-max sm:w-auto pb-1" role="group" aria-label="Categoría">
              {[{ id: 'all' as const, label: 'Todas las categorías', count: null as number | null }, ...categories].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={selectedCategory === cat.id}
                  className={`h-9 px-3 rounded-md border text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  {cat.label}
                  {cat.count !== null && (
                    <span className={`ml-1.5 tabular-nums ${selectedCategory === cat.id ? 'text-stone-300' : 'text-stone-500'}`}>
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isBrowsingAll && (
          <p className="mt-3 text-sm text-stone-600" aria-live="polite">
            {filteredSpecies.length === 1 ? '1 especie' : `${filteredSpecies.length} especies`} ·{' '}
            <button type="button" onClick={clearFilters} className="font-medium text-stone-950 underline underline-offset-2">
              Quitar filtros
            </button>
          </p>
        )}
      </section>

      {/* Species Grid */}
      {filteredSpecies.length === 0 ? (
        <div className="mt-8 py-12 px-6 bg-white rounded-md border border-stone-200 text-center">
          <h2 className="text-xl font-semibold text-stone-950">No encontramos esa especie</h2>
          <p className="mt-2 text-base text-stone-600">
            Prueba con su nombre común, científico o en mapuzungun, como “Cisne”, “Garza”, “Arrayán” o “Pitra”.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 h-10 px-4 rounded-md border border-stone-300 hover:bg-stone-50 text-sm font-medium text-stone-900"
          >
            Ver todas las especies
          </button>
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
                  className="lg:col-span-5 text-2xl sm:text-3xl font-semibold tracking-tight text-stone-950 leading-tight"
                >
                  {group.title}
                </h2>
                <p className="lg:col-span-7 text-base text-stone-600 leading-relaxed max-w-2xl">
                  {group.text}
                </p>
              </div>
              {renderGrid(list, true)}
            </section>
          );
        })
      ) : (
        <section className="mt-10" aria-labelledby="resultados-titulo">
          <h2 id="resultados-titulo" className="mb-6 text-xl font-semibold text-stone-950">
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
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/70"
          onClick={() => setActiveSpecies(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ficha-titulo"
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-lg sm:rounded-lg max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className={`relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden shrink-0 flex items-center justify-center ${
              activeSpecies.image?.includes('ilustracion-') ? `${MOSS} p-6` : 'bg-stone-900'
            }`}>
              <img
                src={resolveMediaUrl(activeSpecies.image)}
                alt={activeSpecies.commonName}
                className={`w-full h-full ${
                  activeSpecies.image?.includes('ilustracion-')
                    ? 'object-contain'
                    : 'object-cover'
                }`}
              />
              <button
                type="button"
                onClick={() => setActiveSpecies(null)}
                aria-label="Cerrar ficha"
                className="absolute top-3 right-3 w-10 h-10 rounded-md bg-white/95 text-stone-900 flex items-center justify-center hover:bg-white active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              <h2
                id="ficha-titulo"
                className="text-2xl sm:text-4xl font-semibold tracking-tight text-stone-950 leading-tight"
              >
                {activeSpecies.commonName}
              </h2>
              <p className="mt-1.5 text-base sm:text-lg text-stone-700">
                {activeSpecies.mapudungunName && (
                  <span>{activeSpecies.mapudungunName} en mapudungun · </span>
                )}
                <span className="italic">{activeSpecies.scientificName}</span>
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {getSpeciesKingdom(activeSpecies)} · {activeSpecies.group || CATEGORY_LABELS[activeSpecies.category]}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                <StatusLabel status={activeSpecies.conservationStatus} />
                {activeSpecies.soundKey && (
                  <button
                    type="button"
                    onClick={() => handlePlaySound(activeSpecies.soundKey!)}
                    className={`inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-semibold transition-colors active:scale-[0.98] ${
                      playingKey === activeSpecies.soundKey
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-900 hover:bg-emerald-800 text-white'
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
                  <h3 className="text-sm font-semibold text-stone-900 mb-2">Estaciones donde se registra</h3>
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
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white hover:bg-stone-50 border border-stone-300 text-sm font-medium text-stone-900 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-stone-500" />
                          <span>{st ? st.name : typeof stRef !== 'string' ? stRef.name : `Estación ${code}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="mt-5 text-base text-stone-800 leading-relaxed">
                {activeSpecies.description}
              </p>

              <div className="mt-5 p-4 rounded-md bg-stone-100">
                <h3 className="text-sm font-bold text-stone-950">
                  Dónde vive en el Humedal Angachilla
                </h3>
                <p className="mt-1 text-sm text-stone-800 leading-relaxed">
                  {activeSpecies.habitat}
                </p>
              </div>

              {activeSpecies.funFact && (
                <div className="mt-3 p-4 rounded-md bg-stone-100">
                  <h3 className="text-sm font-bold text-stone-950">
                    Dato ecológico y de conservación
                  </h3>
                  <p className="mt-1 text-sm text-stone-800 leading-relaxed">
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
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-950 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
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
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-950 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
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
                  className="mt-6 w-full h-12 px-4 rounded-md bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                >
                  <MapPin className="w-4 h-4" />
                  Ver dónde vive en el mapa
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
