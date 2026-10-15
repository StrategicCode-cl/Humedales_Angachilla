'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  QrCode,
  BookOpen,
  Bell,
  Camera,
  MessageSquarePlus,
  ShieldCheck,
  Volume2,
  VolumeX,
  UserCheck,
  LogIn,
  LogOut,
  FileText,
  Sparkles,
  Heart,
  Plus,
  Download,
  Menu,
  X
} from 'lucide-react';
import { User } from '../types';
import { soundService } from '../services/soundService';
import { usePWAInstall } from '../hooks/usePWAInstall';

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
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isInstallable, install } = usePWAInstall();

  // Close dropdown on click outside
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
    <header className="lg:hidden sticky top-0 z-40 bg-white text-stone-900 border-b border-stone-200/90 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={() => setCurrentTab('avisos')}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Compass className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight text-stone-900 font-display">
                  Angachilla
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
                  Santuario
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-semibold tracking-wide hidden sm:block">
                Humedal Urbano • Valdivia
              </p>
            </div>
          </div>

          {/* Unified, uncluttered Action Bar */}
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

            {/* Donation Button */}
            {onOpenDonations && (
              <button
                id="navbar-donate-button"
                onClick={onOpenDonations}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-xs transition-all active:scale-95"
                title="Hacer un aporte voluntario al Santuario Angachilla"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>Apoyar</span>
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
              title="Publicar aviso o reporte"
            >
              <Plus className={`w-4 h-4 stroke-[2.5] transition-transform duration-200 ${isCreatePanelOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Unified User & Tools Menu Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-full border border-stone-200 hover:bg-stone-50 transition-colors focus:outline-none"
                title="Menú de herramientas y cuenta"
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
                <Menu className="w-3.5 h-3.5 text-stone-600 hidden sm:block" />
              </button>

              {/* Tactile Surface Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs text-stone-900 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setShowUserMenu(false)}
                >
                  {/* User Profile Summary */}
                  <div className="px-4 py-2.5 border-b border-stone-100">
                    <p className="font-extrabold text-stone-900 truncate font-display text-sm">
                      {currentUser ? currentUser.name : 'Visitante del Santuario'}
                    </p>
                    <p className="text-stone-500 text-[11px] truncate">
                      {currentUser ? currentUser.email : 'Acceso libre a la comunidad'}
                    </p>
                    <div className="mt-1.5">
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {currentUser?.role === 'admin' ? 'Guardaparques / Admin' : 'Comunidad Humedal'}
                      </span>
                    </div>
                  </div>

                  {/* Sanctuary Tools Group */}
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 py-1">
                      Herramientas del Humedal
                    </p>

                    <button
                      onClick={onOpenQR}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Escanear Tótem QR en terreno</span>
                    </button>

                    <button
                      onClick={onOpenPosters}
                      className="w-full px-2 py-2 text-left text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Decálogo y Posters Oficiales</span>
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

                  {/* Administrative / Account Actions */}
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
    </header>
  );
};
