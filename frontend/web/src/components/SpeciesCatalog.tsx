'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Search, Volume2, MapPin, X, ExternalLink } from 'lucide-react';
import { ConservationStatus, Species, SpeciesCategory } from '../types';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

interface SpeciesCatalogProps {
  onGoToMapHabitat?: (coords: [number, number]) => void;
}

const CATEGORY_LABELS: Record<SpeciesCategory, string> = {
  ave_acuatica: 'Aves acuáticas',
  ave_bosque: 'Aves de bosque',
  mamifero: 'Mamíferos',
  anfibio: 'Anfibios',
  hongo: 'Hongos',
  arbol_arbusto: 'Árboles nativos',
  planta_acuatica: 'Plantas acuáticas',
};

// Fauna first: the catalog is mainly visited to see the animals
const CATEGORY_ORDER: SpeciesCategory[] = [
  'ave_acuatica',
  'ave_bosque',
  'mamifero',
  'anfibio',
  'hongo',
  'arbol_arbusto',
  'planta_acuatica',
];

const FAUNA: SpeciesCategory[] = ['ave_acuatica', 'ave_bosque', 'mamifero', 'anfibio'];

const GROUPS: { id: string; title: string; text: string; categories: SpeciesCategory[] }[] = [
  {
    id: 'aves',
    title: 'Aves del humedal',
    text: 'Viven entre la totora, los canales y el bosque de la orilla. Varias se reconocen antes por el canto que por la vista.',
    categories: ['ave_acuatica', 'ave_bosque'],
  },
  {
    id: 'mamiferos-anfibios',
    title: 'Mamíferos y anfibios',
    text: 'Más difíciles de ver: hay que caminar en silencio por las pasarelas y mirar el agua y la hojarasca.',
    categories: ['mamifero', 'anfibio'],
  },
  {
    id: 'hongos',
    title: 'Hongos del bosque',
    text: 'Crecen con la humedad del bosque valdiviano, sobre troncos, ramas y hojarasca.',
    categories: ['hongo'],
  },
  {
    id: 'flora',
    title: 'Árboles y plantas',
    text: 'El hualve de pitras y canelos y los totorales dan refugio y alimento al resto de las especies.',
    categories: ['arbol_arbusto', 'planta_acuatica'],
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

const StatusLabel: React.FC<{ status: ConservationStatus }> = ({ status }) => (
  <span className="inline-flex items-center gap-2 text-base text-stone-700">
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} aria-hidden="true" />
    {status}
  </span>
);

export const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({ onGoToMapHabitat }) => {
  const [speciesList] = useState<Species[]>(() => storageService.getSpecies());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SpeciesCategory | 'all'>('all');
  const [activeSpecies, setActiveSpecies] = useState<Species | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  // The featured species changes once a day; read on the client so the server render stays stable
  const day = useSyncExternalStore(noopSubscribe, () => dayOfYear(new Date()), () => null);
  const rootRef = useRef<HTMLDivElement>(null);

  const fauna = speciesList.filter(s => FAUNA.includes(s.category));
  const featuredPool = fauna.length > 0 ? fauna : speciesList;
  const featured = featuredPool.length > 0 ? featuredPool[(day ?? 0) % featuredPool.length] : null;

  const q = searchQuery.trim().toLowerCase();
  const isBrowsingAll = selectedCategory === 'all' && q === '';
  const filteredSpecies = speciesList.filter(species => {
    const matchesCategory = selectedCategory === 'all' || species.category === selectedCategory;
    const matchesSearch =
      species.commonName.toLowerCase().includes(q) ||
      species.scientificName.toLowerCase().includes(q) ||
      (species.mapudungunName && species.mapudungunName.toLowerCase().includes(q)) ||
      species.habitat.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const categories = CATEGORY_ORDER.map(id => ({
    id,
    label: CATEGORY_LABELS[id],
    count: speciesList.filter(s => s.category === id).length,
  })).filter(c => c.count > 0);

  const credited = speciesList.filter(s => s.imageCredit);

  // Entrance for each block as it scrolls into view
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
  }, [selectedCategory, searchQuery, day]);

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

  const renderPlate = (species: Species, index: number, large = false) => (
    <article
      key={species.id}
      {...reveal(index)}
      className={`group flex flex-col ${large ? 'sm:col-span-2 lg:row-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden bg-stone-200 ${large ? 'aspect-[4/3] lg:aspect-auto lg:flex-1 lg:min-h-[420px]' : 'aspect-[4/3]'}`}>
        <button
          type="button"
          onClick={() => setActiveSpecies(species)}
          className="absolute inset-0 w-full h-full focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-emerald-500"
          aria-label={`Ver ficha de ${species.commonName}`}
        >
          <img
            src={species.image}
            alt={species.commonName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </button>
        {species.soundKey && (
          <button
            type="button"
            onClick={e => handlePlaySound(species.soundKey!, e)}
            aria-label={`Escuchar ${species.soundLabel || 'canto'} de ${species.commonName}`}
            className={`absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90 hover:scale-105 ${
              playingKey === species.soundKey
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="pt-4">
        <h3 className={`font-bold text-stone-950 leading-tight tracking-tight ${large ? 'text-3xl' : 'text-xl'}`}>
          <button
            type="button"
            onClick={() => setActiveSpecies(species)}
            className="text-left hover:text-emerald-800 transition-colors"
          >
            {species.commonName}
          </button>
        </h3>
        <p className="mt-1 text-base text-stone-700">
          {species.mapudungunName && <span>{species.mapudungunName} · </span>}
          <span className="italic">{species.scientificName}</span>
        </p>
        {large && (
          <p className="mt-3 text-base text-stone-800 leading-relaxed max-w-xl">{species.description}</p>
        )}
        <div className="mt-2">
          <StatusLabel status={species.conservationStatus} />
        </div>
      </div>
    </article>
  );

  const renderGrid = (list: Species[], allowLarge: boolean) => {
    // A large first plate only when the small ones close the rows beside and below it
    const withLarge = allowLarge && list.length >= 5 && (list.length - 5) % 4 === 0;
    const cols = withLarge || list.length > 3 ? 'lg:grid-cols-4' : GRID_COLS[list.length];
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-x-6 gap-y-10`}>
        {list.map((s, i) => renderPlate(s, i, withLarge && i === 0))}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-24">
      {/* First screen: title and the species of the day */}
      <header>
        <h1
          {...reveal(0)}
          className="font-black text-stone-950 tracking-[-0.035em] leading-[0.95] text-[clamp(2.5rem,5vw,4.75rem)]"
        >
          Quién vive en el Angachilla
        </h1>

        {/* Phone order: intro, photo, details. Desktop: text on the left, photo on the right */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-x-12 lg:gap-y-10">
          <p {...reveal(1)} className="lg:col-span-5 lg:row-start-1 text-lg sm:text-xl text-stone-800 leading-relaxed max-w-lg">
            {speciesList.length} especies que puedes ver y escuchar en este humedal urbano de Valdivia: aves,
            mamíferos, anfibios, hongos y árboles nativos.
          </p>

          {featured && (
            <figure {...reveal(1)} className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2">
              <button
                type="button"
                onClick={() => setActiveSpecies(featured)}
                className="block w-full aspect-[4/3] overflow-hidden bg-stone-200"
                aria-label={`Ver ficha de ${featured.commonName}`}
              >
                <img
                  src={featured.image}
                  alt={featured.commonName}
                  className="w-full h-full object-cover slow-drift"
                />
              </button>
              {featured.imageCredit && (
                <figcaption className="hidden lg:block mt-2 text-sm text-stone-600">
                  {featured.commonName}. Foto: {featured.imageCredit.author}, {featured.imageCredit.license}
                </figcaption>
              )}
            </figure>
          )}

          {featured && (
            <div {...reveal(2)} className="lg:col-span-5 lg:row-start-2 lg:self-end">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950 leading-none">
                Especie de hoy: {featured.commonName}
              </h2>
              <p className="mt-2 text-base text-stone-700">
                {featured.mapudungunName && <span>{featured.mapudungunName} · </span>}
                <span className="italic">{featured.scientificName}</span>
              </p>
              <p className="mt-4 text-base text-stone-800 leading-relaxed max-w-lg">{featured.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                {featured.soundKey && (
                  <button
                    type="button"
                    onClick={() => handlePlaySound(featured.soundKey!)}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-base font-bold transition-transform active:scale-95 ${
                      playingKey === featured.soundKey
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                    Escuchar su canto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSpecies(featured)}
                  className="text-base font-bold text-emerald-900 underline underline-offset-4 decoration-2 decoration-emerald-300 hover:decoration-emerald-700 transition-colors"
                >
                  Ver ficha completa
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <section className="mt-20 sm:mt-28" aria-labelledby="explorar-titulo">
        <h2 id="explorar-titulo" className="sr-only">
          Explorar especies
        </h2>
        <div className="flex flex-col-reverse gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              aria-pressed={selectedCategory === 'all'}
              className={`px-4 py-2 rounded-full text-base font-semibold whitespace-nowrap transition-colors active:scale-95 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-200/70 hover:bg-stone-200 text-stone-800'
              }`}
            >
              Todas <span className="opacity-70 tabular-nums">{speciesList.length}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={selectedCategory === cat.id}
                className={`px-4 py-2 rounded-full text-base font-semibold whitespace-nowrap transition-colors active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-200/70 hover:bg-stone-200 text-stone-800'
                }`}
              >
                {cat.label} <span className="opacity-70 tabular-nums">{cat.count}</span>
              </button>
            ))}
          </div>

          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Buscar especie</span>
            <Search className="w-5 h-5 text-stone-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Chucao, Wañke, Drimys…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-full bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Borrar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </label>
        </div>
      </section>

      {/* Species */}
      {filteredSpecies.length === 0 ? (
        <div className="mt-16 py-16 px-6 bg-stone-100 text-center">
          <h2 className="text-2xl font-bold text-stone-950">No encontramos esa especie</h2>
          <p className="mt-2 text-base text-stone-700">
            Prueba con su nombre común, científico o en mapudungun, como “Chucao”, “Wañke” o “Drimys”.
          </p>
        </div>
      ) : isBrowsingAll ? (
        GROUPS.map(group => {
          const list = speciesList.filter(s => group.categories.includes(s.category));
          if (list.length === 0) return null;
          return (
            <section key={group.id} className="mt-16 sm:mt-24" aria-labelledby={`grupo-${group.id}`}>
              <div {...reveal(0)} className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 items-end mb-8">
                <h2
                  id={`grupo-${group.id}`}
                  className="lg:col-span-5 text-3xl sm:text-4xl font-black tracking-tight text-stone-950 leading-none"
                >
                  {group.title}
                </h2>
                <p className="lg:col-span-7 text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl">
                  {group.text}
                </p>
              </div>
              {renderGrid(list, true)}
            </section>
          );
        })
      ) : (
        <section className="mt-12" aria-labelledby="resultados-titulo">
          <h2 id="resultados-titulo" className="mb-8 text-2xl font-bold text-stone-950">
            {selectedCategory !== 'all' ? CATEGORY_LABELS[selectedCategory] : 'Resultados'}{' '}
            <span className="text-stone-600 font-semibold tabular-nums">{filteredSpecies.length}</span>
          </h2>
          {renderGrid(filteredSpecies, false)}
        </section>
      )}

      {/* Citizen science: eBird & iNaturalist (PDF reunión 15-sept-2026) */}
      <section
        {...reveal(0)}
        className="mt-24 sm:mt-32 -mx-4 sm:mx-0 px-6 sm:px-12 py-14 sm:py-16 bg-emerald-950 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end"
        aria-labelledby="ciencia-titulo"
      >
        <div className="lg:col-span-7">
          <h2 id="ciencia-titulo" className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
            ¿Viste o escuchaste algo?
          </h2>
          <p className="mt-5 text-lg text-emerald-50 leading-relaxed max-w-xl">
            Sube tu registro a eBird o iNaturalist. Cada avistamiento en el Angachilla ayuda a monitorear las especies
            del humedal.
          </p>
        </div>
        <div className="lg:col-span-5 flex flex-wrap items-center gap-x-6 gap-y-4 lg:justify-end">
          <a
            href="https://ebird.org/hotspot/L11417032"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-emerald-950 text-base font-bold hover:bg-emerald-100 transition-colors active:scale-95"
          >
            Hotspot en eBird
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://www.inaturalist.org/places/chile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-bold text-white underline underline-offset-4 decoration-2 decoration-emerald-400 hover:decoration-white"
          >
            Registrar en iNaturalist
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Photo credits (required by the CC BY / BY-SA licences) */}
      {credited.length > 0 && (
        <footer className="mt-12 text-sm text-stone-600 leading-relaxed">
          <details>
            <summary className="cursor-pointer w-fit hover:text-stone-900">
              Fotografías de Wikimedia Commons con licencias libres. Ver autores y licencias
            </summary>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
              {credited.map(s => (
                <li key={s.id}>
                  {s.commonName}:{' '}
                  <a
                    href={s.imageCredit!.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-stone-900"
                  >
                    {s.imageCredit!.author}
                  </a>{' '}
                  ({s.imageCredit!.license})
                </li>
              ))}
            </ul>
          </details>
        </footer>
      )}

      {/* Species detail dialog */}
      {activeSpecies && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/80"
          onClick={() => setActiveSpecies(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ficha-titulo"
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-stone-900 overflow-hidden shrink-0">
              <img src={activeSpecies.image} alt={activeSpecies.commonName} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setActiveSpecies(null)}
                aria-label="Cerrar ficha"
                className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white text-stone-900 flex items-center justify-center hover:bg-stone-100 active:scale-90 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              {activeSpecies.imageCredit && (
                <p className="text-sm text-stone-600">
                  Foto:{' '}
                  <a
                    href={activeSpecies.imageCredit.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-stone-900"
                  >
                    {activeSpecies.imageCredit.author}
                  </a>
                  , {activeSpecies.imageCredit.license}
                </p>
              )}
              <h2 id="ficha-titulo" className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-stone-950 leading-none">
                {activeSpecies.commonName}
              </h2>
              <p className="mt-2 text-lg text-stone-700">
                {activeSpecies.mapudungunName && <span>{activeSpecies.mapudungunName} en mapudungun · </span>}
                <span className="italic">{activeSpecies.scientificName}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                <StatusLabel status={activeSpecies.conservationStatus} />
                {activeSpecies.soundKey && (
                  <button
                    type="button"
                    onClick={() => handlePlaySound(activeSpecies.soundKey!)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold transition-transform active:scale-95 ${
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

              <p className="mt-6 text-base sm:text-lg text-stone-800 leading-relaxed">{activeSpecies.description}</p>

              <div className="mt-6 p-5 bg-stone-100">
                <h3 className="text-base font-bold text-stone-950">Dónde vive en el Angachilla</h3>
                <p className="mt-1 text-base text-stone-800 leading-relaxed">{activeSpecies.habitat}</p>
              </div>

              <div className="mt-3 p-5 bg-amber-50">
                <h3 className="text-base font-bold text-amber-950">Dato curioso</h3>
                <p className="mt-1 text-base text-amber-950 leading-relaxed">{activeSpecies.funFact}</p>
              </div>

              {(activeSpecies.ebirdUrl || activeSpecies.inaturalistUrl) && (
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                  {activeSpecies.ebirdUrl && (
                    <a
                      href={activeSpecies.ebirdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-base font-bold text-emerald-900 underline underline-offset-4 decoration-2 decoration-emerald-300 hover:decoration-emerald-700"
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
                      className="inline-flex items-center gap-1.5 text-base font-bold text-emerald-900 underline underline-offset-4 decoration-2 decoration-emerald-300 hover:decoration-emerald-700"
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
                  className="mt-8 w-full py-4 px-4 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <MapPin className="w-5 h-5" />
                  Ver dónde encontrarlo en el mapa
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
