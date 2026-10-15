'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Compass,
  Download,
  FileText,
  Heart,
  Home,
  LogIn,
  LogOut,
  MessageSquarePlus,
  Pin,
  Plus,
  QrCode,
  ShieldCheck,
  Volume2,
  VolumeX
} from 'lucide-react';
import { User } from '../types';
import { pathForTab } from '../lib/tabs';
import { soundService } from '../services/soundService';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DesktopSidebarProps {
  currentTab: string;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenQR: () => void;
  onOpenPosters: () => void;
  onOpenDonations: () => void;
  onLogout: () => void;
  onOpenCreateSheet: () => void;
  isCreatePanelOpen: boolean;
}

const navItems = [
  { id: 'avisos', label: 'Inicio', icon: Home },
  { id: 'mapa', label: 'Mapa & Senderos', icon: Compass },
  { id: 'eventos', label: 'Eventos', icon: Calendar },
  { id: 'galeria', label: 'Galería', icon: Pin },
  { id: 'catalogo', label: 'Biodiversidad', icon: BookOpen },
  { id: 'sugerencias', label: 'Buzón Ciudadano', icon: MessageSquarePlus },
];

// Navegación lateral para pantallas grandes (lg+): queda como franja de íconos y
// se despliega sobre el contenido al pasar el mouse. En móvil se usan el Navbar
// superior y la barra inferior tipo Instagram.
export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
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
  const { isInstallable, install } = usePWAInstall();

  const handleToggleAmbient = () => {
    soundService.toggleAmbient(playing => setIsAmbientPlaying(playing));
  };

  return (
    <aside className="group/sidebar hidden lg:flex fixed inset-y-0 left-0 z-40 w-20 hover:w-64 focus-within:w-64 flex-col overflow-hidden bg-white border-r border-stone-200/90 hover:shadow-2xl focus-within:shadow-2xl transition-[width,box-shadow] duration-1000 ease-in-out select-none">
      {/* Brand */}
      <Link href={pathForTab('avisos')} className="flex items-center gap-3 px-5 h-20 group shrink-0">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-800 flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
          <Compass className="w-5 h-5 text-emerald-100" />
        </div>
        <div className="opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">
          <span className="block font-black text-xl tracking-tight text-stone-900 font-display leading-none">
            Angachilla
          </span>
          <span className="block text-[11px] text-stone-400 font-semibold tracking-wide mt-1">
            Humedal Urbano • Valdivia
          </span>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-6">
        {/* Main navigation */}
        <nav className="space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <Link
                key={item.id}
                href={pathForTab(item.id)}
                className={`flex items-center gap-3 px-[15px] py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-600 font-semibold hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span className="opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          {currentUser?.role === 'admin' && (
            <Link
              href={pathForTab('admin')}
              className={`flex items-center gap-3 px-[15px] py-2.5 rounded-xl text-sm transition-colors ${
                currentTab === 'admin'
                  ? 'bg-emerald-800 text-white font-bold'
                  : 'text-emerald-800 font-semibold hover:bg-emerald-50'
              }`}
            >
              <ShieldCheck className="w-[18px] h-[18px] shrink-0" />
              <span className="opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">Panel Guardaparques</span>
            </Link>
          )}
        </nav>

        {/* Primary action */}
        <button
          id="sidebar-create-button"
          onClick={onOpenCreateSheet}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] ${
            isCreatePanelOpen
              ? 'bg-stone-900 shadow-stone-950/20'
              : 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 hover:brightness-110 shadow-emerald-900/20'
          }`}
        >
          <Plus className={`w-4 h-4 shrink-0 stroke-[2.5] transition-transform duration-200 ${isCreatePanelOpen ? 'rotate-45' : ''}`} />
          <span className="opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">Crear</span>
        </button>

        {/* Tools */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">
            Herramientas
          </p>
          <div className="space-y-0.5">
            <SidebarTool icon={<QrCode className="w-4 h-4" />} label="Escanear tótem QR" onClick={onOpenQR} />
            <SidebarTool icon={<FileText className="w-4 h-4" />} label="Decálogo y posters" onClick={onOpenPosters} />
            <SidebarTool
              icon={isAmbientPlaying ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4" />}
              label={isAmbientPlaying ? 'Sonido ambiente activo' : 'Sonido ambiente'}
              onClick={handleToggleAmbient}
              active={isAmbientPlaying}
            />
            {isInstallable && (
              <SidebarTool icon={<Download className="w-4 h-4" />} label="Instalar como app" onClick={install} />
            )}
          </div>
        </div>
      </div>

      {/* Footer: donation + account */}
      <div className="shrink-0 border-t border-stone-200/90 p-3 space-y-2">
        <button
          id="sidebar-donate-button"
          onClick={onOpenDonations}
          className="w-full flex items-center gap-2 px-[15px] py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
        >
          <Heart className="w-3.5 h-3.5 shrink-0 fill-rose-600 text-rose-600" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">Apoyar al santuario</span>
        </button>

        <div className="flex items-center gap-3 px-1 py-1.5">
          <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <span>{currentUser ? currentUser.name[0] : 'V'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">
            <p className="text-xs font-bold text-stone-900 truncate">
              {currentUser ? currentUser.name : 'Visitante'}
            </p>
            <p className="text-[11px] text-stone-500 truncate">
              {currentUser?.role === 'admin' ? 'Guardaparques' : currentUser ? currentUser.email : 'Sin sesión iniciada'}
            </p>
          </div>
          {currentUser ? (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="p-2 rounded-lg text-emerald-800 hover:bg-emerald-50 transition-colors"
              title="Iniciar sesión / Registrarse"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

function SidebarTool({
  icon,
  label,
  onClick,
  active = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
        active ? 'bg-emerald-50 text-emerald-800' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
      }`}
    >
      <span className="text-emerald-700 shrink-0">{icon}</span>
      <span className="opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-1000 whitespace-nowrap">{label}</span>
    </button>
  );
}
