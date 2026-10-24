'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Camera,
  Compass,
  Download,
  FileText,
  Heart,
  Home,
  LogIn,
  LogOut,
  MessageSquarePlus,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { User } from '../types';
import { resolveMediaUrl } from '../lib/api';
import { AngachillaIcon } from './AngachillaIcon';
import { pathForTab } from '../lib/tabs';
import { soundService } from '../services/soundService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from './AppShell';

interface DesktopSidebarProps {
  currentTab: string;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenQR: () => void;
  onOpenPosters: () => void;
  onOpenDonations: () => void;
  onLogout: () => void;
  onOpenCreateSheet: (anchor?: DOMRect) => void;
  isCreatePanelOpen: boolean;
}

const navItems = [
  { id: 'avisos', label: 'Inicio', icon: Home },
  { id: 'galeria', label: 'Galería', icon: Camera },
  { id: 'mapa', label: 'Mapa y senderos', icon: Compass },
  { id: 'catalogo', label: 'Guía de especies', icon: BookOpen },
  { id: 'eventos', label: 'Calendario', icon: Calendar },
  { id: 'apps', label: 'Apps complementarias', icon: Smartphone },
  { id: 'sugerencias', label: 'Buzón ciudadano', icon: MessageSquarePlus },
];

// Text that appears only while the rail is open (hover or keyboard focus inside it)
const reveal =
  'opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap';

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
  const { openLanding } = useApp();
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  const handleToggleAmbient = () => {
    soundService.toggleAmbient(playing => setIsAmbientPlaying(playing));
  };

  const navLink = (id: string, label: string, Icon: typeof Home) => {
    const isActive = currentTab === id;
    return (
      <Link
        key={id}
        href={pathForTab(id)}
        aria-current={isActive ? 'page' : undefined}
        title={label}
        className={`flex items-center gap-3 h-10 px-[14px] rounded-md text-sm transition-colors ${
          isActive ? 'bg-stone-200/80 text-stone-950 font-semibold' : 'text-stone-600 font-medium hover:bg-stone-100 hover:text-stone-950'
        }`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-stone-950' : 'text-stone-500'}`} strokeWidth={isActive ? 2.2 : 1.8} />
        <span className={reveal}>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="group/sidebar hidden lg:flex fixed inset-y-0 left-0 z-50 w-20 hover:w-64 focus-within:w-64 flex-col overflow-hidden bg-white border-r border-stone-200 hover:shadow-xl focus-within:shadow-xl transition-[width,box-shadow] duration-300 ease-out select-none">
      {/* Brand */}
      <Link href={pathForTab('avisos')} className="flex items-center gap-3 px-5 h-20 shrink-0" aria-label="Angachilla App, inicio">
        <div className="w-10 h-10 shrink-0 rounded-[23%] ring-1 ring-stone-200">
          <AngachillaIcon className="w-full h-full" />
        </div>
        <div className={reveal}>
          <img src={resolveMediaUrl('/api/media/slug/svg-letras-angachilla-app')} alt="" className="h-5 w-auto object-contain" />
          <span className="mt-1 block text-[13px] text-stone-500">Reserva Comunitaria · Valdivia</span>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-4">
        {/* Main action */}
        <button
          id="sidebar-create-button"
          type="button"
          onClick={e => onOpenCreateSheet(e.currentTarget.getBoundingClientRect())}
          aria-expanded={isCreatePanelOpen}
          aria-haspopup="dialog"
          title="Crear"
          className={`w-full flex items-center gap-3 h-11 px-[12px] rounded-md text-sm font-semibold text-white transition-colors active:scale-[0.98] ${
            isCreatePanelOpen ? 'bg-stone-900' : 'bg-emerald-900 hover:bg-emerald-800'
          }`}
        >
          <Plus className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isCreatePanelOpen ? 'rotate-45' : ''}`} strokeWidth={2.4} />
          <span className={reveal}>Crear</span>
        </button>

        {/* Main navigation */}
        <nav aria-label="Secciones" className="mt-4 space-y-0.5 -mx-0.5">
          {navItems.map(item => navLink(item.id, item.label, item.icon))}
          {currentUser?.role === 'admin' && navLink('admin', 'Panel del guardaparques', ShieldCheck)}
        </nav>

        {/* Visit tools */}
        <div className="mt-5 pt-4 border-t border-stone-200 -mx-0.5">
          <p className={`px-[14px] pb-1 text-[13px] text-stone-500 ${reveal}`}>Para tu visita</p>
          <div className="space-y-0.5">
            <SidebarTool icon={QrCode} label="Escanear tótem QR" onClick={onOpenQR} />
            <SidebarTool icon={FileText} label="Decálogo y normas" onClick={onOpenPosters} />
            <SidebarTool
              icon={isAmbientPlaying ? Volume2 : VolumeX}
              label={isAmbientPlaying ? 'Sonido ambiente: activo' : 'Sonido ambiente'}
              onClick={handleToggleAmbient}
              active={isAmbientPlaying}
            />
            <SidebarTool icon={Sparkles} label="Ver la portada" onClick={openLanding} />
            {isInstallable && <SidebarTool icon={Download} label="Instalar como app" onClick={install} />}
          </div>
        </div>
      </div>

      {/* Footer: support + account */}
      <div className="shrink-0 border-t border-stone-200 px-[18px] py-3 space-y-1">
        <button
          id="sidebar-donate-button"
          type="button"
          onClick={onOpenDonations}
          title="Donar a la reserva"
          className="w-full flex items-center gap-3 h-10 px-[12px] rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950 transition-colors"
        >
          <Heart className="w-5 h-5 shrink-0 text-rose-600" strokeWidth={1.8} />
          <span className={reveal}>Donar a la reserva</span>
        </button>

        <div className="flex items-center gap-1">
          <Link
            href={pathForTab('perfil')}
            aria-current={currentTab === 'perfil' ? 'page' : undefined}
            title="Tu perfil"
            className={`min-w-0 flex-1 flex items-center gap-3 rounded-md p-1.5 transition-colors ${
              currentTab === 'perfil' ? 'bg-stone-200/80' : 'hover:bg-stone-100'
            }`}
          >
            <span className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0">
              {currentUser?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (currentUser?.name[0] ?? 'V').toUpperCase()
              )}
            </span>
            <span className={`min-w-0 flex-1 ${reveal}`}>
              <span className="block text-sm font-semibold text-stone-950 truncate">{currentUser ? currentUser.name : 'Visitante'}</span>
              <span className="block text-[13px] text-stone-600 truncate">
                {currentUser?.role === 'admin'
                  ? 'Guardaparques'
                  : currentUser?.username
                  ? `@${currentUser.username}`
                  : currentUser
                  ? currentUser.email
                  : 'Sin sesión iniciada'}
              </span>
            </span>
          </Link>
          {currentUser ? (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className={`w-9 h-9 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-950 hover:bg-stone-100 transition-colors shrink-0 ${reveal}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              aria-label="Iniciar sesión"
              title="Iniciar sesión"
              className={`w-9 h-9 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-950 hover:bg-stone-100 transition-colors shrink-0 ${reveal}`}
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
  icon: Icon,
  label,
  onClick,
  active = false
}: {
  icon: typeof Home;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active || undefined}
      title={label}
      className={`w-full flex items-center gap-3 h-10 px-[14px] rounded-md text-sm transition-colors ${
        active ? 'bg-stone-200/80 text-stone-950 font-semibold' : 'text-stone-600 font-medium hover:bg-stone-100 hover:text-stone-950'
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-stone-950' : 'text-stone-500'}`} strokeWidth={1.8} />
      <span className={reveal}>{label}</span>
    </button>
  );
}
