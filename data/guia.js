/*
 * Guía de uso de MIO-Check, dentro de la propia herramienta.
 *
 * Va en un archivo aparte -mismo motivo que data/surgeries.js: si index.html
 * se abre con doble clic (protocolo file://), fetch() de archivos locales
 * está bloqueado por CORS, así que el contenido va envuelto en una variable
 * global y se carga con una simple etiqueta <script>.
 *
 * Rehecha el 30-09-2026 (pedido del usuario: «la cantidad de texto es
 * inmensa, nadie se va a leer eso nunca»). Ahora es visual y corta: el flujo
 * de un día en cinco pasos, una tarjeta por pantalla con dos o tres puntos,
 * lo que conviene saber y unas dudas rápidas de una o dos frases. La
 * referencia larga sigue siendo README.md. Regla al tocarla: frases cortas,
 * como mucho tres puntos por tarjeta; si algo necesita un párrafo, va al
 * README, no aquí.
 *
 * Todo es texto plano (se pinta con textContent). No se sincroniza, no se
 * guarda nada de aquí, y queda excluida de la impresión.
 *
 * Si cambia el flujo de trabajo, revisar este archivo a la vez que el README.
 *
 * Solo en castellano por ahora (decisión del usuario, 31-08-2026): la app
 * muestra un aviso dentro de la propia guía cuando la interfaz está en
 * inglés, en vez de dejarla a medio traducir sin decirlo.
 */
window.GUIA = {

  // Un día con MIO-Check, de principio a fin
  flujo: [
    { titulo: "Prepara", texto: "Una plantilla en el Organizador: técnicas y material en cada caja." },
    { titulo: "Crea el caso", texto: "Gestión de Casos → Crear caso, y carga la plantilla." },
    { titulo: "Comprueba", texto: "Checklist pre-quirúrgico, vinculado al caso." },
    { titulo: "Apunta", texto: "Registro: fases, eventos y alarmas con un toque." },
    { titulo: "Cierra", texto: "Resultado, evolución y concordancia en la ficha." }
  ],

  // Una tarjeta por pantalla, en los mismos tres bloques que el Inicio
  pantallas: [
    { grupo: "Antes de quirófano", tarjetas: [
      { titulo: "Organizador de Montajes", texto: "Qué electrodo va en cada canal.", puntos: [
        "Crear plantilla, o toca una de la lista para abrirla; «← Todas las plantillas» vuelve a la lista.",
        "Toca un material y luego la entrada de la caja.",
        "Se guarda solo con cada cambio.",
        "El Resumen te da material, coste y avisos."
      ] },
      { titulo: "Gestión de Casos", texto: "Una ficha por cirugía.", puntos: [
        "Crear caso: eliges el equipo (Inomed o Cadwell).",
        "La ficha se guarda sola; «Cerrar caso» al terminar.",
        "⋮ → Abrir en el Registro, para apuntar en ese caso.",
        "Resumen: «Borrador desde el Registro» lo escribe a partir del cronograma.",
        "Informe en PDF y CSV de los casos filtrados.",
        "Borrar manda el caso a la Papelera: se recupera durante 30 días."
      ] }
    ] },
    { grupo: "Quirófano", tarjetas: [
      { titulo: "Checklist pre-quirúrgico", texto: "Cuatro momentos, de la planificación al posicionamiento.", puntos: [
        "Vincúlalo a un caso y las marcas viajan con él."
      ] },
      { titulo: "Registro intraoperatorio", texto: "Lo que pasa en quirófano, con la hora.", puntos: [
        "Barra de abajo: + Fase (un toque; lo siguiente la hereda), + Evento y + Alarma.",
        "Evento y alarma por pasos: técnica › hallazgo › contexto; varias técnicas a la vez = una sola alarma.",
        "Basales: toca una técnica para apuntar; «= Basal» copia la basal si no hay cambios.",
        "En el cronograma, toca la hora o ✎ para corregir."
      ] }
    ] },
    { grupo: "Después / consulta", tarjetas: [
      { titulo: "Material", texto: "Todo el catálogo, con buscador." },
      { titulo: "Miotomas", texto: "Qué músculos cubren los niveles de la cirugía." },
      { titulo: "Simulador", texto: "Una pantalla de monitorización para ensayar alarmas." },
      { titulo: "Mis apuntes", texto: "Tus notas y fotos en carpetas; se exportan a Word." }
    ] }
  ],

  // Lo que conviene saber: una línea cada cosa
  claves: [
    { icono: "🔒", texto: "Nunca datos del paciente: ni nombre, ni NHC, ni fecha de nacimiento. En las fotos, sin la cabecera del informe." },
    { icono: "⇄", texto: "Mismo dato en dos sitios: lo que escribes en el Registro sale en la ficha del caso, y al revés." },
    { icono: "☁", texto: "Funciona sin cobertura y se sincroniza sola. Si este dispositivo y la nube tienen cambios distintos, eliges con cuál quedarte." },
    { icono: "⧉", texto: "Plantilla ≠ caso: cargar una plantilla copia su contenido; cambiarla después no toca los casos." }
  ],

  // Dudas rápidas: una o dos frases
  dudas: [
    { pregunta: "¿Qué significan los colores del cronograma?",
      respuesta: "Rojo, alarma. Naranja, un cambio sin alarma o un factor técnico. Verde, fase o recuperación. Azul, lo demás (anestesia, mapeo, contexto)." },
    { pregunta: "¿Qué significan las siglas?",
      respuesta: "Sin caso: el Registro o el Checklist como hoja suelta, sin caso vinculado. PostPos1 y PostPos2: basales tras el primer y el segundo cambio de posición. HFD: descargas de alta frecuencia. CoMEP: MEP corticobulbares. TOF: tren de cuatro. ⇄: el mismo dato en el Registro y en la ficha. En la lista de casos, «3/5» es la dificultad, ★ un caso destacado y 👁 hacer seguimiento." },
    { pregunta: "¿Cómo apunto una alarma bilateral, hemicorporal o cruzada?",
      respuesta: "Marca todas las técnicas y lados a la vez (por ejemplo t-MEP MSD + MID + CoMEP VII D) y pulsa Apuntar alarma: es una sola alarma, con una causa, unas medidas y una recuperación. Si lo sabes, pon cuánto cayó o subió en %." },
    { pregunta: "¿Qué es PR en la concordancia?",
      respuesta: "Positivo reversible: hubo un cambio significativo, se recuperó tras actuar y no quedó déficit nuevo." },
    { pregunta: "¿Por qué hay material «sin precio»?",
      respuesta: "Se lista aparte para que el total no parezca completo sin serlo. Los precios se ponen en Etiquetas; solo cuenta lo fungible." },
    { pregunta: "¿Cómo tengo mis plantillas más a mano?",
      respuesta: "Toca la ☆ de una plantilla para marcarla; «Solo favoritas» deja solo esas. Se guardan en cada dispositivo." },
    { pregunta: "¿Puedo usar la plantilla de un compañero?",
      respuesta: "Sí: Más acciones → Duplicar. La copia es tuya y el original no se toca." },
    { pregunta: "¿Inomed o Cadwell?",
      respuesta: "Cada plantilla y cada caso son de un equipo; solo cambian las cajas. Solo se cargan plantillas del mismo equipo." },
    { pregunta: "¿Cómo cambio los colores o quito las ayudas?",
      respuesta: "El botón redondo junto al ⋮ pasa por oscuro, azul y claro. «Ocultar ayudas» está en el ⋮." },
    { pregunta: "¿Algún truco para el móvil?",
      respuesta: "Toca y coloca en vez de arrastrar. En el Registro, mantén pulsado un botón para ver qué significa." }
  ]

};
