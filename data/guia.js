/*
 * Guía de uso de MIO-Check, dentro de la propia herramienta.
 *
 * Va en un archivo aparte -mismo motivo que data/surgeries.js: si index.html
 * se abre con doble clic (protocolo file://), fetch() de archivos locales
 * está bloqueado por CORS, así que el contenido va envuelto en una variable
 * global y se carga con una simple etiqueta <script>.
 *
 * Es la versión corta y orientada a la tarea, no la documentación de
 * referencia -esa sigue siendo README.md-. No se sincroniza, no se guarda
 * nada de aquí, y queda excluida de la impresión.
 *
 * Si cambia el flujo de trabajo, este archivo hay que revisarlo a la vez que
 * el README: es la segunda descripción del flujo que existe en el proyecto,
 * y puede quedarse obsoleta en silencio si solo se actualiza una de las dos.
 *
 * Solo en castellano por ahora (decisión del usuario, 31-08-2026): la app
 * muestra un aviso dentro de la propia guía cuando la interfaz está en
 * inglés, en vez de dejarla a medio traducir sin decirlo.
 */
window.GUIA = {

  tarjetas: [
    {
      titulo: "Qué es",
      texto: "Prepara el material de una cirugía monitorizada (IONM) y te dice exactamente qué llevar, cuánto cuesta y en qué caja va cada cosa, canal a canal."
    },
    {
      titulo: "El flujo de un día",
      texto: "Plantilla → técnicas → material en las cajas → resumen → guardar como caso → cerrarlo después de la cirugía."
    },
    {
      titulo: "Plantilla y caso no son lo mismo",
      texto: "La plantilla es el molde: la reutilizas cuantas veces quieras. El caso es lo que pasó ese día concreto y no cambia aunque el molde cambie después — ni aunque lo edites, ni aunque lo borres."
    },
    {
      titulo: "Catálogo y etiquetas",
      texto: "El catálogo es todo el material que puedes colocar. La etiqueta es de qué tipo físico está hecho (aguja, sacacorchos, pegatina…); es lo que se cuenta en el resumen y de donde sale el precio."
    },
    {
      titulo: "Cajas y resumen",
      texto: "Cajas es dónde va cada cosa, canal a canal. El resumen es el objetivo de todo: material a preparar, coste, cajas necesarias y avisos."
    },
    {
      titulo: "Y además",
      texto: "Ventana Docente para practicar miotomas y colocación de cajas, castellano/inglés, funciona sin cobertura y se sincroniza sola entre el móvil y el ordenador."
    },
    {
      titulo: "Pantalla de inicio",
      texto: "El logo lleva siempre aquí: 10 tarjetas agrupadas por el momento de la cirugía -Antes de quirófano (Organizador de Montajes, Gestión de Casos, Checklist pre-quirúrgico, Material), En quirófano (Registro intraoperatorio, Técnicas IONM) y Después / consulta (Docencia, Simulador, Mis apuntes, Bibliografía)-, cada una con una línea que dice para qué sirve. Se trabaja solo dentro de la que elijas; el logo, o el botón Inicio junto al título de cada pantalla, te devuelven aquí."
    }
  ],

  // Acordeón: todos cerrados por defecto. "html" admite <b>/<p>/<ul> como
  // texto estático de desarrollador, igual que ya hacen las intros de
  // Catálogos (cat_intro_*) -no es dato de usuario, no hace falta
  // createElement/textContent para esto.
  acordeon: [
    {
      titulo: "Plantilla y caso: cuándo usar cada una",
      html: "<p>Usa una <b>plantilla</b> (un montaje de la biblioteca) mientras preparas o practicas: la editas, la duplicas, la reordenas sin ningún riesgo, porque no representa ninguna cirugía real todavía.</p><p>Crea un <b>caso</b> cuando la cirugía va a pasar o ya pasó de verdad, con <b>Crear caso</b> en Gestión de Casos. Se abre su <b>ficha</b>; para construir su montaje, en el apartado 5 (Montaje/Técnicas), sub-apartado Cajas y entradas, pulsa <b>Editar montaje</b>, que te lleva al Organizador -a mano, o cargando una plantilla encima-. A partir de ahí es un registro clínico: cargar una plantilla sobre él siempre es una copia de su contenido, nunca un enlace — si luego cambias la plantilla, el caso ya guardado no se entera.</p>"
    },
    {
      titulo: "Preparar un montaje desde cero",
      html: "<p>Dentro de <b>Organizador de Montajes</b>, tarjeta <b>Plantillas de montajes</b> -abierta de fábrica, es la primera- → <b>+ Montaje en blanco</b>. El banco de trabajo (Catálogo, Cajas, Técnicas, Resumen) queda cargado con él al momento.</p><p>Marca las técnicas que vas a hacer, y en Catálogo pulsa un ítem y luego la entrada de la caja donde va -también se puede arrastrar, aunque en pantallas táctiles pulsar y colocar funciona mejor-. Se guarda solo con cada cambio: no hay un botón «Guardar» que se pueda olvidar, aunque si prefieres una confirmación explícita, <b>Guardar montaje</b> la ofrece (ver más abajo).</p>"
    },
    {
      titulo: "Partir de la plantilla de un compañero (duplicar)",
      html: "<p>Desde <b>Plantillas de montajes</b>, elige el montaje de otro autor y pulsa <b>Duplicar</b>. La copia nace a tu nombre y es tuya para editar; el original de tu compañero no se toca.</p>"
    },
    {
      titulo: "La biblioteca de Plantillas de montajes: buscar, elegir, gestionar",
      html: "<p>Tarjeta <b>Plantillas de montajes</b>, arriba del todo dentro de Organizador de Montajes -abierta de fábrica-. Buscador por nombre o autor, y cuántas entradas tiene ocupadas cada uno. La lista sale siempre en <b>orden alfabético</b>, sin importar de quién sea cada montaje.</p><p>Elegir un montaje <b>lo carga al momento y pliega la tarjeta sola, sin preguntar</b>: no hay ningún riesgo, cada montaje es su propio archivo y el anterior se queda guardado tal cual.</p><p><b>Duplicar, Renombrar, Vaciar y Borrar</b> actúan sobre el montaje que tengas cargado en ese momento. Solo puedes tocar los tuyos -salvo los de fábrica, sin autor, que puede editar cualquiera-. <b>Guardar montaje</b> pregunta cada vez si quieres sobrescribir el activo o guardarlo como uno nuevo -una confirmación explícita, aparte del guardado automático de siempre-.</p>"
    },
    {
      titulo: "Cargar un montaje sobre un caso ya creado",
      html: "<p>Solo se puede hacer desde <b>Corrigiendo el material del caso</b> -el botón <b>Editar montaje</b> del apartado 5 te lleva ahí-, en la barra fija de arriba, botón <b>Cargar montaje…</b>. No está en la ficha del caso, a propósito: desde ahí no se sabe si lo que se va a sustituir se puede editar de verdad.</p><p>Elige un montaje y <b>siempre</b> te pregunta antes de tocar nada -también con el caso vacío-, diciendo en números qué va a pasar: cuántas entradas se sobrescriben, o cuántas vacías se rellenan y cuántas se conservan. Puedes <b>Reemplazar todo</b> o <b>Añadir solo lo que falta</b> -esta segunda opción no toca ninguna entrada que ya tuviera material-.</p><p>Es una copia: cargar un montaje no crea ningún enlace con él. Si el caso está cerrado o cancelado, pide una confirmación aparte antes de seguir.</p>"
    },
    {
      titulo: "Guardar el montaje de un caso como plantilla",
      html: "<p>Desde <b>Corrigiendo el material del caso</b> (botón <b>Editar montaje</b> del apartado 5), en la barra fija de arriba, botón <b>Guardar este montaje como plantilla…</b> -ya no está en la ficha-. Crea siempre una plantilla <b>nueva</b> a partir de lo que hay ahora mismo en las cajas de ese caso -nunca sobrescribe una existente-.</p><p>Disponible en cualquier momento, tenga el caso el estado que tenga. El caso en sí no se modifica en absoluto.</p>"
    },
    {
      titulo: "Registrar un caso y cerrarlo: los 8 apartados",
      html: "<p>Desde <b>Gestión de casos</b>, la ficha se organiza en 8 apartados plegables, todos cerrados por defecto -se abre el que interese, no hace falta rellenar de arriba abajo-: Identificación/Trazabilidad, Paciente, Cirugía, Anestesia, Montaje/Técnicas, Desarrollo intraoperatorio, Resultado/Correlación clínica, y Docencia/Meta.</p><p>El <b>Estado</b> (apartado 1) puede ser Pendiente de planificar (negro), Preparado (amarillo), Cerrado (verde) o Cancelado (rojo); el color se ve en la lista de casos. Un caso cancelado pide un motivo, y en el Google Sheet solo cuenta para trazabilidad y paciente -no entra en las estadísticas de técnicas ni de material, porque no llegó a monitorizarse de verdad-.</p><p>El apartado 5 (Montaje/Técnicas) se reparte en tres sub-apartados: <b>Cajas y entradas</b> -con el <b>detalle canal a canal</b>, qué hay puesto en cada entrada de cada caja con el mismo aspecto que la ventana Resumen, de solo lectura: para corregirlo hace falta el botón <b>Editar montaje</b>, que te lleva al Organizador de Montajes-, <b>Material</b> -el material real del caso, sin copia editable aparte: si añades algo que no estaba previsto, colócalo en su caja y anótalo en Notas del material; justo debajo sale también el <b>coste del material</b>, mismo desglose que en Resumen con los precios de hoy, tanto en pantalla como en el informe en PDF- y <b>Técnicas</b> -técnicas realizadas y cómo se realizó cada una, con sus propios campos por técnica-.</p>"
    },
    {
      titulo: "Equipos",
      html: "<p>Cada plantilla y cada caso son de un <b>equipo</b> (el aparato de monitorización), con su letra. El material, el catálogo y los precios son los mismos para todos; lo único que cambia son las <b>cajas</b> donde se coloca. Si el servicio solo tiene un equipo configurado, la app no pregunta ni lo rotula.</p><p>Al pulsar <b>Crear caso</b> o <b>Montaje en blanco</b> se elige el equipo (propone el último que usaste). El rótulo del Organizador dice con qué equipo estás trabajando, y en Gestión de Casos cada caso lleva su letra y se puede filtrar por equipo.</p><p><b>Cargar montaje…</b> solo ofrece plantillas del mismo equipo que el caso: las entradas de un equipo no existen en las cajas del otro. Por lo mismo, el equipo de un caso solo se puede cambiar mientras su montaje esté vacío.</p><p>Lo que es propio de cada equipo -dónde van las sondas, los auriculares o si hay conmutador- lo explica la descripción de cada caja, en la tarjeta <b>Cajas</b>. El material que solo existe en un equipo no aparece en el catálogo de los demás.</p>"
    },
    {
      titulo: "Revisión del montaje (en el Resumen)",
      html: "<p>Debajo del material, el Resumen avisa de lo que parece que falta o sobra: una <b>caja de registro con entradas ocupadas y el GND vacío</b>, una <b>técnica marcada sin su material</b> (p. ej. SEP de mediano sin registro en Erb ni cervical, MEP sin electrodos de TES, PEATC sin auriculares) y <b>material colocado que ninguna técnica marcada usa</b> (¿falta marcarla?).</p><p>Son avisos orientativos: no impiden nada y no se guardan en el caso ni van al Sheet.</p>"
    },
    {
      titulo: "Material extra, sondas y conmutador",
      html: "<p>El <b>material extra</b> es el que no ocupa entrada de ninguna caja -auriculares PEATC y gafas VEP, por ejemplo-: se añade aparte y entra igualmente en el resumen y en el coste.</p><p>Las <b>sondas</b> (categoría propia del catálogo, plegada de fábrica) sí ocupan entrada, como cualquier otro material. Algunas llevan un icono <b>📷</b> junto al nombre: lo abre en un visor dentro de la propia herramienta, para identificar la sonda física sin salir a buscarla en otro sitio.</p><p>El <b>conmutador</b> es un chip fijo de la caja de estimulación. En cuanto lo colocas, suma automáticamente <b>6 electrodos sacacorchos</b> al material a preparar, sin que ocupen entrada propia -reparten por dentro del switch hacia varios canales-.</p>"
    },
    {
      titulo: "Coste del material: fungible, sin precio, cobro por manta",
      html: "<p>El coste solo cuenta el material <b>fungible</b> -el que se gasta-. Lo reutilizable (sondas, gafas, auriculares…) se prepara pero no se gasta, y no entra en el total.</p><p>Un tipo de material sin precio puesto se lista aparte, en vez de contar como cero, para que el total no parezca completo sin serlo -los precios se ponen uno por uno desde el botón <b>Etiquetas</b>-.</p><p>Alguna etiqueta -la manta de electrodos GRID, por ejemplo- viene marcada <b>«Se cobra por manta»</b>: cuenta 1 unidad de coste sin importar cuántas de sus tiras coloques, porque el conjunto entero se abre igual se use una tira o las ocho.</p>"
    },
    {
      titulo: "Perfil de usuario y autoría (y por qué no es seguridad)",
      html: "<p>El selector <b>«quién eres»</b> de la barra superior firma como autor los montajes que crees. Solo el autor de un montaje puede editarlo, renombrarlo, vaciarlo o borrarlo -los de fábrica, sin autor, los puede tocar cualquiera-.</p><p><b>No es una medida de seguridad</b>: cambiar de perfil no pide contraseña ni nada parecido, cualquiera puede hacerlo desde la misma barra. Es solo para no pisarse el trabajo entre compañeros sin querer.</p>"
    },
    {
      titulo: "Sincronización, trabajo sin conexión y qué hacer ante un conflicto",
      html: "<p>Con el token conectado (botón <b>☁</b>), todo -montajes, casos, catálogos- se sube y se baja solo, unos segundos después de cada cambio.</p><p><b>Sin conexión sigue funcionando con normalidad</b> y reintenta en cuanto vuelve. Si has tocado algo en el móvil sin subirlo y abres el ordenador, no se pisa nada: sube lo tuyo en vez de bajar.</p><p>Si dos dispositivos han cambiado cosas distintas, avisa de <b>Conflicto</b> y decides tú, desde el propio diálogo, entre <b>Subir</b> (gana lo de este dispositivo) o <b>Bajar</b> (gana lo del repositorio). La app nunca decide sola cuál de las dos versiones se pierde.</p>"
    },
    {
      titulo: "Concordancia: VP, FP, VN, FN y PR",
      html: "<p>En <b>Resultado / Correlación clínica</b>, la concordancia compara los cambios de la monitorización con el resultado neurológico. Además de VP, FP, VN y FN está <b>PR — positivo reversible</b>: hubo un cambio significativo que se recuperó tras actuar (avisar, pausar, subir la TAM...) y no quedó déficit nuevo.</p><p>Gestión de Casos se puede filtrar por concordancia.</p>"
    },
    {
      titulo: "Informe en PDF y exportar a CSV",
      html: "<p>Dentro de <b>Gestión de casos</b>, botón <b>Exportar casos</b>: abre un informe en PDF -imprimible desde el propio diálogo del navegador- con los casos que cumplan los filtros que tengas puestos arriba (Estado/Desde/Hasta/Destacados/Seguimiento); sin ningún filtro, salen todos. <b>Crear informe</b>, dentro de la ficha de un caso, hace lo mismo pero solo para ese caso. Es una función en pruebas: si algo no sale como esperas, dilo para irla afinando.</p><p>El botón <b>Exportar CSV</b>, al lado, descarga un CSV con esos mismos casos filtrados, sin esperar a la sincronización automática con el Google Sheet -útil si quieres los datos ya mismo, o prefieres no depender de ella-.</p>"
    },
    {
      titulo: "Qué NO se guarda nunca",
      html: "<p>Ningún dato que identifique al paciente: ni nombre, ni apellidos, ni número de historia clínica, ni fecha de nacimiento. Solo el identificador del caso, la edad, el sexo y el resumen de historia clínica.</p><p>Ojo especial con <b>Pruebas de imagen</b> (apartado 2, Paciente): al fotografiar o capturar un informe de RM/TC, encuadra solo la imagen o el hallazgo, nunca la cabecera del informe, que suele traer el nombre y el NHC del paciente.</p>"
    },
    {
      titulo: "Docencia",
      html: "<p>Tarjeta <b>Docencia</b> de la pantalla de inicio (antes botón <b>Docente</b> de la barra superior). Tres pestañas, sin relación con la preparación de material -no tocan ningún montaje ni caso, y Miotomas/Cama de quirófano se guardan solo en ese navegador, no se sincronizan-:</p><p><b>Miotomas</b>: marcas los niveles de columna que abarca la cirugía y aparecen los músculos que dependen de esas raíces; los llevas de un lado a otro pulsándolos. Es un ejercicio, no una calculadora -no elige por ti, solo avisa de qué niveles se quedan sin ningún músculo que los cubra-.</p><p><b>Cama de quirófano</b>: eliges la posición del paciente y repartes las cajas por cabecera, laterales y pies con el mismo gesto de pulsar y colocar del resto de la herramienta. Lo que se practica es que el cable llegue.</p><p><b>Teoría básica de IONM</b>: pestaña nueva, de momento en construcción. El <b>Material</b> tiene su propia tarjeta en la pantalla de inicio, bajo el Registro intraoperatorio: todo el catálogo en filas, agrupado por categoría y con buscador.</p>"
    },
    {
      titulo: "Checklist pre-quirúrgico",
      html: "<p>Tarjeta <b>Checklist pre-quirúrgico</b> de la pantalla de inicio: una lista de comprobación en 5 momentos, desde la planificación hasta el campo ya abierto, para no olvidar nada antes de empezar a monitorizar.</p><p>El desplegable de arriba elige dónde se guardan las marcas: <b>Modelo 0 — sin caso</b> es una checklist de trabajo suelta, sin sincronizar -como el Simulador-, para repasar sin más. Si eliges un caso de la lista, las marcas se guardan dentro de ese caso y viajan con él -se sincronizan, y dos cirugías que estés preparando a la vez no se mezclan-. <b>Vaciar</b> desmarca todo lo de la checklist que tengas abierta en ese momento.</p>"
    },
    {
      titulo: "Registro intraoperatorio",
      html: "<p>Las <b>basales</b> (apertura, post-posición y cierre) son la misma tabla que la del apartado Desarrollo intraoperatorio de la ficha del caso: lo que escribas en un sitio sale en el otro y en la hoja impresa. Sus filas dependen de las técnicas del caso (c-SEP, c-MEP, GRID, corticobulbares, Onda D...).</p><p>Tarjeta <b>Registro intraoperatorio</b> de la pantalla de inicio: la hoja de registro de la monitorización en versión digital (en desarrollo), con las mismas secciones que la de papel -identificación, modalidades, anestesia, hitos, basales, mapeo, eventos, alarmas, zona modular y cierre-.</p><p>Como el Checklist, el desplegable de arriba elige dónde se guarda: <b>Modelo 0 — sin caso</b> es una hoja suelta en este navegador; si eliges un caso, la hoja se guarda dentro del caso y viaja con él. Con un caso elegido, las <b>técnicas y datos del caso pasan solos</b> a la hoja (fecha, diagnóstico, procedimiento, hora de inicio, anestesia y las casillas de modalidades con equivalente exacto), y el botón <b>Pasar al caso</b> devuelve al caso las horas de inicio/fin, las alarmas, el resultado, las incidencias y la perla docente -solo en los campos que el caso tenga vacíos, y enseñándote antes cuáles-.</p><p>Lo más útil es <b>Imprimir hoja</b> (también desde la ficha de un caso, botón <b>Hoja de registro</b>): genera 2 páginas A4 prerrellenadas con lo que ya metiste en Gestión de Casos -identificación, técnicas y modalidades, anestesia, dónde está montado el Raabe, parámetros y notas- y con filas en blanco para escribir a mano en quirófano: basales y comparativa, mapeo con esquema pequeño y un único registro de eventos y alarmas con la leyenda de respuesta NRF / Anest. / Cir. Lo que hayas tecleado en la pantalla (eventos, alarmas, hitos…) sale ya impreso en su fila.</p><p>Los botones <b>Ahora</b> ponen la hora actual, y <b>+ Evento</b> añade una fila de registro ya con la hora. No lleva etiqueta ni nº de historia del paciente.</p>"
    },
    {
      titulo: "Mis apuntes",
      html: "<p>Tarjeta <b>Mis apuntes</b>: tu documento personal de parámetros, filtros y fotos, hecho de <b>cajas de texto con título</b> que se guardan solas (y el botón <b>Guardar</b>, siempre visible abajo, te confirma la hora y sube al momento).</p><p>Puedes agrupar las cajas en <b>carpetas</b>, cada una con su color (pulsa el cuadradito para cambiarlo) y ordenarlas con las flechas ▲▼. Cada caja tiene botones <b>B</b> (negrita) e <b>I</b> (cursiva) y sus propias <b>fotos</b> debajo: cada foto se guarda como archivo aparte, sin límite práctico.</p><p><b>Exportar como Word</b> descarga un .docx con todo (carpetas, cajas con su formato y fotos) para abrirlo y editarlo en Word.</p>"
    },
    {
      titulo: "Uso desde el móvil",
      html: "<p>La interfaz es táctil. Lo cómodo es <b>pulsar y colocar</b>: tocas el material, el catálogo se pliega solo para dejar ver las cajas, y tocas la entrada de destino. En cuanto lo colocas, se suelta la selección y el catálogo se despliega solo otra vez, listo para el siguiente ítem. Arrastrar no funciona bien en pantallas táctiles, así que ese es el flujo recomendado.</p><p>Las fotos (montaje, pruebas de imagen, planificación, apuntes) se pueden hacer con el botón <b>📷</b> junto a «Añadir imagen», y quitar una siempre pide confirmación. Se guardan aparte del resto de datos, así que ya no hay que preocuparse por el espacio del móvil.</p>"
    }
  ]

};
