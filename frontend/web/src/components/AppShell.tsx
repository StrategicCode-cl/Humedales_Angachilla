'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Camera,
  Compass,
  Home,
  Smartphone
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
import { CreateMenu, CreateMenuAnchor } from './CreateMenu';

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
  const [createAnchor, setCreateAnchor] = useState<CreateMenuAnchor | null>(null);
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

  // The "Crear" menu opens beside the button that asked for it (sidebar or top bar) on large screens
  const toggleCreateMenu = (from: 'sidebar' | 'navbar') => (rect?: DOMRect) => {
    if (isCreateMiniPanelOpen) {
      setIsCreateMiniPanelOpen(false);
      return;
    }
    if (rect) {
      const MENU_HEIGHT = 470;
      setCreateAnchor(
        from === 'sidebar'
          ? { top: Math.max(16, Math.min(rect.top, window.innerHeight - MENU_HEIGHT - 16)), left: 92 }
          : { top: rect.bottom + 8, right: Math.max(16, window.innerWidth - rect.right) }
      );
    }
    setIsCreateMiniPanelOpen(true);
  };
  const closeCreateMenu = useCallback(() => setIsCreateMiniPanelOpen(false), []);

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
          onOpenCreateSheet={toggleCreateMenu('navbar')}
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
          onOpenCreateSheet={toggleCreateMenu('sidebar')}
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
        <CreateMenu
          anchor={createAnchor}
          onClose={closeCreateMenu}
          onUploadPhoto={() => {
            setIsCreatePinTriggered(true);
            setCurrentTab('galeria');
          }}
          onPublishPost={() => {
            setCreateNoticeCategory('comunidad');
            setIsCreateNoticeTriggered(true);
            setCurrentTab('avisos');
          }}
          onSuggestion={() => setCurrentTab('sugerencias')}
          onScanQR={() => {
            setPreselectedQRCode(null);
            setIsQROpen(true);
          }}
          onCalendar={() => setCurrentTab('eventos')}
          onRules={() => setIsPostersOpen(true)}
          onDonate={() => setCurrentTab('donar')}
        />
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

