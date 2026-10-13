'use client';

import React, { useState } from 'react';
import {
  Search,
  Volume2,
  MapPin,
  Sparkles,
  Info,
  Filter,
  Layers,
  Leaf,
  Bird,
  ShieldAlert,
  ChevronRight,
  X,
  ExternalLink,
  Globe
} from 'lucide-react';
import { Species, SpeciesCategory } from '../types';
import { INITIAL_SPECIES } from '../data/mockData';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

interface SpeciesCatalogProps {
  onGoToMapHabitat?: (coords: [number, number]) => void;
}

export const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({ onGoToMapHabitat }) => {
  const [speciesList] = useState<Species[]>(() => storageService.getSpecies());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSpecies, setActiveSpecies] = useState<Species | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todas las Especies', count: speciesList.length },
    { id: 'ave_acuatica', label: 'Aves Acuáticas', count: speciesList.filter(s => s.category === 'ave_acuatica').length },
    { id: 'ave_bosque', label: 'Aves de Bosque', count: speciesList.filter(s => s.category === 'ave_bosque').length },
    { id: 'hongo', label: '🍄 Fungi & Hongos', count: speciesList.filter(s => s.category === 'hongo').length },
    { id: 'mamifero', label: 'Mamíferos', count: speciesList.filter(s => s.category === 'mamifero').length },
    { id: 'anfibio', label: 'Anfibios', count: speciesList.filter(s => s.category === 'anfibio').length },
    { id: 'arbol_arbusto', label: 'Árboles Nativos', count: speciesList.filter(s => s.category === 'arbol_arbusto').length },
    { id: 'planta_acuatica', label: 'Plantas Acuáticas', count: speciesList.filter(s => s.category === 'planta_acuatica').length },
  ];

  const filteredSpecies = speciesList.filter(species => {
    const matchesCategory = selectedCategory === 'all' || species.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      species.commonName.toLowerCase().includes(q) ||
      species.scientificName.toLowerCase().includes(q) ||
      (species.mapudungunName && species.mapudungunName.toLowerCase().includes(q)) ||
      species.habitat.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handlePlaySound = (soundKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlayingKey(soundKey);
    soundService.playBySoundKey(soundKey);
    setTimeout(() => {
      setPlayingKey(null);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
              Biodiversidad de la Selva Valdiviana
            </span>
            <span className="text-xs text-stone-500 font-medium">Humedal Angachilla</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 font-display">
            Catálogo Oficial de Flora y Fauna
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl mt-1 leading-relaxed">
            Descubre las especies nativas que habitan en los hualves, canales y bosques siempreverdes del Santuario de la Naturaleza. Escucha sus cantos y conoce su estado de conservación.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre común, científico o mapudungun..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* --- INTEGRACIÓN CON PLATAFORMAS EXTERNAS: eBird & iNaturalist (PDF REUNIÓN 15-SEPT-2026) --- */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-stone-900 shadow-xs border border-stone-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Ciencia Ciudadana
              </span>
              <span className="text-xs text-stone-500 font-medium">Bases de datos biológicos abiertas</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5 font-display">
              Registros en Tiempo Real eBird & iNaturalist
            </h3>
            <p className="text-xs text-stone-600 mt-0.5 max-w-xl">
              Explora avistamientos comunitarios registrados en el Santuario Angachilla o sube tus propios registros ornitológicos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://ebird.org/hotspot/L11417032"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-xs active:scale-95"
            title="Ver avistamientos del Santuario Angachilla en eBird"
          >
            <Bird className="w-4 h-4 text-amber-800" />
            <span>Hotspot eBird</span>
            <ExternalLink className="w-3 h-3 text-amber-700" />
          </a>
          <a
            href="https://www.inaturalist.org/places/chile"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-all shadow-xs active:scale-95"
            title="Explorar flora, fauna y hongos en iNaturalist"
          >
            <Leaf className="w-4 h-4 text-emerald-700" />
            <span>iNaturalist</span>
            <ExternalLink className="w-3 h-3 text-emerald-700" />
          </a>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedCategory === cat.id
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === cat.id
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Species Grid */}
      {filteredSpecies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-sm">
          <Leaf className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800 font-display">
            No se encontraron especies
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Intenta con otros términos de búsqueda como “Chucao”, “Cisne”, “Canelo” o “Pitra”.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpecies.map(species => (
            <div
              key={species.id}
              onClick={() => setActiveSpecies(species)}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Photo Banner */}
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                <img
                  src={species.image}
                  alt={species.commonName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />

                {/* Conservation Status Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${species.statusColor}`}
                  >
                    {species.conservationStatus}
                  </span>
                </div>

                {/* Sound Quick Player Button */}
                {species.soundKey && (
                  <button
                    onClick={e => handlePlaySound(species.soundKey!, e)}
                    title={`Escuchar canto: ${species.soundLabel || species.commonName}`}
                    className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md shadow-md transition-transform active:scale-95 ${
                      playingKey === species.soundKey
                        ? 'bg-teal-500 text-white animate-pulse'
                        : 'bg-stone-900/80 hover:bg-stone-900 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}

                {/* Name on Bottom */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-base font-extrabold font-display leading-tight drop-shadow-sm">
                    {species.commonName}
                  </h3>
                  {species.mapudungunName && (
                    <span className="text-[11px] text-emerald-300 font-semibold italic">
                      {species.mapudungunName} (Mapudungun)
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-xs font-mono text-stone-500 italic">
                    {species.scientificName}
                  </p>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                    {species.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                  <span>Ver ficha completa y hábitat</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SPECIES DETAIL MODAL --- */}
      {activeSpecies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Image Header */}
            <div className="relative aspect-video sm:aspect-[21/9] bg-stone-900 overflow-hidden">
              <img
                src={activeSpecies.image}
                alt={activeSpecies.commonName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

              <button
                onClick={() => setActiveSpecies(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white text-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${activeSpecies.statusColor}`}
                  >
                    {activeSpecies.conservationStatus}
                  </span>
                  {activeSpecies.soundKey && (
                    <button
                      onClick={() => handlePlaySound(activeSpecies.soundKey!)}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500 hover:bg-teal-400 text-stone-950 text-xs font-bold shadow transition-transform active:scale-95"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Reproducir Canto</span>
                    </button>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-display">
                  {activeSpecies.commonName}
                </h2>
                <div className="flex items-center gap-3 text-xs text-stone-300">
                  <span className="italic font-mono">{activeSpecies.scientificName}</span>
                  {activeSpecies.mapudungunName && (
                    <span className="text-emerald-300 font-medium">
                      • {activeSpecies.mapudungunName} (Mapudungun)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Details Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Habitat */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Hábitat en Humedal Angachilla
                </span>
                <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                  {activeSpecies.habitat}
                </p>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Características & Comportamiento
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                  {activeSpecies.description}
                </p>
              </div>

              {/* Fun Fact / Cultural Significance */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950">
                <div className="flex items-center space-x-2 text-amber-800 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">
                    Dato Curioso & Valor Cultural Valdiviano
                  </h4>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  {activeSpecies.funFact}
                </p>
              </div>

              {/* External Monitoring: eBird & iNaturalist (PDF 15-Sept-2026) */}
              {(activeSpecies.ebirdUrl || activeSpecies.inaturalistUrl) && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Monitoreo en Plataformas Científicas
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeSpecies.ebirdUrl && (
                      <a
                        href={activeSpecies.ebirdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition-colors shadow-xs"
                      >
                        <Bird className="w-3.5 h-3.5 text-amber-700" />
                        <span>Ver registros en eBird</span>
                        <ExternalLink className="w-3 h-3 text-amber-600" />
                      </a>
                    )}
                    {activeSpecies.inaturalistUrl && (
                      <a
                        href={activeSpecies.inaturalistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold border border-emerald-300 transition-colors shadow-xs"
                      >
                        <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Ver taxonomía en iNaturalist</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button: Locate on Map */}
              {activeSpecies.approxLocation && onGoToMapHabitat && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onGoToMapHabitat(activeSpecies.approxLocation!);
                      setActiveSpecies(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-950/20 transition-transform active:scale-98"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Ver hábitat aproximado en el mapa interactivo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
