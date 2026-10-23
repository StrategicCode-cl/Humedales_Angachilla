'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Bell,
  Calendar,
  Camera,
  Compass,
  FileText,
  Heart,
  Home,
  Lightbulb,
  QrCode,
  Smartphone,
  X
} from 'lucide-react';
import { User, Notice } from '../types';
import { authApi, resolveMediaUrl } from '../lib/api';
import { pathForTab, tabForPath } from '../lib/tabs';
import { Navbar } from './Navbar';
import { DesktopSidebar } from './DesktopSidebar';
import { QRScannerModal } from './QRScannerModal';
import { AuthModal } from './AuthModal';
import { InfographicsModal } from './InfographicsModal';
import { OfflineIndicator } from './OfflineIndicator';

import { LandingPage } from './LandingPage';

interface AppContextValue {
  currentUser: User | null;
  setCurrentTab: (tab: string) => void;
  openAuth: () => void;
  signIn: (user: User) => void;
  openDonations: () => void;
  openLanding: () => void;
  openQRWithCode: (code: string) => void;
  openQR: () => void;
  logout: () => void;
  goToMapLocation: (coords: [number, number], routeId?: string) => void;
  mapTargetCoordinates: [number, number] | null;
  mapTargetRouteId: string | null;
  isCreateNoticeOpen: boolean;
  closeCreateNotice: () => void;
  createNoticeCategory: Notice['category'];
  isCreatePinOpen: boolean;
  closeCreatePin: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppShell>');
  return ctx;
}

// 5 Primary Bottom Nav items acordados:
// 1. Feed, 2. Galería, 3. Recorrer Mapa (central con botón flotante), 4. Especies, 5. Apps
const bottomNavItems = [
  { id: 'avisos', label: 'Inicio', icon: Home },
  { id: 'galeria', label: 'Galería', icon: Camera },
  { id: 'mapa', label: 'Recorrer Mapa', icon: Compass, isMapCenter: true },
  { id: 'catalogo', label: 'Especies', icon: BookOpen },
  { id: 'apps', label: 'Apps', icon: Smartphone },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = tabForPath(pathname);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Landing Page state
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isRoot = window.location.pathname === '/' || window.location.pathname === '';
    const landed = sessionStorage.getItem('angachilla_landed');
    return isRoot && landed !== 'true';
  });

  // Modals & Panels state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isPostersOpen, setIsPostersOpen] = useState(false);
  const [isCreateMiniPanelOpen, setIsCreateMiniPanelOpen] = useState(false);
  const [isCreatePinTriggered, setIsCreatePinTriggered] = useState(false);
  const [isCreateNoticeTriggered, setIsCreateNoticeTriggered] = useState(false);
  const [createNoticeCategory, setCreateNoticeCategory] = useState<Notice['category']>('comunidad');
  const [preselectedQRCode, setPreselectedQRCode] = useState<string | null>(null);
  const [targetMapCoordinates, setTargetMapCoordinates] = useState<[number, number] | null>(null);
  const [targetMapRouteId, setTargetMapRouteId] = useState<string | null>(null);

  // Recupera la sesión activa (cookie) al montar
  useEffect(() => {
    authApi.me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const setCurrentTab = (tab: string) => router.push(pathForTab(tab));

  const handleOpenQRWithCode = (code: string) => {
    setPreselectedQRCode(code);
    setIsQROpen(true);
  };

  const handleGoToMapLocation = (coords: [number, number], routeId?: string) => {
    setTargetMapCoordinates(coords);
    if (routeId) {
      setTargetMapRouteId(routeId);
    }
    setCurrentTab('mapa');
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    setCurrentUser(null);
    if (currentTab === 'admin') setCurrentTab('avisos');
  };

  const contextValue: AppContextValue = {
    currentUser,
    setCurrentTab,
    openAuth: () => setIsAuthOpen(true),
    signIn: setCurrentUser,
    openDonations: () => setCurrentTab('donar'),
    openLanding: () => setShowLanding(true),
    openQRWithCode: handleOpenQRWithCode,
    openQR: () => {
      setPreselectedQRCode(null);
      setIsQROpen(true);
    },
    logout: handleLogout,
    goToMapLocation: handleGoToMapLocation,
    mapTargetCoordinates: targetMapCoordinates,
    mapTargetRouteId: targetMapRouteId,
    isCreateNoticeOpen: isCreateNoticeTriggered,
    closeCreateNotice: () => setIsCreateNoticeTriggered(false),
    createNoticeCategory,
    isCreatePinOpen: isCreatePinTriggered,
    closeCreatePin: () => setIsCreatePinTriggered(false),
  };

  // Render Landing Page if active
  if (showLanding) {
    return (
      <AppContext.Provider value={contextValue}>
        <LandingPage
          currentUser={currentUser}
          onEnterApp={(targetTab) => {
            sessionStorage.setItem('angachilla_landed', 'true');
            setShowLanding(false);
            if (targetTab) setCurrentTab(targetTab);
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            currentUser={currentUser}
            onUserChange={(user: User) => {
              setCurrentUser(user);
              setIsAuthOpen(false);
              sessionStorage.setItem('angachilla_landed', 'true');
              setShowLanding(false);
            }}
          />
        )}
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div
        className="w-full min-h-screen flex flex-col bg-stone-50"
        style={{
          backgroundImage: `linear-gradient(rgba(250, 250, 249, 0.94), rgba(245, 245, 244, 0.96)), url(${resolveMediaUrl('/api/media/slug/tex-5')})`,
          backgroundSize: '420px',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Top Navbar Header + Institutional Logos Sub-Bar */}
        <Navbar
          setCurrentTab={setCurrentTab}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenQR={() => {
            setPreselectedQRCode(null);
            setIsQROpen(true);
          }}
          onOpenPosters={() => setIsPostersOpen(true)}
          onOpenDonations={() => setCurrentTab('donar')}
          onLogout={handleLogout}
          onOpenCreateSheet={() => setIsCreateMiniPanelOpen(prev => !prev)}
          isCreatePanelOpen={isCreateMiniPanelOpen}
        />

        {/* Desktop Sidebar Navigation (lg+) */}
        <DesktopSidebar
          currentTab={currentTab}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenQR={() => {
            setPreselectedQRCode(null);
            setIsQROpen(true);
          }}
          onOpenPosters={() => setIsPostersOpen(true)}
          onOpenDonations={() => setCurrentTab('donar')}
          onLogout={handleLogout}
          onOpenCreateSheet={() => setIsCreateMiniPanelOpen(prev => !prev)}
          isCreatePanelOpen={isCreateMiniPanelOpen}
        />

        {/* Main View Port */}
        <main className="flex-1 w-full overflow-x-clip pb-16 lg:pb-0 lg:pl-20">
          {children}
        </main>

        {/* --- 5-ITEM MOBILE BOTTOM NAVIGATION BAR (ACTA REUNIÓN 3 APP) --- */}
        <nav
          id="instagram-bottom-dock"
          className="fixed lg:hidden bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 px-2 py-1.5 flex items-center justify-around shadow-2xl select-none"
        >
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if (item.isMapCenter) {
              return (
                <Link
                  key={item.id}
                  id="mobile-map-center-button"
                  href={pathForTab(item.id)}
                  className="flex flex-col items-center -mt-6 focus:outline-none group"
                  title="Recorrer Mapa Interactivo de las 9 Estaciones"
                >
                  <div
                    className={`w-13 h-13 rounded-full flex items-center justify-center p-2.5 text-white shadow-lg border-2 border-white transition-all active:scale-95 ${
                      isActive
                        ? 'bg-emerald-900 shadow-emerald-950/40 ring-2 ring-emerald-400'
                        : 'bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600 shadow-emerald-950/30'
                    }`}
                  >
                    <img
                      src={resolveMediaUrl('/api/media/slug/svg-logo-boton-mapa')}
                      alt="Recorrer Mapa"
                      className="w-7 h-7 object-contain brightness-0 invert"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold mt-0.5 leading-none ${
                      isActive ? 'text-emerald-900' : 'text-emerald-800'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                id={`tab-btn-${item.id}`}
                href={pathForTab(item.id)}
                className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-900 font-black scale-105'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.9]'}`} />
                <span className={`text-[10px] mt-0.5 leading-none ${isActive ? 'font-bold text-emerald-950' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- MINIMALIST FLOATING ACTION PANEL OVER SCREEN --- */}
      {isCreateMiniPanelOpen && (
        <>
          <div
            id="mini-panel-backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={() => setIsCreateMiniPanelOpen(false)}
          />

          <div
            id="mini-actions-panel"
            className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 lg:bottom-auto lg:top-48 lg:left-24 lg:translate-x-0 w-[90%] max-w-xs z-50 bg-stone-900/95 text-white backdrop-blur-xl rounded-3xl p-3.5 shadow-2xl border border-white/10 animate-in zoom-in-95 fade-in slide-in-from-bottom-3 duration-150 select-none"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1 px-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                Acciones Rápidas
              </span>
              <button
                onClick={() => setIsCreateMiniPanelOpen(false)}
                className="w-5 h-5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-y-3 gap-x-1 py-1">
              <MiniPanelButton
                id="mini-btn-pin"
                icon={<Camera className="w-7 h-7 text-rose-400 group-hover:scale-110 transition-transform" />}
                label="Subir Foto"
                onClick={() => {
                  setIsCreateMiniPanelOpen(false);
                  setIsCreatePinTriggered(true);
                  setCurrentTab('galeria');
                }}
              />
              <MiniPanelButton
                id="mini-btn-qr"
                icon={<QrCode className="w-7 h-7 text-purple-400 group-hover:scale-110 transition-transform" />}
                label="Escanear QR"
                onClick={() => {
                  setIsCreateMiniPanelOpen(false);
                  setPreselectedQRCode(null);
                  setIsQROpen(true);
                }}
              />
              <MiniPanelButton
                id="mini-btn-notice"
                icon={<Bell className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform" />}
                label="Publicar Post"
                onClick={() => {
                  setIsCreateMiniPanelOpen(false);
                  setCreateNoticeCategory('comunidad');
                  setIsCreateNoticeTriggered(true);
                  setCurrentTab('avisos');
                }}
              />
              <MiniPanelButton
                id="mini-btn-events"
                icon={<Calendar className="w-7 h-7 text-teal-400 group-hover:scale-110 transition-transform" />}
                label="Calendario"
                onClick={() => {
                  setIsCreateMiniPanelOpen(false);
                  setCurrentTab('eventos');
                }}
              />
              <MiniPanelButton
                id="mini-btn-suggestion"
                icon={<Lightbulb className="w-7 h-7 text-amber-400 group-hover:scale-110 transition-transform" />}
                label="Buzón"
                onClick={() => {
                  setIsCreateMiniPanelOpen(false);
                  setCurrentTab('sugerencias');
                }}
              />
              <MiniPanelButton
                id="mini-btn-posters"
                icon={<FileText className="w-7 h-7 text-sky-400 group-hover:scale-110 transition-transform" />}
                label="Decálogo"
                onClick={() => {
                  setIsCreateMiniPanelOpen(false);
                  setIsPostersOpen(true);
                }}
              />
              <MiniPanelButton
                id="mini-btn-donations"
                className="col-span-3"
                icon={<Heart className="w-7 h-7 text-rose-400 fill-rose-500/30 group-hover:scale-110 transition-transform" />}
                label="Donar Aporte al Santuario"
                onClick={() => {
                  setIsCreateMiniPanelOpen(false);
                  setCurrentTab('donar');
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* --- GLOBAL MODALS --- */}
      <QRScannerModal
        isOpen={isQROpen}
        onClose={() => {
          setIsQROpen(false);
          setPreselectedQRCode(null);
        }}
        preselectedCode={preselectedQRCode}
        onGoToMapLocation={handleGoToMapLocation}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={user => setCurrentUser(user)}
      />

      <InfographicsModal
        isOpen={isPostersOpen}
        onClose={() => setIsPostersOpen(false)}
      />


      <OfflineIndicator />
    </AppContext.Provider>
  );
}

function MiniPanelButton({
  id,
  icon,
  label,
  onClick,
  className = ''
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-white group ${className}`}
      title={label}
    >
      {icon}
      <span className="text-[11px] font-semibold text-stone-200 mt-1">
        {label}
      </span>
    </button>
  );
}
