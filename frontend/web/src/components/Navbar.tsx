'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  MessageSquarePlus,
  ShieldCheck,
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  FileText,
  Heart,
  Plus,
  Download,
  Menu,
  Calendar,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { User } from '../types';
import { resolveMediaUrl } from '../lib/api';
import { soundService } from '../services/soundService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from './AppShell';

interface NavbarProps {
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenQR: () => void;
  onOpenPosters: () => void;
  onOpenDonations?: () => void;
  onLogout: () => void;
  onOpenCreateSheet: () => void;
  isCreatePanelOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  setCurrentTab,
  currentUser,
  onOpenAuth,
  onOpenQR,
  onOpenPosters,
  onOpenDonations,
  onLogout,
  onOpenCreateSheet,
  isCreatePanelOpen
}) => {
  const { openLanding } = useApp();
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isInstallable, install } = usePWAInstall();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleToggleAmbient = () => {
    soundService.toggleAmbient(playing => {
      setIsAmbientPlaying(playing);
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-stone-900 border-b border-stone-200/90 shadow-xs select-none lg:pl-20">
      {/* Main Fixed Top Header (Logo Oficial + Donaciones + Perfil de Usuario) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Official Brand SVG Logos (SIMBOLO + LETRAS ANGACHILLA APP) */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setCurrentTab('avisos')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center p-1.5 shadow-xs group-hover:bg-emerald-800 transition-colors shrink-0">
              <img
                src={resolveMediaUrl('/api/media/slug/svg-simbolo-angachilla-app')}
                alt="Símbolo Angachilla App"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <img
                  src={resolveMediaUrl('/api/media/slug/svg-letras-angachilla-app')}
                  alt="Angachilla App"
                  className="h-5 sm:h-6 w-auto object-contain"
                />
                <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
                  Reserva Comunitaria
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-semibold tracking-wide hidden sm:block">
                Santuario de la Naturaleza Humedal Angachilla · Valdivia
              </p>
            </div>
          </div>

          {/* Right Action Bar: Ambient + Donations + Create + User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Ambient Nature Sound Toggle */}
            <button
              onClick={handleToggleAmbient}
              title={isAmbientPlaying ? 'Silenciar sonidos del humedal' : 'Escuchar ambiente natural (viento y chucaos)'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                isAmbientPlaying
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {isAmbientPlaying ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline text-[11px]">
                {isAmbientPlaying ? 'Sonido on' : 'Ambiente'}
              </span>
            </button>

            {/* Donation Button (Required in Fixed Top Header per Acta Reunión 3) */}
            {onOpenDonations && (
              <button
                id="navbar-donate-button"
                onClick={onOpenDonations}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-xs transition-all active:scale-95"
                title="Hacer una donación o aporte voluntario a la Reserva Comunitaria Angachilla"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>Donar</span>
              </button>
            )}

            {/* Create Action Button */}
            <button
              id="navbar-create-button"
              onClick={onOpenCreateSheet}
              className={`p-2 rounded-full border transition-all ${
                isCreatePanelOpen
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs ring-2 ring-stone-900/20'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
              }`}
              title="Publicar en el Feed o subir foto"
            >
              <Plus className={`w-4 h-4 stroke-[2.5] transition-transform duration-200 ${isCreatePanelOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* User Profile & Tools Menu Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-full border border-stone-200 hover:bg-stone-50 transition-colors focus:outline-none"
                title="Perfil de usuario y herramientas"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-stone-200">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser ? currentUser.name[0] : 'V'}</span>
                  )}
                </div>
                <span className="hidden md:inline text-xs font-bold text-stone-700 max-w-[96px] truncate">
                  {currentUser ? currentUser.name.split(' ')[0] : 'Perfil'}
                </span>
                <Menu className="w-3.5 h-3.5 text-stone-600 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs text-stone-900 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setShowUserMenu(false)}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentTab('perfil')}
                    className="w-full px-4 py-2.5 border-b border-stone-100 text-left hover:bg-stone-50 transition-colors"
                  >
                    <p className="font-semibold text-stone-900 truncate text-sm">
                      {currentUser ? currentUser.name : 'Visitante'}
                    </p>
                    <p className="text-stone-600 text-xs truncate">
                      {currentUser
                        ? `${currentUser.email} · ${currentUser.role === 'admin' ? 'Guardaparques' : 'Visitante'}`
                        : 'Sin sesión iniciada'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-800">Ver tu perfil y actividad ›</p>
                  </button>

                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 py-1">
                      Herramientas del Humedal
                    </p>

                    <button
                      onClick={openLanding}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Portada / Bienvenida</span>
                    </button>

                    <button
                      onClick={onOpenQR}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Escanear Tótem QR en terreno</span>
                    </button>

                    <button
                      onClick={() => setCurrentTab('eventos')}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Calendario de Actividades</span>
                    </button>

                    <button
                      onClick={() => setCurrentTab('apps')}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Apps Complementarias</span>
                    </button>

                    <button
                      onClick={onOpenPosters}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Decálogo y Normas Oficiales</span>
                    </button>

                    {isInstallable && (
                      <button
                        onClick={install}
                        className="w-full px-2 py-2 text-left text-emerald-800 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors"
                      >
                        <Download className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Instalar como App (PWA)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setCurrentTab('sugerencias')}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <MessageSquarePlus className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Buzón Ciudadano</span>
                    </button>
                  </div>

                  <div className="border-t border-stone-100 my-1 pt-1 px-3">
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => setCurrentTab('admin')}
                        className="w-full px-2 py-2 text-left text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold flex items-center gap-2.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Panel de Administración</span>
                      </button>
                    )}

                    {currentUser ? (
                      <button
                        onClick={onLogout}
                        className="w-full px-2 py-2 text-left text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Cerrar Sesión</span>
                      </button>
                    ) : (
                      <button
                        onClick={onOpenAuth}
                        className="w-full px-2 py-2 text-left text-emerald-800 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors"
                      >
                        <LogIn className="w-4 h-4 shrink-0" />
                        <span>Iniciar Sesión / Registrarse</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Sub-Bar with the 3 Official Logos (Acta Reunión 3 App) */}
      <div className="bg-stone-50/90 border-t border-stone-200/70 px-3 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0 hidden sm:inline">
            Impulsan y administran:
          </span>
          <div className="flex items-center justify-around sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 shrink-0" title="Reserva Comunitaria Humedal Angachilla">
              <img
                src={resolveMediaUrl('/api/media/slug/svg-logo-reserva-comunitaria')}
                alt="Logo Reserva Comunitaria Humedal Angachilla"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <span className="text-[10px] font-bold text-stone-700 hidden md:inline">
                Reserva Comunitaria
              </span>
            </div>

            <div className="h-4 w-px bg-stone-200 shrink-0" />

            <div className="flex items-center gap-1.5 shrink-0" title="Comité Ecológico Bosque Humedal Angachilla">
              <img
                src={resolveMediaUrl('/api/media/slug/svg-logo-comite-ecologico')}
                alt="Logo Comité Ecológico Bosque Humedal Angachilla"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <span className="text-[10px] font-bold text-stone-700 hidden md:inline">
                Comité Ecológico
              </span>
            </div>

            <div className="h-4 w-px bg-stone-200 shrink-0" />

            <div className="flex items-center gap-2 shrink-0" title="Ilustre Municipalidad de Valdivia · Marca Turística">
              <img
                src={resolveMediaUrl('/api/media/slug/svg-logo-muni-valdivia')}
                alt="Logo Municipalidad de Valdivia"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <img
                src={resolveMediaUrl('/api/media/slug/svg-logo-marca-turistica')}
                alt="Logo Marca Turística Valdivia"
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
