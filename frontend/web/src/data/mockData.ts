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

export const INITIAL_SPECIES: Species[] = [
  {
    id: 'sp-cisne',
    commonName: 'Cisne de Cuello Negro',
    mapudungunName: 'Wañke',
    scientificName: 'Cygnus melancoryphus',
    category: 'ave_acuatica',
    conservationStatus: 'Vulnerable',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    habitat: 'Lagunas abiertas, estuarios y meandros con vegetación sumergida (luchecillo).',
    description: 'Ave emblemática de los humedales valdivianos. De cuerpo blanco inmaculado con cuello y cabeza negros azabache, pico plomizo con carúncula roja en la base.',
    funFact: 'Tras el terremoto de 1960 en Valdivia, los terrenos hundidos se transformaron en santuarios biológicos donde los cisnes encontraron su refugio más importante de Sudamérica.',
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=900&q=80',
    soundKey: 'cisne',
    soundLabel: 'Bocina resonante',
    approxLocation: [-39.8525, -73.2285],
    ebirdUrl: 'https://ebird.org/species/blnswa2',
    inaturalistUrl: 'https://www.inaturalist.org/taxa/7016-Cygnus-melancoryphus'
  },
  {
    id: 'sp-chucao',
    commonName: 'Chucao',
    mapudungunName: 'Chukao',
    scientificName: 'Scelorchilus rubecula',
    category: 'ave_bosque',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Sotobosque denso y húmedo de hualves, cañaverales de colihue y bosques de ribera.',
    description: 'Pequeña ave terrestre con pecho rufo anaranjado brillante, cejas blancas y cola erguida. Es más fácil escucharlo cantar que observarlo por su esquivo comportamiento en la hojarasca.',
    funFact: 'En la mitología huilliche y mapuche, su potente trino emitido al lado derecho del caminante anuncia buena fortuna en el sendero, mientras que a la izquierda advierte precaución.',
    image: 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=900&q=80',
    soundKey: 'chucao',
    soundLabel: 'Canto del bosque',
    approxLocation: [-39.8540, -73.2230],
    ebirdUrl: 'https://ebird.org/species/chutap1',
    inaturalistUrl: 'https://www.inaturalist.org/taxa/14761-Scelorchilus-rubecula'
  },
  {
    id: 'sp-martin-pescador',
    commonName: 'Martín Pescador',
    mapudungunName: 'Ketro',
    scientificName: 'Megaceryle torquata',
    category: 'ave_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Riberas de ríos calmos, canales de marea y lagunas protegidas.',
    description: 'Posee una cresta prominente gris azulada, pecho rojizo canela y un pico fuerte y afilado con el que zambulle en picada vertical para atrapar peces pequeños.',
    funFact: 'Se posa pacientemente sobre ramas secas de pitra que cuelgan del agua, permaneciendo inmóvil hasta que detecta el reflejo de una carmelita o puye.',
    image: 'https://images.unsplash.com/photo-1518992028580-6d97bdca06c3?auto=format&fit=crop&w=900&q=80',
    soundKey: 'martin_pescador',
    soundLabel: 'Matraca estridente',
    approxLocation: [-39.8510, -73.2245],
    ebirdUrl: 'https://ebird.org/species/rinkin1',
    inaturalistUrl: 'https://www.inaturalist.org/taxa/2443-Megaceryle-torquata'
  },
  {
    id: 'sp-siete-colores',
    commonName: 'Siete Colores',
    mapudungunName: 'Makitro',
    scientificName: 'Tachuris rubrigastra',
    category: 'ave_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Pajonales de totora y juncales densos en las orillas húmedas del Angachilla.',
    description: 'Una de las aves más coloridas del hemisferio sur: corona negra con raya rubí, lomo verde brillante, vientre amarillo canario, alas con franja blanca y cola tricolor.',
    funFact: 'Construye un nido en forma de taza perfectamente tejido entre los tallos de junco con telarañas y plumón vegetal, resistente a las crecidas de marea.',
    image: 'https://images.unsplash.com/photo-1612024782955-49fae79e42bb?auto=format&fit=crop&w=900&q=80',
    soundKey: 'siete_colores',
    soundLabel: 'Pío armónico',
    approxLocation: [-39.8532, -73.2270],
    ebirdUrl: 'https://ebird.org/species/matrus1',
    inaturalistUrl: 'https://www.inaturalist.org/taxa/16723-Tachuris-rubrigastra'
  },
  {
    id: 'sp-garza-cuca',
    commonName: 'Garza Cuca',
    mapudungunName: 'Kuka',
    scientificName: 'Ardea cocoi',
    category: 'ave_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Esteros someros, orillas de río e islotes pantanosos.',
    description: 'La garza más grande de Chile y Sudamérica, con hasta 1.3 metros de envergadura alar. Corona y cresta negra con plumas alargadas, pecho blanco rayado y cuerpo gris ceniza.',
    funFact: 'Caza peces e invertebrados al acecho, manteniéndose completamente inmóvil durante largos minutos en aguas someras hasta disparar su cuello elástico.',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',
    soundKey: 'garza_cuca',
    soundLabel: 'Graznido grave',
    approxLocation: [-39.8505, -73.2290],
    ebirdUrl: 'https://ebird.org/species/cocwoo1',
    inaturalistUrl: 'https://www.inaturalist.org/taxa/4946-Ardea-cocoi'
  },
  {
    id: 'sp-coipo',
    commonName: 'Coipo Chileno',
    mapudungunName: 'Koypu',
    scientificName: 'Myocastor coypus',
    category: 'mamifero',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Canales con totorales y pastizales ribereños en el humedal.',
    description: 'El roedor nativo más grande de Chile. Posee pelaje castaño impermeable, patas traseras con membranas interdigitales para nadar y característicos incisivos anaranjados brillantes.',
    funFact: 'Las hembras poseen mamas en el dorso del cuerpo, permitiendo amamantar a sus crías mientras nada sigilosamente por el agua.',
    image: 'https://images.unsplash.com/photo-1590422749897-476722d41fae?auto=format&fit=crop&w=900&q=80',
    soundKey: 'coipo',
    soundLabel: 'Chapotero acuático',
    approxLocation: [-39.8538, -73.2255],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/43770-Myocastor-coypus'
  },
  {
    id: 'sp-ranita-darwin',
    commonName: 'Ranita de Darwin',
    mapudungunName: 'Pillan',
    scientificName: 'Rhinoderma darwinii',
    category: 'anfibio',
    conservationStatus: 'En Peligro',
    statusColor: 'bg-rose-100 text-rose-800 border-rose-300',
    habitat: 'Suelo húmedo del bosque siempreverde valdiviano, musgos y restos de hojarasca.',
    description: 'Diminuto anfibio con hocico alargado y puntiagudo en forma de hoja triangular. Su coloración varía entre marrón tierra y verde esmeralda para mimetizarse.',
    funFact: 'El macho realiza una crianza bucal única en el reino animal: ingiere los renacuajos y los cría en su saco vocal gular hasta que metamorfosean y salen como ranitas formadas.',
    image: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=900&q=80',
    soundKey: 'ranita_darwin',
    soundLabel: 'Campanilla de cristal',
    approxLocation: [-39.8550, -73.2220],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/25396-Rhinoderma-darwinii'
  },
  {
    id: 'sp-pitra',
    commonName: 'Pitra (Hualve)',
    mapudungunName: 'Pëtüra',
    scientificName: 'Myrceugenia exsucca',
    category: 'arbol_arbusto',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Suelos pantanosos permanentemente inundados; forma el ecosistema de "hualve".',
    description: 'Árbol siempreverde de corteza agrietada blanquecina con raíces adventicias que forman zancos capaces de respirar en terrenos anegados con baja oxigenación.',
    funFact: 'El bosque pantanoso de Pitra en Angachilla es un amortiguador natural que retiene crecidas de lluvias torrenciales y purifica el agua dulce de Valdivia.',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
    approxLocation: [-39.8542, -73.2238],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/431267-Myrceugenia-exsucca'
  },
  {
    id: 'sp-totora',
    commonName: 'Totora Gigante',
    mapudungunName: 'Tromün',
    scientificName: 'Schoenoplectus californicus',
    category: 'planta_acuatica',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Orillas de lagunas, marismas y bancos fluviales de aguas tranquilas.',
    description: 'Planta macrófita de tallos cilíndricos esponjosos de 2 a 4 metros de altura, con cámaras de aire internas que le otorgan flotabilidad y resistencia al viento sureño.',
    funFact: 'Es el refugio de anidación preferido por el cisne de cuello negro y el siete colores, y actúa como filtro biofísico de nutrientes y sedimentos.',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=80',
    approxLocation: [-39.8520, -73.2280],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/78996-Schoenoplectus-californicus'
  },
  {
    id: 'sp-canelo',
    commonName: 'Canelo Sagrado',
    mapudungunName: 'Füye / Boighe',
    scientificName: 'Drimys winteri',
    category: 'arbol_arbusto',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Bordes de cursos de agua y bosques húmedos templados lluviosos.',
    description: 'Árbol sagrado del pueblo Mapuche. Hojas gruesas verde oscuras por el haz y glaucas blanquecinas por el envés, con flores blancas estrelladas aromáticas.',
    funFact: 'Su corteza contiene altas dosis de vitamina C y fue empleada por marineros en el estrecho de Magallanes para curar el escorbuto en el siglo XVI.',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80',
    approxLocation: [-39.8530, -73.2240],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/180630-Drimys-winteri'
  },
  // --- REINO FUNGI: HONGOS DEL HUMEDAL Y BOSQUE HUALVE VALDIVIANO (PDF 15-SEPT-2026) ---
  {
    id: 'sp-diguene',
    commonName: 'Digüeñe (Llao Llao)',
    mapudungunName: 'Diweñ',
    scientificName: 'Cyttaria espinosae / Cyttaria darwinii',
    category: 'hongo',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Ramas y troncos de árboles del género Nothofagus (roble, coigüe) en los bosques del santuario.',
    description: 'Hongo parásito estacional de forma globular carnosa, de color blanco y anaranjado brillante con superficie alveolar que fructifica durante la primavera valdiviana.',
    funFact: 'Tradicional alimento recolectado ancestralmente por el pueblo Mapuche y consumido fresco en ensaladas con cilantro y limón, o en empanadas criollas sureñas.',
    image: 'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=900&q=80',
    approxLocation: [-39.8522, -73.2235],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/154483-Cyttaria-darwinii'
  },
  {
    id: 'sp-changle',
    commonName: 'Changle de Bosque Húmedo',
    mapudungunName: 'Changllid',
    scientificName: 'Ramaria flava',
    category: 'hongo',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Suelo rico en humus y hojarasca de los bosques templados lluviosos de la ribera del Angachilla.',
    description: 'Hongo de llamativa morfología con aspecto de coral marino, de ramificaciones densas de color amarillo azufre o crema con base blanquecina gruesa.',
    funFact: 'Es uno de los hongos silvestres comestibles más codiciados en las ferias fluviales de Los Ríos. Su presencia indica excelente salud biológica del suelo boscoso.',
    image: 'https://images.unsplash.com/photo-1607656311408-1e4cf26322db?auto=format&fit=crop&w=900&q=80',
    approxLocation: [-39.8545, -73.2225],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/48705-Ramaria-flava'
  },
  {
    id: 'sp-cortinario-morado',
    commonName: 'Cortinario Morado Valdiviano',
    scientificName: 'Cortinarius magellanicus',
    category: 'hongo',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    habitat: 'Hojarasca sombría y húmeda bajo coigües, arrayanes y pitras del humedal.',
    description: 'Seta de color violeta púrpura intenso y sombrero brillante y viscoso con pie cilíndrico robusto y una cortina filamentosa en ejemplares jóvenes.',
    funFact: 'Es un hongo micorrícico esencial que se conecta con las raíces de los árboles nativos, transfiriéndoles agua y minerales a cambio de carbohidratos fotosintéticos.',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80',
    approxLocation: [-39.8536, -73.2248],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/126938-Cortinarius-magellanicus'
  },
  {
    id: 'sp-oreja-palo',
    commonName: 'Oreja de Palo (Hongo Yesquero)',
    mapudungunName: 'Pellin-hongo',
    scientificName: 'Ganoderma australe',
    category: 'hongo',
    conservationStatus: 'Preocupación Menor',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    habitat: 'Troncos caídos y tocones añosos en el sendero del hualve.',
    description: 'Hongo perenne con cuerpo fructífero leñoso en forma de repisa o consola, de superficie superior marrón canela rugosa y poros finos blanquecinos por debajo.',
    funFact: 'Cumple el rol ecológico fundamental de reciclar la madera muerta del bosque, devolviendo nutrientes vitales al suelo del humedal.',
    image: 'https://images.unsplash.com/photo-1546853020-ca4909aef454?auto=format&fit=crop&w=900&q=80',
    approxLocation: [-39.8518, -73.2252],
    inaturalistUrl: 'https://www.inaturalist.org/taxa/347895-Ganoderma-australe'
  }
];

export const HUMEDAL_ROUTES: HumedalRoute[] = [
  {
    id: 'ruta-cisnes',
    name: 'Sendero Los Cisnes y Miradores Acuáticos',
    difficulty: 'Fácil',
    distanceKm: 1.2,
    estimatedMinutes: 25,
    description: 'Ruta en pasarelas de madera elevadas que recorre las lagunas protegidas, ideal para avistamiento de cisnes de cuello negro, taguas y garzas.',
    color: '#059669', // emerald
    highlight: 'Apta para toda la familia, coches de bebé y fotografía de avifauna.',
    surfaceType: 'Pasarela de ciprés con barandillas',
    path: [
      [-39.8495, -73.2260],
      [-39.8505, -73.2268],
      [-39.8512, -73.2274],
      [-39.8520, -73.2282],
      [-39.8528, -73.2290],
      [-39.8535, -73.2285],
      [-39.8542, -73.2275]
    ],
    checkpoints: [
      {
        id: 'cp-1-1',
        name: 'Portal de Acceso Claro de Luna',
        instruction: 'Inicia tu caminata ingresando por la pasarela de madera principal.',
        pointIndex: 0,
        alertType: 'info',
        alertMessage: 'Mantén a tus mascotas con correa y no arrojes pan a los cisnes.',
        totemQrId: 'ANG-QR-01'
      },
      {
        id: 'cp-1-2',
        name: 'Pasarela de los Juncales',
        instruction: 'Continúa recto 250 metros entre los totorales densos.',
        pointIndex: 2,
        alertType: 'viewpoint',
        alertMessage: 'Punto de alta probabilidad de avistamiento de Siete Colores en los juncos.',
        totemQrId: 'ANG-QR-02'
      },
      {
        id: 'cp-1-3',
        name: 'Mirador Central Cisne de Cuello Negro',
        instruction: 'Gira suavemente a la izquierda hacia la plataforma panorámica elevada.',
        pointIndex: 4,
        alertType: 'viewpoint',
        alertMessage: 'Observatorio con catalejos instalados y bancos de descanso.',
        totemQrId: 'ANG-QR-03'
      },
      {
        id: 'cp-1-4',
        name: 'Estación Laguna de las Taguas',
        instruction: 'Fin del tramo pasarela. Conexión hacia el circuito del bosque.',
        pointIndex: 6,
        alertType: 'info',
        alertMessage: 'Has completado la ruta con éxito. ¡Escanea el tótem para registrar tu visita!'
      }
    ]
  },
  {
    id: 'ruta-bosque',
    name: 'Circuito Bosque Pantanoso y Hualves',
    difficulty: 'Media',
    distanceKm: 2.1,
    estimatedMinutes: 45,
    description: 'Sendero inmersivo bajo la copa de pitras centenarias, canelos y arrayanes. El hogar natural del Chucao y la Ranita de Darwin.',
    color: '#0284c7', // sky
    highlight: 'Sombra tupida, aromas de hojas de canelo y cantos mágicos del bosque húmedo.',
    surfaceType: 'Tierra compactada con tramos de durmientes de madera',
    path: [
      [-39.8495, -73.2260],
      [-39.8502, -73.2250],
      [-39.8515, -73.2240],
      [-39.8530, -73.2230],
      [-39.8545, -73.2225],
      [-39.8555, -73.2235],
      [-39.8542, -73.2255],
      [-39.8530, -73.2268]
    ],
    checkpoints: [
      {
        id: 'cp-2-1',
        name: 'Bifurcación hacia el Hualve',
        instruction: 'Toma el sendero sombreado hacia el este adentrándote en el bosque.',
        pointIndex: 1,
        alertType: 'caution',
        alertMessage: 'Suelo húmedo en época de lluvia. Se recomienda calzado de trekking.'
      },
      {
        id: 'cp-2-2',
        name: 'Tótem Hualve Milenario de Pitras',
        instruction: 'Avanza 400 metros entre los árboles de raíces zancudas sumergidas.',
        pointIndex: 3,
        alertType: 'info',
        alertMessage: 'Detén el paso y escucha: el Chucao suele cantar en esta quebrada.',
        totemQrId: 'ANG-QR-04'
      },
      {
        id: 'cp-2-3',
        name: 'Refugio de la Ranita de Darwin',
        instruction: 'Bordeando la zona de musgos húmedos, mantén silencio absoluto.',
        pointIndex: 5,
        alertType: 'warning',
        alertMessage: 'Área de alta fragilidad ecológica: no salirse del sendero delimitado.',
        totemQrId: 'ANG-QR-06'
      },
      {
        id: 'cp-2-4',
        name: 'Retorno Mirador Ribereño',
        instruction: 'Cruce con la pasarela central hacia la salida.',
        pointIndex: 7,
        alertType: 'info'
      }
    ]
  },
  {
    id: 'ruta-ribera-kayak',
    name: 'Travesía Ribera Fluvial y Muelle Angachilla',
    difficulty: 'Aventura',
    distanceKm: 3.4,
    estimatedMinutes: 75,
    description: 'Recorrido ribereño a orillas del río Angachilla con vista a la navegación tradicional de botes y punto de embarque para kayaks recreativos.',
    color: '#d97706', // amber
    highlight: 'Vistas abiertas al curso del río, brisa fluvial y muelle comunitario de madera.',
    surfaceType: 'Riberas de pasto, ripio fino y pontones flotantes',
    path: [
      [-39.8495, -73.2260],
      [-39.8488, -73.2245],
      [-39.8492, -73.2220],
      [-39.8505, -73.2205],
      [-39.8522, -73.2195],
      [-39.8540, -73.2200],
      [-39.8550, -73.2215]
    ],
    checkpoints: [
      {
        id: 'cp-3-1',
        name: 'Borde Costero Fluvial',
        instruction: 'Sigue la huella peatonal paralela al curso calmo del río Angachilla.',
        pointIndex: 1,
        alertType: 'info',
        alertMessage: 'Revisa el horario de pleamar y bajamar si viajas con kayak.'
      },
      {
        id: 'cp-3-2',
        name: 'Puesto de Observación Martín Pescador',
        instruction: 'Continúa 500 metros hacia el recodo donde descansan los botes artesanales.',
        pointIndex: 3,
        alertType: 'viewpoint',
        alertMessage: 'Frecuente vuelo rasante de martines pescadores zambulléndose.',
        totemQrId: 'ANG-QR-05'
      },
      {
        id: 'cp-3-3',
        name: 'Muelle Náutico Ecológico',
        instruction: 'Llegada al pontón flotante para desembarco de kayak o contemplación.',
        pointIndex: 6,
        alertType: 'info',
        alertMessage: 'Punto de encuentro de boteros y guías locales del humedal.'
      }
    ]
  }
];

export const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: 'poi-1',
    name: 'Tótem 1: Portal de Bienvenida y Mirador El Sauce',
    category: 'totem_qr',
    coordinates: [-39.8495, -73.2260],
    description: 'Acceso principal al Santuario de la Naturaleza Humedal Angachilla desde calle René Schneider / Claro de Luna. Cartelería informativa general, mapas físicos y dispensador de bolsas biodegradables.',
    qrCode: 'ANG-QR-01',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    soundKey: 'siete_colores'
  },
  {
    id: 'poi-2',
    name: 'Tótem 2: Pasarela de las Taguas y Juncales',
    category: 'pasarela',
    coordinates: [-39.8512, -73.2274],
    description: 'Tramo de pasarela suspendida sobre el espejo de agua. Rodeado de totoras gigantes y nidos flotantes de taguas comunes y patos jergones.',
    qrCode: 'ANG-QR-02',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80',
    soundKey: 'tagua'
  },
  {
    id: 'poi-3',
    name: 'Tótem 3: Torre de Observación Cisnes de Cuello Negro',
    category: 'torre',
    coordinates: [-39.8528, -73.2290],
    description: 'Estructura de madera nativa de dos niveles con telescopios monoculares para observar el comportamiento reproductivo y alimentación de las colonias de cisnes sin perturbarlos.',
    qrCode: 'ANG-QR-03',
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=900&q=80',
    soundKey: 'cisne'
  },
  {
    id: 'poi-4',
    name: 'Tótem 4: Hualve Milenario de Pitras Inundadas',
    category: 'totem_qr',
    coordinates: [-39.8530, -73.2230],
    description: 'Uno de los remanentes de bosque pantanoso mejor conservados de la cuenca del Río Valdivia. Microclima fresco con helechos gigantes y líquenes barba de viejo.',
    qrCode: 'ANG-QR-04',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
    soundKey: 'chucao'
  },
  {
    id: 'poi-5',
    name: 'Tótem 5: Muelle Comunitario Río Angachilla',
    category: 'muelle',
    coordinates: [-39.8505, -73.2205],
    description: 'Muelle flotante de madera para botes tradicionales de paseo y bajada de kayaks con chaleco salvavidas obligatorio. Hermosa panorámica del río al atardecer.',
    qrCode: 'ANG-QR-05',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    soundKey: 'martin_pescador'
  },
  {
    id: 'poi-6',
    name: 'Tótem 6: Estación de Monitoreo Ranita de Darwin',
    category: 'totem_qr',
    coordinates: [-39.8555, -73.2235],
    description: 'Punto de estudio bioacústico donde investigadores de la Universidad Austral de Chile (UACh) monitorean poblaciones de anfibios nativos e indicadores de salud del agua.',
    qrCode: 'ANG-QR-06',
    image: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=900&q=80',
    soundKey: 'ranita_darwin'
  }
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'not-1',
    title: 'Gran Jornada de Limpieza y Recuperación Comunitaria de Orillas',
    summary: 'Invitación a todos los vecinos y voluntarios este sábado desde las 10:00 hrs en el Portal Claro de Luna. Guantes y bolsas provistos.',
    fullText: 'La Corporación Humedales de Angachilla junto a la Municipalidad de Valdivia invitan a la comunidad a participar en la segunda jornada estacional de retiro de residuos en la ribera del humedal. Contaremos con monitores ambientales, música local acústica y estación de hidratación. Por favor asistir con ropa cómoda y botas de agua.',
    image: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80',
    category: 'limpieza',
    date: '24 Sep 2026',
    author: 'Corporación Humedales Angachilla',
    pinned: true,
    approved: true
  },
  {
    id: 'not-2',
    title: 'Alerta de Temporada: Nacimiento de Pichones de Cisne de Cuello Negro',
    summary: 'Se ha registrado la eclosión de 14 polluelos en el sector de totorales sur. Por favor transitar en silencio y no llevar perros sueltos.',
    fullText: 'Guardaparques del santuario informan que varias parejas de cisnes han completado con éxito su período de incubación. Durante las próximas 4 semanas las crías estarán nadando junto a sus padres sobre las espaldas de las hembras. Queda estrictamente prohibido el vuelo de drones a menos de 100 metros de altura sobre las lagunas y se solicita a los kayakistas mantener al menos 50 metros de distancia.',
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=1200&q=80',
    category: 'biodiversidad',
    date: '20 Sep 2026',
    author: 'Guardaparques Santuario Angachilla',
    pinned: true,
    approved: true
  },
  {
    id: 'not-3',
    title: 'Taller de Identificación de Cantos de Aves Silvestres del Bosque Húmedo',
    summary: 'Aprende a reconocer el canto del Chucao, Huet-huet, Martín Pescador y Rayadito con bioacústicos de la UACh.',
    fullText: 'Un taller interactivo gratuito abierto para niños y adultos impartido por el Laboratorio de Ecología Acústica. Aprenderemos a escuchar activamente la sinfonía natural del humedal, el uso de grabadoras parabólicas y la importancia de reducir el ruido urbano en los bordes de la reserva natural.',
    image: 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=1200&q=80',
    category: 'taller',
    date: '17 Sep 2026',
    author: 'Facultad de Ciencias UACh',
    approved: true
  },
  {
    id: 'not-4',
    title: 'Trabajos de Mantención y Reposición de Tableros en Pasarela Sur',
    summary: 'Se realizarán recambios de durmientes de madera en 40 metros del Sendero Los Cisnes. Habilitado paso peatonal alternativo.',
    fullText: 'El equipo de infraestructura del parque estará reemplazando maderas húmedas por tablas de ciprés tratadas ecológicamente para garantizar la máxima seguridad en invierno. El desvío señalizado añade solo 3 minutos al recorrido.',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    category: 'alerta',
    date: '12 Sep 2026',
    author: 'Administración del Parque',
    approved: true
  },
  {
    id: 'not-5',
    title: 'Vecinos de Villa Los Notros organizan cuadrilla de monitoreo de nidos',
    summary: 'La junta vecinal coordinó un grupo voluntario para vigilar que las mascotas no perturben los nidos ribereños de taguas y huairavos.',
    fullText: 'Una iniciativa comunitaria ciudadana nacida de los vecinos colindantes al humedal. Con el apoyo y aprobación de los guardaparques del santuario, se instalaron carteles educativos de madera nativa recuperada y se organizaron turnos de caminata consciente en horarios de alta afluencia.',
    image: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
    category: 'comunidad',
    date: '10 Sep 2026',
    author: 'Junta de Vecinos Villa Los Notros',
    approved: true,
    isCommunity: true
  },
  {
    id: 'not-6',
    title: 'Registro ciudadano de avistamiento de Huillín en el río Angachilla',
    summary: 'Familia valdiviana documenta en video una pareja de nutrias de río nadando cerca del muelle al amanecer.',
    fullText: 'La observación fue revisada y confirmada por biólogos de la UACh. Es un extraordinario indicador de la excelente calidad del agua y la recuperación de peces nativos como el puye en este sector del humedal.',
    image: 'https://images.unsplash.com/photo-1590422749897-476722d41fae?auto=format&fit=crop&w=1200&q=80',
    category: 'comunidad',
    date: '06 Sep 2026',
    author: 'Familia Muñoz Valenzuela (Vecinos)',
    approved: true,
    isCommunity: true
  }
];

export const INITIAL_WETLAND_EVENTS: WetlandEvent[] = [
  {
    id: 'evt-1',
    title: 'Avistamiento Matutino de Cisnes y Aves Acuáticas',
    description: 'Recorrido guiado con telescopios terrestres y binoculares de alta definición. Observaremos cortejos y alimentación de cisnes de cuello negro y taguas.',
    date: 'Sábado 26 de Septiembre, 2026',
    time: '08:30 - 10:30 hrs',
    locationName: 'Mirador Central Cisne de Cuello Negro',
    coordinates: [-39.8528, -73.2290],
    routeId: 'ruta-cisnes',
    routeName: 'Sendero Los Cisnes',
    category: 'avistamiento',
    capacity: 25,
    registeredCount: 19,
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=800&q=80',
    organizer: 'Club de Observadores de Aves Los Ríos'
  },
  {
    id: 'evt-2',
    title: 'Taller de Fotografía de Humedal al Atardecer',
    description: 'Aprende composición, reflejos en el agua y fotografía de aves en vuelo aprovechando la hora dorada de Valdivia. Para teléfonos y cámaras.',
    date: 'Domingo 27 de Septiembre, 2026',
    time: '17:00 - 19:00 hrs',
    locationName: 'Pasarela de los Juncales',
    coordinates: [-39.8512, -73.2274],
    routeId: 'ruta-cisnes',
    routeName: 'Sendero Los Cisnes',
    category: 'fotografia',
    capacity: 20,
    registeredCount: 14,
    image: 'https://images.unsplash.com/photo-1518992028580-6d97bdca06c3?auto=format&fit=crop&w=800&q=80',
    organizer: 'Colectivo Fotográfico Valdiviano'
  },
  {
    id: 'evt-3',
    title: 'Caminata Bioacústica: Cantos del Chucao y Fauna Oculta',
    description: 'Inmersión sensorial por el bosque pantanoso con micrófonos parabólicos y auriculares. Descubriremos las frecuencias y dialectos del Chucao y Rayadito.',
    date: 'Sábado 26 de Septiembre, 2026',
    time: '11:00 - 12:45 hrs',
    locationName: 'Tótem Hualve Milenario de Pitras',
    coordinates: [-39.8530, -73.2230],
    routeId: 'ruta-bosque',
    routeName: 'Circuito Bosque Pantanoso',
    category: 'educativo',
    capacity: 16,
    registeredCount: 13,
    image: 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=800&q=80',
    organizer: 'Laboratorio de Acústica UACh'
  },
  {
    id: 'evt-4',
    title: 'Búsqueda Nocturna de Anfibios y Ranita de Darwin',
    description: 'Expedición nocturna con linternas de luz roja para registrar anfibios nativos sin perturbarlos. Conoce la maravillosa crianza bucal del macho de Ranita de Darwin.',
    date: 'Viernes 2 de Octubre, 2026',
    time: '19:30 - 21:15 hrs',
    locationName: 'Refugio de la Ranita de Darwin',
    coordinates: [-39.8545, -73.2225],
    routeId: 'ruta-bosque',
    routeName: 'Circuito Bosque Pantanoso',
    category: 'educativo',
    capacity: 12,
    registeredCount: 10,
    image: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=800&q=80',
    organizer: 'Grupo Herpetológico Austral'
  },
  {
    id: 'evt-5',
    title: 'Remada Comunitaria y Limpieza Fluvial en Kayak',
    description: 'Travesía a remo por las márgenes del río Angachilla recolectando plásticos atrapados en juncos. Se facilitan kayaks y chalecos a inscritos.',
    date: 'Sábado 3 de Octubre, 2026',
    time: '10:00 - 13:00 hrs',
    locationName: 'Muelle Comunitario Angachilla',
    coordinates: [-39.8505, -73.2205],
    routeId: 'ruta-ribera-kayak',
    routeName: 'Travesía Ribera Fluvial',
    category: 'kayak',
    capacity: 30,
    registeredCount: 22,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    organizer: 'Club Kayak Valdivia & Vecinos'
  },
  {
    id: 'evt-6',
    title: 'Plantación Ciudadana de Pitras y Árboles Ribereños',
    description: 'Reforestación con especies nativas para estabilizar las orillas y crear nuevos corredores biológicos. Se entregan herramientas y sustrato orgánico.',
    date: 'Domingo 4 de Octubre, 2026',
    time: '11:00 - 13:30 hrs',
    locationName: 'Portal Claro de Luna',
    coordinates: [-39.8495, -73.2260],
    routeId: 'ruta-ribera-kayak',
    routeName: 'Travesía Ribera Fluvial',
    category: 'limpieza',
    capacity: 40,
    registeredCount: 31,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    organizer: 'Corporación Humedales de Angachilla'
  }
];

export const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sug-1',
    title: 'Instalación de dispensadores de agua en el Portal Claro de Luna',
    description: 'Sería de gran ayuda para los caminantes y ciclistas contar con un bebedero ecológico para rellenar botellas reutilizables antes de comenzar las rutas.',
    category: 'infraestructura',
    status: 'aprobada',
    createdAt: '19 Sep 2026',
    authorName: 'Camila Rosas V.',
    authorEmail: 'camila.rosas@gmail.com',
    adminComment: '¡Excelente propuesta! Se incorporó en el plan de mejoras del municipio para el próximo mes.'
  },
  {
    id: 'sug-2',
    title: 'Colocación de señalética en braille y relieve en la Torre de Observación',
    description: 'Para que personas con discapacidad visual puedan conocer los detalles táctiles de las aves que habitan el humedal.',
    category: 'educacion',
    status: 'aprobada',
    createdAt: '15 Sep 2026',
    authorName: 'Rodrigo Fuentes M.',
    authorEmail: 'r.fuentes@uach.cl',
    adminComment: 'Aprobado. Estamos coordinando con el equipo de accesibilidad universal para confeccionar las placas.'
  },
  {
    id: 'sug-3',
    title: 'Mayor fiscalización nocturna por ruidos molestos en el muelle',
    description: 'Algunos fines de semana se concentran vehículos con música alta cerca del acceso al río que perturban a las garzas que anidan cerca.',
    category: 'seguridad',
    status: 'pendiente',
    createdAt: '21 Sep 2026',
    authorName: 'Matías Silva',
    authorEmail: 'msilva@gmail.com'
  }
];

export const INITIAL_COMMUNITY_PHOTOS: CommunityPhoto[] = [
  {
    id: 'photo-1',
    title: 'Amanecer dorado reflejado en la laguna de los cisnes',
    visitedPlace: 'Mirador Central Cisne de Cuello Negro',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Francisca Morales',
    authorEmail: 'fran.valdivia@gmail.com',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    date: '20 Sep 2026',
    likes: 38,
    isSaved: true,
    approved: true,
    description: 'La neblina matinal de Valdivia abriéndose paso sobre el humedal. ¡Un espectáculo inolvidable!',
    tags: ['Aves', 'Atardeceres', 'Laguna'],
    aspectRatio: 'tall',
    commentsCount: 12
  },
  {
    id: 'photo-2',
    title: 'Avistamiento de Huillín en el río Angachilla',
    visitedPlace: 'Muelle Comunitario Río Angachilla',
    imageUrl: 'https://images.unsplash.com/photo-1590422749897-476722d41fae?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Esteban Alarcón',
    authorEmail: 'esteban.a@gmail.com',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    date: '18 Sep 2026',
    likes: 64,
    isSaved: false,
    approved: true,
    description: 'Tuvimos la suerte infinita de ver a este mamífero protegido nadando junto a las ramas sumergidas del muelle.',
    tags: ['Fauna', 'Río', 'Nativo'],
    aspectRatio: 'square',
    commentsCount: 8
  },
  {
    id: 'photo-3',
    title: 'Un Chucao curioso sobre un tronco con musgo verde',
    visitedPlace: 'Hualve Milenario de Pitras',
    imageUrl: 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Valentina Soto',
    authorEmail: 'vale.soto@gmail.com',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    date: '14 Sep 2026',
    likes: 49,
    isSaved: true,
    approved: true,
    description: 'Cantó fuerte a nuestro lado derecho durante toda la caminata por el hualve. Toda una bendición huilliche.',
    tags: ['Aves', 'Bosque', 'Chucao'],
    aspectRatio: 'tall',
    commentsCount: 15
  },
  {
    id: 'photo-4',
    title: 'Pasarela flotante entre los juncos y el estero calmo',
    visitedPlace: 'Pasarela Estero Claro de Luna',
    imageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Rodrigo Fuentes',
    authorEmail: 'r.fuentes@uach.cl',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    date: '12 Sep 2026',
    likes: 82,
    isSaved: false,
    approved: true,
    description: 'La madera mojada por la llovizna valdiviana genera un aroma a bosque templado que recarga el alma.',
    tags: ['Pasarelas', 'Senderos', 'Lluvia'],
    aspectRatio: 'wide',
    commentsCount: 6
  },
  {
    id: 'photo-5',
    title: 'Familia de Cisnes de Cuello Negro alimentándose en aguas someras',
    visitedPlace: 'Santuario Ribera Este',
    imageUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Camila Rosas V.',
    authorEmail: 'camila.rosas@gmail.com',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    date: '10 Sep 2026',
    likes: 115,
    isSaved: true,
    approved: true,
    description: 'Los pichones grises ya aprenden a sumergir el cuello en el luchecillo. Recordatorio: jamás alimentarlos con pan.',
    tags: ['Aves', 'Cisnes', 'Fauna'],
    aspectRatio: 'tall',
    commentsCount: 24
  },
  {
    id: 'photo-6',
    title: 'Travesía en Kayak al caer la tarde por el meandro sur',
    visitedPlace: 'Río Angachilla - sector kayak',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Matías Silva',
    authorEmail: 'msilva@gmail.com',
    authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    date: '08 Sep 2026',
    likes: 73,
    isSaved: false,
    approved: true,
    description: 'Remando en silencio para no asustar a los martines pescadores. La perspectiva desde el agua es alucinante.',
    tags: ['Kayak', 'Río', 'Aventura'],
    aspectRatio: 'square',
    commentsCount: 9
  },
  {
    id: 'photo-7',
    title: 'Reflejos de la selva valdiviana en el humedal tras el chubasco',
    visitedPlace: 'Hualve Milenario de Pitras',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Paula Kramm',
    authorEmail: 'pkramm@gmail.com',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    date: '05 Sep 2026',
    likes: 91,
    isSaved: true,
    approved: true,
    description: 'Las pitras sumergidas actúan como filtros biológicos milenarios. Cuidemos este santuario de todos.',
    tags: ['Flora', 'Bosque', 'Nativo'],
    aspectRatio: 'tall',
    commentsCount: 11
  },
  {
    id: 'photo-8',
    title: 'Atardecer púrpura sobre la bahía del humedal',
    visitedPlace: 'Torre Panorámica de las Taguas',
    imageUrl: 'https://images.unsplash.com/photo-1518992028580-6d97bdca06c3?auto=format&fit=crop&w=1000&q=80',
    authorName: 'Gonzalo Vera',
    authorEmail: 'gvera@valdiviaco.cl',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    date: '02 Sep 2026',
    likes: 142,
    isSaved: false,
    approved: true,
    description: 'Vista 360 grados desde la torre panorámica. Los colores del cielo valdiviano no tienen comparación.',
    tags: ['Atardeceres', 'Pasarelas', 'Laguna'],
    aspectRatio: 'wide',
    commentsCount: 19
  }
];

export const INFOGRAPHIC_POSTERS: InfographicPoster[] = [
  {
    id: 'poster-1',
    title: 'Decálogo del Visitante Consciente',
    subtitle: 'Protejamos el Santuario de la Naturaleza Humedal Angachilla',
    theme: 'Conservación Activa',
    imageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    rules: [
      'Prohibido alimentar a las aves acuáticas con pan o restos de comida procesada (causa deformaciones óseas).',
      'Mantén siempre a tus mascotas con correa corta; un perro suelto puede destruir nidos enteros en minutos.',
      'Lleva contigo todos tus residuos plásticos y colillas; no dejes nada en el humedal salvo tus huellas.',
      'Circula exclusivamente por las pasarelas y senderos marcados para no compactar las raíces zancudas de las pitras.',
      'Habla en tono moderado y disfruta el paisaje sonoro de las más de 80 especies de aves que aquí habitan.'
    ],
    description: 'El humedal no es solo un parque recreativo, sino un ecosistema vivo que regula las inundaciones de Valdivia, purifica el agua y captura toneladas de carbono.'
  },
  {
    id: 'poster-2',
    title: 'El Ciclo del Agua y los Hualves',
    subtitle: 'Por qué Valdivia es la capital de los humedales urbanos',
    theme: 'Hidrología y Clima',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    rules: [
      'Los hualves absorben hasta el 70% de las precipitaciones torrenciales de otoño e invierno.',
      'Sus raíces filtran metales pesados y sedimentos antes de que el agua desemboque en el Río Calle-Calle.',
      'Albergan especies fósiles vivientes que evolucionaron hace más de 40 millones de años en la selva valdiviana.',
      'Son corredores biológicos vitales entre la Cordillera de la Costa y el estuario del Río Valdivia.'
    ],
    description: 'Conoce cómo los terremotos y la geografía fluvial crearon los humedales más fascinantes del sur de Chile.'
  }
];

export const WAZE_LIVE_ALERTS: WazeLiveAlert[] = [
  {
    id: 'al-1',
    type: 'fauna',
    title: 'Avistamiento de Cisnes con pichones',
    description: 'Grupo familiar de cisnes alimentándose a solo 15 metros del mirador principal.',
    coordinates: [-39.8525, -73.2285],
    reportedBy: 'Guardaparques Jorge',
    timeAgo: 'Hace 8 min'
  },
  {
    id: 'al-2',
    type: 'resbaladizo',
    title: 'Pasarela húmeda con rocío matutino',
    description: 'Tramo sombreado con musgo resbaladizo. Camine con precaución sobre las tablas.',
    coordinates: [-39.8512, -73.2274],
    reportedBy: 'Vecino Matías',
    timeAgo: 'Hace 22 min'
  },
  {
    id: 'al-3',
    type: 'silencio',
    title: 'Zona de Nidificación Sensible',
    description: 'Se solicita silencio riguroso por nidos activos de taguas en las totoras contiguas.',
    coordinates: [-39.8530, -73.2230],
    reportedBy: 'Corporación Angachilla',
    timeAgo: 'Hace 45 min'
  }
];

export const INITIAL_SPONSOR_ADS: SponsorAd[] = [
  {
    id: 'ad-kayak',
    sponsorName: 'Kayak Fluvial Valdivia',
    badge: 'Eco-Turismo Local',
    title: 'Expediciones en Kayak al Atardecer',
    subtitle: 'Navega en silencio por los meandros del Angachilla',
    description: 'Tours guiados por biólogos locales respetando las zonas de nidificación. Descuento 15% para visitantes del humedal.',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    linkUrl: '#'
  },
  {
    id: 'ad-cafe',
    sponsorName: 'Café & Vivero Bosque Nativo',
    badge: 'Comercio Sustentable',
    title: 'Cafetería de Especialidad & Plantas Nativas',
    subtitle: 'A solo 300m del acceso Portal Claro de Luna',
    description: 'Café orgánico, repostería casera con murta y avellanas, y especies arbóreas nativas para reforestar tu jardín.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    linkUrl: '#'
  },
  {
    id: 'ad-reciclaje',
    sponsorName: 'Cooperativa Los Ríos Recicla',
    badge: 'Economía Circular',
    title: 'Puntos Verdes y Manejo de Residuos',
    subtitle: 'Por un humedal libre de plásticos',
    description: 'Retiro domiciliario y compostaje comunitario en Villa Galilea y alrededores de Angachilla.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    linkUrl: '#'
  }
];

// --- TICKETS DE MODERACIÓN DE LA COMUNIDAD (PDF REUNIÓN 15-SEPT-2026) ---
export const INITIAL_MODERATION_TICKETS: ModerationTicket[] = [
  {
    id: 'tkt-001',
    type: 'avistamiento_especie',
    authorName: 'Camila Pineda (Vecina Villa Galilea)',
    authorEmail: 'camila.pineda@gmail.com',
    submittedAt: 'Hoy, 09:15',
    title: 'Familia de Cisnes de Cuello Negro con 4 polluelos en Meandro Angachilla',
    description: 'Pude observar y fotografiar desde el mirador oeste una pareja de cisnes con 4 crías alimentándose de luchecillo en aguas mansas. Solicito publicar en avisos para que la comunidad sepa que están anidando.',
    speciesName: 'Cisne de Cuello Negro',
    locationName: 'Mirador Los Cisnes',
    locationCoords: [-39.8525, -73.2285],
    imageUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=800&q=80',
    status: 'pendiente'
  },
  {
    id: 'tkt-002',
    type: 'foto_comunidad',
    authorName: 'Rodrigo Almonacid (Fotógrafo de Aves)',
    authorEmail: 'rodrigo.fotografia@valdivia.cl',
    submittedAt: 'Ayer, 18:40',
    title: 'Fotografía en primer plano de Chucao en sotobosque de Pitra',
    description: 'Registro tomado con teleobjetivo 400mm en la pasarela del hualve sin usar flash ni perturbar al animal. Propongo sumarlo a la galería comunitaria.',
    speciesName: 'Chucao',
    locationName: 'Sendero del Hualve',
    locationCoords: [-39.8540, -73.2230],
    imageUrl: 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=800&q=80',
    status: 'pendiente'
  },
  {
    id: 'tkt-003',
    type: 'reporte_ambiental',
    authorName: 'Patricio Vera (Club de Kayak)',
    authorEmail: 'patricio.kayak@gmail.com',
    submittedAt: '18 sept 2026',
    title: 'Tronco flotante obstruyendo canal de navegación menor',
    description: 'Un árbol de sauce seco cayó parcialmente sobre el canal secundario hacia el río Valdivia. No afecta a las aves pero dificulta el paso de botes de monitoreo.',
    locationName: 'Canal Secundario Río Angachilla',
    locationCoords: [-39.8505, -73.2268],
    status: 'aprobado',
    adminNotes: 'Revisado por guardaparques y notificado al equipo de mantención fluvial.',
    reviewedBy: 'Guardaparques Humedal Angachilla',
    reviewedAt: '19 sept 2026'
  },
  {
    id: 'tkt-004',
    type: 'aviso_novedad',
    authorName: 'Marta Solís (Profesora Colegio Bicentenario)',
    authorEmail: 'marta.solis@educa.cl',
    submittedAt: '17 sept 2026',
    title: 'Taller Escolar de Cuidado del Humedal',
    description: 'Queremos difundir un taller de avistamiento de aves para niños de 5to básico el próximo sábado por la mañana.',
    locationName: 'Centro de Interpretación Ambiental',
    status: 'aprobado',
    adminNotes: 'Aprobado y publicado en la sección de Eventos Comunitarios.',
    reviewedBy: 'Guardaparques Humedal Angachilla',
    reviewedAt: '18 sept 2026'
  }
];

// --- INFORMACIÓN INSTITUCIONAL DEL COMITÉ Y RESERVA COMUNITARIA (PDF REUNIÓN 15-SEPT-2026) ---
export const SANCTUARY_COMMITTEE_INFO = {
  name: 'Comité Ecológico Bosque Humedal del Santuario Angachilla',
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
    inaturalistPlace: 'https://www.inaturalist.org/places/chile'
  },
  historySummary: `El Santuario de la Naturaleza Humedal Angachilla es fruto de una incansable gesta comunitaria iniciada a principios de los años 2000 por vecinos y vecinas de Villa Galilea, Angachilla, Claro de Luna y sectores del sur de Valdivia.

Frente a la constante amenaza de rellenos ilegales, expansión urbana no regulada y basurales clandestinos que asfixiaban los ecosistemas surgidos tras el gran sismo y maremoto de mayo de 1960, la comunidad se organizó como Comité Ecológico para reforestar con canelos y coigües, construir pasarelas rústicas de observación y defender el agua.

En articulación con la comunidad científica de la Universidad Austral de Chile (UACh) y organizaciones ciudadanas, el Consejo de Ministros para la Sustentabilidad aprobó formalmente la declaración de Santuario de la Naturaleza protegiendo más de 2.000 hectáreas de meandros fluviales, hualves de pitras y lagunas de anidación. Hoy en día, el comité autogestiona el cuidado de este tesoro biocultural abierto a toda la ciudadanía.`,
  pillars: [
    {
      title: 'Defensa Territorial y Comunitaria',
      desc: 'Monitoreo ciudadano constante contra rellenos clandestinos y contaminación de aguas.'
    },
    {
      title: 'Educación & Ciencia Ciudadana',
      desc: 'Talleres barriales, avistamiento con eBird / iNaturalist y visitas pedagógicas con escuelas.'
    },
    {
      title: 'Restauración del Hualve Nativo',
      desc: 'Reforestación con canelos, pitras, arrayanes y maitenes para revitalizar el bosque pantanoso.'
    }
  ]
};


