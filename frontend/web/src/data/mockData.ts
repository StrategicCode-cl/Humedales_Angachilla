import {
  HumedalRoute,
  PointOfInterest,
  Species,
  Notice,
  Suggestion,
  CommunityPhoto,
  InfographicPoster,
  WazeLiveAlert,
  WetlandEvent,
  SponsorAd,
  ModerationTicket
} from '../types';
import { ROUTE_GEOMETRY } from './routeGeometry.generated';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const mediaSlug = (slug: string) => `${API_URL}/api/media/slug/${slug}`;

export const INITIAL_SPECIES: Species[] = [
  {
    id: 'sp-cisne-de-cuello-negro',
    commonName: 'Cisne de Cuello Negro',
    mapudungunName: 'Wañke',
    scientificName: 'Cygnus melancoryphus',
    kingdom: 'Fauna',
    group: 'Aves acuáticas',
    category: 'ave_acuatica',
    conservationStatus: 'Vulnerable',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    habitat: 'Espejo de agua del Angachilla (Estación 3) y canales con luchecillo.',
    description: 'Ave acuática emblemática de los humedales valdivianos, de cuerpo blanco con cuello y cabeza negros aterciopelados y carúncula roja basal.',
    funFact: 'Los padres transportan a sus pichones sobre el lomo mientras recorren el Espejo del Angachilla.',
    image: mediaSlug('ilustracion-cisne-de-cuello-negro'),
    illustrationUrl: mediaSlug('ilustracion-cisne-de-cuello-negro'),
    photoUrl: mediaSlug('estacion-s3-foto-1'),
    soundKey: 'cisne',
    soundLabel: 'Silbido resonante',
    approxLocation: [-39.85555, -73.24050],
    ebirdUrl: 'https://ebird.org/species/blnswa2',
    inaturalistUrl: 'https://www.inaturalist.org/taxa/7016-Cygnus-melancoryphus'
  },
  {
    id: 'sp-siete-colores',
    commonName: 'Siete Colores',
    mapudungunName: 'Trarü-pülli / Makitro',
    scientificName: 'Tachuris rubrigastra',
    kingdom: 'Fauna',
    group: 'Aves acuáticas',
    category: 'ave_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Totoral del Santuario (Estación 4) y pajonales de junco.',
    description: 'Joya viviente del humedal que combina siete colores vibrantes en su plumaje y construye su nido tejido entre los tallos de totora.',
    funFact: 'Su supervivencia depende íntegramente de la conservación de los pajonales de totora del humedal.',
    image: mediaSlug('ilustracion-siete-colores'),
    illustrationUrl: mediaSlug('ilustracion-siete-colores'),
    photoUrl: mediaSlug('estacion-s4-foto-1'),
    soundKey: 'siete_colores',
    soundLabel: 'Canto del totoral',
    approxLocation: [-39.85515, -73.23890],
    ebirdUrl: 'https://ebird.org/species/matrus1',
    inaturalistUrl: 'https://www.inaturalist.org/taxa/16723-Tachuris-rubrigastra'
  },
  {
    id: 'sp-garza-cuca',
    commonName: 'Garza Cuca',
    mapudungunName: 'Kuka',
    scientificName: 'Ardea cocoi',
    kingdom: 'Fauna',
    group: 'Aves acuáticas',
    category: 'ave_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Mirador Espejo del Angachilla (Estación 3) y riberas tranquilas.',
    description: 'La garza más grande de Chile, avistada regularmente en el Espejo del Angachilla con su dorso gris azulado y penacho negro.',
    funFact: 'Caza peces e invertebrados al acecho manteniéndose inmóvil en aguas someras.',
    image: mediaSlug('ilustracion-garza-cuca'),
    illustrationUrl: mediaSlug('ilustracion-garza-cuca'),
    photoUrl: mediaSlug('estacion-s3-foto-1'),
    soundKey: 'garza_cuca',
    soundLabel: 'Graznido profundo',
    approxLocation: [-39.85555, -73.24050]
  },
  {
    id: 'sp-martin-pescador',
    commonName: 'Martín Pescador',
    mapudungunName: 'Ketro',
    scientificName: 'Megaceryle torquata',
    kingdom: 'Fauna',
    group: 'Aves acuáticas',
    category: 'ave_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Vega de la Garza (Estación 6) y ramas sobre el estero Angachilla.',
    description: 'El martín pescador más grande de Sudamérica, con cresta azul grisácea, pecho rufo canela y pico fuerte para zambullirse.',
    funFact: 'Emite su característico canto de matraca mientras sobrevuela el cauce del estero.',
    image: mediaSlug('ilustracion-martin-pescador'),
    illustrationUrl: mediaSlug('ilustracion-martin-pescador'),
    photoUrl: mediaSlug('estacion-s6-foto-1'),
    soundKey: 'martin_pescador',
    soundLabel: 'Matraca ribereña',
    approxLocation: [-39.85585, -73.23740]
  },
  {
    id: 'sp-rana-grande-chilena',
    commonName: 'Rana Grande Chilena',
    mapudungunName: 'Lloko',
    scientificName: 'Calyptocephalella gayi',
    kingdom: 'Fauna',
    group: 'Anfibios',
    category: 'anfibio',
    conservationStatus: 'Vulnerable',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    habitat: 'Laguna de los Pinos (Estación 2) y cuerpos de agua oxigenados con vegetación acuática.',
    description: 'El anfibio más grande y único de Chile, considerado un fósil viviente que habita nuestros humedales desde hace millones de años.',
    funFact: 'Sus renacuajos se desarrollan en la Laguna de los Pinos y se desplazan con las lluvias hacia el Espejo del Angachilla.',
    image: mediaSlug('ilustracion-rana-grande-chilena'),
    illustrationUrl: mediaSlug('ilustracion-rana-grande-chilena'),
    photoUrl: mediaSlug('estacion-s2-foto-1'),
    soundKey: 'ranita_darwin',
    soundLabel: 'Canto de anfibio',
    approxLocation: [-39.85620, -73.23920]
  },
  {
    id: 'sp-camaron-de-vega-camaron-de-hualve',
    commonName: 'Camarón de Vega (Camarón de Hualve)',
    mapudungunName: 'Tükukan',
    scientificName: 'Parastacus nicoleti',
    kingdom: 'Fauna',
    group: 'Crustáceos',
    category: 'anfibio',
    conservationStatus: 'Vulnerable',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    habitat: 'Suelo permanentemente saturado de agua en el Bosque Los Canelos (Estación 5).',
    description: 'Crustáceo excavador endémico que construye madrigueras de túneles subterráneos conectados y conos de protección altos y truncados conocidos como chimeneas.',
    funFact: 'Sus galerías subterráneas oxigenan el suelo inundable del bosque de canelos, temus y pitras.',
    image: mediaSlug('ilustracion-camaron-de-vega-camaron-de-hualve'),
    illustrationUrl: mediaSlug('ilustracion-camaron-de-vega-camaron-de-hualve'),
    photoUrl: mediaSlug('estacion-s5-foto-1'),
    approxLocation: [-39.85845, -73.23710]
  },
  {
    id: 'sp-canelo',
    commonName: 'Canelo',
    mapudungunName: 'Füye / Boighe',
    scientificName: 'Drimys winteri',
    kingdom: 'Flora',
    group: 'Árboles y arbustos',
    category: 'arbol_arbusto',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Bosque Los Canelos (Estación 5), bordeando el humedal Angachilla.',
    description: 'Árbol sagrado del pueblo Mapuche que alcanza hasta 30 metros de altura, capturando subterráneamente el agua de lluvia para limpiarla y enviarla al humedal.',
    funFact: 'Junto al arrayán, temu y pitra aumenta su tasa de fotosíntesis en condiciones de inundación.',
    image: mediaSlug('estacion-s5-foto-1'),
    photoUrl: mediaSlug('estacion-s5-foto-1'),
    approxLocation: [-39.85845, -73.23710]
  }
];

function fromGpx(id: string): Pick<HumedalRoute, 'distanceKm' | 'path' | 'detailUrl' | 'bounds' | 'isLoop' | 'source'> {
  const g = ROUTE_GEOMETRY[id];
  return {
    distanceKm: g.distanceKm,
    path: g.overview,
    detailUrl: g.detailUrl,
    bounds: g.bounds,
    isLoop: g.isLoop,
    source: g.source
  };
}

export const HUMEDAL_ROUTES: HumedalRoute[] = [
  {
    id: 'ruta-circuito',
    name: 'Circuito Angachilla',
    difficulty: 'Fácil',
    estimatedMinutes: ROUTE_GEOMETRY['ruta-circuito'].recordedMinutes ?? 66,
    description: 'Circuito principal que parte desde la Placita de la Resistencia, recorre el Mirador del Hualve (S1), Laguna de los Pinos (S2), Mirador Espejo del Angachilla (S3), Totoral del Santuario (S4) y retorna por la Vega de la Garza (S6).',
    color: '#047857',
    ...fromGpx('ruta-circuito'),
    checkpoints: [
      {
        id: 'cp-circuito-inicio',
        name: 'Placita de la Resistencia y Mirador del Hualve (S1)',
        instruction: 'Comienza el circuito desde el acceso principal hacia el Mirador del Hualve.',
        progress: 0.1,
        alertType: 'info',
        alertMessage: 'Transita en silencio y mantén a tus mascotas con correa.'
      },
      {
        id: 'cp-circuito-mitad',
        name: 'Laguna de los Pinos (S2) y Espejo del Angachilla (S3)',
        instruction: 'Avanza hacia el poniente bordeando la laguna de anfibios hasta el Mirador Espejo del Angachilla.',
        progress: 0.5,
        alertType: 'viewpoint',
        alertMessage: 'Buen tramo para detenerse en silencio y observar aves acuáticas.'
      },
      {
        id: 'cp-circuito-fin',
        name: 'Totoral del Santuario (S4) y Vega de la Garza (S6)',
        instruction: 'Retorna bordeando el totoral y la Vega de la Garza hasta la Placita de la Resistencia.',
        progress: 0.9,
        alertType: 'info'
      }
    ]
  },
  {
    id: 'ruta-canelos',
    name: 'Bosque Los Canelos',
    difficulty: 'Fácil',
    estimatedMinutes: ROUTE_GEOMETRY['ruta-canelos'].recordedMinutes ?? 27,
    description: 'Recorrido interpretativo hacia el sector sur del humedal, atravesando el Auditorio Vivo, el bosque inundable de canelos, arrayanes, temus y pitras (Estación 5) y el Espacio de Reflexión.',
    color: '#0e7490',
    ...fromGpx('ruta-canelos'),
    checkpoints: [
      {
        id: 'cp-canelos-inicio',
        name: 'Acceso hacia Auditorio Vivo',
        instruction: 'Toma el sendero sur desde el acceso en dirección al Auditorio Vivo.',
        progress: 0.15,
        alertType: 'info',
        alertMessage: 'No cortes ramas ni extraigas plantas o funga.'
      },
      {
        id: 'cp-canelos-bosque',
        name: 'Estación 5: Bosque Los Canelos',
        instruction: 'Entras al bosque inundable de canelos, temus y pitras. Camina con cuidado.',
        progress: 0.5,
        alertType: 'caution',
        alertMessage: 'No introduzcas objetos en los orificios ni dañes las chimeneas del camarón de vega.'
      },
      {
        id: 'cp-canelos-fin',
        name: 'Espacio de Reflexión y retorno',
        instruction: 'Llega al Espacio de Reflexión en el extremo sur y regresa hacia el acceso.',
        progress: 0.9,
        alertType: 'info'
      }
    ]
  }
];

const LEGACY_ROUTE_IDS: Record<string, string> = {
  'ruta-cisnes': 'ruta-circuito',
  'ruta-bosque': 'ruta-canelos',
  'ruta-ribera-kayak': 'ruta-circuito'
};

export function resolveRouteId(id: string): string {
  return LEGACY_ROUTE_IDS[id] ?? id;
}

// Las 9 Estaciones Reales ubicadas dentro del polígono de las 2 rutas GPX reales del Humedal Angachilla
export const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: 'st-s1',
    code: 'S1',
    slug: 'mirador-del-hualve',
    name: 'Estación 1: Mirador del Hualve',
    subtitle: 'Restauración de bosque humedal, matorral nativo y vista al pantano de Chequén',
    category: 'mirador',
    coordinates: [-39.85675, -73.23785],
    description: 'Esta loma y su vista nos muestra la restauración del bosque humedal que fue arrancado y cubierto por rellenos, donde hoy crecen notros, maquis, laureles, quilas y un grupo único de Chequén en el pantano.',
    rules: [
      'Emitir el menor ruido posible para no alterar ni espantar a las aves.',
      'No cortar ramas ni árboles ni extraer plantas, funga y retoños.',
      'No dejar basura; llévatela o transpórtala a los basureros cercanos.',
      'Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente.'
    ],
    qrCode: 'ANG-QR-01',
    routeId: 'ruta-circuito',
    image: mediaSlug('estacion-s1-foto-1'),
    soundKey: 'chucao'
  },
  {
    id: 'st-s2',
    code: 'S2',
    slug: 'laguna-de-los-pinos',
    name: 'Estación 2: Laguna de los Pinos',
    subtitle: 'Laguna estacionaria de anfibios, helechos Costilla de Vaca y contraste hídrico',
    category: 'mirador',
    coordinates: [-39.85620, -73.23920],
    description: 'Laguna estacionaria con abundante vegetación conectada al estero del humedal Angachilla, ideal para la reproducción de la Rana Grande Chilena, la Rana de Antifaz y el Sapito de Cuatro Ojos.',
    rules: [
      'Respetar el hábitat de los renacuajos sin alterarlos.',
      'No verter ni arrojar objetos a la laguna.',
      'No ingresar a la laguna ni alterar su suelo y vegetación.',
      'Evitar venir con mascotas; de lo contrario mantenerlas con correa.'
    ],
    qrCode: 'ANG-QR-02',
    routeId: 'ruta-circuito',
    image: mediaSlug('estacion-s2-foto-1'),
    soundKey: 'ranita_darwin'
  },
  {
    id: 'st-s3',
    code: 'S3',
    slug: 'mirador-espejo-del-angachilla',
    name: 'Estación 3: Mirador Espejo del Angachilla',
    subtitle: 'Espejo de agua abierto, avistamiento de cisnes, garzas, patos y coipos',
    category: 'torre',
    coordinates: [-39.85555, -73.24050],
    description: 'Mirador con vista al espejo de agua del Angachilla donde se avistan cisnes de cuello negro, garzas cucas, patos reales, jergones, taguas, pimpollos y coipos.',
    rules: [
      'Mantener las vías de drenaje de aguas lluvias limpias y despejadas.',
      'Emitir el menor ruido posible para no alterar ni espantar a las aves.',
      'Evitar venir con mascotas; de lo contrario mantenerlas con correa.'
    ],
    qrCode: 'ANG-QR-03',
    routeId: 'ruta-circuito',
    image: mediaSlug('estacion-s3-foto-1'),
    soundKey: 'cisne'
  },
  {
    id: 'st-s4',
    code: 'S4',
    slug: 'totoral-del-santuario',
    name: 'Estación 4: Totoral del Santuario',
    subtitle: 'Pajonal palustre de batros, totoras, cortaderas, calafates y nidos colgantes',
    category: 'pasarela',
    coordinates: [-39.85515, -73.23890],
    description: 'Pajonal permanentemente inundado cubierto por batros, totoras, cortaderas y junquillos con presencia de calafates en sus orillas y aves que tejen sus nidos sobre las totoras.',
    rules: [
      'No cortar ni extraer las plantas acuáticas del pajonal.',
      'Emitir el menor ruido posible para no alterar ni espantar a las aves.',
      'Evitar venir con mascotas; de lo contrario mantenerlas con correa.',
      'No dejar basura; llévatela o transpórtala a los basureros cercanos.'
    ],
    qrCode: 'ANG-QR-04',
    routeId: 'ruta-circuito',
    image: mediaSlug('estacion-s4-foto-1'),
    soundKey: 'siete_colores'
  },
  {
    id: 'st-s5',
    code: 'S5',
    slug: 'bosque-los-canelos',
    name: 'Estación 5: Bosque Los Canelos',
    subtitle: 'Bosque inundable de Canelos, Arrayanes, Temus, Pitras, Camarón de Vega y Voqui Blanco',
    category: 'totem_qr',
    coordinates: [-39.85845, -73.23710],
    description: 'Extenso bosque inundable de canelos, arrayanes, temus y pitras que filtra el agua de lluvia, alberga las madrigueras y chimeneas del camarón de vega y las lianas de copihue y voqui blanco.',
    rules: [
      'No cortar ramas ni árboles ni extraer plantas, funga y retoños.',
      'No extraer tierra del suelo.',
      'No plantar especies exóticas ni enterrar mascotas.',
      'No introducir objetos en los orificios ni destruir chimeneas de camarones de vega.',
      'No ingresar ni invadir zonas de crecimiento de funga y plantas nativas.'
    ],
    qrCode: 'ANG-QR-05',
    routeId: 'ruta-canelos',
    image: mediaSlug('estacion-s5-foto-1'),
    soundKey: 'chucao'
  },
  {
    id: 'st-s6',
    code: 'S6',
    slug: 'vega-de-la-garza',
    name: 'Estación 6: Vega de la Garza',
    subtitle: 'Planicie de afloramiento hídrico, pradera ceremonial y refugio de aves acuáticas',
    category: 'mirador',
    coordinates: [-39.85585, -73.23740],
    description: 'Ecosistema de terreno bajo y fértil alimentado por aguas subterráneas que afloran desde el estero Angachilla, refugio de garzas, cuervos de pantano, patos nativos y sitio de valor ceremonial.',
    rules: [
      'Mantén a tus mascotas con correa y supervisadas constantemente.',
      'Evita que tu perro persiga o moleste a las aves.',
      'Recoge siempre los desechos de tus mascotas.',
      'No ingreses a áreas de humedales reconocidas para la nidificación de aves.'
    ],
    qrCode: 'ANG-QR-06',
    routeId: 'ruta-circuito',
    image: mediaSlug('estacion-s6-foto-1'),
    soundKey: 'martin_pescador'
  },
  {
    id: 'st-e7',
    code: 'E7',
    slug: 'placita-de-la-resistencia',
    name: 'Placita de la Resistencia',
    subtitle: 'Portal de acceso comunitario y memoria de la defensa ciudadana del humedal',
    category: 'totem_qr',
    coordinates: [-39.85695, -73.23698],
    description: 'Acceso principal y espacio de encuentro que conmemora la defensa comunitaria que rescató el Bosque Humedal Angachilla de los rellenos.',
    rules: [
      'Respeta la señalética comunitaria y transita sólo por senderos habilitados.',
      'Prohibido el ingreso de vehículos motorizados y hacer fuego.'
    ],
    qrCode: 'ANG-QR-07',
    routeId: 'ruta-circuito',
    image: mediaSlug('estacion-e7-foto-1'),
    soundKey: 'siete_colores'
  },
  {
    id: 'st-e8',
    code: 'E8',
    slug: 'auditorio-vivo',
    name: 'Auditorio Vivo',
    subtitle: 'Aula abierta de educación ambiental, escucha bioacústica y actividades culturales',
    category: 'totem_qr',
    coordinates: [-39.85745, -73.23725],
    description: 'Espacio anfiteatro al aire libre para talleres de educación ambiental, charlas científicas y encuentros culturales comunitarios.',
    rules: [
      'Mantener silencio durante las sesiones de escucha de aves.',
      'Cuidar la infraestructura sustentable de la reserva.'
    ],
    qrCode: 'ANG-QR-08',
    routeId: 'ruta-canelos',
    image: mediaSlug('estacion-e8-foto-1'),
    soundKey: 'chucao'
  },
  {
    id: 'st-e9',
    code: 'E9',
    slug: 'espacio-de-reflexion',
    name: 'Espacio de Reflexión',
    subtitle: 'Rincón contemplativo de bienestar, silencio y conexión con el bosque húmedo',
    category: 'mirador',
    coordinates: [-39.85910, -73.23695],
    description: 'Sector de pausa y contemplación en el extremo sur del sendero Bosque Los Canelos, pensado para el bienestar y la escucha silenciosa del ecosistema.',
    rules: [
      'Espacio de silencio y contemplación.',
      'No salirse del sendero demarcado.'
    ],
    qrCode: 'ANG-QR-09',
    routeId: 'ruta-canelos',
    image: mediaSlug('estacion-e9-foto-1'),
    soundKey: 'ranita_darwin'
  }
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'not-1',
    title: 'Temporada de Nidificación en el Totoral y Espejo del Angachilla',
    summary: 'Se solicita transitar en silencio por los miradores S3 y S4 y evitar el ingreso con mascotas para proteger a las aves acuáticas.',
    fullText: 'Durante esta temporada diversas especies como el Cisne de Cuello Negro, el Siete Colores, el Trabajador y la Tagua Común utilizan los pajonales de totora para construir sus nidos y criar a sus polluelos. Recuerda mantenerte exclusivamente en los senderos habilitados y emitir el menor ruido posible.',
    image: mediaSlug('estacion-s3-foto-1'),
    category: 'biodiversidad',
    date: 'Oct 2026',
    author: 'Comité Ecológico Humedal Angachilla',
    pinned: true,
    approved: true
  },
  {
    id: 'not-2',
    title: 'Protección de Madrigueras y Chimeneas del Camarón de Vega en Bosque Los Canelos',
    summary: 'En la Estación 5 el suelo húmedo presenta chimeneas de barro construidas por el Camarón de Hualve (Parastacus nicoleti). No salgas del sendero.',
    fullText: 'El Bosque Los Canelos mantiene un suelo permanentemente saturado de agua donde habita el camarón de vega y crecen hongos nativos y enredaderas como el Voqui Blanco. Está estrictamente prohibido introducir objetos en los orificios, extraer tierra de hoja o recolectar funga y plantas.',
    image: mediaSlug('estacion-s5-foto-1'),
    category: 'alerta',
    date: 'Oct 2026',
    author: 'Guardaparques Reserva Comunitaria',
    pinned: true,
    approved: true
  },
  {
    id: 'not-3',
    title: 'Programa de Recorridos Guiados de Educación Ambiental en la Reserva Comunitaria',
    summary: 'Actividades gratuitas y abiertas para toda la comunidad valdiviana en el Circuito Angachilla y Auditorio Vivo.',
    fullText: 'En el marco del programa de infraestructura sustentable y educación ambiental apoyado por CORFO y desarrollado por el Comité Ecológico Humedal Angachilla junto a la Ilustre Municipalidad de Valdivia, invitamos a escuelas, familias y vecinos a inscribirse en las caminatas interpretativas.',
    image: mediaSlug('estacion-s1-foto-1'),
    category: 'taller',
    date: 'Oct 2026',
    author: 'Comité Ecológico & Municipalidad de Valdivia',
    approved: true
  }
];

export const INITIAL_WETLAND_EVENTS: WetlandEvent[] = [
  {
    id: 'evt-1',
    title: 'Avistamiento Guiado de Aves Acuáticas en el Espejo del Angachilla',
    description: 'Recorrido interpretativo por las estaciones S1, S3 y S4 para reconocer al Cisne de Cuello Negro, Garza Cuca, Tagua, Pimpollo y Siete Colores.',
    date: '2026-10-25',
    time: '09:30 - 11:30 hrs',
    locationName: 'Estación 3: Mirador Espejo del Angachilla',
    coordinates: [-39.85555, -73.24050],
    routeId: 'ruta-circuito',
    routeName: 'Circuito Angachilla',
    category: 'avistamiento',
    capacity: 25,
    registeredCount: 8,
    image: mediaSlug('estacion-s3-foto-1'),
    organizer: 'Comité Ecológico Humedal Angachilla'
  },
  {
    id: 'evt-2',
    title: 'Caminata Botánica: Bosque Inundable de Canelos, Pitras y Voqui Blanco',
    description: 'Exploración guiada por la ruta Bosque Los Canelos para conocer los 4 árboles nativos que combaten inundaciones y el mimetismo del Voqui Blanco.',
    date: '2026-10-26',
    time: '11:00 - 13:00 hrs',
    locationName: 'Estación 5: Bosque Los Canelos',
    coordinates: [-39.85845, -73.23710],
    routeId: 'ruta-canelos',
    routeName: 'Bosque Los Canelos',
    category: 'educativo',
    capacity: 20,
    registeredCount: 6,
    image: mediaSlug('estacion-s5-foto-1'),
    organizer: 'Comité Ecológico Humedal Angachilla'
  }
];

export const INITIAL_SUGGESTIONS: Suggestion[] = [];

export const INITIAL_COMMUNITY_PHOTOS: CommunityPhoto[] = [
  {
    id: 'photo-1',
    title: 'Vista panorámica desde el Mirador Espejo del Angachilla (Estación 3)',
    visitedPlace: 'Estación 3: Mirador Espejo del Angachilla',
    imageUrl: mediaSlug('estacion-s3-foto-1'),
    authorName: 'Comité Ecológico Humedal Angachilla',
    authorEmail: 'comitebosquehumedal@gmail.com',
    authorAvatar: mediaSlug('svg-simbolo-angachilla-app'),
    date: 'Oct 2026',
    likes: 18,
    isSaved: false,
    approved: true,
    description: 'El Espejo del Angachilla rodeado de vegetación palustre y bosque humedal.',
    tags: ['Mirador', 'Espejo de Agua', 'Aves'],
    aspectRatio: 'wide',
    commentsCount: 2
  },
  {
    id: 'photo-2',
    title: 'Sotobosque húmedo en la ruta Bosque Los Canelos (Estación 5)',
    visitedPlace: 'Estación 5: Bosque Los Canelos',
    imageUrl: mediaSlug('estacion-s5-foto-1'),
    authorName: 'Guardaparques Reserva Angachilla',
    authorEmail: 'comitebosquehumedal@gmail.com',
    authorAvatar: mediaSlug('svg-simbolo-angachilla-app'),
    date: 'Oct 2026',
    likes: 14,
    isSaved: false,
    approved: true,
    description: 'Canelos, arrayanes, temus y pitras en el sendero sur de la reserva.',
    tags: ['Bosque', 'Canelos', 'Senderos'],
    aspectRatio: 'tall',
    commentsCount: 1
  }
];

export const INFOGRAPHIC_POSTERS: InfographicPoster[] = [
  {
    id: 'poster-1',
    title: 'Normas de Cuidado de Nuestra Reserva Comunitaria',
    subtitle: 'Reserva Comunitaria Bosque Humedal Angachilla',
    theme: 'Conservación y Convivencia',
    imageUrl: mediaSlug('estacion-s1-foto-1'),
    rules: [
      'No botar basura; ésta contamina el hábitat. Llévatela o transpórtala a los basureros cercanos.',
      'Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente.',
      'No cortar ramas ni árboles ni extraer plantas, funga y retoños.',
      'Emitir el menor ruido posible para no alterar ni espantar a las aves.',
      'Prohibido hacer fuego o fogatas y acampar en la reserva.',
      'Transitar sólo por los senderos habilitados.',
      'Prohibido el ingreso de vehículos motorizados.',
      'Prohibido cazar y pescar.'
    ],
    description: 'La Reserva Comunitaria Bosque Humedal Angachilla cuenta con infraestructura sustentable con accesibilidad universal y está abierta a toda la comunidad. Requiere de tu colaboración para su cuidado y conservación.'
  },
  {
    id: 'poster-2',
    title: 'Bosque Inundable y Filtro Hídrico del Angachilla',
    subtitle: 'Canelo, Arrayán, Temu y Pitra contra las inundaciones',
    theme: 'Hidrología y Biodiversidad',
    imageUrl: mediaSlug('estacion-s5-foto-1'),
    rules: [
      'Estos 4 árboles nativos en condiciones de inundación aumentan su tasa de fotosíntesis.',
      'Capturan subterráneamente el agua de las lluvias para limpiarla y enviarla al humedal.',
      'El suelo húmedo alberga las madrigueras y chimeneas del Camarón de Vega (Parastacus nicoleti).',
      'El pajonal de batros, totoras y cortaderas filtra contaminantes y protege la nidificación de las aves.'
    ],
    description: 'Tener cuidado con lo que se vierte y arroja en las calles y mantener las vías de drenaje de aguas lluvias limpias y despejadas, ya que todo llega al humedal.'
  }
];

export const WAZE_LIVE_ALERTS: WazeLiveAlert[] = [
  {
    id: 'al-1',
    type: 'fauna',
    title: 'Avistamiento de Garza Cuca y Cisnes en Estación 3',
    description: 'Transitar en silencio al acercarse al Mirador Espejo del Angachilla.',
    coordinates: [-39.85555, -73.24050],
    reportedBy: 'Guardaparques Reserva',
    timeAgo: 'Hoy'
  },
  {
    id: 'al-2',
    type: 'resbaladizo',
    title: 'Suelo húmedo y chimeneas de camarón en Bosque Los Canelos',
    description: 'Mantenerse dentro de la huella del sendero en Estación 5 para no dañar madrigueras.',
    coordinates: [-39.85845, -73.23710],
    reportedBy: 'Comité Ecológico',
    timeAgo: 'Hoy'
  }
];

export const INITIAL_SPONSOR_ADS: SponsorAd[] = [
  {
    id: 'ad-corfo',
    sponsorName: 'CORFO Los Ríos & Municipalidad de Valdivia',
    badge: 'Innovación Social',
    title: 'Infraestructura Sustentable y Educación Ambiental',
    subtitle: 'Reserva Comunitaria Bosque Humedal Angachilla',
    description: 'Proyecto desarrollado por el Comité Ecológico Humedal Angachilla en conjunto con la Ilustre Municipalidad de Valdivia con apoyo del Comité de Fomento de Los Ríos.',
    imageUrl: mediaSlug('estacion-e7-foto-1'),
    linkUrl: '#'
  }
];

export const INITIAL_MODERATION_TICKETS: ModerationTicket[] = [];

export const SANCTUARY_COMMITTEE_INFO = {
  name: 'Comité Ecológico Humedal Angachilla',
  legalEntity: 'Organización Comunitaria Funcional Ley N° 19.418',
  rut: '65.213.206-5',
  declarationYear: 2021,
  areaHectares: 2025,
  location: 'Sector Sur de Valdivia, Región de Los Ríos, Chile',
  socialLinks: {
    instagram: 'https://instagram.com/humedalangachilla',
    instagramHandle: '@humedalangachilla',
    facebook: 'https://facebook.com/ComiteBosqueHumedalAngachilla',
    email: 'comitebosquehumedal@gmail.com',
    ebirdHotspot: 'https://ebird.org/hotspot/L11417032',
    inaturalistPlace: 'https://inaturalist.mma.gob.cl/'
  },
  historySummary: `La Reserva Comunitaria Bosque Humedal Angachilla es un espacio natural protegido y gestionado por el Comité Ecológico Humedal Angachilla en las áreas de zona de protección del Santuario de la Naturaleza Humedal Angachilla y en terrenos colindantes a éste administrados por la organización, los cuales proyectan conformar como una Reserva Natural Urbana.

Este lugar es rescatado y resguardado por la comunidad debido al abandono e impacto negativo que estaba sufriendo, siendo amenazado principalmente por los rellenos de tierra y escombros que arrasaron con parte del bosque humedal, además de los microbasurales y el ingreso de vehículos motorizados que afectaron la vegetación y el hábitat de diversas especies.

La reserva comunitaria cuenta en su interior con una infraestructura sustentable con accesibilidad universal, y un programa de actividades recreativas y de educación ambiental gratuitas y abiertas para toda la comunidad.`,
  pillars: [
    {
      title: '1. Conservación y Restauración Ecológica',
      desc: 'Protección activa de ecosistemas de hualve, espejo de agua, pajonales, anfibios, avifauna y bosque de canelos.'
    },
    {
      title: '2. Infraestructura Sustentable y Diseño Bioclimático',
      desc: 'Senderos, miradores, Auditorio Vivo, Espacio de Reflexión y estaciones con accesibilidad universal.'
    },
    {
      title: '3. Educación Ambiental y Ciencia Ciudadana',
      desc: 'Recorridos guiados interpretativos, talleres escolares y monitoreo colaborativo de flora, fauna y funga.'
    },
    {
      title: '4. Cultura, Salud y Bienestar Comunitario',
      desc: 'Encuentros interculturales, prácticas de contemplación y salud mental en contacto con el bosque humedal.'
    },
    {
      title: '5. Gobernanza y Gestión Comunitaria',
      desc: 'Autogestión territorial y articulación con vecinos, municipio y CORFO Los Ríos hacia una Reserva Natural Urbana.'
    }
  ]
};
