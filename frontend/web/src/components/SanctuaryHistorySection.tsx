'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Heart,
  Award,
  TreeDeciduous,
  Users,
  Send,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { SANCTUARY_COMMITTEE_INFO } from '../data/mockData';
import { API_URL, ecosistemaApi } from '../lib/api';
import { storageService } from '../services/storageService';

interface SanctuaryHistorySectionProps {
  onOpenDonations?: () => void;
  initialSubTab?: 'reserva' | 'comite' | 'app';
}

export const SanctuaryHistorySection: React.FC<SanctuaryHistorySectionProps> = ({
  onOpenDonations,
  initialSubTab = 'reserva',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reserva' | 'comite' | 'app'>(initialSubTab);
  const [expandedWorkLine, setExpandedWorkLine] = useState<number | null>(1);
  const [contents, setContents] = useState<Record<string, any>>(() =>
    storageService.getInstitutionalContents()
  );

  // Contact Modal native <dialog> ref (using modern-web-guidance light-dismiss-a-dialog)
  const contactDialogRef = useRef<HTMLDialogElement>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Consulta sobre Visita o Educación Ambiental');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

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
    contactDialogRef.current?.showModal();
  };

  const closeContactModal = () => {
    contactDialogRef.current?.close();
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSending(true);
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
      alert('No se pudo enviar el mensaje. Intenta nuevamente.');
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
      'La Reserva Comunitaria Bosque Humedal Angachilla es un espacio natural protegido y gestionado por el Comité Ecológico Humedal Angachilla en las áreas de zona de protección del Santuario de la Naturaleza Humedal Angachilla y en terrenos colindantes a éste administrados por la organización, los cuales proyectan conformar como una Reserva Natural Urbana.',
      'Este lugar es rescatado y resguardado por la comunidad debido al abandono e impacto negativo que estaba sufriendo, siendo amenazado principalmente por los rellenos de tierra y escombros que arrasaron con parte del bosque humedal, además de los microbasurales y el ingreso de vehículos motorizados que afectaron la vegetación y el hábitat de diversas especies.',
      'Con una superficie aproximada de 20 hectáreas, este espacio se caracteriza por la diversidad de ecosistemas que coexisten en el área urbana de Valdivia, con presencia de praderas, bosque renoval nativo y exótico, hualves (bosque pantanoso), humedal palustre, esteros y lagunas que conforman un refugio de biodiversidad de gran valor ecológico donde habitan especies en categoría de conservación como el cisne de cuello negro, la rana chilena, el huillín, el pájaro siete colores y el carpintero negro.',
      'La reserva comunitaria cuenta en su interior con una infraestructura sustentable con accesibilidad universal, y un programa de actividades recreativas y de educación ambiental gratuitas y abiertas para toda la comunidad. Esta iniciativa contribuyó en la acreditación de Valdivia como Ciudad Humedal por la Convención Ramsar en julio de 2025, además de ser reconocida con el premio Valdivia Destaca en febrero de 2026 por su aporte al desarrollo local.',
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
      { texto: 'Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente.', mediaSlug: 'docx-reserva-2' },
      { texto: 'No cortar ramas ni árboles ni extraer plantas, funga y retoños.', mediaSlug: 'docx-reserva-3' },
      { texto: 'Emitir el menor ruido posible para no alterar ni espantar a las aves.', mediaSlug: 'docx-reserva-4' },
      { texto: 'Prohibido hacer fuego o fogatas y acampar en la reserva.', mediaSlug: 'docx-reserva-5' },
      { texto: 'Transitar sólo por los senderos habilitados.', mediaSlug: 'docx-reserva-6' },
      { texto: 'Prohibido el ingreso de vehículos motorizados.', mediaSlug: 'docx-reserva-7' },
      { texto: 'Prohibido cazar y pescar dentro de la reserva.', mediaSlug: 'docx-reserva-8' },
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

  return (
    <section
      id="sanctuary-history-section"
      className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-stone-900"
    >
      {/* Top Institutional Sub-Tabs with Organic Texture Header */}
      <div
        className="relative p-5 sm:p-6 border-b border-stone-200 text-white bg-emerald-950"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 46, 34, 0.92), rgba(15, 62, 47, 0.85)), url(${API_URL}/api/media/slug/tex-1)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={`${API_URL}/api/media/slug/svg-simbolo-angachilla-app`}
              alt="Símbolo Angachilla"
              className="w-12 h-12 rounded-2xl bg-white/95 p-1.5 object-contain shrink-0 shadow-md"
            />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                Reserva Comunitaria Bosque Humedal Angachilla
              </span>
              <h2 className="text-lg sm:text-xl font-black font-display mt-1 text-white leading-tight">
                Acerca de la Reserva, Comité y Aplicación
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openContactModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 shadow-xs active:scale-95 transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-800" />
              <span>Contacto Reserva</span>
            </button>
            {onOpenDonations && (
              <button
                type="button"
                onClick={onOpenDonations}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs active:scale-95 transition-all"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Donaciones</span>
              </button>
            )}
          </div>
        </div>

        {/* Selector de las 3 secciones institucionales del Acta de Reunión */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('reserva')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'reserva'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'bg-white/10 text-emerald-100 hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Nuestra Reserva Comunitaria</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('comite')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'comite'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'bg-white/10 text-emerald-100 hover:bg-white/20'
            }`}
          >
            <TreeDeciduous className="w-4 h-4" />
            <span>Comité Ecológico</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('app')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'app'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'bg-white/10 text-emerald-100 hover:bg-white/20'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Angachilla App</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: ACERCA DE LA RESERVA COMUNITARIA + ATRACTIVOS + 8 NORMAS CON ICONOS REALES */}
      {activeSubTab === 'reserva' && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h3 className="text-lg font-black text-stone-950">{reservaData.titulo}</h3>
              <p className="text-xs text-stone-600 mt-0.5">{reservaData.subtitulo}</p>
            </div>
            <img
              src={`${API_URL}/api/media/slug/svg-logo-reserva-comunitaria`}
              alt="Logo Reserva Comunitaria Bosque Humedal Angachilla"
              className="h-14 w-auto object-contain self-start md:self-auto"
            />
          </div>

          <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
            {(reservaData.parrafos || []).map((p: string, idx: number) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {Array.isArray(reservaData.atractivos) && reservaData.atractivos.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-3">
                Atractivos y Actividades en la Reserva
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reservaData.atractivos.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-emerald-900 mb-3">
              Normas y Recomendaciones de Cuidado en la Reserva
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(reservaData.normas || []).map((n: { texto: string; mediaSlug: string }, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 hover:border-emerald-300 transition-colors"
                >
                  <img
                    src={`${API_URL}/api/media/slug/${n.mediaSlug}`}
                    alt={`Norma ${idx + 1}`}
                    loading="lazy"
                    className="w-12 h-12 rounded-xl object-contain bg-white p-1.5 border border-stone-200 shrink-0"
                  />
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-snug">
                    {n.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Botón destacado de Contacto dentro de Acerca de la Reserva */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-sm font-extrabold text-emerald-950">
                ¿Deseas coordinar una visita educativa, voluntariado o comunicarte con la Reserva?
              </h5>
              <p className="text-xs text-emerald-800 mt-0.5">
                Escríbenos directamente a través del formulario oficial de contacto del Comité Ecológico.
              </p>
            </div>
            <button
              type="button"
              onClick={openContactModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 inline-flex items-center gap-2 shadow-xs"
            >
              <Mail className="w-4 h-4" />
              <span>Abrir Formulario de Contacto</span>
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: ACERCA DEL COMITÉ ECOLÓGICO Y SUS LÍNEAS DE TRABAJO */}
      {activeSubTab === 'comite' && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h3 className="text-lg font-black text-stone-950">{comiteData.titulo}</h3>
              <p className="text-xs text-stone-600 mt-0.5">{comiteData.subtitulo}</p>
            </div>
            <img
              src={`${API_URL}/api/media/slug/svg-logo-comite-ecologico`}
              alt="Logo Comité Ecológico Humedal Angachilla"
              className="h-14 w-auto object-contain self-start md:self-auto"
            />
          </div>

          <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
            <h4 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Historia de Defensa y Autogestión Comunitaria</span>
            </h4>
            {(comiteData.historia || []).map((p: string, idx: number) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3">
              Líneas de Trabajo del Comité Ecológico
            </h4>
            <div className="space-y-2.5">
              {(comiteData.lineasTrabajo || []).map(
                (linea: { numero: number; titulo: string; resumen: string; detalle: string }) => {
                  const isOpen = expandedWorkLine === linea.numero;
                  return (
                    <div
                      key={linea.numero}
                      className="rounded-2xl border border-stone-200 bg-stone-50/70 overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedWorkLine(isOpen ? null : linea.numero)}
                        aria-expanded={isOpen}
                        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                            0{linea.numero}
                          </span>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-sm text-stone-950">{linea.titulo}</h5>
                            <p className="text-xs text-stone-600 truncate">{linea.resumen}</p>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-stone-600 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-600 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-2 text-xs sm:text-sm text-stone-700 leading-relaxed bg-white border-t border-stone-200/70">
                          {linea.detalle}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Redes Sociales y Contacto del Comité */}
          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-600">
              <Users className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">RUT Comité: {SANCTUARY_COMMITTEE_INFO.rut}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={SANCTUARY_COMMITTEE_INFO.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs"
              >
                <span>Instagram {SANCTUARY_COMMITTEE_INFO.socialLinks.instagramHandle}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={SANCTUARY_COMMITTEE_INFO.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                <span>Facebook Oficial</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={openContactModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{SANCTUARY_COMMITTEE_INFO.socialLinks.email}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 3: ACERCA DE LA APP (ANGACHILLA APP.docx + 3 IMÁGENES DE BD) */}
      {activeSubTab === 'app' && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <img
                src={`${API_URL}/api/media/slug/svg-simbolo-angachilla-app`}
                alt="Símbolo Angachilla App"
                className="w-12 h-12 object-contain"
              />
              <div>
                <img
                  src={`${API_URL}/api/media/slug/svg-letras-angachilla-app`}
                  alt="Angachilla App"
                  className="h-6 w-auto object-contain"
                />
                <p className="text-xs text-stone-600 mt-1">{appData.subtitulo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={`${API_URL}/api/media/slug/svg-logo-muni-valdivia`}
                alt="Ilustre Municipalidad de Valdivia"
                className="h-12 w-auto object-contain"
              />
              <img
                src={`${API_URL}/api/media/slug/svg-logo-marca-turistica`}
                alt="Marca Turística Valdivia Ciudad Humedal"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>

          <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
            <p>{appData.intro}</p>
            <p>{appData.objetivo}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(appData.items || []).map(
              (item: { titulo: string; texto: string; mediaSlug: string }, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] bg-white border-b border-stone-200 p-3 flex items-center justify-center">
                    <img
                      src={`${API_URL}/api/media/slug/${item.mediaSlug}`}
                      alt={item.titulo}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="font-extrabold text-sm text-stone-950">{item.titulo}</h4>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{item.texto}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* MODAL NATIVO <dialog closedby="any"> DE CONTACTO CON LA RESERVA */}
      <dialog
        ref={contactDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby="contact-reserva-title"
        className="m-auto w-full max-w-lg rounded-3xl bg-white p-0 text-stone-900 shadow-2xl border border-stone-200 backdrop:bg-black/60 backdrop:backdrop-blur-xs"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                Contacto Directo
              </span>
              <h3 id="contact-reserva-title" className="text-lg font-black text-stone-950 mt-1">
                Escribir a la Reserva Comunitaria Angachilla
              </h3>
            </div>
            <button
              type="button"
              onClick={closeContactModal}
              aria-label="Cerrar formulario de contacto"
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {contactSent ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-extrabold text-stone-950">
                ¡Mensaje recibido por el Comité Ecológico!
              </h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Tu consulta quedó registrada en la base de datos de la Reserva Comunitaria Bosque Humedal Angachilla. Te responderemos a la brevedad.
              </p>
              <button
                type="button"
                onClick={closeContactModal}
                className="mt-2 px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="mt-4 space-y-3.5">
              <label className="block">
                <span className="block text-xs font-bold text-stone-700 mb-1">Tu nombre</span>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Ej: María González"
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-bold text-stone-700 mb-1">Correo electrónico</span>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="tu@correo.cl"
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-bold text-stone-700 mb-1">Motivo</span>
                <select
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="Consulta sobre Visita o Educación Ambiental">
                    Visita Guiada / Educación Ambiental
                  </option>
                  <option value="Voluntariado y Jornadas de Restauración">
                    Voluntariado y Restauración
                  </option>
                  <option value="Reporte Ambiental o Denuncia en el Humedal">
                    Reporte Ambiental en la Reserva
                  </option>
                  <option value="Colaboración Institucional o Investigación">
                    Colaboración / Investigación
                  </option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-bold text-stone-700 mb-1">Mensaje</span>
                <textarea
                  rows={3}
                  required
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Escribe aquí tu consulta o propuesta para el Comité Ecológico..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeContactModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contactSending}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{contactSending ? 'Enviando...' : 'Enviar Mensaje'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </section>
  );
};
