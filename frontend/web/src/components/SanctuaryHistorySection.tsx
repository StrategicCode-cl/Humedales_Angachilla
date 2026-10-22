'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, Mail, Heart, Send, CheckCircle2, X } from 'lucide-react';
import { SANCTUARY_COMMITTEE_INFO } from '../data/mockData';
import { API_URL, ecosistemaApi } from '../lib/api';
import { storageService } from '../services/storageService';

interface SanctuaryHistorySectionProps {
  onOpenDonations?: () => void;
  initialSubTab?: 'reserva' | 'comite' | 'app';
}

type SubTab = 'reserva' | 'comite' | 'app';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'reserva', label: 'La reserva' },
  { id: 'comite', label: 'Comité Ecológico' },
  { id: 'app', label: 'Angachilla App' },
];

const inputClass =
  'w-full h-10 px-3 rounded-md bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';
const secondaryButton =
  'h-9 px-3 rounded-md bg-white border border-stone-300 hover:bg-stone-50 text-stone-900 text-sm font-medium inline-flex items-center gap-1.5 transition-colors';
const media = (slug: string) => `${API_URL}/api/media/slug/${slug}`;

export const SanctuaryHistorySection: React.FC<SanctuaryHistorySectionProps> = ({
  onOpenDonations,
  initialSubTab = 'reserva',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialSubTab);
  const [expandedWorkLine, setExpandedWorkLine] = useState<number | null>(1);
  const [contents, setContents] = useState<Record<string, any>>(() =>
    storageService.getInstitutionalContents()
  );

  // Contact form in a native <dialog>
  const contactDialogRef = useRef<HTMLDialogElement>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Consulta sobre Visita o Educación Ambiental');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Follow the parent when it asks for another tab
  const [requestedSubTab, setRequestedSubTab] = useState(initialSubTab);
  if (requestedSubTab !== initialSubTab) {
    setRequestedSubTab(initialSubTab);
    setActiveSubTab(initialSubTab);
  }

  useEffect(() => {
    const onSync = () => setContents({ ...storageService.getInstitutionalContents() });
    window.addEventListener('angachilla:sync', onSync);
    ecosistemaApi
      .getContents()
      .then(c => setContents(c))
      .catch(() => {});
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

  // Fallback for browsers without native <dialog closedby="any"> support (e.g. Safari)
  useEffect(() => {
    const dialog = contactDialogRef.current;
    if (!dialog) return;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener('click', handleBackdropClick);
      return () => dialog.removeEventListener('click', handleBackdropClick);
    }
  }, []);

  const openContactModal = () => {
    setContactSent(false);
    setContactError(null);
    contactDialogRef.current?.showModal();
  };

  const closeContactModal = () => {
    contactDialogRef.current?.close();
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSending(true);
    setContactError(null);
    try {
      await ecosistemaApi.submitContactInquiry({
        name: contactName.trim(),
        email: contactEmail.trim(),
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
      });
      setContactSent(true);
      setContactMessage('');
    } catch {
      setContactError('No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setContactSending(false);
    }
  };

  const appData = contents['acerca-app'] ?? {
    titulo: 'Angachilla App',
    subtitulo: 'Aplicación móvil y plataforma web de la Reserva Comunitaria Bosque Humedal Angachilla',
    intro:
      'La aplicación móvil Angachilla App para Android e iOS es una iniciativa que se enmarca en la implementación de una infraestructura sustentable y un programa de actividades recreativas y de educación ambiental en la Reserva Comunitaria Bosque Humedal Angachilla, mediante el financiamiento de un proyecto de innovación social apoyado por el Comité de Fomento de Los Ríos (CORFO), el cual es desarrollado por el Comité Ecológico Humedal Angachilla en conjunto con la Ilustre Municipalidad de Valdivia.',
    objetivo:
      'Esta herramienta digital busca mejorar la experiencia de las visitas en la Reserva Comunitaria Bosque Humedal Angachilla, facilitando la educación ambiental para el conocimiento de su biodiversidad, el comportamiento respetuoso para su conservación y el sentido de pertenencia de la comunidad valdiviana con este espacio natural.',
    items: [
      {
        titulo: 'Mapa interactivo con GPS y estaciones',
        texto:
          'Recorrer con guía GPS los senderos de la reserva a través de un mapa interactivo con estaciones de puntos de interés que muestran las características y fotografías de los ecosistemas del lugar junto a sus normas y recomendaciones de cuidado, con las especies que se pueden avistar en cada uno de ellos.',
        mediaSlug: 'docx-app-1',
      },
      {
        titulo: 'Guía de Biodiversidad: Fauna, Flora y Reino Fungi',
        texto:
          'Tener una guía de las especies de flora, fauna y funga presentes en el humedal Angachilla, con sus ilustraciones y fotografías para poder reconocerlas, descripción, hábitat, nombre científico y en mapuzungun.',
        mediaSlug: 'docx-app-2',
      },
      {
        titulo: 'Comunidad, Galería, Avisos y Calendario',
        texto:
          'Compartir registros fotográficos y publicaciones de las visitas en la reserva en el Feed comunitario, apreciar imágenes del lugar en la Galería oficial, conocer las principales noticias, avisos y el calendario de actividades.',
        mediaSlug: 'docx-app-3',
      },
    ],
  };

  const reservaData = contents['acerca-reserva'] ?? {
    titulo: 'Nuestra Reserva Comunitaria',
    subtitulo: 'Reserva Natural Urbana y Santuario de la Naturaleza Bosque Humedal Angachilla',
    parrafos: [
      'La Reserva Comunitaria Bosque Humedal Angachilla es un área de conservación natural que alberga una gran biodiversidad que habita en su humedal palustre y sus diferentes bosques inundables. Esta se ubica en el sector sur de la ciudad de Valdivia, Región de Los Ríos, Chile. Y abarca un área de protección de aproximadamente 20 hectáreas integrada dentro del Santuario de la Naturaleza Humedales de Angachilla.',
      'La limpieza del agua, la regulación de inundaciones y la captura de carbono son importantes servicios ecosistémicos que, como todos los humedales, esta reserva le entrega a Valdivia, la que fue declarada oficialmente como la primera “Ciudad Humedal” de Latinoamérica y la única en Chile por la Convención Ramsar en julio de 2025.',
      'Bosque Humedal Angachilla nace como una iniciativa vecinal de proteger, conservar y valorar esta reserva natural por el cuidado de nuestra salud y bienestar. En ella se ve reflejado el trabajo comunitario, voluntario y sostenido en el tiempo por vecinos y organizaciones que creen en la fuerza de la colaboración. Esta iniciativa fue impulsada por el Comité Ecológico Bosque Humedal del Santuario Angachilla, la que fue nominada por la I. Municipalidad de Valdivia y elegida por toda la comunidad como ganadora de “Valdivia Destaca 2026”, en la categoría de ciudad sustentable.',
    ],
    atractivos: [
      'Miradores, puentes y senderos inclusivos.',
      'Avistamiento de aves, flora, fauna y funga.',
      'Bosques y praderas para baños de naturaleza y recreación.',
      'Tótems informativos de puntos de interés.',
      'Espacios para talleres y actividades comunitarias.',
      'Bancas de descanso y reflexión.',
      'Recorridos guiados.',
      'Navegación en kayak.',
    ],
    normas: [
      { texto: 'No botar basura; ésta contamina el hábitat. Llévatela o transpórtala a los basureros cercanos.', mediaSlug: 'docx-reserva-1' },
      { texto: 'Humedal Angachilla Zona Protegida.', mediaSlug: 'docx-reserva-2' },
      { texto: 'Parque Natural de Bosque Nativo y Rivera.', mediaSlug: 'docx-reserva-3' },
      { texto: 'Flora y Fauna Nativa del Bosque y Humedal.', mediaSlug: 'docx-reserva-4' },
      { texto: 'Miradores de Paisajes y de Avistamiento.', mediaSlug: 'docx-reserva-5' },
      { texto: 'Trekking sólo por los senderos habilitados.', mediaSlug: 'docx-reserva-6' },
      { texto: 'Avistamiento de aves en Zonas protegidas.', mediaSlug: 'docx-reserva-7' },
      { texto: 'Toma de Fotografías de Flora, Fauna y Paisajes.', mediaSlug: 'docx-reserva-8' },
    ],
  };

  const comiteData = contents['acerca-comite'] ?? {
    titulo: 'Comité Ecológico Humedal Angachilla',
    subtitulo: 'Organización comunitaria funcional sin fines de lucro · Fundada en 2020 en Valdivia',
    historia: [
      'El Comité Ecológico Humedal Angachilla es una organización comunitaria funcional sin fines de lucro fundada el año 2020 por vecinas y vecinos del barrio Claro de Luna (ex Villa Galilea), con el objetivo de proteger y conservar los ecosistemas del humedal Angachilla.',
      'La organización surge de manera autoconvocada frente a la necesidad de detener una serie de amenazas antrópicas que afectaban gravemente al humedal en el sector, tales como rellenos ilegales de tierra y escombros que arrasaron con parte del bosque humedal, microbasurales, tránsito de vehículos motorizados y tala de vegetación nativa.',
      'A partir de la articulación barrial y el trabajo colaborativo con otras comunidades ribereñas (integrando la Corporación Humedales de Angachilla), la organización impulsó la declaratoria del Santuario de la Naturaleza Humedal Angachilla y la creación de la Reserva Comunitaria Bosque Humedal Angachilla como modelo pionero de gobernanza comunitaria y Reserva Natural Urbana en Valdivia.',
    ],
    lineasTrabajo: [
      {
        numero: 1,
        titulo: 'Trabajo Comunitario',
        resumen: 'Mingas de limpieza, restauración ecológica con flora nativa, mantención de senderos y gobernanza barrial.',
        detalle:
          'Desarrollamos jornadas voluntarias y mingas comunitarias para la limpieza y erradicación de microbasurales, reforestación participativa con árboles y plantas nativas, construcción y mantención de senderos, miradores y señalética, fortaleciendo el tejido social y el cuidado colectivo del territorio.',
      },
      {
        numero: 2,
        titulo: 'Educación Ambiental',
        resumen: 'Aula abierta para jardines infantiles, escuelas, colegios, universidades y organizaciones sociales.',
        detalle:
          'Realizamos recorridos pedagógicos guiados, talleres de reconocimiento de flora, fauna y funga, y jornadas de sensibilización ambiental al aire libre utilizando el Auditorio Vivo y las estaciones interpretativas de la reserva como un espacio educativo vivo para toda la comunidad valdiviana.',
      },
      {
        numero: 3,
        titulo: 'Ciencia Comunitaria y Ciudadana',
        resumen: 'Monitoreo participativo de avifauna, anfibios, calidad de agua y registro colaborativo de biodiversidad.',
        detalle:
          'Impulsamos el levantamiento comunitario de información ecológica, censos de aves acuáticas y de bosque, monitoreo de especies en categoría de conservación (cisne de cuello negro, rana chilena, huillín, siete colores) y vinculación con plataformas de ciencia ciudadana como eBird e iNaturalist.',
      },
      {
        numero: 4,
        titulo: 'Ecoturismo Vecinal',
        resumen: 'Recorridos guiados terrestres y en kayak, senderismo inclusivo y turismo de naturaleza de bajo impacto.',
        detalle:
          'Promovemos visitas responsables y experiencias de ecoturismo comunitario con identidad local, incluyendo recorridos interpretativos por el Circuito Angachilla y el Bosque Los Canelos, avistamiento de aves y navegación sustentable en kayak por las aguas del humedal.',
      },
      {
        numero: 5,
        titulo: 'Arte, Cultura y Patrimonio',
        resumen: 'Encuentros culturales, creación artística, memoria biocultural y bienestar en contacto con la naturaleza.',
        detalle:
          'Fomentamos expresiones artísticas, música acústica, ilustración naturalista, fotografía, baños de naturaleza y puesta en valor del patrimonio biocultural y mapuche-huilliche asociado a los humedales y bosques pantanosos del río Angachilla.',
      },
    ],
  };


  // Title block shared by the three tabs: name, line under it, the organisation's own logos
  const sheetHeader = (title: string, subtitle: string, logos: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 pt-5 sm:pt-6">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-stone-950">{title}</h3>
        <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">{logos}</div>
    </div>
  );

  return (
    <section id="sanctuary-history-section" className="text-stone-900">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={media('svg-simbolo-angachilla-app')}
            alt=""
            className="w-11 h-11 rounded-md bg-white border border-stone-200 p-1 object-contain shrink-0"
          />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">Acerca de</h2>
            <p className="text-sm text-stone-700">Reserva Comunitaria Bosque Humedal Angachilla · Valdivia</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openContactModal} className={secondaryButton}>
            <Mail className="w-4 h-4 text-stone-500" />
            Escribir a la reserva
          </button>
          {onOpenDonations && (
            <button type="button" onClick={onOpenDonations} className={secondaryButton}>
              <Heart className="w-4 h-4 text-rose-600" />
              Donar
            </button>
          )}
        </div>
      </header>

      <div role="tablist" aria-label="Secciones" className="mt-5 flex gap-6 border-b border-stone-300 overflow-x-auto scrollbar-none">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`-mb-px py-2.5 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeSubTab === tab.id
                ? 'border-stone-900 text-stone-950'
                : 'border-transparent text-stone-600 hover:text-stone-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 bg-white border border-stone-200 rounded-md overflow-hidden" role="tabpanel">
        {/* La reserva: history, what is there, the rules */}
        {activeSubTab === 'reserva' && (
          <>
            {sheetHeader(
              reservaData.titulo,
              reservaData.subtitulo,
              <img
                src={media('svg-logo-reserva-comunitaria')}
                alt="Logo Reserva Comunitaria Bosque Humedal Angachilla"
                className="h-14 w-auto object-contain"
              />
            )}

            <div className="px-5 sm:px-6 pt-5 pb-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem] gap-6 lg:gap-8">
              <div className="space-y-4 text-[15px] leading-7 text-stone-800">
                {(reservaData.parrafos || []).map((p: string, idx: number) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {Array.isArray(reservaData.atractivos) && reservaData.atractivos.length > 0 && (
                <aside className="self-start rounded-md bg-stone-50 border border-stone-200 p-4">
                  <h4 className="text-sm font-semibold text-stone-950">Qué encontrarás</h4>
                  <ul className="mt-2 divide-y divide-stone-200">
                    {reservaData.atractivos.map((item: string, idx: number) => (
                      <li key={idx} className="py-2 flex items-start gap-2 text-sm text-stone-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
            </div>

            <div className="px-5 sm:px-6 py-6 border-t border-stone-200">
              <h4 className="text-base font-semibold text-stone-950">Normas y recomendaciones de cuidado</h4>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {(reservaData.normas || []).map((n: { texto: string; mediaSlug: string }, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 py-3 border-b border-stone-100">
                    <img
                      src={media(n.mediaSlug)}
                      alt=""
                      loading="lazy"
                      className="w-11 h-11 rounded-sm object-contain bg-white border border-stone-200 p-1 shrink-0"
                    />
                    <p className="text-sm leading-snug text-stone-800">{n.texto}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-5 sm:px-6 py-5 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-[15px] font-semibold text-stone-950">Visitas educativas, voluntariado y consultas</h4>
                <p className="mt-0.5 text-sm text-stone-600">El Comité Ecológico responde los mensajes enviados desde la app.</p>
              </div>
              <button
                type="button"
                onClick={openContactModal}
                className="h-10 px-4 rounded-md bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Escribir a la reserva
              </button>
            </div>
          </>
        )}

        {/* Comité Ecológico: history and work lines */}
        {activeSubTab === 'comite' && (
          <>
            {sheetHeader(
              comiteData.titulo,
              comiteData.subtitulo,
              <img
                src={media('svg-logo-comite-ecologico')}
                alt="Logo Comité Ecológico Humedal Angachilla"
                className="h-14 w-auto object-contain"
              />
            )}

            <div className="px-5 sm:px-6 pt-5 pb-6">
              <h4 className="text-base font-semibold text-stone-950">Historia</h4>
              <div className="mt-2 space-y-4 max-w-[68ch] text-[15px] leading-7 text-stone-800">
                {(comiteData.historia || []).map((p: string, idx: number) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-6">
              <h4 className="text-base font-semibold text-stone-950">Líneas de trabajo</h4>
              <ul className="mt-3 border border-stone-200 rounded-md divide-y divide-stone-200">
                {(comiteData.lineasTrabajo || []).map(
                  (linea: { numero: number; titulo: string; resumen: string; detalle: string }) => {
                    const isOpen = expandedWorkLine === linea.numero;
                    return (
                      <li key={linea.numero}>
                        <button
                          type="button"
                          onClick={() => setExpandedWorkLine(isOpen ? null : linea.numero)}
                          aria-expanded={isOpen}
                          className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
                        >
                          <span className="min-w-0">
                            <span className="block text-[15px] font-semibold text-stone-950">{linea.titulo}</span>
                            <span className="block mt-0.5 text-sm text-stone-600">{linea.resumen}</span>
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <p className="px-4 pb-4 -mt-1 max-w-[68ch] text-[15px] leading-7 text-stone-800">{linea.detalle}</p>
                        )}
                      </li>
                    );
                  }
                )}
              </ul>
            </div>

            <div className="px-5 sm:px-6 py-5 border-t border-stone-200 bg-stone-50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <p className="text-sm text-stone-700 whitespace-nowrap shrink-0">
                RUT <span className="font-medium text-stone-900 tabular-nums">{SANCTUARY_COMMITTEE_INFO.rut}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={SANCTUARY_COMMITTEE_INFO.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={secondaryButton}
                >
                  Instagram {SANCTUARY_COMMITTEE_INFO.socialLinks.instagramHandle}
                  <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                </a>
                <a
                  href={SANCTUARY_COMMITTEE_INFO.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={secondaryButton}
                >
                  Facebook
                  <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                </a>
                <button type="button" onClick={openContactModal} className={secondaryButton}>
                  <Mail className="w-4 h-4 text-stone-500" />
                  {SANCTUARY_COMMITTEE_INFO.socialLinks.email}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Angachilla App: what it is, who backs it, what it does */}
        {activeSubTab === 'app' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 pt-5 sm:pt-6">
              <div className="flex items-center gap-3">
                <img src={media('svg-simbolo-angachilla-app')} alt="" className="w-12 h-12 object-contain shrink-0" />
                <div>
                  <h3>
                    <img src={media('svg-letras-angachilla-app')} alt={appData.titulo || 'Angachilla App'} className="h-6 w-auto object-contain" />
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">{appData.subtitulo}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <img src={media('svg-logo-muni-valdivia')} alt="Ilustre Municipalidad de Valdivia" className="h-11 w-auto object-contain" />
                <img
                  src={media('svg-logo-marca-turistica')}
                  alt="Marca Turística Valdivia Ciudad Humedal"
                  className="h-11 w-auto object-contain"
                />
              </div>
            </div>

            <div className="px-5 sm:px-6 pt-5 pb-6 space-y-4 max-w-[72ch] text-[15px] leading-7 text-stone-800">
              <p>{appData.intro}</p>
              <p>{appData.objetivo}</p>
            </div>

            <div className="px-5 sm:px-6 py-6 border-t border-stone-200">
              <h4 className="text-base font-semibold text-stone-950">Qué puedes hacer con la app</h4>
              <ul className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
                {(appData.items || []).map((item: { titulo: string; texto: string; mediaSlug: string }, idx: number) => (
                  <li key={idx}>
                    <div className="aspect-[16/10] rounded-md bg-stone-50 border border-stone-200 p-3 flex items-center justify-center">
                      <img src={media(item.mediaSlug)} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                    </div>
                    <h5 className="mt-3 text-[15px] font-semibold text-stone-950">{item.titulo}</h5>
                    <p className="mt-1 text-sm leading-relaxed text-stone-700">{item.texto}</p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Contact form */}
      <dialog
        ref={contactDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby="contact-reserva-title"
        className="m-auto w-[calc(100%-1.5rem)] max-w-lg rounded-lg bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-black/60"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="contact-reserva-title" className="text-lg font-semibold text-stone-950">
                Escribir a la reserva
              </h3>
              <p className="mt-0.5 text-sm text-stone-600">Tu mensaje llega al Comité Ecológico Humedal Angachilla.</p>
            </div>
            <button
              type="button"
              onClick={closeContactModal}
              aria-label="Cerrar formulario de contacto"
              className="w-8 h-8 -mr-1 -mt-1 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {contactSent ? (
            <div className="mt-5 rounded-md bg-stone-50 border border-stone-200 p-4">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-stone-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                Mensaje enviado
              </p>
              <p className="mt-1 text-sm text-stone-700">
                El Comité Ecológico te responderá al correo que indicaste.
              </p>
              <button
                type="button"
                onClick={closeContactModal}
                className="mt-4 h-9 px-4 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="mt-5 space-y-4">
              <label className="block">
                <span className="block text-sm font-medium text-stone-800 mb-1">Tu nombre</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="María González"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-stone-800 mb-1">Correo electrónico</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="tu@correo.cl"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-stone-800 mb-1">Motivo</span>
                <select value={contactSubject} onChange={e => setContactSubject(e.target.value)} className={inputClass}>
                  <option value="Consulta sobre Visita o Educación Ambiental">Visita guiada o educación ambiental</option>
                  <option value="Voluntariado y Jornadas de Restauración">Voluntariado y restauración</option>
                  <option value="Reporte Ambiental o Denuncia en el Humedal">Reporte ambiental en la reserva</option>
                  <option value="Colaboración Institucional o Investigación">Colaboración o investigación</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-stone-800 mb-1">Mensaje</span>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Escribe tu consulta o propuesta"
                  className={`${inputClass} h-auto py-2`}
                />
              </label>
              {contactError && (
                <p role="alert" className="text-sm text-rose-800 bg-rose-50 rounded-md px-3 py-2">
                  {contactError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeContactModal}
                  className="h-10 px-4 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contactSending}
                  className="h-10 px-4 rounded-md bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-300 text-white text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {contactSending ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </section>
  );
};
