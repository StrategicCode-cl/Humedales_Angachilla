'use client';

// Las secciones de la maqueta leen localStorage al montar (y el mapa usa Leaflet,
// que necesita window), así que se renderizan solo en el cliente. Cuando los datos
// vengan del backend se pueden pasar a renderizado en servidor.
import dynamic from 'next/dynamic';
import { ShieldCheck } from 'lucide-react';
import { useApp } from './AppShell';

function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
    </div>
  );
}

const NoticeBoard = dynamic(() => import('./NoticeBoard').then(m => m.NoticeBoard), {
  ssr: false,
  loading: SectionLoading,
});
const MapNavigation = dynamic(() => import('./MapNavigation').then(m => m.MapNavigation), {
  ssr: false,
  loading: SectionLoading,
});
const EventsSection = dynamic(() => import('./EventsSection').then(m => m.EventsSection), {
  ssr: false,
  loading: SectionLoading,
});
const CommunityGallery = dynamic(() => import('./CommunityGallery').then(m => m.CommunityGallery), {
  ssr: false,
  loading: SectionLoading,
});
const SpeciesCatalog = dynamic(() => import('./SpeciesCatalog').then(m => m.SpeciesCatalog), {
  ssr: false,
  loading: SectionLoading,
});
const SuggestionsPanel = dynamic(() => import('./SuggestionsPanel').then(m => m.SuggestionsPanel), {
  ssr: false,
  loading: SectionLoading,
});
const AdminDashboard = dynamic(() => import('./AdminDashboard').then(m => m.AdminDashboard), {
  ssr: false,
  loading: SectionLoading,
});

export function AvisosSection() {
  const app = useApp();
  return (
    <NoticeBoard
      currentUser={app.currentUser}
      onOpenAuth={app.openAuth}
      isCreateModalOpen={app.isCreateNoticeOpen}
      onCloseCreateModal={app.closeCreateNotice}
      initialCreateCategory={app.createNoticeCategory}
      onOpenDonations={app.openDonations}
    />
  );
}

export function MapaSection() {
  const app = useApp();
  return (
    <MapNavigation
      onOpenQRWithCode={app.openQRWithCode}
      targetCoordinates={app.mapTargetCoordinates}
      targetRouteId={app.mapTargetRouteId}
      onGoToEvents={() => app.setCurrentTab('eventos')}
    />
  );
}

export function EventosSection() {
  const app = useApp();
  return (
    <EventsSection
      onGoToMapLocation={app.goToMapLocation}
      currentUser={app.currentUser}
      onOpenAuth={app.openAuth}
    />
  );
}

export function GaleriaSection() {
  const app = useApp();
  return (
    <CommunityGallery
      currentUser={app.currentUser}
      onOpenAuth={app.openAuth}
      onGoToMapLocation={app.goToMapLocation}
      isCreatePinOpen={app.isCreatePinOpen}
      onCloseCreatePin={app.closeCreatePin}
    />
  );
}

export function EspeciesSection() {
  const app = useApp();
  return <SpeciesCatalog onGoToMapHabitat={app.goToMapLocation} />;
}

export function BuzonSection() {
  const app = useApp();
  return <SuggestionsPanel currentUser={app.currentUser} onOpenAuth={app.openAuth} />;
}

export function AdminSection() {
  const app = useApp();

  if (app.currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <ShieldCheck className="w-10 h-10 mx-auto text-emerald-700" />
        <h1 className="mt-4 text-xl font-bold text-stone-900">Acceso restringido</h1>
        <p className="mt-2 text-sm text-stone-600">
          El panel de administración es solo para guardaparques.
        </p>
        <button
          onClick={app.openAuth}
          className="mt-6 px-4 py-2 rounded-full text-sm font-bold bg-emerald-800 text-white hover:bg-emerald-700 transition-colors"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return <AdminDashboard currentUser={app.currentUser} />;
}
