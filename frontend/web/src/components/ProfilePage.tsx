'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';
import { useApp } from './AppShell';
import { storageService } from '../services/storageService';
import { feedApi } from '../lib/api';
import { pathForTab } from '../lib/tabs';
import { formatEventDate } from '../lib/eventDates';
import { DonationRecord, Suggestion, User } from '../types';

const DONATION_PURPOSE: Record<DonationRecord['purpose'], string> = {
  mantenimiento_pasarelas: 'Mantenimiento de pasarelas',
  reforestacion: 'Reforestación',
  totems_qr: 'Tótems QR',
  monitoreo_fauna: 'Monitoreo de fauna',
  general: 'Aporte general'
};

const SUGGESTION_STATUS: Record<Suggestion['status'], { label: string; className: string }> = {
  pendiente: { label: 'En revisión', className: 'bg-amber-50 text-amber-900' },
  aprobada: { label: 'Aprobada', className: 'bg-emerald-50 text-emerald-900' },
  rechazada: { label: 'No aprobada', className: 'bg-stone-100 text-stone-700' }
};

const SUGGESTION_CATEGORY: Record<Suggestion['category'], string> = {
  infraestructura: 'Infraestructura',
  fauna: 'Fauna',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  educacion: 'Educación'
};

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const memberSince = (user: User) =>
  new Date(`${user.createdAt}T12:00:00`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

// Short name of a totem: "Tótem 3: Torre de Observación…" → "Torre de Observación…"
const totemName = (name: string) => name.split(':').slice(1).join(':').trim() || name;

function Panel({
  title,
  aside,
  children,
  footer
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-stone-200 rounded-lg" aria-label={title}>
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2">
        <h2 className="text-base font-semibold text-stone-950">{title}</h2>
        {aside && <span className="text-sm text-stone-600 tabular-nums">{aside}</span>}
      </div>
      {children}
      {footer && <div className="px-4 py-3 border-t border-stone-200">{footer}</div>}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-4 text-sm text-stone-600">{children}</p>;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-stone-900 hover:underline underline-offset-2">
      {children}
      <ChevronRight className="w-4 h-4" />
    </Link>
  );
}

export const ProfilePage: React.FC = () => {
  const app = useApp();
  const user = app.currentUser;
  const email = user?.email.toLowerCase();

  // Everything below is read from storage + synced with PostgreSQL & MongoDB
  const [, setVersion] = useState(0);
  const refresh = () => setVersion(v => v + 1);

  useEffect(() => {
    window.addEventListener('angachilla:sync', refresh);
    if (user) {
      feedApi.getMyActivity().then(() => refresh()).catch(() => {});
    }
    return () => window.removeEventListener('angachilla:sync', refresh);
  }, [user]);

  const events = storageService.getEvents().filter(e => e.isRegistered);
  const savedIds = storageService.getSavedNoticeIds();
  const notices = storageService.getNotices();
  const saved = savedIds.map(id => notices.find(n => n.id === id)).filter(n => n !== undefined);
  const totems = storageService.getPointsOfInterest();
  const scanned = new Set(storageService.getScannedQRs());
  const visited = totems.filter(t => scanned.has(t.qrCode));
  const pins = email ? storageService.getCommunityPhotos().filter(p => p.authorEmail.toLowerCase() === email) : [];
  const suggestions = email ? storageService.getSuggestions().filter(s => s.authorEmail.toLowerCase() === email) : [];
  const donations = email ? storageService.getDonations().filter(d => d.donorEmail.toLowerCase() === email) : [];
  const donationTotal = donations.reduce((sum, d) => sum + d.amountClp, 0);
  const totemPct = totems.length > 0 ? (visited.length / totems.length) * 100 : 0;

  const summary: { label: string; value: React.ReactNode }[] = [
    { label: 'Actividades inscritas', value: events.length },
    {
      label: 'Tótems visitados',
      value: (
        <>
          {visited.length} <span className="text-sm font-normal text-stone-600">de {totems.length}</span>
        </>
      )
    },
    { label: 'Pines publicados', value: user ? pins.length : <span className="text-stone-400">—</span> },
    { label: 'Sugerencias', value: user ? suggestions.length : <span className="text-stone-400">—</span> }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-9 pb-24">
      {/* Who */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-5">
        {user ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center text-xl font-semibold overflow-hidden shrink-0" aria-hidden="true">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.trim()[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1 basis-48">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-950 truncate">{user.name}</h1>
              <p className="text-sm text-stone-600">
                {user.email} · {user.role === 'admin' ? 'Guardaparques' : 'Visitante'} · Miembro desde {memberSince(user)}
              </p>
            </div>
            <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 max-sm:-ml-3">
              {user.role === 'admin' && (
                <Link
                  href={pathForTab('admin')}
                  className="h-9 px-3 rounded-md bg-stone-200 hover:bg-stone-300 text-sm font-semibold text-stone-900 inline-flex items-center"
                >
                  Panel de administración
                </Link>
              )}
              <button
                type="button"
                onClick={app.logout}
                className="h-9 px-3 rounded-md text-sm font-semibold text-stone-700 hover:bg-stone-200/70"
              >
                Cerrar sesión
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Tu perfil</h1>
              <p className="text-sm text-stone-600 max-w-xl">
                Inicia sesión para ver tus pines, sugerencias y donaciones. Tus inscripciones y tótems visitados en este dispositivo
                aparecen abajo.
              </p>
            </div>
            <button
              type="button"
              onClick={app.openAuth}
              className="h-10 px-4 rounded-md bg-stone-950 hover:bg-stone-800 text-white text-sm font-semibold self-start sm:self-auto"
            >
              Iniciar sesión
            </button>
          </>
        )}
      </header>

      {/* Summary */}
      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200 border border-stone-200 rounded-lg overflow-hidden">
        {summary.map(item => (
          <div key={item.label} className="bg-white px-4 py-3">
            <dt className="text-sm text-stone-600">{item.label}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-stone-950">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Two independent columns: each stack ends where its content ends */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <Panel
            title="Actividades inscritas"
            aside={events.length > 0 ? events.length : undefined}
            footer={<FooterLink href={pathForTab('eventos')}>Ver el calendario</FooterLink>}
          >
            {events.length > 0 ? (
              <ul className="divide-y divide-stone-200 border-t border-stone-200">
                {events.map(evt => (
                  <li key={evt.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-stone-950">{evt.title}</p>
                      <p className="text-sm text-stone-600">
                        {formatEventDate(evt.date)} · {evt.time}
                      </p>
                      <p className="text-sm text-stone-600">
                        {evt.locationName} · {evt.routeName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        storageService.toggleRegisterEvent(evt.id);
                        refresh();
                      }}
                      className="shrink-0 h-8 px-2.5 rounded-md text-sm font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      Cancelar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No estás inscrito en ninguna actividad.</Empty>
            )}
          </Panel>

          <Panel
            title="Publicaciones guardadas"
            aside={saved.length > 0 ? saved.length : undefined}
            footer={<FooterLink href={pathForTab('avisos')}>Ir al inicio</FooterLink>}
          >
            {saved.length > 0 ? (
              <ul className="divide-y divide-stone-200 border-t border-stone-200">
                {saved.map(notice => (
                  <li key={notice.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-stone-950">{notice.title}</p>
                      <p className="text-sm text-stone-600">
                        {notice.date} · {notice.author}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        storageService.toggleSavedNotice(notice.id);
                        refresh();
                      }}
                      className="shrink-0 h-8 px-2.5 rounded-md text-sm font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Guarda avisos del inicio con el marcador para leerlos después.</Empty>
            )}
          </Panel>

          <Panel
            title="Donaciones"
            aside={donations.length > 0 ? clp.format(donationTotal) : undefined}
            footer={
              <button
                type="button"
                onClick={app.openDonations}
                className="inline-flex items-center gap-1 text-sm font-semibold text-stone-900 hover:underline underline-offset-2"
              >
                Apoyar al santuario
                <ChevronRight className="w-4 h-4" />
              </button>
            }
          >
            {!user ? (
              <Empty>Inicia sesión para ver las donaciones hechas con tu correo.</Empty>
            ) : donations.length > 0 ? (
              <ul className="divide-y divide-stone-200 border-t border-stone-200">
                {donations.map(d => (
                  <li key={d.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-stone-950">{DONATION_PURPOSE[d.purpose]}</p>
                      <p className="text-sm text-stone-600">
                        {d.date} · Comprobante {d.receiptNumber}
                      </p>
                    </div>
                    <span className="text-base font-semibold tabular-nums text-stone-950">{clp.format(d.amountClp)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aún no has hecho donaciones con este correo.</Empty>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Tótems visitados"
            aside={`${visited.length} de ${totems.length}`}
            footer={
              <button
                type="button"
                onClick={app.openQR}
                className="h-9 px-3 rounded-md bg-stone-950 hover:bg-stone-800 text-white text-sm font-semibold"
              >
                Escanear un tótem
              </button>
            }
          >
            <div className="px-4 pb-3">
              <div
                className="h-2 rounded-full bg-stone-200 overflow-hidden"
                role="progressbar"
                aria-label="Tótems visitados"
                aria-valuenow={visited.length}
                aria-valuemin={0}
                aria-valuemax={totems.length}
              >
                <div className="h-full rounded-full bg-emerald-700" style={{ width: `${totemPct}%` }} />
              </div>
            </div>
            <ul className="divide-y divide-stone-200 border-t border-stone-200">
              {totems.map(totem => {
                const done = scanned.has(totem.qrCode);
                return (
                  <li key={totem.id} className="px-4 py-2.5 flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${
                        done ? 'bg-stone-900 text-white' : 'border border-stone-300'
                      }`}
                      aria-hidden="true"
                    >
                      {done && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className={`min-w-0 flex-1 text-sm ${done ? 'text-stone-950 font-semibold' : 'text-stone-700'}`}>
                      {totemName(totem.name)}
                    </span>
                    <span className="text-sm text-stone-600 shrink-0">{done ? 'Visitado' : totem.qrCode}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel
            title="Tus sugerencias"
            aside={suggestions.length > 0 ? suggestions.length : undefined}
            footer={<FooterLink href={pathForTab('sugerencias')}>Ir al buzón ciudadano</FooterLink>}
          >
            {!user ? (
              <Empty>Inicia sesión para seguir el estado de tus sugerencias.</Empty>
            ) : suggestions.length > 0 ? (
              <ul className="divide-y divide-stone-200 border-t border-stone-200">
                {suggestions.map(s => (
                  <li key={s.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold text-stone-950">{s.title}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${SUGGESTION_STATUS[s.status].className}`}>
                        {SUGGESTION_STATUS[s.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600">
                      {SUGGESTION_CATEGORY[s.category]} · {s.createdAt}
                    </p>
                    {s.adminComment && (
                      <p className="mt-1.5 pl-3 border-l-2 border-stone-300 text-sm text-stone-700">
                        <span className="font-semibold text-stone-900">Respuesta del comité:</span> {s.adminComment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No has enviado sugerencias con este correo.</Empty>
            )}
          </Panel>

          <Panel
            title="Tus pines"
            aside={pins.length > 0 ? pins.length : undefined}
            footer={<FooterLink href={pathForTab('galeria')}>Ir a la galería</FooterLink>}
          >
            {!user ? (
              <Empty>Inicia sesión para ver las fotos que has publicado.</Empty>
            ) : pins.length > 0 ? (
              <ul className="divide-y divide-stone-200 border-t border-stone-200">
                {pins.map(pin => (
                  <li key={pin.id} className="px-4 py-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pin.imageUrl} alt="" className="w-12 h-12 rounded-md object-cover bg-stone-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-stone-950 truncate">{pin.title}</p>
                      <p className="text-sm text-stone-600 truncate">
                        {pin.visitedPlace} · {pin.date}
                        {!pin.approved && ' · En revisión'}
                      </p>
                    </div>
                    <span className="text-sm text-stone-600 tabular-nums shrink-0">{pin.likes} me gusta</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aún no has publicado pines.</Empty>
            )}
          </Panel>
        </div>
      </div>

      <p className="mt-6 text-sm text-stone-600">
        Las inscripciones, tótems, publicaciones guardadas y donaciones se guardan en este dispositivo.
      </p>
    </div>
  );
};
