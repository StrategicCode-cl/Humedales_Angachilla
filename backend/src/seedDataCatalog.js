// Catálogo estructurado extraído íntegramente de los documentos oficiales en /utilidad:
// - TEXTO S 1.odt a TEXTO S 6.odt
// - ANGACHILLA APP.docx
// - NUESTRA RESERVA COMUNITARIA.docx
// - COMITE ECOLÓGICO.docx

export const STATIONS_DATA = [
  {
    codigo: "S1",
    slug: "mirador-del-hualve",
    folder: "MIRADOR DEL HUALVE",
    nombre: "Estación 1: Mirador del Hualve",
    subtitulo: "Restauración de bosque humedal, matorral nativo y vista al pantano de Chequén",
    categoria: "mirador",
    codigoQr: "ANG-QR-01",
    soundKey: "chucao",
    rutaSlug: "ruta-circuito",
    lat: -39.85675,
    lng: -73.23785,
    orden: 1,
    descripcion: `Esta loma y su vista nos muestra la restauración del bosque humedal que fue arrancado y cubierto por los rellenos de altura, donde el crecimiento de los arbustos, árboles aún bajos y pasto sobre ésta ha condicionado un hábitat para aves de matorral, pastizal y bosque arbustivo. Se aprecian árboles como el notro con su flor roja en primavera y el maqui con sus frutos de verano sobre las laderas de relleno de tierra, ya que éstas son las primeras especies en regenerar, colonizar y estabilizar los suelos afectados por cualquier alteración.

Hacia la derecha se aprecia el hualve, un pantano de bosque inundado que nace de una quebrada que llega al humedal Angachilla. Arraigados al fondo del agua hay árboles nativos únicos en la reserva como un grupo de Chequén en el pantano. Este bosque pantanoso alberga un ecosistema que ha tenido menor invasión, por lo que ha servido de refugio y hábitat de diversas especies de fauna silvestre.

En las zonas más altas se aprecian los Laureles o Trihues, árboles nativos que llevan muchos años de crecimiento y que incluso sobrevivieron a los rellenos y deforestación por la expansión urbana. La quila, tipo de caña nativa de estas zonas húmedas, también aprovecha de crecer y expandirse como matorral en suelos que hayan sido deforestados. El equilibrio ecológico mediante la conservación de la biodiversidad de esta reserva es indispensable para la calidad de vida de los habitantes.`,
    normas: [
      "Emitir el menor ruido posible para no alterar ni espantar a las aves.",
      "No cortar ramas ni árboles ni extraer plantas, funga y retoños.",
      "No dejar basura; ésta contamina el hábitat, llévatela o transpórtala a los basureros cercanos.",
      "Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente."
    ]
  },
  {
    codigo: "S2",
    slug: "laguna-de-los-pinos",
    folder: "LAGUNA DE LOS PINOS",
    nombre: "Estación 2: Laguna de los Pinos",
    subtitulo: "Laguna estacionaria de anfibios, helechos Costilla de Vaca y contraste hídrico",
    categoria: "mirador",
    codigoQr: "ANG-QR-02",
    soundKey: "ranita_darwin",
    rutaSlug: "ruta-circuito",
    lat: -39.85620,
    lng: -73.23920,
    orden: 2,
    descripcion: `Este espacio se caracteriza por tener una laguna estacionaria con abundante vegetación y la mayor parte del año con agua, la que tiene un cierto grado de drenaje conectado al cauce del estero del humedal Angachilla. Estas condiciones son ideales para la supervivencia de los renacuajos que provienen de los huevos que dejan los anfibios en este lugar; el desarrollo de éstos depende tanto de la presencia de vegetación como de la existencia de movimientos en el cuerpo de agua que permitan una buena oxigenación. Luego, el desplazamiento de los renacuajos hacia el Espejo de agua del Angachilla mediante las lluvias facilita la supervivencia y permite un buen desarrollo de la población de anfibios del lugar, como la Rana Grande Chilena —el anfibio más grande y único de este país considerado fósil viviente por existir desde hace millones de años— y el Sapito de Cuatro Ojos.

Como en una línea limítrofe en la zona colindante entre el pajonal y el bosque humedal se pueden apreciar los helechos Costilla de Vaca, grandes de hojas dentadas y con sus brotes nuevos en forma de espiral, por donde se desplazan aves de sotobosque.

La presencia de pinos en este lugar nos hace apreciar cómo éstos han deteriorado el suelo con la resina y agujas que desechan, además de consumir mucha más cantidad de agua que los árboles nativos del bosque humedal, amenazando el flujo hídrico del cuerpo de agua.`,
    normas: [
      "Respetar el hábitat de los renacuajos sin alterarlos.",
      "No verter ni arrojar objetos a la laguna.",
      "No ingresar a la laguna ni alterar su suelo y vegetación.",
      "Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente."
    ]
  },
  {
    codigo: "S3",
    slug: "mirador-espejo-del-angachilla",
    folder: "MIRADOR ESPEJO DEL ANGACHILLA",
    nombre: "Estación 3: Mirador Espejo del Angachilla",
    subtitulo: "Espejo de agua abierto, avistamiento de cisnes, garzas, patos y coipos",
    categoria: "torre",
    codigoQr: "ANG-QR-03",
    soundKey: "cisne",
    rutaSlug: "ruta-circuito",
    lat: -39.85555,
    lng: -73.24050,
    orden: 3,
    descripcion: `Este mirador se caracteriza por estar en suelo de vegetación terrestre donde crecen árboles nativos como el Maitén y el Hualle y arbustos como la murta, con vista a suelos inundados con zonas cubiertas de bosque humedal, pajonal de vegetación palustre y el espejo de agua que presenta plantas acuáticas arraigadas al suelo sumergidas o flotando sus hojas y flores.

El Espejo del Angachilla permite avistar durante gran parte del año diferentes especies de patos, garzas, taguas, zambullidores y aves costeras, así como la presencia de coipos, mamíferos nativos roedores fundamentales para el control de la biomasa y la conservación del ecosistema del humedal.

En este mirador se puede apreciar a la Garza Cuca, la más grande de Chile, además de observar cómo el espejo de agua se ha visto afectado por el incremento de plantas acuáticas hidrófitas producto de la contaminación por materia orgánica proveniente de colectores de aguas lluvias urbanos.`,
    normas: [
      "Tener cuidado con lo que se vierte y arroja en las calles y mantener las vías de drenaje de aguas lluvias limpias.",
      "Emitir el menor ruido posible para no alterar ni espantar a las aves.",
      "Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente."
    ]
  },
  {
    codigo: "S4",
    slug: "totoral-del-santuario",
    folder: "TOTORAL DEL SANTUARIO",
    nombre: "Estación 4: Totoral del Santuario",
    subtitulo: "Pajonal palustre de batros, totoras, cortaderas, calafates y nidos colgantes",
    categoria: "pasarela",
    codigoQr: "ANG-QR-04",
    soundKey: "siete_colores",
    rutaSlug: "ruta-circuito",
    lat: -39.85515,
    lng: -73.23890,
    orden: 4,
    descripcion: `El pajonal es la zona que bordea el caudal del estero hacia la orilla que converge con el bosque, cuyo suelo está permanentemente inundado cerca del cauce y periódicamente inundado más hacia afuera. Estos suelos están completamente cubiertos por plantas acuáticas palustres conformadas principalmente por batros, totoras, cortaderas y junquillos. Estas plantas viven con sus raíces arraigadas al suelo inundado, pero sus tallos, hojas y flores sobresalen por encima del agua, desempeñando un papel ecológico crucial como biofiltros y refugio de nidificación.

A orillas de este pajonal encontramos un gran grupo de calafates, arbustos espinosos nativos de fruto comestible representativos del sur austral. En este hábitat se pueden ver y escuchar aves como el Siete Colores y el Trabajador, que construyen sus nidos tejidos colgando entre las totoras y juncos sobre el nivel del agua.`,
    normas: [
      "No cortar ni extraer las plantas acuáticas del pajonal.",
      "Emitir el menor ruido posible para no alterar ni espantar a las aves.",
      "Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente.",
      "No dejar basura; ésta contamina el hábitat, llévatela o transpórtala a los basureros cercanos."
    ]
  },
  {
    codigo: "S5",
    slug: "bosque-los-canelos",
    folder: "BOSQUE LOS CANELOS",
    nombre: "Estación 5: Bosque Los Canelos",
    subtitulo: "Bosque inundable de Canelos, Arrayanes, Temus, Pitras, Camarón de Vega y Voqui Blanco",
    categoria: "totem_qr",
    codigoQr: "ANG-QR-05",
    soundKey: "chucao",
    rutaSlug: "ruta-canelos",
    lat: -39.85845,
    lng: -73.23710,
    orden: 5,
    descripcion: `Este sector se caracteriza por ser único en la zona con una gran extensión de bosque de canelos que bordea al humedal Angachilla, capturando subterráneamente el agua de las lluvias para limpiarla y enviarla a éste. Estos árboles que pueden llegar a tener 30 metros de altura comparten este hábitat con el arrayán, el temu (de tronco anaranjado) y la pitra (de tronco con grandes rugosidades). Estos 4 árboles en condiciones de inundación aumentan su tasa de fotosíntesis, combatiendo las inundaciones y siendo una gran fuente de oxígeno.

Debido a su sombra y humedad este bosque mantiene un microclima que posibilita la existencia del Camarón de Vega (Parastacus nicoleti), cuyas madrigueras subterráneas forman conos de protección conocidos como chimeneas. Enrollados en los árboles encontramos enredaderas nativas como el Copihue y el sorprendente Voqui Blanco (Boquila trifoliolata), capaz de mimetizar la forma, color y tamaño de las hojas de múltiples plantas huésped.`,
    normas: [
      "No cortar ramas ni árboles ni extraer plantas, funga y retoños.",
      "No extraer tierra de hoja ni suelo del bosque.",
      "No plantar especies exóticas ni enterrar mascotas.",
      "No introducir objetos en los orificios ni destruir las chimeneas de los camarones de vega.",
      "No ingresar ni invadir zonas de crecimiento de funga y plantas nativas."
    ]
  },
  {
    codigo: "S6",
    slug: "vega-de-la-garza",
    folder: "VEGA DE LA GARZA",
    nombre: "Estación 6: Vega de la Garza",
    subtitulo: "Planicie de afloramiento hídrico, pradera ceremonial y refugio de aves acuáticas",
    categoria: "mirador",
    codigoQr: "ANG-QR-06",
    soundKey: "martin_pescador",
    rutaSlug: "ruta-circuito",
    lat: -39.85585,
    lng: -73.23740,
    orden: 6,
    descripcion: `La vega es un ecosistema de humedal que se caracteriza por un terreno bajo, llano y fértil, alimentado por aguas superficiales o subterráneas que afloran a la superficie, inundando el terreno periódicamente como una laguna conectada con el estero Angachilla. Es un gran refugio para patos nativos, cuervos de pantano, garzas, queltehues y martines pescadores.

Junto a la vega se extiende la pradera enriquecida de hierbas, matorrales y flores silvestres nutridas por la conexión hídrica del suelo. Las condiciones de esta gran planicie abierta junto al humedal y en contacto directo con el agua que fluye de la vega dan cuenta de un sitio de valor ceremonial ancestral donde se desarrollan prácticas de encuentro con la naturaleza.`,
    normas: [
      "Mantén a tus mascotas con correa y supervisadas constantemente; por naturaleza son depredadores que afectan aves, polluelos y huevos.",
      "Evita que tu perro persiga o moleste a las aves. Si las aves vuelan o dejan de alimentarse, te has acercado demasiado.",
      "Recoge siempre los desechos de tus mascotas para evitar la contaminación del ecosistema.",
      "No ingreses a áreas de humedales reconocidas para la nidificación de aves."
    ]
  },
  {
    codigo: "E7",
    slug: "placita-de-la-resistencia",
    folder: "PLACITA DE LA RESISTENCIA",
    nombre: "Placita de la Resistencia",
    subtitulo: "Portal de acceso comunitario y memoria de la defensa ciudadana del humedal",
    categoria: "totem_qr",
    codigoQr: "ANG-QR-07",
    soundKey: "siete_colores",
    rutaSlug: "ruta-circuito",
    lat: -39.85695,
    lng: -73.23698,
    orden: 7,
    descripcion: `Punto de bienvenida y encuentro comunitario de la Reserva Comunitaria Bosque Humedal Angachilla. Este espacio conmemora la organización vecinal que detuvo los rellenos sobre el humedal y transformó un sitio amenazado en un área de conservación biocultural autogestionada por la comunidad.`,
    normas: [
      "Respeta la señalética comunitaria y los senderos demarcados.",
      "Deposita tus residuos fuera de la reserva o llévalos de regreso contigo.",
      "Punto de inicio para el Circuito Angachilla y la ruta Bosque Los Canelos."
    ]
  },
  {
    codigo: "E8",
    slug: "auditorio-vivo",
    folder: "AUDITORIO VIVO",
    nombre: "Auditorio Vivo",
    subtitulo: "Aula abierta de educación ambiental, escucha bioacústica y actividades culturales",
    categoria: "totem_qr",
    codigoQr: "ANG-QR-08",
    soundKey: "chucao",
    rutaSlug: "ruta-canelos",
    lat: -39.85745,
    lng: -73.23725,
    orden: 8,
    descripcion: `Espacio anfiteatro integrado de manera armónica en el entorno natural de la reserva, destinado a talleres de educación ambiental, charlas científicas, actividades escolares y jornadas culturales al aire libre en conexión con el paisaje sonoro del humedal.`,
    normas: [
      "Mantener el silencio durante las sesiones de escucha de aves y educación ambiental.",
      "Cuidar las estructuras de madera e infraestructura comunitaria del auditorio."
    ]
  },
  {
    codigo: "E9",
    slug: "espacio-de-reflexion",
    folder: "ESPACIO DE REFLEXIÓN",
    nombre: "Espacio de Reflexión",
    subtitulo: "Rincón contemplativo de bienestar, silencio y conexión con el bosque húmedo",
    categoria: "mirador",
    codigoQr: "ANG-QR-09",
    soundKey: "ranita_darwin",
    rutaSlug: "ruta-canelos",
    lat: -39.85910,
    lng: -73.23695,
    orden: 9,
    descripcion: `Sector de pausa y contemplación rodeado por la vegetación nativa del sur del sendero. Diseñado para promover la salud mental, el descanso consciente y la observación silenciosa de la biodiversidad del bosque humedal.`,
    normas: [
      "Espacio de silencio y contemplación: evita hablar en voz alta o reproducir música.",
      "No salirse del sendero demarcado para proteger las raíces y el musgo del suelo."
    ]
  }
];

// Metadatos enriquecidos para las especies de las estaciones + flora y fungi
export const SPECIES_METADATA = {
  "CACHAÑA": {
    nombreComun: "Cachaña",
    nombreMapudungun: "Chori",
    nombreCientifico: "Enicognathus ferrugineus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Bosques templados de Nothofagus y matorrales altos del humedal.",
    descripcion: "Loro nativo de plumaje verde esmeralda con frente y vientre rojizos y cola marrón rojiza. Suele desplazarse en bandadas bulliciosas entre las copas de los árboles.",
    datoCurioso: "Es el loro que habita más al sur del planeta, llegando hasta Tierra del Fuego."
  },
  "CACHUDITO": {
    nombreComun: "Cachudito Común",
    nombreMapudungun: "Püdu-püdu",
    nombreCientifico: "Anairetes parulus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Matorrales ribereños, quilantales y bordes de bosque húmedo.",
    descripcion: "Pequeña e inquieta ave insectívora reconocida por su característico penacho de plumas negras curvadas hacia adelante sobre la cabeza y sus ojos de iris blanco amarillento.",
    datoCurioso: "Construye un diminuto nido en forma de copa forrado con líquenes y plumas suaves."
  },
  "DIUCON": {
    nombreComun: "Diucón",
    nombreMapudungun: "Diwkon",
    nombreCientifico: "Pyrope pyrope",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Claros de bosque, miradores y bordes de humedal.",
    descripcion: "Ave de dorso gris ceniciento, pecho blanco grisáceo e inconfundibles ojos de color rojo rubí intenso. Se posa en ramas altas desde donde se lanza en vuelo para capturar insectos.",
    datoCurioso: "En invierno sus ojos rojos resaltan entre la neblina matinal de los humedales valdivianos."
  },
  "JOTE CABEZA NEGRA": {
    nombreComun: "Jote de Cabeza Negra",
    nombreMapudungun: "Kelong",
    nombreCientifico: "Coragyps atratus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Sobrevolando las lomas, riberas y árboles altos de la reserva.",
    descripcion: "Ave carroñera de plumaje negro brillante con cabeza desnuda gris oscura y manchas blancas en las puntas de las alas visibles durante el planeo.",
    datoCurioso: "Cumple un rol sanitario esencial limpiando de restos orgánicos los ecosistemas."
  },
  "LOICA": {
    nombreComun: "Loica Común",
    nombreMapudungun: "Loyka",
    nombreCientifico: "Leistes loyca",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Pastizales húmedos, vegas y laderas en restauración del Mirador del Hualve.",
    descripcion: "Ave emblemática de Chile cuyo macho luce un pecho y garganta de color rojo escarlata encendido que contrasta con su dorso pardo estriado y ceja blanca.",
    datoCurioso: "Anida oculta entre el pasto alto de las vegas para proteger a sus polluelos."
  },
  "RARA": {
    nombreComun: "Rara",
    nombreMapudungun: "Rara",
    nombreCientifico: "Phytotoma rara",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Matorrales de maqui, quila y arbustos ribereños.",
    descripcion: "Ave herbívora de ojos rojos brillantes y pico corto con bordes finamente aserrados, adaptado especialmente para cortar brotes, hojas tiernas y frutos.",
    datoCurioso: "Su canto suena similar a una matraca de madera y es única por su dieta folívora."
  },
  "TENCA": {
    nombreComun: "Tenca Chilena",
    nombreMapudungun: "Trengka",
    nombreCientifico: "Mimus thenca",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Laderas arbustivas y matorrales abiertos de la reserva.",
    descripcion: "Ave de plumaje pardo grisáceo con larga cola bordeada de blanco y una notable ceja blanquecina. Es famosa por su extraordinario repertorio vocal.",
    datoCurioso: "Es capaz de imitar a la perfección el canto de decenas de otras especies de aves del humedal."
  },
  "TIUQUE": {
    nombreComun: "Tiuque",
    nombreMapudungun: "Chiwkü",
    nombreCientifico: "Milvago chimango",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Praderas, vegas húmedas y copas de árboles ribereños.",
    descripcion: "Ave rapaz oportunista de plumaje pardo canela muy común en los humedales del sur, donde busca insectos, lombrices y pequeños vertebrados en las orillas.",
    datoCurioso: "Posee una gran inteligencia para resolver problemas y trabajar en grupo."
  },
  "TORDO": {
    nombreComun: "Tordo",
    nombreMapudungun: "Küreü",
    nombreCientifico: "Curaeus curaeus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Bordes de bosque húmedo, quilantales y vegas.",
    descripcion: "Ave de plumaje íntegramente negro azabache con reflejos metálicos azulados y un pico robusto, largo y recto. Su canto es melodioso y potente.",
    datoCurioso: "Se desplaza en grupos familiares que se comunican constantemente entre los árboles."
  },
  "CHURRIN DE LA MOCHA": {
    nombreComun: "Churrín de la Mocha",
    nombreMapudungun: "Chürrin",
    nombreCientifico: "Eugralla paradoxa",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Sotobosque denso de helechos Costilla de Vaca y quilas húmedas.",
    descripcion: "Ave endémica de los bosques templados lluviosos del sur, de cuerpo rechoncho gris pizarra, flancos rojizos y patas amarillas fuertes.",
    datoCurioso: "Rara vez vuela; prefiere correr ágilmente como un pequeño ratón entre las hojas del suelo."
  },
  "COLILARGA": {
    nombreComun: "Colilarga",
    nombreMapudungun: "Mëme",
    nombreCientifico: "Sylviorthorhynchus desmursii",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Matorrales cerrados de quila y sotobosque valdiviano.",
    descripcion: "Diminuta ave parda inconfundible por sus plumas timoneras filamentosas que miden más del doble de la longitud de su propio cuerpo.",
    datoCurioso: "Sus plumas de la cola parecen delicadas hebras de encaje que le ayudan a equilibrarse entre las cañas."
  },
  "GOLONDRINA Torso Negro": {
    nombreComun: "Golondrina de Dorso Negro",
    nombreMapudungun: "Pilmaikén",
    nombreCientifico: "Pygochelidon cyanoleuca",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Sobrevolando lagunas, espejos de agua y praderas del humedal.",
    descripcion: "Golondrina acrobática de dorso azul negruzco metálico y pecho blanco, con subcaudales negras. Captura insectos al vuelo rasante sobre el agua.",
    datoCurioso: "Sus vuelos rasantes sobre la laguna ayudan a controlar naturalmente las poblaciones de zancudos."
  },
  "JOTE CABEZA COLORADA": {
    nombreComun: "Jote de Cabeza Colorada",
    nombreMapudungun: "Kanin",
    nombreCientifico: "Cathartes aura",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Corrientes térmicas sobre el bosque y humedal.",
    descripcion: "Gran planeador de alas anchas bicolores y cabeza roja desnuda. Planea en círculos con las alas ligeramente alzadas en forma de V.",
    datoCurioso: "Posee uno de los sentidos del olfato más desarrollados de todas las aves del mundo."
  },
  "PICAFLOR CHICO": {
    nombreComun: "Picaflor Chico",
    nombreMapudungun: "Pinda",
    nombreCientifico: "Sephanoides sephaniodes",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Bosques de notro, chilco, copihue y jardines nativos del humedal.",
    descripcion: "Pequeño colibrí de dorso verde bronceado brillante; el macho ostenta una corona iridiscente rojo-anaranjada encendida como fuego.",
    datoCurioso: "Es el polinizador clave del bosque valdiviano, visitando flores de notro, copihue y quintral incluso en invierno."
  },
  "RANA CHILENA ": {
    nombreComun: "Rana Grande Chilena",
    nombreMapudungun: "Lloko / Kо-pakarwa",
    nombreCientifico: "Calyptocephalella gayi",
    reino: "Fauna",
    grupo: "Anfibios",
    categoria: "anfibio",
    estado: "Vulnerable",
    habitat: "Laguna de los Pinos y cuerpos de agua permanentes con abundante vegetación acuática.",
    descripcion: "El anfibio más grande y endémico de Chile, considerado un auténtico fósil viviente que ha habitado estos humedales desde la época de los dinosaurios.",
    datoCurioso: "Sus renacuajos gigantes pueden superar los 15 cm y prefieren aguas frescas y bien oxigenadas.",
    soundKey: "ranita_darwin"
  },
  "SAPITO DE Antifaz": {
    nombreComun: "Rana de Antifaz",
    nombreMapudungun: "Pakarwa",
    nombreCientifico: "Batrachyla taeniata",
    reino: "Fauna",
    grupo: "Anfibios",
    categoria: "anfibio",
    estado: "Preocupación Menor",
    habitat: "Hojarasca húmeda, troncos caídos y bordes de la Laguna de los Pinos.",
    descripcion: "Esbelto anfibio del bosque templado caracterizado por una banda oscura a modo de antifaz que cruza desde el hocico a través del ojo hasta el hombro.",
    datoCurioso: "Deposita sus huevos en tierra húmeda a fines de verano, y las lluvias de otoño arrastran las larvas al agua.",
    soundKey: "ranita_darwin"
  },
  "SAPITO DE CUATROJOS": {
    nombreComun: "Sapito de Cuatro Ojos",
    nombreMapudungun: "Meli-nge",
    nombreCientifico: "Pleurodema thaul",
    reino: "Fauna",
    grupo: "Anfibios",
    categoria: "anfibio",
    estado: "Preocupación Menor",
    habitat: "Lagunas estacionarias, vegas inundadas y riberas húmedas.",
    descripcion: "Anfibio nativo que presenta dos glándulas lumbares prominentes con manchas oscuras que asemejan un gran par de ojos en su parte posterior.",
    datoCurioso: "Cuando se siente amenazado, infla su cuerpo y levanta la cadera para mostrar sus 'ojos falsos' y ahuyentar depredadores.",
    soundKey: "ranita_darwin"
  },
  "CAHUIL": {
    nombreComun: "Gaviota Cáhuil",
    nombreMapudungun: "Kawüll",
    nombreCientifico: "Chroicocephalus maculipennis",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Espejos de agua abiertos, juncales y riberas del humedal.",
    descripcion: "Gaviota esbelta de pico y patas rojas oscuras; en época reproductiva luce una elegante capucha café chocolate oscura en la cabeza.",
    datoCurioso: "Nidifica en colonias flotantes construidas sobre los pajonales de totora del humedal."
  },
  "CHOROY": {
    nombreComun: "Choroy",
    nombreMapudungun: "Choroy",
    nombreCientifico: "Enicognathus leptorhynchus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Bosques altos de pellín, coigüe y canelo que rodean el espejo de agua.",
    descripcion: "Loro endémico del sur de Chile, distinguible de la cachaña por su mandíbula superior notablemente alargada y fina y su banda frontal roja.",
    datoCurioso: "Su largo pico está especializado para extraer semillas de araucarias y frutos del bosque nativo."
  },
  "CISNE DE CUELLO NEGRO": {
    nombreComun: "Cisne de Cuello Negro",
    nombreMapudungun: "Wañke",
    nombreCientifico: "Cygnus melancoryphus",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Vulnerable",
    habitat: "Espejo de agua del Angachilla y canales con luchecillo sumergido.",
    descripcion: "Ave acuática emblemática de Valdivia, de plumaje blanco puro con cuello y cabeza negros aterciopelados y una carúncula roja brillante sobre el pico.",
    datoCurioso: "Los padres transportan a sus pichones recién nacidos sobre el lomo entre sus alas mientras nadan por la laguna.",
    soundKey: "cisne",
    soundLabel: "Silbido resonante"
  },
  "GARZA CHICA": {
    nombreComun: "Garza Chica",
    nombreMapudungun: "Pichi Pillu",
    nombreCientifico: "Egretta thula",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Orillas someras del Espejo del Angachilla y Vega de la Garza.",
    descripcion: "Delicada garza de plumaje blanco inmaculado, pico negro, patas negras y llamativos dedos de color amarillo brillante.",
    datoCurioso: "Agita sus patas amarillas en el barro bajo el agua para hacer salir a pequeños peces y camarones."
  },
  "GARZA CUCA": {
    nombreComun: "Garza Cuca",
    nombreMapudungun: "Kuka",
    nombreCientifico: "Ardea cocoi",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Espejo del Angachilla y riberas tranquilas rodeadas de totorales.",
    descripcion: "La garza de mayor tamaño en Chile, con hasta 1,3 metros de envergadura alar, dorso gris azulado, cuello blanco estriado y elegante penacho negro.",
    datoCurioso: "Permanece completamente inmóvil como una estatua durante largos minutos antes de pescar con precisión relámpago.",
    soundKey: "garza_cuca",
    soundLabel: "Graznido profundo"
  },
  "PATO JERGON CHICO": {
    nombreComun: "Pato Jergón Chico",
    nombreMapudungun: "Këchü",
    nombreCientifico: "Anas flavirostris",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Lagunas, vegas inundadas y canales calmos del humedal.",
    descripcion: "Pequeño pato nativo de cabeza oscura finamente moteada y pico amarillo brillante con una franja central negra.",
    datoCurioso: "A diferencia de otros patos, a menudo utiliza nidos abandonados en árboles cercanos al agua."
  },
  "PATO REAL": {
    nombreComun: "Pato Real",
    nombreMapudungun: "Wala-pato",
    nombreCientifico: "Mareca sibilatrix",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Espejos de agua abiertos y praderas húmedas ribereñas.",
    descripcion: "Uno de los patos más vistosos de Chile: frente y mejillas blancas, nuca con reflejos verde-azulados metálicos iridiscentes y flancos color canela.",
    datoCurioso: "Emite un característico silbido claro mientras vuela en pareja sobre el espejo de agua."
  },
  "PIMPOLLO": {
    nombreComun: "Pimpollo Común",
    nombreMapudungun: "Pimpollo",
    nombreCientifico: "Rollandia rolland",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Aguas calmas con vegetación flotante en el Espejo del Angachilla.",
    descripcion: "Zambullidor nativo de ojos rojos intensos y penachos auriculares blancos y negros en las mejillas que contrastan con su cuerpo castaño.",
    datoCurioso: "Puede sumergirse sin dejar apenas ondas en el agua para escapar del peligro."
  },
  "TAGUA": {
    nombreComun: "Tagua Común",
    nombreMapudungun: "Trawa",
    nombreCientifico: "Fulica armillata",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Espejo del Angachilla y bordes de totorales.",
    descripcion: "Ave acuática de plumaje gris pizarra negruzco, pico amarillo con mancha roja basal y grandes patas lobuladas amarillas con liga roja.",
    datoCurioso: "Para levantar vuelo corre vigorosamente chapoteando varios metros sobre la superficie del agua.",
    soundKey: "tagua",
    soundLabel: "Canto de tagua"
  },
  "YECO": {
    nombreComun: "Cormorán Yeco",
    nombreMapudungun: "Yeku",
    nombreCientifico: "Nannopterum brasilianum",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Troncos emergentes y riberas del Espejo del Angachilla.",
    descripcion: "Ave buceadora de plumaje negro lustroso y pico ganchudo. Es habitual observarlo posado sobre troncos con las alas completamente extendidas al sol.",
    datoCurioso: "Sus plumas no son impermeables, lo que le permite sumergirse a gran profundidad sin flotar, debiendo secar sus alas al salir."
  },
  "BECAZINA": {
    nombreComun: "Becasina Común",
    nombreMapudungun: "Këdañ",
    nombreCientifico: "Gallinago paraguaiae",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Pajonales inundados, totorales y vegas barrosas.",
    descripcion: "Ave limícola de plumaje críptico listado que la hace casi invisible entre los juncos, dotada de un larguísimo pico recto y sensible.",
    datoCurioso: "Durante sus vuelos nupciales abre las plumas externas de la cola produciendo un zumbido vibrante en el aire."
  },
  "CHERCAN DE LAS VEGAS": {
    nombreComun: "Chercán de las Vegas",
    nombreMapudungun: "Chüdüf",
    nombreCientifico: "Cistothorus platensis",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Pajonales húmedos, cortaderas y totorales de la Estación 4.",
    descripcion: "Pequeño chercán de dorso finamente listado en blanco y negro y cola siempre erguida, especialista de los pajonales de humedal.",
    datoCurioso: "El macho construye varios nidos esféricos entre los juncos para que la hembra elija el más seguro."
  },
  "CHIRIHUE": {
    nombreComun: "Chirihue Común",
    nombreMapudungun: "Chiriwe",
    nombreCientifico: "Sicalis luteola",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Praderas húmedas y bordes del totoral.",
    descripcion: "Pequeña ave granívora de pecho y vientre amarillo intenso y dorso oliváceo estriado que forma bandadas alegres en las vegas.",
    datoCurioso: "En primavera los machos cantan mientras descienden planeando lentamente hacia el pastizal."
  },
  "GOLONDRINA CHILENA": {
    nombreComun: "Golondrina Chilena",
    nombreMapudungun: "Pilmaikén",
    nombreCientifico: "Tachycineta leucopyga",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Espejos de agua, totorales y bosque inundado.",
    descripcion: "Reconocible por su dorso azul metálico brillante y una inconfundible rabadilla blanca pura sobre la cola que resalta en pleno vuelo.",
    datoCurioso: "Anida en cavidades naturales de los troncos antiguos de pitras y canelos del humedal."
  },
  "PIDEN": {
    nombreComun: "Pidén Común",
    nombreMapudungun: "Piden",
    nombreCientifico: "Pardirallus sanguinolentus",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Totorales densos, batros y canales someros.",
    descripcion: "Rálido caminador de cuerpo comprimido lateralmente para deslizarse entre los juncos, con largo pico tricolor (azul, rojo en la base y verde en la punta) y patas rojas.",
    datoCurioso: "Su potente grito resonante al atardecer es uno de los sonidos más característicos de los humedales del sur."
  },
  "RUN RUN": {
    nombreComun: "Run-Run",
    nombreMapudungun: "Run-run",
    nombreCientifico: "Hymenops perspicillatus",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Juncales, totorales y vegas húmedas.",
    descripcion: "El macho es negro azabache con grandes parches blancos en las alas y una llamativa carúncula carnosa amarilla alrededor del ojo; la hembra es parda estriada.",
    datoCurioso: "Recibe su nombre por el sonido que producen sus alas durante sus vuelos verticales de exhibición."
  },
  "SIETECOLORES": {
    nombreComun: "Siete Colores",
    nombreMapudungun: "Trarü-pülli / Makitro",
    nombreCientifico: "Tachuris rubrigastra",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Exclusivo de los totorales y juncales del humedal.",
    descripcion: "Joya viviente de los humedales: combina negro, rojo rubí, azul, verde esmeralda, amarillo intenso, blanco y canela en apenas 11 cm de longitud.",
    datoCurioso: "Su supervivencia depende 100% de la conservación de la totora, donde ata su nido en forma de cono.",
    soundKey: "siete_colores",
    soundLabel: "Canto del totoral"
  },
  "TIJERAL": {
    nombreComun: "Tijeral Común",
    nombreMapudungun: "Chijeral",
    nombreCientifico: "Leptasthenura aegithaloides",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Arbustos de calafate, maqui y bordes del totoral.",
    descripcion: "Pequeña e inquieta ave acrobática con cresta despeinada y larga cola escalonada terminada en dos puntas finas como una tijera.",
    datoCurioso: "Recorre incansablemente las ramas cabeza abajo buscando pequeños insectos en la corteza."
  },
  "TRABAJADOR": {
    nombreComun: "Trabajador",
    nombreMapudungun: "Kütrankülen",
    nombreCientifico: "Phleocryptes melanops",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Pajonales de totora y junco sobre aguas someras.",
    descripcion: "Ave palustre de dorso listado y ceja blanquecina que trabaja sin descanso entre los tallos de totora.",
    datoCurioso: "Construye un nido esférico cerrado con barro y fibras vegetales, provisto de un pequeño alero sobre la entrada para protegerlo de la lluvia."
  },
  "TRILE": {
    nombreComun: "Trile",
    nombreMapudungun: "Trili",
    nombreCientifico: "Agelasticus thilius",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Totorales, batros y juncales inundados.",
    descripcion: "Ave icterida íntimamente ligada al humedal; el macho es negro brillante con llamativas charreteras de color amarillo oro en los hombros.",
    datoCurioso: "Anida en colonias entre las totoras y defiende valientemente el pajonal ante la presencia de rapaces."
  },
  "CAMARON": {
    nombreComun: "Camarón de Vega (Camarón de Hualve)",
    nombreMapudungun: "Tükukan",
    nombreCientifico: "Parastacus nicoleti",
    reino: "Fauna",
    grupo: "Crustáceos",
    categoria: "anfibio",
    estado: "Vulnerable",
    habitat: "Suelos saturados de agua del Bosque Los Canelos y hualves.",
    descripcion: "Crustáceo excavador endémico del sur de Chile que construye complejas redes de galerías subterráneas conectadas con el nivel freático del humedal.",
    datoCurioso: "En periodos de inundación levanta conos truncados de barro llamados 'chimeneas' que oxigenan el suelo del bosque."
  },
  "CHUNCHO": {
    nombreComun: "Chuncho Austral",
    nombreMapudungun: "Kilkil",
    nombreCientifico: "Glaucidium nana",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Interior del Bosque Los Canelos y arboledas nativas.",
    descripcion: "Pequeño búho rapaz activo tanto de día como de noche, de mirada penetrante amarilla y dos manchas oscuras en la nuca que simulan ojos adicionales.",
    datoCurioso: "A pesar de su pequeño tamaño es un cazador formidable que habita las cavidades de los árboles añosos."
  },
  "COMETOCINO": {
    nombreComun: "Cometocino Patagónico",
    nombreMapudungun: "Chayka",
    nombreCientifico: "Phrygilus patagonicus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Bosque Los Canelos, notros y matorrales húmedos.",
    descripcion: "Hermoso paseriforme del bosque austral con capucha gris azulada, dorso canela anaranjado brillante y pecho amarillo verdoso.",
    datoCurioso: "Se alimenta de semillas, frutos nativos y néctar en los bosques lluviosos valdivianos."
  },
  "FIOFIO": {
    nombreComun: "Fío-Fío",
    nombreMapudungun: "Fiw-fiw",
    nombreCientifico: "Elaenia albiceps",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Copas de canelos, arrayanes y arbustos frutales de la reserva.",
    descripcion: "Visitante primaveral-estival de plumaje oliváceo con dos bandas alares blancas y una corona oculta de plumas blancas que eriza al cantar.",
    datoCurioso: "Realiza una increíble migración anual de miles de kilómetros desde la Amazonía hasta los bosques de Valdivia."
  },
  "JILGUERO": {
    nombreComun: "Jilguero Austral",
    nombreMapudungun: "Chiwü",
    nombreCientifico: "Spinus barbatus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Arboledas nativas y claros de bosque de la reserva.",
    descripcion: "Pequeña ave cantora de plumaje amarillo verdoso brillante, con corona y garganta negras en el macho y bandas amarillas en las alas.",
    datoCurioso: "Su trino musical cristalino llena de vida el dosel del Bosque Los Canelos."
  },
  "PITIO-Photoroom": {
    nombreComun: "Pitío Austral",
    nombreMapudungun: "Pütiw",
    nombreCientifico: "Colaptes pitius",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Troncos añosos y claros del Bosque Los Canelos.",
    descripcion: "Carpintero nativo de plumaje barrado en pardo y crema, rabadilla blanca y ojos amarillos. Emite un fuerte grito 'pitío-pitío' al volar.",
    datoCurioso: "A diferencia de otros carpinteros, suele bajar al suelo húmedo para buscar larvas de insectos y hormigas."
  },
  "TORCAZA": {
    nombreComun: "Torcaza",
    nombreMapudungun: "Kono",
    nombreCientifico: "Patagioenas araucana",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Dosel alto de canelos, laureles, pitras y arrayanes.",
    descripcion: "La paloma nativa más grande de los bosques del sur, de plumaje castaño vinoso con una franja blanca y verde broncíneo brillante en la nuca.",
    datoCurioso: "Su canto profundo y grave ('cu-cu-cu') resuena desde lo alto de los canelos y ayuda a dispersar semillas de árboles nativos."
  },
  "VIUDITA": {
    nombreComun: "Viudita",
    nombreMapudungun: "Chiñura",
    nombreCientifico: "Colorhamphus parvirostris",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Sotobosque sombrío y húmedo del Bosque Los Canelos.",
    descripcion: "Pequeño cazamoscas del bosque valdiviano de cabeza gris, dorso pardo y dos marcadas bandas alares de color canela rojizo.",
    datoCurioso: "Su silbido melancólico de una sola nota anuncia los días de lluvia en el bosque húmedo."
  },
  "ZORZAL": {
    nombreComun: "Zorzal Patagónico",
    nombreMapudungun: "Wilki",
    nombreCientifico: "Turdus falcklandii",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Suelo húmedo del bosque, praderas y riberas de la reserva.",
    descripcion: "Ave muy conocida en el sur por su pecho ocre, garganta estriada y pico y patas de color amarillo anaranjado intenso.",
    datoCurioso: "Camina dando pequeños saltitos y deteniéndose con la cabeza inclinada para escuchar el movimiento de las lombrices bajo tierra."
  },
  "BANDURRIA": {
    nombreComun: "Bandurria Común",
    nombreMapudungun: "Raki",
    nombreCientifico: "Theristicus melanopis",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Vega de la Garza, praderas húmedas y árboles altos de descanso.",
    descripcion: "Ave emblemática de Valdivia de gran tamaño, cuello ocre amarillento, alas grises y un largo pico negro curvado hacia abajo.",
    datoCurioso: "Sus potentes trompeteos matinales al volar en bandada forman parte de la identidad sonora de Valdivia."
  },
  "CUERVO DE PANTANO": {
    nombreComun: "Cuervo de Pantano Común",
    nombreMapudungun: "Kuervo",
    nombreCientifico: "Plegadis chihi",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Vegas inundadas y aguas someras de la Estación 6.",
    descripcion: "Ibis de largo pico curvo cuyo plumaje oscuro castaño rojizo brilla con intensos reflejos metálicos verdes y púrpuras bajo la luz del sol.",
    datoCurioso: "Sondea el barro blando de la vega con la punta sensible de su pico curvo para encontrar pequeños invertebrados."
  },
  "GARZA GRANDE": {
    nombreComun: "Garza Grande",
    nombreMapudungun: "Fütra Pillu",
    nombreCientifico: "Ardea alba",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Vega de la Garza y Espejo del Angachilla.",
    descripcion: "Gran garza de plumaje completamente blanco, cuello largo en forma de S, pico amarillo anaranjado y largas patas negras.",
    datoCurioso: "Durante la época reproductiva desarrolla delicadas plumas filamentosas llamadas egretas sobre su dorso."
  },
  "JERGON GRANDE": {
    nombreComun: "Pato Jergón Grande",
    nombreMapudungun: "Üwala",
    nombreCientifico: "Anas georgica",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Vega de la Garza y espejo de agua abierto.",
    descripcion: "Pato nativo de cuello largo, cola aguda y pico amarillo vivo con culmen negro; de mayor tamaño y cuello más estilizado que el jergón chico.",
    datoCurioso: "Se alimenta filtrando semillas de plantas acuáticas sumergidas la cabeza en aguas someras."
  },
  "MARTIN PESCADOR": {
    nombreComun: "Martín Pescador",
    nombreMapudungun: "Ketro /Chollcholl",
    nombreCientifico: "Megaceryle torquata",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Ramas ribereñas sobre el estero Angachilla y Vega de la Garza.",
    descripcion: "El martín pescador más grande de Sudamérica, con cresta despeinada azul grisácea, collar blanco, pecho rufo intenso y fuerte pico recto.",
    datoCurioso: "Se lanza en picada desde ramas altas sobre el agua emitiendo su inconfundible canto de matraca.",
    soundKey: "martin_pescador",
    soundLabel: "Matraca ribereña"
  },
  "PATO CAPUCHINO": {
    nombreComun: "Pato Capuchino",
    nombreMapudungun: "Pato",
    nombreCientifico: "Spatula versicolor",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Lagunas tranquilas con vegetación palustre en la Vega de la Garza.",
    descripcion: "Hermoso y pequeño pato con una capucha negra que llega hasta debajo de los ojos, mejillas ocres y un pico celeste azulado con base amarilla.",
    datoCurioso: "Es una especie tranquila y confiada que suele nadar en parejas entre los juncos de la vega."
  },
  "PATO COLORADO": {
    nombreComun: "Pato Colorado",
    nombreMapudungun: "Kelü-pato",
    nombreCientifico: "Spatula cyanoptera",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Aguas someras y vegas inundadas de la Estación 6.",
    descripcion: "El macho destaca por su intenso plumaje rojo canela caoba, ojos rojos y parches celestes en las alas visibles al volar.",
    datoCurioso: "Filtra el agua superficial con las laminillas de su pico negro espatulado."
  },
  "PICURIO": {
    nombreComun: "Picurio",
    nombreMapudungun: "Pikuriw",
    nombreCientifico: "Podilymbus podiceps",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Espejo del Angachilla y lagunas con totorales.",
    descripcion: "Zambullidor robusto de plumaje pardo que en época reproductiva presenta garganta negra y un anillo negro vertical alrededor de su grueso pico claro.",
    datoCurioso: "Puede regular su flotabilidad comprimiendo sus plumas para dejar sólo los ojos y el pico fuera del agua como un submarino."
  },
  "PITOTOY CHICO": {
    nombreComun: "Pitotoy Chico",
    nombreMapudungun: "Pitotoy",
    nombreCientifico: "Tringa flavipes",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Orillas barrosas y aguas someras de la Vega de la Garza.",
    descripcion: "Ave limícola migratoria de cuerpo esbelto gris moteado y largas patas de color amarillo brillante.",
    datoCurioso: "Viaja cada año desde los humedales boreales de Norteamérica hasta el Humedal Angachilla."
  },
  "QUELTEHUE": {
    nombreComun: "Queltehue Común (Treile)",
    nombreMapudungun: "Tregül",
    nombreCientifico: "Vanellus chilensis",
    reino: "Fauna",
    grupo: "Aves acuáticas",
    categoria: "ave_acuatica",
    estado: "Preocupación Menor",
    habitat: "Praderas húmedas y Vega de la Garza.",
    descripcion: "Ave centinela de las vegas del sur, con pecho negro, penacho occipital, ojos rojos rubí y espolones córneos rosados en los dobleces de las alas.",
    datoCurioso: "En la cosmovisión mapuche su canto grupal anuncia lluvias o la llegada de visitantes al territorio."
  },
  "TRARO": {
    nombreComun: "Traro (Carancho Común)",
    nombreMapudungun: "Traru",
    nombreCientifico: "Caracara plancus",
    reino: "Fauna",
    grupo: "Aves de bosque y matorral",
    categoria: "ave_bosque",
    estado: "Preocupación Menor",
    habitat: "Vegas abiertas, praderas y copas altas de la reserva.",
    descripcion: "Imponente rapaz de corona negra, cuello blanco barrado y cera facial anaranjada rojiza que cambia de intensidad según su estado de alerta.",
    datoCurioso: "Camina con porte majestuoso por las vegas gracias a sus largas patas amarillas."
  }
};

// Especies de Flora y Fauna adicionales listadas explícitamente en TEXTO S 1.odt .. TEXTO S 6.odt (usando imágenes del sendero/estaciones)
export const EXTRA_SPECIES_LIST = [
  {
    slug: "sp-coipo",
    nombreComun: "Coipo",
    nombreMapudungun: "Koypu",
    nombreCientifico: "Myocastor coypus",
    reino: "Fauna",
    grupo: "Mamíferos",
    categoria: "mamifero",
    estado: "Preocupación Menor",
    habitat: "Espejo del Angachilla, canales con totorales y riberas húmedas (Estación 3).",
    descripcion: "Roedor nativo semiacuático mencionado en la Estación 3 (Mirador Espejo del Angachilla). Se alimenta de plantas acuáticas y contribuye de forma natural al control de la biomasa vegetal y mantención del espejo de agua.",
    datoCurioso: "Sus madrigueras se ubican en las riberas protegidas por totorales y juncos del humedal.",
    soundKey: "coipo",
    soundLabel: "Chapoteo en el espejo de agua",
    mediaSlug: "estacion-s3-foto-1",
    stations: ["S3", "S4"]
  },
  {
    slug: "sp-canelo",
    nombreComun: "Canelo",
    nombreMapudungun: "Füye / Boighe",
    nombreCientifico: "Drimys winteri",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Bosque Los Canelos (Estación 5), donde alcanza hasta 30 metros de altura en suelos húmedos.",
    descripcion: "Árbol sagrado del pueblo Mapuche. Captura subterráneamente el agua de las lluvias para limpiarla y enviarla al humedal Angachilla, aumentando su tasa de fotosíntesis en condiciones de inundación.",
    datoCurioso: "Junto al arrayán, temu y pitra, combate las inundaciones del cambio climático y aporta gran cantidad de oxígeno.",
    mediaSlug: "estacion-s5-foto-1",
    stations: ["S5", "E8", "E9"]
  },
  {
    slug: "sp-pitra",
    nombreComun: "Pitra",
    nombreMapudungun: "Pëtüra",
    nombreCientifico: "Myrceugenia exsucca",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Suelos permanentemente inundados del Mirador del Hualve (S1) y Bosque Los Canelos (S5).",
    descripcion: "Árbol nativo de hualve que se destaca por su tronco con grandes rugosidades y raíces adaptadas a suelos permanentemente saturados de agua.",
    datoCurioso: "En condiciones de inundación incrementa su fotosíntesis, actuando como esponja hídrica natural de Valdivia.",
    mediaSlug: "estacion-s5-foto-2",
    stations: ["S1", "S5"]
  },
  {
    slug: "sp-arrayan",
    nombreComun: "Arrayán",
    nombreMapudungun: "Kolü-mamüll / Quetri",
    nombreCientifico: "Luma apiculata",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Bosque Los Canelos (Estación 5) y riberas húmedas del santuario.",
    descripcion: "Árbol siempreverde de corteza lisa color canela-anaranjado con manchas blancas, flores blancas aromáticas y frutos negros comestibles.",
    datoCurioso: "Comparte el bosque inundable con el canelo, el temu y la pitra, aumentando su tasa fotosintética bajo inundación.",
    mediaSlug: "estacion-s5-foto-1",
    stations: ["S1", "S5", "E8"]
  },
  {
    slug: "sp-temu",
    nombreComun: "Temu",
    nombreMapudungun: "Temu",
    nombreCientifico: "Blepharocalyx cruckshanksii",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Bosques pantanosos (hualves) de la Estación 5: Bosque Los Canelos.",
    descripcion: "Árbol higrófilo endémico de Chile reconocible por su tronco liso de tono anaranjado rojizo que habita suelos anegados.",
    datoCurioso: "Forma parte de la asociación vegetal Temu-Pitra característica de los hualves valdivianos.",
    mediaSlug: "estacion-s5-foto-2",
    stations: ["S1", "S5"]
  },
  {
    slug: "sp-chequen",
    nombreComun: "Chequén",
    nombreMapudungun: "Cheken",
    nombreCientifico: "Luma chequen",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Pantano de hualve visible desde la Estación 1: Mirador del Hualve.",
    descripcion: "Mirtácea nativa de hojas pequeñas aromáticas que crece arraigada al fondo del agua en el pantano del Mirador del Hualve.",
    datoCurioso: "El grupo de chequenes del pantano de la Estación 1 ha permanecido casi sin invasión humana, sirviendo de refugio a la fauna silvestre.",
    mediaSlug: "estacion-s1-foto-1",
    stations: ["S1"]
  },
  {
    slug: "sp-notro",
    nombreComun: "Notro Chileno",
    nombreMapudungun: "Notru",
    nombreCientifico: "Embothrium coccineum",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Lomas en restauración de la Estación 1: Mirador del Hualve.",
    descripcion: "Árbol nativo pionero de intensa floración roja escarlata en primavera que coloniza y estabiliza suelos alterados.",
    datoCurioso: "Junto al maqui es una de las primeras especies en regenerar las laderas afectadas por antiguos rellenos.",
    mediaSlug: "estacion-s1-foto-2",
    stations: ["S1", "E7"]
  },
  {
    slug: "sp-maqui",
    nombreComun: "Maqui",
    nombreMapudungun: "Maki / Külón",
    nombreCientifico: "Aristotelia chilensis",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Laderas del Mirador del Hualve (S1) y bordes de sendero.",
    descripcion: "Árbol sagrado mapuche de rápido crecimiento cuyos frutos violáceos de verano alimentan a decenas de aves del bosque humedal.",
    datoCurioso: "Actúa como especie restauradora pionera estabilizando suelos degradados.",
    mediaSlug: "estacion-s1-foto-3",
    stations: ["S1", "S3", "E7"]
  },
  {
    slug: "sp-laurel",
    nombreComun: "Laurel",
    nombreMapudungun: "Triwe",
    nombreCientifico: "Laurelia sempervirens",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Casi Amenazada",
    habitat: "Zonas altas del Mirador del Hualve (Estación 1).",
    descripcion: "Árbol nativo siempreverde de follaje intensamente aromático cuyos ejemplares antiguos sobrevivieron a la deforestación y expansión urbana.",
    datoCurioso: "Sus hojas desprenden una fragancia especiada única cuando son acariciadas por el viento o la lluvia.",
    mediaSlug: "estacion-s1-foto-4",
    stations: ["S1", "S5"]
  },
  {
    slug: "sp-quila",
    nombreComun: "Quila",
    nombreMapudungun: "Küla",
    nombreCientifico: "Chusquea quila",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Bordes de bosque y laderas del Mirador del Hualve (Estación 1).",
    descripcion: "Bambú nativo trepador y ramificado que forma densos quilantales donde anidan y se refugian aves como el Churrín de la Mocha, la Colilarga y el Chercán.",
    datoCurioso: "Sus cañas flexibles protegen las laderas de la erosión provocada por las lluvias invernales.",
    mediaSlug: "estacion-s1-foto-2",
    stations: ["S1", "S2"]
  },
  {
    slug: "sp-costilla-de-vaca",
    nombreComun: "Costilla de Vaca",
    nombreMapudungun: "Külküll",
    nombreCientifico: "Blechnum chilense",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Línea limítrofe entre el pajonal y el bosque en la Estación 2: Laguna de los Pinos.",
    descripcion: "Gran helecho nativo de frondas coriáceas dentadas y brotes nuevos enrollados en espiral que protege el desplazamiento de aves de sotobosque en las riberas húmedas.",
    datoCurioso: "Sus brotes jóvenes en espiral despliegan una geometría natural característica de la ribera de la Laguna de los Pinos.",
    mediaSlug: "estacion-s2-foto-1",
    stations: ["S2", "S5", "E9"]
  },
  {
    slug: "sp-maiten",
    nombreComun: "Maitén",
    nombreMapudungun: "Mayten",
    nombreCientifico: "Maytenus boaria",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Lomajes y riberas de la Estación 2: Laguna de los Pinos.",
    descripcion: "Árbol nativo siempreverde de ramas finas y colgantes que aporta sombra y semillas a las aves del bosque y matorral.",
    datoCurioso: "Sus pequeñas semillas envueltas en un arilo rojizo son muy apetecidas por fío-fíos, diucones y tencas.",
    mediaSlug: "estacion-s2-foto-1",
    stations: ["S2"]
  },
  {
    slug: "sp-murta",
    nombreComun: "Murta",
    nombreMapudungun: "Üñi",
    nombreCientifico: "Ugni molinae",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Bordes de sendero en la Estación 2: Laguna de los Pinos.",
    descripcion: "Arbusto nativo siempreverde de flores acampanadas rosadas y bayas rojas intensamente aromáticas.",
    datoCurioso: "Sus frutos otoñales alimentan a numerosas aves frugívoras del santuario.",
    mediaSlug: "estacion-s2-foto-1",
    stations: ["S2"]
  },
  {
    slug: "sp-hualle-roble",
    nombreComun: "Hualle (Roble)",
    nombreMapudungun: "Koyam / Walle",
    nombreCientifico: "Nothofagus obliqua",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Estación 2 (Laguna de los Pinos) y Estación 3 (Mirador Espejo del Angachilla).",
    descripcion: "Gran árbol caducifolio nativo que domina las terrazas altas del humedal y ofrece posaderos elevados a rapaces y aves de bosque.",
    datoCurioso: "Los ejemplares jóvenes se denominan 'hualle' y los árboles antiguos de madera rojiza dura se llaman 'pellín'.",
    mediaSlug: "estacion-s3-foto-1",
    stations: ["S1", "S2", "S3"]
  },
  {
    slug: "sp-calafate",
    nombreComun: "Calafate",
    nombreMapudungun: "Mëchay",
    nombreCientifico: "Berberis microphylla",
    reino: "Flora",
    grupo: "Árboles y arbustos",
    categoria: "arbol_arbusto",
    estado: "Preocupación Menor",
    habitat: "Orillas del pajonal en la Estación 4: Totoral del Santuario.",
    descripcion: "Arbusto espinoso nativo de flores amarillas y bayas azul-negruzcas que ofrece refugio seguro a pequeñas aves.",
    datoCurioso: "En la Estación 4 conforma un cordón protector natural junto al totoral.",
    mediaSlug: "estacion-s4-foto-1",
    stations: ["S4", "S6"]
  },
  {
    slug: "sp-totora",
    nombreComun: "Totora",
    nombreMapudungun: "Tromün",
    nombreCientifico: "Schoenoplectus californicus",
    reino: "Flora",
    grupo: "Plantas acuáticas y trepadoras",
    categoria: "planta_acuatica",
    estado: "Preocupación Menor",
    habitat: "Totoral del Santuario (Estación 4) y orillas del Espejo del Angachilla (Estación 3).",
    descripcion: "Planta acuática palustre que vive con sus raíces arraigadas al suelo inundado mientras sus tallos, hojas y flores sobresalen por encima del agua, filtrando contaminantes y protegiendo la fauna.",
    datoCurioso: "Sus tallos sostienen los nidos colgantes tejidos por el Siete Colores y el Trabajador.",
    mediaSlug: "estacion-s4-foto-1",
    stations: ["S3", "S4", "S6"]
  },
  {
    slug: "sp-batro-cortadera",
    nombreComun: "Batro, Cortadera y Junquillo",
    nombreMapudungun: "Vatro / Katrüna",
    nombreCientifico: "Typha angustifolia / Cyperus eragrostis / Juncus procerus",
    reino: "Flora",
    grupo: "Plantas acuáticas y trepadoras",
    categoria: "planta_acuatica",
    estado: "Preocupación Menor",
    habitat: "Pajonal palustre de la Estación 4 (Totoral del Santuario) y Estación 6 (Vega de la Garza).",
    descripcion: "Comunidad de macrófitas palustres emergentes (batros, cortaderas y junquillos) que depuran las aguas del estero y amortiguan las crecidas invernales.",
    datoCurioso: "Sus raíces sumergidas oxigenan el sedimento y retienen el exceso de nutrientes urbanos.",
    mediaSlug: "estacion-s4-foto-2",
    stations: ["S2", "S4", "S6"]
  },
  {
    slug: "sp-voqui-blanco",
    nombreComun: "Voqui Blanco",
    nombreMapudungun: "Foki",
    nombreCientifico: "Boquila trifoliolata",
    reino: "Flora",
    grupo: "Plantas acuáticas y trepadoras",
    categoria: "planta_acuatica",
    estado: "Preocupación Menor",
    habitat: "Bosque Los Canelos (Estación 5), trepando sobre canelos, arrayanes y pitras.",
    descripcion: "Enredadera leñosa endémica llamada también 'planta camaleón' en la Estación 5, célebre por su capacidad única de imitar las hojas de los árboles sobre los que trepa.",
    datoCurioso: "Es capaz de imitar la forma, tamaño, color y nervadura de las hojas de hasta tres árboles huésped distintos sin siquiera tocarlos.",
    mediaSlug: "estacion-s5-foto-1",
    stations: ["S5", "E9"]
  },
  {
    slug: "sp-copihue",
    nombreComun: "Copihue",
    nombreMapudungun: "Kolkopiw",
    nombreCientifico: "Lapageria rosea",
    reino: "Flora",
    grupo: "Plantas acuáticas y trepadoras",
    categoria: "planta_acuatica",
    estado: "Vulnerable",
    habitat: "Interior sombrío y húmedo de la Estación 5: Bosque Los Canelos.",
    descripcion: "Enredadera perenne endémica de flores acampanadas de textura cerosa color rojo carmín que es polinizada por el picaflor chico.",
    datoCurioso: "Su fruto comestible tarda cerca de un año en madurar en la penumbra del bosque húmedo.",
    mediaSlug: "estacion-s5-foto-2",
    stations: ["S5", "E9"]
  }
];

export const INSTITUTIONAL_CONTENT = {
  "acerca-app": {
    titulo: "Angachilla App",
    subtitulo: "Aplicación móvil y plataforma web de la Reserva Comunitaria Bosque Humedal Angachilla",
    intro: `La aplicación móvil Angachilla App para Android e iOS es una iniciativa que se enmarca en la implementación de una infraestructura sustentable y un programa de actividades recreativas y de educación ambiental en la Reserva Comunitaria Bosque Humedal Angachilla, mediante el financiamiento de un proyecto de innovación social apoyado por el Comité de Fomento de Los Ríos (CORFO), el cual es desarrollado por el Comité Ecológico Humedal Angachilla en conjunto con la Ilustre Municipalidad de Valdivia.`,
    objetivo: `Esta herramienta digital busca mejorar la experiencia de las visitas en la Reserva Comunitaria Bosque Humedal Angachilla, facilitando la educación ambiental para el conocimiento de su biodiversidad, el comportamiento respetuoso para su conservación y el sentido de pertenencia de la comunidad valdiviana con este espacio natural, potenciando así también el turismo sostenible dentro de la ciudad.`,
    items: [
      {
        titulo: "Recorrido GPS y estaciones de interés",
        texto: "Recorrer con guía GPS los senderos de la reserva a través de un mapa interactivo con estaciones de puntos de interés que muestran las características y fotografías de los ecosistemas del lugar junto a sus normas y recomendaciones de cuidado, con las especies que se pueden avistar en cada uno de ellos.",
        mediaSlug: "docx-app-1"
      },
      {
        titulo: "Guía de Especies del Humedal",
        texto: "Tener una guía de las especies de flora, fauna y funga presentes en el humedal Angachilla, con sus ilustraciones y fotografías para poder reconocerlas, descripción, hábitat, nombre científico y en mapuzungun.",
        mediaSlug: "docx-app-2"
      },
      {
        titulo: "Comunidad, Galería y Calendario de Actividades",
        texto: "Compartir registros fotográficos y publicaciones de las visitas en la reserva en el Feed comunitario, apreciar imágenes del lugar en la Galería, conocer las principales noticias, avisos y el calendario de actividades.",
        mediaSlug: "docx-app-3"
      }
    ]
  },
  "acerca-reserva": {
    titulo: "Nuestra Reserva Comunitaria",
    subtitulo: "Reserva Comunitaria Bosque Humedal Angachilla — 20 hectáreas protegidas por la comunidad",
    parrafos: [
      "La Reserva Comunitaria Bosque Humedal Angachilla es un espacio natural protegido y gestionado por el Comité Ecológico Humedal Angachilla en las áreas de zona de protección del Santuario de la Naturaleza Humedal Angachilla y en terrenos colindantes a éste administrados por la organización, los cuales abarcan una superficie total aproximada de 20 hectáreas que proyectan conformar como una Reserva Natural Urbana.",
      "Este lugar es rescatado y resguardado por la comunidad debido al abandono e impacto negativo que estaba sufriendo, siendo amenazado principalmente por los rellenos de tierra y escombros que arrasaron con parte del bosque humedal, además de los microbasurales, la caza y la tala ilegal que afectaron la vegetación y el hábitat de diversas especies.",
      "La reserva comunitaria cuenta en su interior con una infraestructura sustentable con accesibilidad universal, y un programa de actividades recreativas y de educación ambiental gratuitas y abiertas para toda la comunidad. Estas iniciativas le permitieron ser reconocida dentro de la acreditación de Valdivia como Ciudad Humedal por la Convención Ramsar en julio de 2025, y ser elegida por votación popular como la iniciativa ganadora del premio Valdivia Destaca 2026 de la Ilustre Municipalidad de Valdivia, siendo valorada como un aporte relevante al desarrollo sostenible de la comuna.",
      "Este lugar está disponible permanentemente para ser visitado por cualquier persona, por lo que requiere de tu colaboración para su cuidado y la conservación de su biodiversidad."
    ],
    atractivos: [
      "Observación de Aves",
      "Caminatas por Senderos",
      "Fotografía de Naturaleza",
      "Contemplación en Miradores",
      "Reforestaciones Comunitarias",
      "Educación Ambiental",
      "Jornadas de Voluntariado",
      "Encuentros Artísticos y Culturales",
      "Actividades de Salud y Bienestar"
    ],
    normas: [
      { texto: "No botar basura; ésta contamina el hábitat. Llévatela o transpórtala a los basureros cercanos.", mediaSlug: "docx-reserva-1" },
      { texto: "Evitar venir con mascotas; de lo contrario mantenerlas con correa y supervisadas constantemente.", mediaSlug: "docx-reserva-2" },
      { texto: "No cortar ramas ni árboles ni extraer plantas, funga y retoños.", mediaSlug: "docx-reserva-3" },
      { texto: "Emitir el menor ruido posible para no alterar ni espantar a las aves.", mediaSlug: "docx-reserva-4" },
      { texto: "Prohibido hacer fuego o fogatas y acampar en la reserva.", mediaSlug: "docx-reserva-5" },
      { texto: "Transitar sólo por los senderos habilitados.", mediaSlug: "docx-reserva-6" },
      { texto: "Prohibido el ingreso de vehículos motorizados.", mediaSlug: "docx-reserva-7" },
      { texto: "Prohibido cazar y pescar dentro de la reserva.", mediaSlug: "docx-reserva-8" }
    ]
  },
  "acerca-comite": {
    titulo: "Comité Ecológico Humedal Angachilla",
    subtitulo: "Organización comunitaria fundada en 2020 por vecinas y vecinos de Valdivia",
    historia: [
      "El Comité Ecológico Humedal Angachilla es una organización comunitaria funcional sin fines de lucro fundada en el año 2020 por vecinas y vecinos del barrio Claro de Luna (ex Villa Galilea) de Valdivia para la protección y conservación del humedal Angachilla y su entorno, con el propósito de fomentar la educación ambiental, la investigación científica, el rescate cultural, el turismo sustentable y las actividades recreativas en este espacio natural.",
      "Actualmente forman parte de esta organización personas de diversos sectores de la ciudad de Valdivia, quienes además constituyeron la Corporación Humedales de Angachilla, entidad que reúne a representantes de las comunidades aledañas a todo el Santuario de la Naturaleza Humedal Angachilla para participar de la gobernanza y administración de toda esta área protegida.",
      "El Comité Ecológico Humedal Angachilla administra la Reserva Comunitaria Bosque Humedal Angachilla, en donde desarrolla las siguientes líneas de trabajo:"
    ],
    lineasTrabajo: [
      {
        numero: 1,
        titulo: "Trabajo Comunitario",
        resumen: "Participación activa en restauración, limpieza, reforestación y mantención de senderos e infraestructura.",
        detalle: "Se promueve la participación activa de la comunidad en la restauración, limpieza, reforestación, creación y mantención de senderos e infraestructura de la reserva comunitaria, fortaleciendo el tejido social y el sentido de pertenencia e identidad con el territorio."
      },
      {
        numero: 2,
        titulo: "Educación Ambiental",
        resumen: "Visitas guiadas, talleres y charlas educativas abiertas a establecimientos y organizaciones.",
        detalle: "Se realizan visitas guiadas, talleres y charlas educativas dirigidas a jardines infantiles, colegios, universidades, juntas de vecinos y organizaciones sociales, fomentando el conocimiento y valoración de la biodiversidad y las funciones ecológicas de los humedales."
      },
      {
        numero: 3,
        titulo: "Ciencia Comunitaria y Ciudadana",
        resumen: "Monitoreos participativos de flora, fauna, funga y calidad del agua junto a investigadores.",
        detalle: "Se desarrollan monitoreos participativos de flora, fauna, funga y calidad del agua, además de colaboraciones con investigadores, tesistas y centros de estudio para generar conocimiento científico abierto para la conservación del ecosistema."
      },
      {
        numero: 4,
        titulo: "Ecoturismo Vecinal",
        resumen: "Turismo de base comunitaria y sustentable en los barrios del sector sur de Valdivia.",
        detalle: "Se impulsa un modelo de turismo de base comunitaria y sustentable que pone en valor el patrimonio natural de los barrios del sector sur de Valdivia, ofreciendo experiencias de observación de naturaleza y caminatas interpretativas respetuosas con el entorno."
      },
      {
        numero: 5,
        titulo: "Arte, Cultura y Patrimonio",
        resumen: "Encuentros artísticos, culturales y prácticas de salud y bienestar al aire libre.",
        detalle: "Se generan espacios de encuentro en torno a las artes escénicas, la música, la literatura, las artes visuales y las prácticas de salud y bienestar al aire libre, integrando la cultura y la creación artística con la contemplación y defensa del bosque humedal."
      }
    ],
    contacto: {
      rut: "65.213.206-5",
      email: "comitebosquehumedal@gmail.com",
      instagram: "https://instagram.com/humedalangachilla",
      instagramHandle: "@humedalangachilla",
      facebook: "https://facebook.com/ComiteBosqueHumedalAngachilla",
      ubicacion: "Reserva Comunitaria Bosque Humedal Angachilla, Sector Sur de Valdivia, Región de Los Ríos"
    }
  },
  "apps-complementarias": {
    titulo: "Apps Complementarias",
    subtitulo: "Herramientas recomendadas para potenciar la observación de naturaleza en tu recorrido por el humedal",
    apps: [
      {
        id: "ebird",
        nombre: "eBird",
        categoria: "Avistamiento de Aves",
        descripcion: "Registra tus listas de aves observadas en el humedal Angachilla y aporta datos reales para la conservación de la avifauna de Los Ríos.",
        urlWeb: "https://ebird.org/hotspot/L11417032",
        urlAndroid: "https://play.google.com/store/apps/details?id=edu.cornell.birds.ebird",
        urlIos: "https://apps.apple.com/cl/app/ebird/id988799279",
        badge: "Aves"
      },
      {
        id: "merlin",
        nombre: "Merlin Bird ID",
        categoria: "Identificación por Canto y Foto",
        descripcion: "Identifica en tiempo real los cantos de las aves del bosque y del totoral usando el micrófono de tu teléfono con el paquete de aves de Chile.",
        urlWeb: "https://merlin.allaboutbirds.org/",
        urlAndroid: "https://play.google.com/store/apps/details?id=com.labs.merlinbirdid.app",
        urlIos: "https://apps.apple.com/cl/app/merlin-bird-id-by-cornell-lab/id773457673",
        badge: "Bioacústica"
      },
      {
        id: "inaturalist",
        nombre: "iNaturalist Chile",
        categoria: "Flora, Fauna y Reino Fungi",
        descripcion: "Comparte tus observaciones de plantas nativas, helechos, anfibios y hongos del humedal junto a la comunidad de naturalistas de Chile.",
        urlWeb: "https://inaturalist.mma.gob.cl/",
        urlAndroid: "https://play.google.com/store/apps/details?id=org.inaturalist.android",
        urlIos: "https://apps.apple.com/cl/app/inaturalist/id421397028",
        badge: "Biodiversidad"
      },
      {
        id: "windy",
        nombre: "Windy Valdivia",
        categoria: "Meteorología y Lluvias",
        descripcion: "Consulta en vivo el radar de lluvias, viento y condiciones meteorológicas en el sector sur de Valdivia antes de recorrer los senderos.",
        urlWeb: "https://www.windy.com/-39.857/-73.238?rain,-39.857,-73.238,14",
        urlAndroid: "https://play.google.com/store/apps/details?id=com.windyty.android",
        urlIos: "https://apps.apple.com/cl/app/windy-com-weather-radar/id1161387262",
        badge: "Clima"
      }
    ]
  }
};

