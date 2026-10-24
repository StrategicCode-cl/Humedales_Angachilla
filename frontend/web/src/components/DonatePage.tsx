'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, ChevronDown, Copy } from 'lucide-react';
import { storageService } from '../services/storageService';
import { resolveMediaUrl } from '../lib/api';
import { pathForTab } from '../lib/tabs';
import { DonationRecord } from '../types';
import { useApp } from './AppShell';

// Committee bank details shown for transfers. Confirm the account number with the committee before launch.
const BANK = [
  { label: 'Titular', value: 'Comité Ecológico Bosque Humedal del Santuario Angachilla' },
  { label: 'RUT', value: '65.213.206-5' },
  { label: 'Banco', value: 'BancoEstado' },
  { label: 'Tipo de cuenta', value: 'Cuenta corriente' },
  { label: 'N° de cuenta', value: '123-45678-90' },
  { label: 'Correo', value: 'comitebosquehumedal@gmail.com' },
];


const FAQ = [
  {
    q: '¿Cómo se paga?',
    a: 'Por ahora con transferencia a la cuenta del Comité Ecológico en BancoEstado. Registra tu aporte aquí, recibirás un número de registro, y escríbelo en el asunto de la transferencia. El pago con tarjeta (Webpay) estará disponible más adelante.',
  },
  {
    q: 'Estoy de visita desde otro país, ¿puedo aportar?',
    a: 'Sí. Si no puedes transferir a una cuenta chilena, escribe a comitebosquehumedal@gmail.com y el Comité te indicará otra forma.',
  },
  {
    q: '¿Recibo algún comprobante?',
    a: 'Al registrar el aporte ves un número de registro y un resumen. Si necesitas un certificado para una institución, pídelo al correo del Comité indicando ese número.',
  },
  {
    q: '¿Puedo ayudar sin dinero?',
    a: 'Sí: en las mingas de limpieza, plantaciones y jornadas de voluntariado. Las fechas están en el calendario de actividades.',
    link: { label: 'Ver el calendario', tab: 'eventos' },
  },
];

const PRESETS = [2000, 5000, 10000, 20000];
const MIN_AMOUNT = 500;

const clp = (n: number) => `$${n.toLocaleString('es-CL')}`;
const media = (slug: string) => resolveMediaUrl(`/api/media/slug/${slug}`);

const inputClass =
  'w-full h-11 px-3 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';

const BankList: React.FC = () => (
  <dl className="space-y-1 text-sm">
    {BANK.map(b => (
      <div key={b.label} className="flex justify-between gap-4 py-1">
        <dt className="text-stone-600 shrink-0">{b.label}</dt>
        <dd className="font-medium text-stone-900 text-right tabular-nums">{b.value}</dd>
      </div>
    ))}
  </dl>
);

export const DonatePage: React.FC = () => {
  const { currentUser } = useApp();
  const formRef = useRef<HTMLElement>(null);

  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState(currentUser?.name ?? '');
  const [donorEmail, setDonorEmail] = useState(currentUser?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<DonationRecord | null>(null);
  const [copied, setCopied] = useState(false);

  // The session arrives after mount; fill the empty fields once it does
  const [knownUser, setKnownUser] = useState(currentUser);
  if (knownUser !== currentUser) {
    setKnownUser(currentUser);
    if (currentUser) {
      if (!donorName) setDonorName(currentUser.name);
      if (!donorEmail) setDonorEmail(currentUser.email);
    }
  }

  // Entrance for each block below the hero; content stays visible without script or with reduced motion
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = pageRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-shown');
            observer.unobserve(entry.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' }
    );
    root.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToForm = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };


  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setCustomAmount(val);
    setAmount(val ? parseInt(val, 10) : 0);
  };

  const copyBank = (subject?: string) => {
    const text = [...BANK.map(b => `${b.label}: ${b.value}`), `Asunto: ${subject ?? 'Aporte Humedal Angachilla'}`].join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < MIN_AMOUNT) {
      setError(`El monto mínimo es ${clp(MIN_AMOUNT)}.`);
      return;
    }
    if (!donorName.trim() || !donorEmail.trim()) {
      setError('Escribe tu nombre y correo para registrar el aporte.');
      return;
    }
    setError(null);
    setCompleted(
      storageService.addDonation({
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        amountClp: amount,
        // With no destination to choose, the committee assigns it
        purpose: 'general',
        paymentMethod: 'transferencia',
      })
    );
    scrollToForm();
  };


  const copyButton = (subject?: string) => (
    <button
      type="button"
      onClick={() => copyBank(subject)}
      className="h-8 px-2.5 -mr-1 rounded-md text-sm font-medium text-stone-800 hover:bg-stone-200/70 inline-flex items-center gap-1.5"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-stone-500" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );

  return (
    <div ref={pageRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-8 lg:gap-10 items-start">
        {/* Hero */}
        <div className="lg:col-start-1 lg:row-start-1">
          <img
            src={media('estacion-s2-foto-3')}
            alt="Laguna de los Pinos reflejando el cielo, en la Reserva Comunitaria Bosque Humedal Angachilla"
            className="w-full aspect-[16/10] sm:aspect-[16/9] object-cover rounded-md bg-stone-200"
          />
          <h1 className="mt-6 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-stone-950 text-balance">
            Ayuda a cuidar el Humedal Angachilla
          </h1>
          <p className="mt-3 max-w-[60ch] text-base sm:text-lg leading-relaxed text-stone-700">
            Tu aporte mantiene los senderos, planta bosque nativo y protege a las aves de esta reserva comunitaria de 20
            hectáreas en Valdivia, cuidada por vecinas y vecinos desde 2020.
          </p>
        </div>

        {/* Donation form: second on a phone, a sticky column on large screens */}
        <aside
          ref={formRef}
          aria-labelledby="aporte-titulo"
          className="scroll-mt-20 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-28 bg-white rounded-md"
        >
          {completed ? (
            <div className="p-5">
              <h2 id="aporte-titulo" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-stone-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                Aporte registrado
              </h2>
              <p className="mt-2 text-base leading-relaxed text-stone-800">
                Falta un paso: transfiere <strong className="font-semibold text-stone-950">{clp(completed.amountClp)}</strong> y
                escribe <strong className="font-semibold text-stone-950 tabular-nums">{completed.receiptNumber}</strong> en el
                asunto.
              </p>

              <div className="mt-4 rounded-md bg-stone-100 px-4 py-2">
                <div className="flex items-center justify-between pt-1.5 pb-1">
                  <h3 className="text-sm font-semibold text-stone-950">Datos de transferencia</h3>
                  {copyButton(completed.receiptNumber)}
                </div>
                <BankList />
              </div>

              <dl className="mt-4 space-y-1 text-sm">
                {[
                  ['N° de registro', completed.receiptNumber],
                  ['A nombre de', completed.donorName],
                  ['Fecha', completed.date],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-1">
                    <dt className="text-stone-600 shrink-0">{label}</dt>
                    <dd className="font-medium text-stone-900 text-right tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>

              <button
                type="button"
                onClick={() => setCompleted(null)}
                className="mt-5 w-full h-11 rounded-md border border-stone-300 hover:bg-stone-50 text-stone-900 text-sm font-semibold"
              >
                Registrar otro aporte
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="p-5 space-y-5">
              <h2 id="aporte-titulo" className="text-xl font-semibold tracking-tight text-stone-950">
                Tu aporte
              </h2>

              <fieldset>
                <legend className="text-sm font-semibold text-stone-900">Monto</legend>
                <div className="mt-2 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Montos sugeridos">
                  {PRESETS.map(val => {
                    const active = amount === val && !customAmount;
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        key={val}
                        onClick={() => {
                          setAmount(val);
                          setCustomAmount('');
                        }}
                        className={`h-11 rounded-md text-base font-semibold tabular-nums border transition-colors ${
                          active
                            ? 'bg-stone-900 border-stone-900 text-white'
                            : 'bg-white border-stone-300 text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        {clp(val)}
                      </button>
                    );
                  })}
                </div>
                <label className="relative mt-1.5 block">
                  <span className="sr-only">Otro monto en pesos</span>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-stone-500" aria-hidden="true">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmount ? parseInt(customAmount, 10).toLocaleString('es-CL') : ''}
                    onChange={handleCustomChange}
                    placeholder="Otro monto"
                    className={`${inputClass} pl-7 pr-14 tabular-nums`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500" aria-hidden="true">
                    CLP
                  </span>
                </label>
              </fieldset>

              <label className="block">
                <span className="block text-sm font-semibold text-stone-900 mb-1.5">Nombre o institución</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  placeholder="Francisca Silva"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-stone-900 mb-1.5">Correo</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={donorEmail}
                  onChange={e => setDonorEmail(e.target.value)}
                  placeholder="tu@correo.cl"
                  className={inputClass}
                />
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-stone-900">Medio de pago</legend>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="min-h-14 px-3 py-2 rounded-md border-2 border-stone-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-stone-900 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold text-stone-950">Transferencia</span>
                      <span className="block text-[13px] text-stone-600">Al Comité</span>
                    </span>
                  </div>
                  <div className="min-h-14 px-3 py-2 rounded-md border-2 border-dashed border-stone-300 flex items-center" aria-disabled="true">
                    <span>
                      <span className="block text-sm font-semibold text-stone-500">Webpay</span>
                      <span className="block text-[13px] text-stone-500">Próximamente</span>
                    </span>
                  </div>
                </div>
              </fieldset>

              {error && (
                <p role="alert" className="text-sm text-rose-800 bg-rose-50 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full h-12 rounded-md bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 text-white text-base font-semibold tabular-nums transition-colors"
              >
                {amount >= MIN_AMOUNT ? `Registrar aporte de ${clp(amount)}` : 'Registrar aporte'}
              </button>
              <p className="-mt-2 text-[13px] leading-relaxed text-stone-600">
                Luego verás los datos para transferir.
              </p>

              <details className="group pt-1">
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-stone-800 [&::-webkit-details-marker]:hidden">
                  Ver solo los datos bancarios
                  <ChevronDown className="w-4 h-4 text-stone-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 rounded-md bg-stone-100 px-4 py-2">
                  <div className="flex justify-end pt-1">{copyButton()}</div>
                  <BankList />
                </div>
              </details>
            </form>
          )}
        </aside>


        {/* Who receives it */}
        <section aria-labelledby="quien-titulo" className="lg:col-start-1 lg:row-start-2 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_14rem] gap-5 sm:gap-6 items-start">
          <div>
            <h2 data-reveal id="quien-titulo" className="text-2xl font-semibold tracking-tight text-stone-950">
              Quién recibe tu aporte
            </h2>
            <p className="mt-3 text-base leading-7 text-stone-800">
              El <strong className="font-semibold">Comité Ecológico Humedal Angachilla</strong>, una organización comunitaria
              sin fines de lucro fundada en 2020 por vecinas y vecinos del barrio Claro de Luna. Rescataron este lugar de los
              rellenos y microbasurales, y hoy mantienen sus senderos, miradores y actividades gratuitas para toda la
              comunidad.
            </p>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-stone-600">RUT</dt>
                <dd className="font-medium text-stone-900 tabular-nums">65.213.206-5</dd>
              </div>
              <div>
                <dt className="text-stone-600">Reconocimiento</dt>
                <dd className="font-medium text-stone-900">Ganadora de Valdivia Destaca 2026</dd>
              </div>
            </dl>
          </div>
          <img
            src={media('estacion-e7-foto-1')}
            alt="Placita de la Resistencia, espacio comunitario en el acceso a la reserva"
            loading="lazy"
            className="w-full aspect-[4/3] sm:aspect-[3/4] object-cover rounded-sm bg-stone-200"
          />
        </section>

        {/* Questions */}
        <section aria-labelledby="faq-titulo" className="lg:col-start-1 lg:row-start-3">
          <h2 data-reveal id="faq-titulo" className="text-2xl font-semibold tracking-tight text-stone-950">
            Preguntas frecuentes
          </h2>
          <div className="mt-4 space-y-2">
            {FAQ.map(item => (
              <details key={item.q} className="group bg-white rounded-md px-4">
                <summary className="flex items-center justify-between gap-4 py-3 cursor-pointer list-none text-base font-medium text-stone-950 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-stone-500 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-4 max-w-[65ch] text-base leading-relaxed text-stone-700">
                  {item.a}{' '}
                  {item.link && (
                    <Link href={pathForTab(item.link.tab)} className="font-medium text-stone-950 underline underline-offset-2">
                      {item.link.label}
                    </Link>
                  )}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
