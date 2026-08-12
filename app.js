(function () {
  "use strict";

  var DATA = window.SURGERIES_DATA || {};
  var CAJAS = DATA.cajas_material || {};
  var CATALOGO_BASE = DATA.catalogo_material || [];
  var ETIQUETAS_BASE = DATA.etiquetas || [];
  var TECNICAS = DATA.tecnicas || [];
  var PERFILES = DATA.perfiles_procedimiento || [];
  var STORAGE_KEY = "mio_ionm_escenarios_v1";

  // Índice de técnicas: id -> técnica
  var TECS = {};
  TECNICAS.forEach(function (g) {
    (g.items || []).forEach(function (t) { TECS[t.id] = t; });
  });

  /* ---------------------------------------------------------------- *
   * Etiquetas = tipos físicos de material (aguja trenzada, sacacorchos,
   * pegatina...). Deciden qué se cuenta en el resumen y cómo se ve el chip.
   *
   * Las de fábrica viven en data/surgeries.js. El usuario puede crear las
   * suyas, y también editar o borrar las de fábrica: una etiqueta propia
   * con el mismo id sustituye a la de fábrica, y etiquetasBorradas guarda
   * las que ha quitado.
   * ---------------------------------------------------------------- */
  var PALETA = {
    rojo: "#cc2f24", azul: "#2565c4", verde: "#248a3c", amarillo: "#d3a800",
    negro: "#14171a", naranja: "#d2691e", morado: "#7b3fa0",
    turquesa: "#0d8f8f", gris: "#8896a2"
  };
  var BORDES = {
    solido: "solid", punteado: "dotted", discontinuo: "dashed",
    doble: "double", grueso: "solid", ninguno: "none"
  };

  var etiquetasUsuario = [];    // [{id, nombre, borde, color, fondo}]
  var etiquetasBorradas = [];   // ids de etiquetas de fábrica que el usuario ha quitado
  var ETIQUETAS = [];           // lista final, ordenada
  var ETQ = {};                 // id -> etiqueta

  function reconstruirEtiquetas() {
    ETIQUETAS = [];
    ETQ = {};
    ETIQUETAS_BASE.forEach(function (e) {
      if (etiquetasBorradas.indexOf(e.id) !== -1) return;
      var copia = Object.assign({}, e);
      ETQ[copia.id] = copia;
      ETIQUETAS.push(copia);
    });
    etiquetasUsuario.forEach(function (e) {
      var copia = Object.assign({}, e, { propia: true });
      var previa = ETQ[copia.id];
      if (previa) {
        // Reedición de una etiqueta de fábrica: ocupa su mismo sitio
        ETIQUETAS[ETIQUETAS.indexOf(previa)] = copia;
      } else {
        ETIQUETAS.push(copia);
      }
      ETQ[copia.id] = copia;
    });
  }

  function etiquetaPorNombre(nombre) {
    if (!nombre) return null;
    var buscado = nombre.trim().toLowerCase();
    for (var i = 0; i < ETIQUETAS.length; i++) {
      if (ETIQUETAS[i].nombre.trim().toLowerCase() === buscado) return ETIQUETAS[i];
    }
    return null;
  }

  function idLibreEtiqueta(nombre) {
    var base = "e_" + normalizar(nombre || "etiqueta");
    var id = base, n = 2;
    while (ETQ[id]) { id = base + "_" + n; n++; }
    return id;
  }

  // Etiqueta efectiva de un ítem: el override de la colocación manda sobre
  // la del ítem. "material" es el campo antiguo (texto suelto) de copias
  // exportadas antes de que existieran las etiquetas.
  function etiquetaDe(item, override) {
    if (!item) return null;
    if (override && ETQ[override]) return ETQ[override];
    if (item.etiqueta && ETQ[item.etiqueta]) return ETQ[item.etiqueta];
    return etiquetaPorNombre(item.material);
  }

  function nombreEtiquetaDe(item, override) {
    var et = etiquetaDe(item, override);
    return et ? et.nombre : (item && item.material) || "Sin etiqueta";
  }

  // El ítem puede sobreescribir cualquiera de las tres señas de la etiqueta
  function estiloDe(item, override) {
    var et = etiquetaDe(item, override) || {};
    return {
      borde: item.borde || et.borde || "solido",
      color: item.color || et.color || null,
      fondo: item.fondo || et.fondo || "ninguno"
    };
  }

  function colorHex(valor) {
    if (!valor || valor === "ninguno") return null;
    if (PALETA[valor]) return PALETA[valor];
    return /^#[0-9a-f]{3,8}$/i.test(valor) ? valor : null;
  }

  function aplicarEstilo(el, estilo) {
    el.style.borderStyle = BORDES[estilo.borde] || "solid";
    el.style.borderWidth = (estilo.borde === "grueso" || estilo.borde === "doble") ? "3px" : "1px";
    var borde = colorHex(estilo.color);
    if (borde) el.style.borderColor = borde;
    var fondo = colorHex(estilo.fondo);
    // Tinte suave: el mismo color con alfa, para que se lea igual sobre el
    // panel claro del catálogo y sobre el fondo oscuro de las cajas.
    if (fondo) el.style.backgroundColor = fondo + "2e";
  }

  /* ---------------------------------------------------------------- *
   * Catálogo = material de fábrica (data/surgeries.js) + material propio
   * que el usuario añade desde la interfaz.
   * ---------------------------------------------------------------- */
  var catalogoUsuario = [];   // [{id, nombre, categoria, material, color, nota, sin_entrada}]
  var CATALOGO = [];          // agrupado, listo para pintar
  var ITEMS = {};             // id -> item

  function reconstruirCatalogo() {
    ITEMS = {};
    CATALOGO = [];

    CATALOGO_BASE.forEach(function (grupo) {
      var items = (grupo.items || []).map(function (item) {
        var completo = Object.assign({}, item, {
          categoria: grupo.categoria,
          // Material que se prepara pero no se conecta a ninguna entrada
          sin_entrada: !!(item.sin_entrada || grupo.sin_entrada)
        });
        ITEMS[item.id] = completo;
        return completo;
      });
      CATALOGO.push({ categoria: grupo.categoria, items: items });
    });

    catalogoUsuario.forEach(function (item) {
      var completo = Object.assign({}, item, { propio: true });
      var previo = ITEMS[item.id];
      ITEMS[item.id] = completo;
      var grupo = CATALOGO.filter(function (g) { return g.categoria === item.categoria; })[0];
      if (!grupo) {
        grupo = { categoria: item.categoria, items: [] };
        CATALOGO.push(grupo);
      }
      // Un ítem propio con el id de uno de fábrica lo sustituye en su sitio,
      // para poder retocar el material que viene de serie sin duplicarlo.
      var i = previo ? grupo.items.indexOf(previo) : -1;
      if (i !== -1) grupo.items[i] = completo;
      else grupo.items.push(completo);
      // Si además cambió de categoría, hay que sacarlo de la anterior
      if (previo && i === -1) {
        CATALOGO.forEach(function (g) {
          var j = g.items.indexOf(previo);
          if (j !== -1) g.items.splice(j, 1);
        });
      }
    });
  }

  function categoriasExistentes() {
    return CATALOGO.map(function (g) { return g.categoria; });
  }

  function normalizar(texto) {
    return (texto || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "x";
  }

  function idLibre(nombre) {
    var base = "u_" + normalizar(nombre || "material");
    var id = base, n = 2;
    while (ITEMS[id]) { id = base + "_" + n; n++; }
    return id;
  }

  /* ---------------------------------------------------------------- *
   * Estado
   * ---------------------------------------------------------------- */
  var escenarios = {};
  var activo = null;

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function cargarEstado() {
    escenarios = clonar(DATA.escenarios || {});
    catalogoUsuario = [];
    etiquetasUsuario = [];
    etiquetasBorradas = [];
    var guardado = null;
    try {
      guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      guardado = null;
    }
    if (guardado && Array.isArray(guardado.etiquetas_usuario)) {
      etiquetasUsuario = guardado.etiquetas_usuario;
    }
    if (guardado && Array.isArray(guardado.etiquetas_borradas)) {
      etiquetasBorradas = guardado.etiquetas_borradas;
    }
    if (guardado && Array.isArray(guardado.catalogo_usuario)) {
      catalogoUsuario = guardado.catalogo_usuario;
    }
    reconstruirEtiquetas();
    migrarMaterialALaEtiqueta();
    reconstruirCatalogo();
    if (guardado && guardado.escenarios) {
      // Lo guardado manda: incluye ediciones de los presets de fábrica
      Object.keys(guardado.escenarios).forEach(function (id) {
        escenarios[id] = guardado.escenarios[id];
      });
      // Respeta los borrados del usuario sobre presets de fábrica
      (guardado.borrados || []).forEach(function (id) {
        delete escenarios[id];
      });
      activo = guardado.activo;
    }
    if (!activo || !escenarios[activo]) {
      activo = Object.keys(escenarios)[0] || null;
    }
  }

  var borrados = [];

  // Copias hechas antes de que existieran las etiquetas guardaban el tipo
  // físico como texto suelto en "material". Se convierte a etiqueta: si el
  // texto coincide con una existente se reutiliza, y si no se crea una nueva
  // para no perder el recuento.
  function migrarMaterialALaEtiqueta() {
    var nuevas = false;
    catalogoUsuario.forEach(function (item) {
      if (item.etiqueta || !item.material) return;
      var et = etiquetaPorNombre(item.material);
      if (!et) {
        et = {
          id: idLibreEtiqueta(item.material),
          nombre: item.material,
          borde: "solido", color: "gris", fondo: "ninguno"
        };
        etiquetasUsuario.push(et);
        ETQ[et.id] = et;
        ETIQUETAS.push(et);
        nuevas = true;
      }
      item.etiqueta = et.id;
      delete item.material;
    });
    if (nuevas) reconstruirEtiquetas();
  }

  function guardarEstado() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        escenarios: escenarios,
        activo: activo,
        borrados: borrados,
        catalogo_usuario: catalogoUsuario,
        etiquetas_usuario: etiquetasUsuario,
        etiquetas_borradas: etiquetasBorradas
      }));
      avisoGuardado("Guardado en este navegador · " + new Date().toLocaleTimeString("es-ES"));
      programarSubida();
    } catch (e) {
      avisoGuardado("No se ha podido guardar: " + e.message, true);
    }
  }

  function avisoGuardado(texto, esError) {
    var el = document.getElementById("guardado-aviso");
    el.textContent = texto;
    el.className = "guardado-aviso" + (esError ? " error" : "");
  }

  function escenarioActual() {
    return escenarios[activo] || null;
  }

  // Material extra del escenario (no ocupa entrada de ninguna caja)
  function extrasDe() {
    var esc = escenarioActual();
    if (!esc) return [];
    if (!esc.extras) esc.extras = [];
    return esc.extras;
  }

  function alternarExtra(itemId) {
    var arr = extrasDe();
    var i = arr.indexOf(itemId);
    if (i === -1) arr.push(itemId); else arr.splice(i, 1);
    guardarEstado();
    renderCatalogo();
    renderResumen();
  }

  // Técnicas marcadas en el escenario
  function tecnicasDe() {
    var esc = escenarioActual();
    if (!esc) return [];
    if (!esc.tecnicas) esc.tecnicas = [];
    return esc.tecnicas;
  }

  function alternarTecnica(id) {
    var arr = tecnicasDe();
    var i = arr.indexOf(id);
    if (i === -1) arr.push(id); else arr.splice(i, 1);
    guardarEstado();
    renderTecnicas();
    renderResumen();
  }

  /* Etiqueta elegida para UNA colocación concreta. Vive en el escenario,
     igual que el conmutador, así que el mismo A1 puede ir con sacacorchos
     en una cirugía y con aguja en otra sin duplicarlo en el catálogo. */
  function claveEntrada(cajaKey, entradaId) {
    return cajaKey + "/" + entradaId;
  }

  function etiquetaColocada(cajaKey, entradaId) {
    var esc = escenarioActual();
    if (!esc || !esc.etiquetas) return null;
    return esc.etiquetas[claveEntrada(cajaKey, entradaId)] || null;
  }

  function fijarEtiquetaColocada(cajaKey, entradaId, etiquetaId, itemId) {
    var esc = escenarioActual();
    if (!esc) return;
    if (!esc.etiquetas) esc.etiquetas = {};
    var clave = claveEntrada(cajaKey, entradaId);
    var item = ITEMS[itemId];
    // Si vuelve a la etiqueta propia del ítem no hace falta guardar nada
    if (item && item.etiqueta === etiquetaId) delete esc.etiquetas[clave];
    else esc.etiquetas[clave] = etiquetaId;
  }

  function olvidarEtiquetaColocada(cajaKey, entradaId) {
    var esc = escenarioActual();
    if (esc && esc.etiquetas) delete esc.etiquetas[claveEntrada(cajaKey, entradaId)];
  }

  function asignacionesDe(cajaKey) {
    var esc = escenarioActual();
    if (!esc) return {};
    if (!esc.asignaciones) esc.asignaciones = {};
    if (!esc.asignaciones[cajaKey]) esc.asignaciones[cajaKey] = {};
    return esc.asignaciones[cajaKey];
  }

  /* ---------------------------------------------------------------- *
   * Definición de entradas de una caja
   * ---------------------------------------------------------------- */
  function infoCaja(key) {
    var info = CAJAS[key] || { nombre: key, descripcion: "" };
    return {
      nombre: info.nombre || key,
      descripcion: info.descripcion || "",
      canales: info.canales || 8,
      conector: info.conector || "par",
      inicio: info.numeracion_inicio || 1,
      especiales: info.especiales || []
    };
  }

  // Devuelve todas las entradas de una caja como lista plana de descriptores
  function entradasDe(key) {
    var info = infoCaja(key);
    var out = [];
    var i, n;
    for (i = 0; i < info.canales; i++) {
      n = info.inicio + i;
      if (info.conector === "anodal_catodal") {
        out.push({ id: n + ":anodal", etiqueta: n, polo: "anodal", conector: "rojo" });
        out.push({ id: n + ":catodal", etiqueta: n, polo: "catodal", conector: "negro" });
      } else if (info.conector === "par") {
        out.push({ id: String(n), etiqueta: n, conector: "par" });
      } else {
        out.push({ id: String(n), etiqueta: n, conector: "individual" });
      }
    }
    info.especiales.forEach(function (esp) {
      out.push({
        id: esp.clave,
        etiqueta: esp.nombre,
        conector: esp.conector === "par" ? "par" : (esp.color || "individual"),
        nota: esp.nota,
        especial: true
      });
    });
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Selección por clic (alternativa a arrastrar)
   * ---------------------------------------------------------------- */
  var seleccionado = null;

  function seleccionar(itemId) {
    seleccionado = itemId;
    var barra = document.getElementById("barra-seleccion");
    if (itemId && ITEMS[itemId]) {
      document.getElementById("bs-nombre").textContent = ITEMS[itemId].nombre;
      barra.hidden = false;
      document.body.classList.add("hay-seleccion");
    } else {
      seleccionado = null;
      barra.hidden = true;
      document.body.classList.remove("hay-seleccion");
    }
    document.querySelectorAll(".chip.seleccionado").forEach(function (c) {
      c.classList.remove("seleccionado");
    });
    if (seleccionado) {
      document.querySelectorAll('#catalogo-contenido .chip[data-item-id="' + seleccionado + '"]')
        .forEach(function (c) { c.classList.add("seleccionado"); });
      // En móvil el catálogo ocupa media pantalla: se pliega para dejar ver las cajas
      if (window.matchMedia("(max-width: 900px)").matches) {
        document.getElementById("panel-catalogo").classList.add("plegado");
        document.getElementById("btn-plegar").textContent = "▸";
      }
    }
  }

  function colocar(cajaKey, entradaId, itemId) {
    asignacionesDe(cajaKey)[entradaId] = itemId;
    // La etiqueta que hubiera elegida era del material anterior
    olvidarEtiquetaColocada(cajaKey, entradaId);
    guardarEstado();
    renderCajas();
    renderResumen();
  }

  /* ---------------------------------------------------------------- *
   * Chips
   * ---------------------------------------------------------------- */
  function crearChip(item, opciones) {
    opciones = opciones || {};
    var chip = document.createElement("span");
    chip.className = "chip" + (opciones.colocado ? " chip-colocado" : "");
    chip.draggable = true;
    chip.dataset.itemId = item.id;
    if (opciones.cajaKey) chip.dataset.origenCaja = opciones.cajaKey;
    if (opciones.entradaId) chip.dataset.origenEntrada = opciones.entradaId;

    // Aspecto según el tipo físico (etiqueta), con el override de la
    // colocación si lo hay: borde, color de borde y tinte de fondo.
    var override = opciones.colocado
      ? etiquetaColocada(opciones.cajaKey, opciones.entradaId) : null;
    var etiqueta = etiquetaDe(item, override);
    aplicarEstilo(chip, estiloDe(item, override));

    var rotulo = etiqueta ? etiqueta.nombre : "sin etiqueta";
    chip.title = (item.nota ? item.nota + "\n" : "") + "Tipo: " + rotulo;

    if (item.color) {
      var dot = document.createElement("span");
      dot.className = "color-dot color-" + item.color;
      chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(item.nombre));

    // Material propio: lápiz para editarlo (solo en el catálogo)
    if (item.propio && !opciones.colocado) {
      chip.classList.add("chip-propio");
      var lapiz = document.createElement("button");
      lapiz.type = "button";
      lapiz.className = "chip-editar";
      lapiz.textContent = "✎";
      lapiz.title = "Editar este material";
      lapiz.addEventListener("click", function (e) {
        e.stopPropagation();
        abrirEditorMaterial(item.id);
      });
      chip.appendChild(lapiz);
    }

    if (item.sin_entrada) {
      // No se arrastra ni se coloca: se activa o desactiva para el escenario
      chip.draggable = false;
      chip.classList.add("chip-extra");
      if (extrasDe().indexOf(item.id) !== -1) chip.classList.add("activo");
      chip.addEventListener("click", function () { alternarExtra(item.id); });
      return chip;
    }

    if (item.conmutador && opciones.colocado) {
      var sel = document.createElement("select");
      sel.className = "chip-select";
      (item.opciones || []).forEach(function (op) {
        var o = document.createElement("option");
        o.textContent = op;
        sel.appendChild(o);
      });
      var esc = escenarioActual();
      var guardadoSel = esc && esc.conmutador && esc.conmutador[opciones.cajaKey + "/" + opciones.entradaId];
      if (guardadoSel) sel.value = guardadoSel;
      ["mousedown", "click", "dragstart"].forEach(function (ev) {
        sel.addEventListener(ev, function (e) { e.stopPropagation(); });
      });
      sel.addEventListener("change", function () {
        var e2 = escenarioActual();
        if (!e2.conmutador) e2.conmutador = {};
        e2.conmutador[opciones.cajaKey + "/" + opciones.entradaId] = sel.value;
        guardarEstado();
        renderResumen();
      });
      chip.appendChild(sel);
    }

    if (!opciones.colocado) {
      // Chip del catálogo: al pulsarlo queda seleccionado para colocar
      chip.addEventListener("click", function () {
        seleccionar(seleccionado === item.id ? null : item.id);
      });
    }

    if (opciones.colocado) {
      // Selector de tipo físico para ESTA colocación: el mismo A1 puede ir
      // con sacacorchos en una cirugía y con aguja en otra.
      var selEt = document.createElement("select");
      selEt.className = "chip-select chip-etiqueta";
      selEt.title = "Tipo físico de material en esta entrada";
      ETIQUETAS.forEach(function (et) {
        var o = document.createElement("option");
        o.value = et.id;
        o.textContent = et.nombre;
        selEt.appendChild(o);
      });
      if (etiqueta) selEt.value = etiqueta.id;
      ["mousedown", "click", "dragstart"].forEach(function (ev) {
        selEt.addEventListener(ev, function (e) { e.stopPropagation(); });
      });
      selEt.addEventListener("change", function () {
        fijarEtiquetaColocada(opciones.cajaKey, opciones.entradaId, selEt.value, item.id);
        guardarEstado();
        renderCajas();
        renderResumen();
      });
      chip.appendChild(selEt);

      var quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "chip-quitar";
      quitar.textContent = "✕";
      quitar.title = "Quitar de esta entrada";
      quitar.addEventListener("click", function (e) {
        e.stopPropagation();
        delete asignacionesDe(opciones.cajaKey)[opciones.entradaId];
        olvidarEtiquetaColocada(opciones.cajaKey, opciones.entradaId);
        guardarEstado();
        renderCajas();
        renderResumen();
      });
      chip.appendChild(quitar);
    }

    return chip;
  }

  /* ---------------------------------------------------------------- *
   * Drag & drop (delegado en document)
   * ---------------------------------------------------------------- */
  var arrastrando = null;

  document.addEventListener("dragstart", function (e) {
    var chip = e.target.closest && e.target.closest(".chip");
    if (!chip) return;
    arrastrando = {
      itemId: chip.dataset.itemId,
      origenCaja: chip.dataset.origenCaja || null,
      origenEntrada: chip.dataset.origenEntrada || null
    };
    chip.classList.add("arrastrando");
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", chip.dataset.itemId);
  });

  document.addEventListener("dragend", function (e) {
    pararAutoScroll();
    var chip = e.target.closest && e.target.closest(".chip");
    if (chip) chip.classList.remove("arrastrando");
    document.querySelectorAll(".sobre").forEach(function (el) {
      el.classList.remove("sobre");
    });
    arrastrando = null;
  });

  // Auto-scroll al arrastrar cerca del borde superior/inferior de la ventana
  var autoScroll = null;
  function pararAutoScroll() {
    if (autoScroll) { clearInterval(autoScroll); autoScroll = null; }
  }
  function evaluarAutoScroll(y) {
    var margen = 90;
    var dir = 0;
    if (y < margen) dir = -1;
    else if (y > window.innerHeight - margen) dir = 1;
    pararAutoScroll();
    if (dir) {
      autoScroll = setInterval(function () { window.scrollBy(0, dir * 22); }, 16);
    }
  }

  document.addEventListener("dragover", function (e) {
    evaluarAutoScroll(e.clientY);
    var slot = e.target.closest && e.target.closest(".slot");
    if (slot) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      slot.classList.add("sobre");
      return;
    }
    // Soltar sobre el catálogo = quitar de la caja
    var cat = e.target.closest && e.target.closest(".panel-catalogo");
    if (cat && arrastrando && arrastrando.origenCaja) {
      e.preventDefault();
      cat.classList.add("sobre");
    }
  });

  document.addEventListener("dragleave", function (e) {
    var el = e.target.closest && e.target.closest(".slot, .panel-catalogo");
    if (el) el.classList.remove("sobre");
  });

  document.addEventListener("drop", function (e) {
    pararAutoScroll();
    if (!arrastrando) return;

    var slot = e.target.closest && e.target.closest(".slot");
    if (slot) {
      e.preventDefault();
      slot.classList.remove("sobre");
      var destinoCaja = slot.dataset.caja;
      var destinoEntrada = slot.dataset.entrada;

      // Mover dentro/entre cajas: liberar el origen y llevarse su etiqueta
      var etiquetaViajera = null;
      if (arrastrando.origenCaja) {
        etiquetaViajera = etiquetaColocada(arrastrando.origenCaja, arrastrando.origenEntrada);
        delete asignacionesDe(arrastrando.origenCaja)[arrastrando.origenEntrada];
        olvidarEtiquetaColocada(arrastrando.origenCaja, arrastrando.origenEntrada);
      }
      asignacionesDe(destinoCaja)[destinoEntrada] = arrastrando.itemId;
      olvidarEtiquetaColocada(destinoCaja, destinoEntrada);
      if (etiquetaViajera) {
        fijarEtiquetaColocada(destinoCaja, destinoEntrada, etiquetaViajera, arrastrando.itemId);
      }
      guardarEstado();
      renderCajas();
      renderResumen();
      return;
    }

    var cat = e.target.closest && e.target.closest(".panel-catalogo");
    if (cat && arrastrando.origenCaja) {
      e.preventDefault();
      cat.classList.remove("sobre");
      delete asignacionesDe(arrastrando.origenCaja)[arrastrando.origenEntrada];
      olvidarEtiquetaColocada(arrastrando.origenCaja, arrastrando.origenEntrada);
      guardarEstado();
      renderCajas();
      renderResumen();
    }
  });

  /* ---------------------------------------------------------------- *
   * Render: catálogo maestro
   * ---------------------------------------------------------------- */
  function renderCatalogo() {
    var cont = document.getElementById("catalogo-contenido");
    var filtro = (document.getElementById("catalogo-buscar").value || "").toLowerCase().trim();
    cont.innerHTML = "";

    CATALOGO.forEach(function (grupo) {
      var items = (grupo.items || []).filter(function (it) {
        if (!filtro) return true;
        return (it.nombre + " " + (it.nota || "") + " " + grupo.categoria).toLowerCase().indexOf(filtro) !== -1;
      });
      if (!items.length) return;

      var bloque = document.createElement("div");
      bloque.className = "catalogo-grupo";
      var h = document.createElement("div");
      h.className = "grupo-titulo";
      h.textContent = grupo.categoria;
      bloque.appendChild(h);
      var fila = document.createElement("div");
      fila.className = "chip-fila";
      items.forEach(function (it) {
        fila.appendChild(crearChip(ITEMS[it.id], {}));
      });
      bloque.appendChild(fila);
      cont.appendChild(bloque);
    });

    if (!cont.children.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = "Ningún material coincide con la búsqueda.";
      cont.appendChild(vacio);
    }
  }

  /* ---------------------------------------------------------------- *
   * Sincronización con GitHub
   *
   * El estado vive en localStorage y la herramienta funciona sin conexión.
   * Subir y bajar son acciones manuales contra un repositorio privado de
   * datos (nunca el del código, que se publica). Si el archivo remoto ha
   * cambiado desde la última vez, se avisa en lugar de pisarlo.
   * ---------------------------------------------------------------- */
  var SYNC_KEY = "mio_ionm_sync_v1";
  var RUTA_REMOTA = "estado.json";
  // pendiente: hay cambios locales sin subir. Sobrevive al cierre del
  // navegador para no bajar encima de ellos al abrir en otro sitio.
  var sync = { repo: "", token: "", sha: null, fecha: null, pendiente: false };

  var RETARDO_SUBIDA = 4000;   // margen para no subir en cada tecleo
  var temporizador = null;
  var subiendo = false;
  var conflicto = false;       // el remoto cambió desde otro dispositivo
  var ultimoFallo = null;

  function syncActivo() {
    return !!(sync.repo && sync.token);
  }

  function enQuirofano() {
    return document.body.classList.contains("modo-quirofano");
  }

  function cargarSync() {
    try {
      var g = JSON.parse(localStorage.getItem(SYNC_KEY) || "null");
      if (g) sync = Object.assign(sync, g);
    } catch (e) { /* configuración ausente o ilegible */ }
  }

  function guardarSync() {
    try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch (e) { /* sin persistencia */ }
  }

  function pintarEstadoSync() {
    var el = document.getElementById("sync-estado");
    var btn = document.getElementById("btn-sync");
    var estado = "ok";
    if (!syncActivo()) {
      el.textContent = "Sin conectar";
      estado = "off";
    } else if (conflicto) {
      el.textContent = "Conflicto";
      estado = "error";
    } else if (subiendo) {
      el.textContent = "Sincronizando…";
    } else if (ultimoFallo) {
      el.textContent = "Sin subir";
      estado = "error";
    } else if (sync.pendiente) {
      el.textContent = enQuirofano() ? "En pausa" : "Guardando…";
      estado = "aviso";
    } else if (sync.fecha) {
      el.textContent = "Sinc. " + new Date(sync.fecha).toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
      });
    } else {
      el.textContent = "Conectado";
    }
    btn.dataset.estado = estado;
    btn.title = ultimoFallo || (conflicto
      ? "En GitHub hay una versión más reciente. Abre para resolverlo."
      : "Sincronizar con GitHub");
  }

  function mensajeSync(texto, esError) {
    var err = document.getElementById("sync-error");
    var ok = document.getElementById("sync-ok");
    err.hidden = true; ok.hidden = true;
    if (!texto) return;
    var destino = esError ? err : ok;
    destino.textContent = texto;
    destino.hidden = false;
  }

  // btoa/atob no admiten caracteres no ASCII: hay acentos en los nombres
  function aBase64(texto) {
    var bytes = new TextEncoder().encode(texto);
    var bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  function deBase64(b64) {
    var bin = atob(b64.replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function urlContenido() {
    return "https://api.github.com/repos/" + sync.repo + "/contents/" + RUTA_REMOTA;
  }

  function cabeceras() {
    return {
      "Authorization": "Bearer " + sync.token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }

  function errorLegible(resp) {
    if (resp.status === 401) return "Token no válido o caducado.";
    if (resp.status === 403) return "El token no tiene permiso de escritura sobre ese repositorio.";
    if (resp.status === 404) return "No se encuentra el repositorio. Revisa el nombre y que el token lo incluya.";
    if (resp.status === 409) return "Conflicto: el archivo remoto ha cambiado.";
    return "GitHub respondió " + resp.status + ".";
  }

  function estadoActual() {
    return {
      formato: "mio-ionm",
      version: 2,
      fecha: new Date().toISOString(),
      escenarios: escenarios,
      catalogo_usuario: catalogoUsuario,
      etiquetas_usuario: etiquetasUsuario,
      etiquetas_borradas: etiquetasBorradas,
      borrados: borrados,
      activo: activo
    };
  }

  function aplicarEstado(copia) {
    escenarios = copia.escenarios || {};
    catalogoUsuario = copia.catalogo_usuario || [];
    etiquetasUsuario = copia.etiquetas_usuario || [];
    etiquetasBorradas = copia.etiquetas_borradas || [];
    borrados = copia.borrados || [];
    activo = copia.activo && escenarios[copia.activo] ? copia.activo : Object.keys(escenarios)[0] || null;
    reconstruirEtiquetas();
    migrarMaterialALaEtiqueta();   // copias de la versión 1, sin etiquetas
    reconstruirCatalogo();
    guardarEstado();
    renderTodo();
  }

  // Lee el archivo remoto. Devuelve {existe, contenido, sha} o lanza error.
  function leerRemoto() {
    return fetch(urlContenido() + "?ref=HEAD", { headers: cabeceras(), cache: "no-store" })
      .then(function (resp) {
        // 404 = el archivo no existe todavía; 409 = el repositorio está recién
        // creado y aún no tiene ningún commit. En ambos casos hay que crearlo.
        if (resp.status === 404 || resp.status === 409) {
          return { existe: false, sha: null, contenido: null };
        }
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json().then(function (json) {
          return { existe: true, sha: json.sha, contenido: JSON.parse(deBase64(json.content)) };
        });
      });
  }

  // Escribe el estado en el repositorio. shaRemoto identifica la versión
  // sobre la que escribimos (GitHub la exige para no pisar a ciegas).
  function enviarEstado(shaRemoto) {
    var cuerpo = {
      message: "Actualizar escenarios MIO/IONM",
      content: aBase64(JSON.stringify(estadoActual(), null, 2))
    };
    if (shaRemoto) cuerpo.sha = shaRemoto;
    return fetch(urlContenido(), {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify(cuerpo)
    }).then(function (resp) {
      if (!resp.ok) throw new Error(errorLegible(resp));
      return resp.json();
    }).then(function (json) {
      sync.sha = json.content.sha;
      sync.fecha = new Date().toISOString();
      sync.pendiente = false;
      conflicto = false;
      ultimoFallo = null;
      guardarSync();
      pintarEstadoSync();
    });
  }

  function subir(forzar) {
    if (!syncActivo()) return;
    mensajeSync("Subiendo…");
    leerRemoto()
      .then(function (remoto) {
        // Si en el repositorio hay algo más nuevo que lo que bajamos, avisamos
        if (remoto.existe && sync.sha && remoto.sha !== sync.sha && !forzar) {
          var f = remoto.contenido && remoto.contenido.fecha
            ? new Date(remoto.contenido.fecha).toLocaleString("es-ES") : "fecha desconocida";
          if (!confirm(
            "En GitHub hay una versión más reciente (" + f + ") que no tienes en este dispositivo.\n\n" +
            "Si subes ahora, la sustituyes y pierdes esos cambios.\n" +
            "Cancela y pulsa «Bajar» si prefieres traértela primero.\n\n¿Subir de todas formas?"
          )) {
            mensajeSync("Subida cancelada. Pulsa «Bajar» para traer la versión de GitHub.", true);
            return null;
          }
        }
        return enviarEstado(remoto.sha).then(function () {
          mensajeSync("Subido correctamente.");
        });
      })
      .catch(function (e) { mensajeSync(e.message || "No se ha podido subir.", true); });
  }

  /* -------- Automático --------------------------------------------- *
   * Guardar deja una marca de "pendiente" y arranca una cuenta atrás.
   * Nunca se pisa lo remoto a la brava: si ha cambiado desde otro
   * dispositivo se marca conflicto y se deja en manos del usuario.
   * ------------------------------------------------------------------ */
  function programarSubida() {
    if (!syncActivo()) return;
    sync.pendiente = true;
    guardarSync();
    pintarEstadoSync();
    if (temporizador) clearTimeout(temporizador);
    // En quirófano no se toca la red: se sube al salir del modo
    if (enQuirofano()) return;
    temporizador = setTimeout(function () {
      temporizador = null;
      subirAuto();
    }, RETARDO_SUBIDA);
  }

  function subirAuto() {
    if (!syncActivo() || subiendo || conflicto || !sync.pendiente) return;
    if (navigator.onLine === false) { pintarEstadoSync(); return; }
    subiendo = true;
    pintarEstadoSync();
    leerRemoto()
      .then(function (remoto) {
        if (remoto.existe && sync.sha && remoto.sha !== sync.sha) {
          conflicto = true;
          return null;   // hay que decidir a mano cuál se queda
        }
        return enviarEstado(remoto.sha);
      })
      .catch(function (e) { ultimoFallo = e.message || "No se ha podido subir."; })
      .then(function () {
        subiendo = false;
        pintarEstadoSync();
      });
  }

  // Al abrir: si no hay nada local sin subir, se trae lo último sin preguntar
  function bajarAuto() {
    if (!syncActivo() || navigator.onLine === false) return;
    if (sync.pendiente) { subirAuto(); return; }
    subiendo = true;
    pintarEstadoSync();
    leerRemoto()
      .then(function (remoto) {
        if (!remoto.existe || remoto.sha === sync.sha) return;
        var copia = remoto.contenido;
        if (!copia || copia.formato !== "mio-ionm") return;
        aplicarEstado(copia);
        sync.sha = remoto.sha;
        sync.fecha = new Date().toISOString();
        // aplicarEstado guarda, y guardar deja pendiente: no lo está
        sync.pendiente = false;
        if (temporizador) { clearTimeout(temporizador); temporizador = null; }
        guardarSync();
        avisoGuardado("Traído de GitHub · " + new Date().toLocaleTimeString("es-ES"));
      })
      .catch(function (e) { ultimoFallo = e.message || "No se ha podido bajar."; })
      .then(function () {
        subiendo = false;
        pintarEstadoSync();
      });
  }

  // Al volver la conexión se reintenta lo que quedó pendiente
  window.addEventListener("online", function () {
    ultimoFallo = null;
    if (sync.pendiente) subirAuto();
  });

  // Cerrar la pestaña con algo sin subir: avisa antes de perderlo de vista
  window.addEventListener("beforeunload", function (e) {
    if (syncActivo() && sync.pendiente && !enQuirofano()) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  function bajar() {
    if (!sync.repo || !sync.token) return;
    mensajeSync("Bajando…");
    leerRemoto()
      .then(function (remoto) {
        if (!remoto.existe) {
          mensajeSync("Todavía no hay nada guardado en ese repositorio. Pulsa «Subir» para crearlo.", true);
          return;
        }
        var copia = remoto.contenido;
        if (!copia || copia.formato !== "mio-ionm") throw new Error("El archivo remoto no tiene el formato esperado.");
        var nEsc = Object.keys(copia.escenarios || {}).length;
        if (!confirm(
          "Traer de GitHub la versión del " +
          new Date(copia.fecha).toLocaleString("es-ES") + ":\n" +
          "· " + nEsc + " escenario(s)\n" +
          "· " + (copia.catalogo_usuario || []).length + " material(es) propios\n\n" +
          "Sustituye lo que tengas en este dispositivo. ¿Continuar?"
        )) { mensajeSync("Descarga cancelada."); return; }
        aplicarEstado(copia);
        sync.sha = remoto.sha;
        sync.fecha = new Date().toISOString();
        // Lo local queda sustituido: ya no hay nada pendiente ni en conflicto
        sync.pendiente = false;
        conflicto = false;
        ultimoFallo = null;
        if (temporizador) { clearTimeout(temporizador); temporizador = null; }
        guardarSync();
        pintarEstadoSync();
        mensajeSync("Descargado correctamente.");
      })
      .catch(function (e) { mensajeSync(e.message || "No se ha podido bajar.", true); });
  }

  var dlgSync = document.getElementById("dlg-sync");

  document.getElementById("btn-sync").addEventListener("click", function () {
    document.getElementById("sync-repo").value = sync.repo || "";
    document.getElementById("sync-token").value = sync.token || "";
    mensajeSync(null);
    dlgSync.showModal();
  });

  function leerCamposSync() {
    var repo = document.getElementById("sync-repo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    var token = document.getElementById("sync-token").value.trim();
    if (!repo || !token) {
      mensajeSync("Hacen falta el repositorio y el token.", true);
      return false;
    }
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
      mensajeSync("El repositorio debe tener el formato usuario/repositorio.", true);
      return false;
    }
    if (repo !== sync.repo) {
      // Repo distinto: la referencia anterior no vale y hay que subirlo entero
      sync.sha = null;
      conflicto = false;
      sync.pendiente = true;
    }
    sync.repo = repo;
    sync.token = token;
    ultimoFallo = null;
    guardarSync();
    pintarEstadoSync();
    return true;
  }

  document.getElementById("sync-subir").addEventListener("click", function () {
    if (leerCamposSync()) subir(false);
  });
  document.getElementById("sync-bajar").addEventListener("click", function () {
    if (leerCamposSync()) bajar();
  });
  document.getElementById("sync-cerrar").addEventListener("click", function () { dlgSync.close(); });
  document.getElementById("sync-olvidar").addEventListener("click", function () {
    if (!confirm("¿Olvidar el token y el repositorio en este dispositivo?\nTus escenarios no se borran, y lo guardado en GitHub tampoco.")) return;
    sync = { repo: "", token: "", sha: null, fecha: null, pendiente: false };
    conflicto = false;
    ultimoFallo = null;
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    try { localStorage.removeItem(SYNC_KEY); } catch (e) { /* nada que borrar */ }
    document.getElementById("sync-repo").value = "";
    document.getElementById("sync-token").value = "";
    pintarEstadoSync();
    mensajeSync("Desconectado de GitHub.");
  });

  /* ---------------------------------------------------------------- *
   * Editor de material propio
   * ---------------------------------------------------------------- */
  var dlg = document.getElementById("dlg-material");
  var editandoId = null;

  function rellenarDatalists() {
    var dlCat = document.getElementById("lista-categorias");
    dlCat.innerHTML = "";
    categoriasExistentes().forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      dlCat.appendChild(o);
    });
  }

  // Desplegable de colores con el nombre en castellano, más "sin color"
  function rellenarSelectColor(sel, textoVacio) {
    var previo = sel.value;
    sel.innerHTML = "";
    var vacio = document.createElement("option");
    vacio.value = "";
    vacio.textContent = textoVacio;
    sel.appendChild(vacio);
    Object.keys(PALETA).forEach(function (nombre) {
      var o = document.createElement("option");
      o.value = nombre;
      o.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      sel.appendChild(o);
    });
    var ninguno = document.createElement("option");
    ninguno.value = "ninguno";
    ninguno.textContent = "Sin fondo";
    if (sel.id === "mat-fondo" || sel.id === "et-fondo") sel.appendChild(ninguno);
    // Un color a medida guardado como hex sigue siendo una opción válida
    if (previo && !sel.querySelector('option[value="' + previo + '"]')) {
      var libre = document.createElement("option");
      libre.value = previo;
      libre.textContent = previo;
      sel.appendChild(libre);
    }
    sel.value = previo;
  }

  function rellenarSelectEtiquetas(sel, valor) {
    sel.innerHTML = "";
    ETIQUETAS.forEach(function (et) {
      var o = document.createElement("option");
      o.value = et.id;
      o.textContent = et.nombre;
      sel.appendChild(o);
    });
    if (valor && ETQ[valor]) sel.value = valor;
  }

  // Chip de ejemplo que se repinta al tocar cualquier desplegable
  function refrescarPreviaMaterial() {
    var previa = document.getElementById("mat-previa");
    previa.removeAttribute("style");
    previa.textContent = document.getElementById("mat-nombre").value.trim() || "Ejemplo";
    aplicarEstilo(previa, estiloDe({
      etiqueta: document.getElementById("mat-etiqueta").value,
      borde: document.getElementById("mat-borde").value || undefined,
      color: document.getElementById("mat-color").value || undefined,
      fondo: document.getElementById("mat-fondo").value || undefined
    }, null));
  }

  function abrirEditorMaterial(id) {
    editandoId = id || null;
    var item = id ? ITEMS[id] : null;
    rellenarDatalists();
    rellenarSelectColor(document.getElementById("mat-color"), "Como la etiqueta");
    rellenarSelectColor(document.getElementById("mat-fondo"), "Como la etiqueta");
    var etActual = item ? (etiquetaDe(item, null) || {}).id : (ETIQUETAS[0] || {}).id;
    rellenarSelectEtiquetas(document.getElementById("mat-etiqueta"), etActual);
    document.getElementById("dlg-titulo").textContent = item ? "Editar material" : "Material nuevo";
    document.getElementById("mat-nombre").value = item ? item.nombre : "";
    document.getElementById("mat-categoria").value = item ? item.categoria : "";
    document.getElementById("mat-borde").value = item ? (item.borde || "") : "";
    document.getElementById("mat-color").value = item ? (item.color || "") : "";
    document.getElementById("mat-fondo").value = item ? (item.fondo || "") : "";
    document.getElementById("mat-nota").value = item ? (item.nota || "") : "";
    document.getElementById("mat-sinentrada").checked = item ? !!item.sin_entrada : false;
    document.getElementById("mat-borrar").hidden = !item;
    document.getElementById("mat-error").hidden = true;
    refrescarPreviaMaterial();
    dlg.showModal();
    document.getElementById("mat-nombre").focus();
  }

  function guardarMaterial() {
    var nombre = document.getElementById("mat-nombre").value.trim();
    var categoria = document.getElementById("mat-categoria").value.trim();
    var etiqueta = document.getElementById("mat-etiqueta").value;
    var err = document.getElementById("mat-error");

    if (!nombre || !categoria || !etiqueta) {
      err.textContent = "Nombre, categoría y etiqueta son obligatorios.";
      err.hidden = false;
      return;
    }

    var datos = {
      nombre: nombre,
      categoria: categoria,
      etiqueta: etiqueta,
      borde: document.getElementById("mat-borde").value || undefined,
      color: document.getElementById("mat-color").value || undefined,
      fondo: document.getElementById("mat-fondo").value || undefined,
      nota: document.getElementById("mat-nota").value.trim() || undefined,
      sin_entrada: document.getElementById("mat-sinentrada").checked || undefined
    };

    if (editandoId) {
      var existente = catalogoUsuario.filter(function (i) { return i.id === editandoId; })[0];
      if (existente) Object.assign(existente, datos);
    } else {
      datos.id = idLibre(nombre);
      catalogoUsuario.push(datos);
    }

    reconstruirCatalogo();
    guardarEstado();
    renderCatalogo();
    renderCajas();
    renderResumen();
    dlg.close();
  }

  function borrarMaterial() {
    if (!editandoId) return;
    var item = ITEMS[editandoId];
    // ¿Está colocado en algún escenario?
    var usos = 0;
    Object.keys(escenarios).forEach(function (eid) {
      var asig = escenarios[eid].asignaciones || {};
      Object.keys(asig).forEach(function (caja) {
        Object.keys(asig[caja]).forEach(function (ent) {
          if (asig[caja][ent] === editandoId) usos++;
        });
      });
      if ((escenarios[eid].extras || []).indexOf(editandoId) !== -1) usos++;
    });

    var msg = "¿Borrar “" + item.nombre + "” del catálogo?";
    if (usos) msg += "\n\nEstá colocado en " + usos + " entrada(s) de tus escenarios; también se quitará de ahí.";
    if (!confirm(msg)) return;

    catalogoUsuario = catalogoUsuario.filter(function (i) { return i.id !== editandoId; });
    Object.keys(escenarios).forEach(function (eid) {
      var asig = escenarios[eid].asignaciones || {};
      Object.keys(asig).forEach(function (caja) {
        Object.keys(asig[caja]).forEach(function (ent) {
          if (asig[caja][ent] !== editandoId) return;
          delete asig[caja][ent];
          // La etiqueta elegida para esa entrada se queda sin dueño
          if (escenarios[eid].etiquetas) delete escenarios[eid].etiquetas[caja + "/" + ent];
        });
      });
      if (escenarios[eid].extras) {
        escenarios[eid].extras = escenarios[eid].extras.filter(function (x) { return x !== editandoId; });
      }
    });

    reconstruirCatalogo();
    guardarEstado();
    renderCatalogo();
    renderCajas();
    renderResumen();
    dlg.close();
  }

  document.getElementById("btn-nuevo-material").addEventListener("click", function () {
    abrirEditorMaterial(null);
  });
  document.getElementById("mat-guardar").addEventListener("click", guardarMaterial);
  document.getElementById("mat-borrar").addEventListener("click", borrarMaterial);
  document.getElementById("mat-cancelar").addEventListener("click", function () { dlg.close(); });
  ["mat-etiqueta", "mat-borde", "mat-color", "mat-fondo"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", refrescarPreviaMaterial);
  });
  document.getElementById("mat-nombre").addEventListener("input", refrescarPreviaMaterial);
  document.getElementById("mat-nueva-etiqueta").addEventListener("click", function () {
    abrirGestorEtiquetas(null);
  });

  /* ---------------------------------------------------------------- *
   * Gestor de etiquetas
   *
   * Se pueden crear nuevas, editar cualquiera (también las de fábrica: la
   * versión editada se guarda con el mismo id y la sustituye) y borrarlas.
   * Al borrar una hay que reasignar el material que la usaba, así que se
   * pregunta a dónde va antes de quitarla.
   * ---------------------------------------------------------------- */
  var dlgEt = document.getElementById("dlg-etiquetas");
  var editandoEtiqueta = null;

  function itemsConEtiqueta(etId) {
    return Object.keys(ITEMS).filter(function (id) {
      var et = etiquetaDe(ITEMS[id], null);
      return et && et.id === etId;
    });
  }

  function usosEnEscenarios(etId) {
    var n = 0;
    Object.keys(escenarios).forEach(function (eid) {
      var mapa = escenarios[eid].etiquetas || {};
      Object.keys(mapa).forEach(function (k) { if (mapa[k] === etId) n++; });
    });
    return n;
  }

  function refrescarPreviaEtiqueta() {
    var previa = document.getElementById("et-previa");
    previa.removeAttribute("style");
    previa.textContent = document.getElementById("et-nombre").value.trim() || "Ejemplo";
    aplicarEstilo(previa, {
      borde: document.getElementById("et-borde").value,
      color: document.getElementById("et-color").value,
      fondo: document.getElementById("et-fondo").value
    });
  }

  function renderListaEtiquetas() {
    var cont = document.getElementById("etiquetas-lista");
    cont.innerHTML = "";
    ETIQUETAS.forEach(function (et) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip chip-etiqueta-lista" + (editandoEtiqueta === et.id ? " editando" : "");
      chip.textContent = et.nombre;
      aplicarEstilo(chip, { borde: et.borde, color: et.color, fondo: et.fondo });
      var usos = itemsConEtiqueta(et.id).length;
      chip.title = usos + " material(es) del catálogo usan esta etiqueta" +
        (et.propia ? "" : " · de fábrica");
      var cuenta = document.createElement("span");
      cuenta.className = "etiqueta-usos";
      cuenta.textContent = usos;
      chip.appendChild(cuenta);
      chip.addEventListener("click", function () { cargarEtiquetaEnFormulario(et.id); });
      cont.appendChild(chip);
    });
  }

  function cargarEtiquetaEnFormulario(id) {
    editandoEtiqueta = id || null;
    var et = id ? ETQ[id] : null;
    rellenarSelectColor(document.getElementById("et-color"), "Sin color");
    rellenarSelectColor(document.getElementById("et-fondo"), "Sin fondo");
    document.getElementById("et-titulo").textContent = et
      ? "Editar «" + et.nombre + "»" + (et.propia ? "" : " (de fábrica)")
      : "Etiqueta nueva";
    document.getElementById("et-nombre").value = et ? et.nombre : "";
    document.getElementById("et-borde").value = et ? (et.borde || "solido") : "solido";
    document.getElementById("et-color").value = et ? (et.color || "") : "gris";
    document.getElementById("et-fondo").value = et ? (et.fondo || "") : "ninguno";
    document.getElementById("et-borrar").hidden = !et;
    document.getElementById("et-error").hidden = true;
    refrescarPreviaEtiqueta();
    renderListaEtiquetas();
  }

  function abrirGestorEtiquetas(id) {
    cargarEtiquetaEnFormulario(id);
    if (!dlgEt.open) dlgEt.showModal();
    document.getElementById("et-nombre").focus();
  }

  function guardarEtiqueta() {
    var nombre = document.getElementById("et-nombre").value.trim();
    var err = document.getElementById("et-error");
    if (!nombre) {
      err.textContent = "La etiqueta necesita un nombre.";
      err.hidden = false;
      return;
    }
    // Dos etiquetas con el mismo nombre se sumarían juntas en el resumen
    var choque = etiquetaPorNombre(nombre);
    if (choque && choque.id !== editandoEtiqueta) {
      err.textContent = "Ya existe una etiqueta llamada «" + choque.nombre + "».";
      err.hidden = false;
      return;
    }

    var datos = {
      id: editandoEtiqueta || idLibreEtiqueta(nombre),
      nombre: nombre,
      borde: document.getElementById("et-borde").value,
      color: document.getElementById("et-color").value,
      fondo: document.getElementById("et-fondo").value
    };

    var existente = etiquetasUsuario.filter(function (e) { return e.id === datos.id; })[0];
    if (existente) Object.assign(existente, datos);
    else etiquetasUsuario.push(datos);
    // Si estaba borrada y se vuelve a guardar, deja de estarlo
    etiquetasBorradas = etiquetasBorradas.filter(function (x) { return x !== datos.id; });

    reconstruirEtiquetas();
    reconstruirCatalogo();
    guardarEstado();
    renderTodo();
    cargarEtiquetaEnFormulario(datos.id);
  }

  function borrarEtiqueta() {
    if (!editandoEtiqueta) return;
    var et = ETQ[editandoEtiqueta];
    if (!et) return;
    if (ETIQUETAS.length < 2) {
      var err = document.getElementById("et-error");
      err.textContent = "Tiene que quedar al menos una etiqueta.";
      err.hidden = false;
      return;
    }

    var afectados = itemsConEtiqueta(et.id);
    var enEscenarios = usosEnEscenarios(et.id);
    var destino = ETIQUETAS.filter(function (e) { return e.id !== et.id; })[0];

    var msg = "¿Borrar la etiqueta “" + et.nombre + "”?";
    if (afectados.length || enEscenarios) {
      msg += "\n\n" + afectados.length + " material(es) del catálogo y " + enEscenarios +
        " colocación(es) pasarán a “" + destino.nombre + "”.";
    }
    if (!et.propia) msg += "\n\nEs una etiqueta de fábrica: volverá si pulsas «Restablecer».";
    if (!confirm(msg)) return;

    // Reasignar el material propio que la usaba
    catalogoUsuario.forEach(function (item) {
      if (item.etiqueta === et.id) item.etiqueta = destino.id;
    });
    // Y las colocaciones que la habían elegido a mano
    Object.keys(escenarios).forEach(function (eid) {
      var mapa = escenarios[eid].etiquetas;
      if (!mapa) return;
      Object.keys(mapa).forEach(function (k) {
        if (mapa[k] === et.id) mapa[k] = destino.id;
      });
    });
    // El material de fábrica no se puede reescribir: se le fija el destino
    // como override permanente creando una entrada propia mínima.
    afectados.forEach(function (itemId) {
      var item = ITEMS[itemId];
      if (item.propio || item.etiqueta !== et.id) return;
      var copia = Object.assign({}, item, { etiqueta: destino.id });
      delete copia.propio;
      catalogoUsuario.push(copia);
    });

    etiquetasUsuario = etiquetasUsuario.filter(function (e) { return e.id !== et.id; });
    if (ETIQUETAS_BASE.some(function (e) { return e.id === et.id; })) {
      etiquetasBorradas.push(et.id);
    }

    reconstruirEtiquetas();
    reconstruirCatalogo();
    guardarEstado();
    renderTodo();
    cargarEtiquetaEnFormulario(null);
  }

  document.getElementById("btn-etiquetas").addEventListener("click", function () {
    abrirGestorEtiquetas(null);
  });
  document.getElementById("et-guardar").addEventListener("click", guardarEtiqueta);
  document.getElementById("et-borrar").addEventListener("click", borrarEtiqueta);
  document.getElementById("et-nueva").addEventListener("click", function () {
    cargarEtiquetaEnFormulario(null);
    document.getElementById("et-nombre").focus();
  });
  document.getElementById("et-cerrar").addEventListener("click", function () {
    dlgEt.close();
    // El editor de material puede haberse quedado abierto detrás
    if (dlg.open) {
      rellenarSelectEtiquetas(document.getElementById("mat-etiqueta"),
        document.getElementById("mat-etiqueta").value);
      refrescarPreviaMaterial();
    }
  });
  ["et-borde", "et-color", "et-fondo"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", refrescarPreviaEtiqueta);
  });
  document.getElementById("et-nombre").addEventListener("input", refrescarPreviaEtiqueta);
  // Color a medida: se añade como opción y queda elegido en «color del borde»
  document.getElementById("et-color-libre").addEventListener("input", function () {
    var sel = document.getElementById("et-color");
    var hex = this.value;
    if (!sel.querySelector('option[value="' + hex + '"]')) {
      var o = document.createElement("option");
      o.value = hex;
      o.textContent = hex;
      sel.appendChild(o);
    }
    sel.value = hex;
    refrescarPreviaEtiqueta();
  });

  /* ---------------------------------------------------------------- *
   * Render: técnicas y perfiles
   * ---------------------------------------------------------------- */
  function renderTecnicas() {
    var cont = document.getElementById("tecnicas-contenido");
    cont.innerHTML = "";
    if (!escenarioActual()) return;
    var activas = tecnicasDe();

    TECNICAS.forEach(function (grupo) {
      var bloque = document.createElement("div");
      bloque.className = "tecnicas-grupo";
      var h = document.createElement("div");
      h.className = "grupo-titulo";
      h.textContent = grupo.grupo;
      bloque.appendChild(h);

      var fila = document.createElement("div");
      fila.className = "chip-fila";
      (grupo.items || []).forEach(function (t) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" + (activas.indexOf(t.id) !== -1 ? " activo" : "");
        chip.textContent = t.nombre;
        if (t.descripcion) chip.title = t.descripcion;
        chip.addEventListener("click", function () { alternarTecnica(t.id); });
        fila.appendChild(chip);
      });
      bloque.appendChild(fila);
      cont.appendChild(bloque);
    });
  }

  function renderPerfilSelect() {
    var sel = document.getElementById("perfil-select");
    sel.innerHTML = "";
    var vacio = document.createElement("option");
    vacio.value = "";
    vacio.textContent = "— elegir —";
    sel.appendChild(vacio);
    PERFILES.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.nombre;
      sel.appendChild(o);
    });
  }

  document.getElementById("perfil-select").addEventListener("change", function (e) {
    var perfil = PERFILES.filter(function (p) { return p.id === e.target.value; })[0];
    e.target.value = "";
    if (!perfil || !escenarioActual()) return;
    if (!confirm("¿Marcar las técnicas de “" + perfil.nombre + "”?\nSustituye las técnicas marcadas ahora mismo. El material colocado no se toca.")) return;
    escenarioActual().tecnicas = perfil.tecnicas.slice();
    if (perfil.nota) escenarioActual().nota_perfil = perfil.nombre + ": " + perfil.nota;
    guardarEstado();
    renderTecnicas();
    renderResumen();
  });

  /* ---------------------------------------------------------------- *
   * Render: cajas físicas
   * ---------------------------------------------------------------- */
  function crearConector(clase) {
    var c = document.createElement("span");
    c.className = "conector " + clase;
    return c;
  }

  function crearSlot(cajaKey, entrada) {
    var slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.caja = cajaKey;
    slot.dataset.entrada = entrada.id;
    slot.addEventListener("click", function (e) {
      if (!seleccionado) return;
      if (e.target.closest(".chip-quitar, .chip-select")) return;
      colocar(cajaKey, entrada.id, seleccionado);
    });
    var itemId = asignacionesDe(cajaKey)[entrada.id];
    if (itemId && ITEMS[itemId]) {
      slot.appendChild(crearChip(ITEMS[itemId], {
        colocado: true,
        cajaKey: cajaKey,
        entradaId: entrada.id
      }));
    } else if (itemId) {
      slot.appendChild(document.createTextNode("? " + itemId));
    }
    return slot;
  }

  function crearFila(cajaKey, entrada) {
    var row = document.createElement("div");
    row.className = "canal-row";

    var num = document.createElement("span");
    num.className = "canal-num";
    num.textContent = entrada.etiqueta;
    row.appendChild(num);

    var cons = document.createElement("span");
    cons.className = "canal-conectores";
    if (entrada.conector === "par") {
      cons.appendChild(crearConector("rojo"));
      cons.appendChild(crearConector("negro"));
    } else {
      cons.appendChild(crearConector(entrada.conector));
    }
    row.appendChild(cons);

    row.appendChild(crearSlot(cajaKey, entrada));

    if (entrada.nota) {
      var nota = document.createElement("span");
      nota.className = "canal-nota";
      nota.textContent = entrada.nota;
      row.appendChild(nota);
    }
    return row;
  }

  function renderCajaFisica(cajaKey) {
    var info = infoCaja(cajaKey);
    var entradas = entradasDe(cajaKey);
    var numeradas = entradas.filter(function (e) { return !e.especial; });
    var especiales = entradas.filter(function (e) { return e.especial; });

    var card = document.createElement("div");
    card.className = "card caja-card";

    var cab = document.createElement("div");
    cab.className = "caja-cab";

    var h3 = document.createElement("h3");
    h3.textContent = info.nombre;
    cab.appendChild(h3);

    // La descripción va en un icono con tooltip para no gastar altura
    if (info.descripcion) {
      var info_i = document.createElement("span");
      info_i.className = "caja-info";
      info_i.textContent = "i";
      info_i.title = info.descripcion;
      cab.appendChild(info_i);
    }

    var usadas = entradas.filter(function (e) {
      return !!asignacionesDe(cajaKey)[e.id];
    }).length;
    var contador = document.createElement("span");
    contador.className = "caja-contador" + (usadas === 0 ? " vacia" : "");
    contador.textContent = usadas + "/" + entradas.length;
    cab.appendChild(contador);

    card.appendChild(cab);

    var box = document.createElement("div");
    box.className = "caja-fisica";
    if (info.conector === "anodal_catodal" || info.conector === "individual_2col") {
      box.classList.add("ancha");
    }

    var tab = document.createElement("div");
    tab.className = "caja-tab";
    tab.textContent = "kΩ";
    box.appendChild(tab);

    var wrap = document.createElement("div");
    wrap.className = "canales-wrap";

    if (info.conector === "anodal_catodal") {
      var cab = document.createElement("div");
      cab.className = "canal-row cabecera";
      var sp = document.createElement("span");
      sp.className = "canal-num";
      cab.appendChild(sp);
      ["Anodal (rojo)", "Catodal (negro)"].forEach(function (t) {
        var e = document.createElement("div");
        e.className = "mitad-titulo";
        e.textContent = t;
        cab.appendChild(e);
      });
      wrap.appendChild(cab);

      for (var i = 0; i < numeradas.length; i += 2) {
        var anodal = numeradas[i];
        var catodal = numeradas[i + 1];
        var row = document.createElement("div");
        row.className = "canal-row doble";
        var n = document.createElement("span");
        n.className = "canal-num";
        n.textContent = anodal.etiqueta;
        row.appendChild(n);
        [anodal, catodal].forEach(function (ent) {
          var mitad = document.createElement("div");
          mitad.className = "canal-mitad";
          mitad.appendChild(crearConector(ent.conector));
          mitad.appendChild(crearSlot(cajaKey, ent));
          row.appendChild(mitad);
        });
        wrap.appendChild(row);
      }
    } else if (info.conector === "individual_2col") {
      wrap.classList.add("dos-columnas");
      var mitadN = Math.ceil(numeradas.length / 2);
      [numeradas.slice(0, mitadN), numeradas.slice(mitadN)].forEach(function (grupo) {
        var col = document.createElement("div");
        col.className = "columna";
        grupo.forEach(function (ent) { col.appendChild(crearFila(cajaKey, ent)); });
        wrap.appendChild(col);
      });
    } else {
      numeradas.forEach(function (ent) { wrap.appendChild(crearFila(cajaKey, ent)); });
    }
    box.appendChild(wrap);

    if (especiales.length) {
      var esp = document.createElement("div");
      esp.className = "canales-especiales";
      especiales.forEach(function (ent) { esp.appendChild(crearFila(cajaKey, ent)); });
      box.appendChild(esp);
    }

    var plate = document.createElement("div");
    plate.className = "caja-plate";
    plate.textContent = info.nombre;
    box.appendChild(plate);

    card.appendChild(box);
    return card;
  }

  function renderCajas() {
    var cont = document.getElementById("cajas-contenido");
    cont.innerHTML = "";
    if (!escenarioActual()) return;

    var grid = document.createElement("div");
    grid.className = "cajas-grid";
    Object.keys(CAJAS).forEach(function (key) {
      grid.appendChild(renderCajaFisica(key));
    });
    cont.appendChild(grid);
  }

  /* ---------------------------------------------------------------- *
   * Render: resumen de material  (el objetivo de la herramienta)
   * ---------------------------------------------------------------- */
  function renderResumen() {
    var cont = document.getElementById("resumen-contenido");
    cont.innerHTML = "";
    var esc = escenarioActual();
    if (!esc) {
      cont.innerHTML = '<p class="empty-hint">No hay ningún escenario. Crea uno con “+ Nuevo”.</p>';
      return;
    }

    var titulo = document.createElement("div");
    titulo.className = "resumen-titulo";
    titulo.innerHTML = "<strong>" + esc.nombre + "</strong>";
    cont.appendChild(titulo);

    // Técnicas marcadas (o modalidades sueltas de escenarios antiguos)
    var etiquetasTec = tecnicasDe().map(function (id) {
      return TECS[id] ? TECS[id].nombre : id;
    }).concat(esc.modalidades || []);
    if (etiquetasTec.length) {
      var mods = document.createElement("div");
      mods.className = "modalidades";
      etiquetasTec.forEach(function (m) {
        var c = document.createElement("span");
        c.className = "modalidad-chip";
        c.textContent = m;
        mods.appendChild(c);
      });
      cont.appendChild(mods);
    }

    // Recuento
    var totalMaterial = {};
    var estiloPorTipo = {};   // nombre de etiqueta -> estilo, para el distintivo
    var cajasUsadas = [];
    var totalEntradas = 0;

    Object.keys(CAJAS).forEach(function (cajaKey) {
      var entradas = entradasDe(cajaKey);
      var asign = asignacionesDe(cajaKey);
      var detalle = [];
      entradas.forEach(function (ent) {
        var itemId = asign[ent.id];
        if (!itemId) return;
        var item = ITEMS[itemId];
        if (!item) return;
        var rotuloEntrada = ent.polo ? ent.etiqueta + " " + ent.polo : ent.etiqueta;
        var nombre = item.nombre;
        if (item.conmutador) {
          var sel = esc.conmutador && esc.conmutador[cajaKey + "/" + ent.id];
          if (sel) nombre += " → " + sel;
        }
        var override = etiquetaColocada(cajaKey, ent.id);
        var tipo = nombreEtiquetaDe(item, override);
        var estilo = estiloDe(item, override);
        if (!estiloPorTipo[tipo]) estiloPorTipo[tipo] = estilo;
        detalle.push({
          entrada: rotuloEntrada, nombre: nombre, color: item.color,
          tipo: tipo, estilo: estilo
        });
        // media_unidad: dos entradas que salen del mismo paquete (Erb1 + Erb2)
        totalMaterial[tipo] = (totalMaterial[tipo] || 0) + (item.media_unidad ? 0.5 : 1);
        totalEntradas++;
      });
      if (detalle.length) {
        cajasUsadas.push({
          key: cajaKey,
          nombre: infoCaja(cajaKey).nombre,
          usadas: detalle.length,
          total: entradas.length,
          detalle: detalle
        });
      }
    });

    var extras = extrasDe().map(function (id) { return ITEMS[id]; }).filter(Boolean);
    extras.forEach(function (item) {
      var tipo = nombreEtiquetaDe(item, null);
      if (!estiloPorTipo[tipo]) estiloPorTipo[tipo] = estiloDe(item, null);
      totalMaterial[tipo] = (totalMaterial[tipo] || 0) + 1;
    });

    if (!totalEntradas && !extras.length) {
      cont.insertAdjacentHTML("beforeend",
        '<p class="empty-hint">Escenario vacío. Arrastra material del catálogo a las entradas de las cajas.</p>');
      return;
    }

    // Dos columnas: recuento a la izquierda, desglose por caja a la derecha
    var cols = document.createElement("div");
    cols.className = "resumen-cols";
    var colIzq = document.createElement("div");
    var colDer = document.createElement("div");
    cols.appendChild(colIzq);
    cols.appendChild(colDer);
    cont.appendChild(cols);

    // Bloque: material total
    var secMat = document.createElement("div");
    secMat.className = "resumen-bloque";
    secMat.innerHTML = "<h3>Material a preparar</h3>";
    var tablaMat = document.createElement("table");
    tablaMat.className = "tabla-resumen";
    var tbodyMat = document.createElement("tbody");
    Object.keys(totalMaterial).sort().forEach(function (mat) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      // Distintivo con el mismo borde/color que llevan los chips de ese tipo
      if (estiloPorTipo[mat]) {
        var muestra = document.createElement("span");
        muestra.className = "muestra-etiqueta";
        aplicarEstilo(muestra, estiloPorTipo[mat]);
        td1.appendChild(muestra);
      }
      td1.appendChild(document.createTextNode(mat));
      var td2 = document.createElement("td");
      td2.className = "num";
      // Media unidad suelta: se redondea hacia arriba (hay que abrir el paquete igual)
      var cantidad = totalMaterial[mat];
      td2.textContent = Number.isInteger(cantidad) ? cantidad : Math.ceil(cantidad);
      if (!Number.isInteger(cantidad)) {
        td2.title = "Redondeado hacia arriba: " + cantidad + " paquetes en uso";
      }
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbodyMat.appendChild(tr);
    });
    tablaMat.appendChild(tbodyMat);
    secMat.appendChild(tablaMat);
    colIzq.appendChild(secMat);

    // Bloque: cajas necesarias
    var secCajas = document.createElement("div");
    secCajas.className = "resumen-bloque";
    secCajas.innerHTML = "<h3>Cajas necesarias (" + cajasUsadas.length + ")</h3>";
    cajasUsadas.forEach(function (c) {
      var bloque = document.createElement("div");
      bloque.className = "resumen-caja";

      var cab = document.createElement("div");
      cab.className = "resumen-caja-cab";
      var nom = document.createElement("span");
      nom.className = "resumen-caja-nombre";
      nom.textContent = c.nombre;
      var cnt = document.createElement("span");
      cnt.className = "resumen-caja-cnt" + (c.usadas === c.total ? " llena" : "");
      cnt.textContent = c.usadas + "/" + c.total + " entradas";
      cab.appendChild(nom);
      cab.appendChild(cnt);
      bloque.appendChild(cab);

      var lista = document.createElement("div");
      lista.className = "resumen-entradas";
      c.detalle.forEach(function (d) {
        var el = document.createElement("span");
        el.className = "resumen-entrada";
        if (d.estilo) aplicarEstilo(el, d.estilo);
        el.title = "Tipo: " + d.tipo;
        el.innerHTML = '<span class="re-num">' + d.entrada + "</span> ";
        if (d.color) {
          var dot = document.createElement("span");
          dot.className = "color-dot color-" + d.color;
          el.appendChild(dot);
        }
        el.appendChild(document.createTextNode(d.nombre));
        lista.appendChild(el);
      });
      bloque.appendChild(lista);
      secCajas.appendChild(bloque);
    });
    colDer.appendChild(secCajas);

    // Bloque: material extra (no ocupa entrada)
    if (extras.length) {
      var secEx = document.createElement("div");
      secEx.className = "resumen-bloque";
      secEx.innerHTML = "<h3>Material extra (no ocupa entrada)</h3>";
      var listaEx = document.createElement("div");
      listaEx.className = "resumen-entradas";
      extras.forEach(function (item) {
        var el = document.createElement("span");
        el.className = "resumen-entrada";
        el.textContent = item.nombre;
        if (item.nota) el.title = item.nota;
        listaEx.appendChild(el);
      });
      secEx.appendChild(listaEx);
      colIzq.appendChild(secEx);
    }

    // Avisos
    var avisos = [];
    cajasUsadas.forEach(function (c) {
      if (c.usadas === c.total) avisos.push("La caja “" + c.nombre + "” está completa — no quedan entradas libres.");
    });
    if (esc.nota_perfil) avisos.push(esc.nota_perfil);
    if (esc.notas) avisos.push(esc.notas);
    if (esc.pendiente) avisos.push("Pendiente de confirmar: " + esc.pendiente);

    if (avisos.length) {
      var secAv = document.createElement("div");
      secAv.className = "resumen-bloque";
      secAv.innerHTML = "<h3>Avisos</h3>";
      var ul = document.createElement("ul");
      ul.className = "avisos";
      avisos.forEach(function (a) {
        var li = document.createElement("li");
        li.textContent = a;
        ul.appendChild(li);
      });
      secAv.appendChild(ul);
      cont.appendChild(secAv);
    }
  }

  /* ---------------------------------------------------------------- *
   * Selector de escenarios y acciones
   * ---------------------------------------------------------------- */
  function renderSelect() {
    var sel = document.getElementById("escenario-select");
    sel.innerHTML = "";
    Object.keys(escenarios).forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = escenarios[id].nombre || id;
      if (id === activo) opt.selected = true;
      sel.appendChild(opt);
    });
    if (!Object.keys(escenarios).length) {
      var vacio = document.createElement("option");
      vacio.textContent = "— sin escenarios —";
      sel.appendChild(vacio);
    }
  }

  function idDesdeNombre(nombre) {
    var base = nombre.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "escenario";
    var id = base;
    var n = 2;
    while (escenarios[id]) { id = base + "_" + n; n++; }
    return id;
  }

  function renderTodo() {
    renderSelect();
    renderTecnicas();
    renderResumen();
    renderCatalogo();
    renderCajas();
  }

  document.getElementById("escenario-select").addEventListener("change", function (e) {
    activo = e.target.value;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-nuevo").addEventListener("click", function () {
    var nombre = prompt("Nombre del nuevo escenario de cirugía:");
    if (!nombre) return;
    var id = idDesdeNombre(nombre);
    escenarios[id] = { nombre: nombre, modalidades: [], asignaciones: {} };
    activo = id;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-duplicar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    var nombre = prompt("Nombre de la copia:", esc.nombre + " (copia)");
    if (!nombre) return;
    var id = idDesdeNombre(nombre);
    escenarios[id] = clonar(esc);
    escenarios[id].nombre = nombre;
    activo = id;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-renombrar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    var nombre = prompt("Nuevo nombre:", esc.nombre);
    if (!nombre) return;
    esc.nombre = nombre;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-vaciar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    if (!confirm("¿Vaciar todas las entradas de “" + esc.nombre + "”?\nEl escenario se conserva, pero se queda sin material colocado.")) return;
    esc.asignaciones = {};
    esc.conmutador = {};
    esc.extras = [];
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-borrar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    if (!confirm("¿Borrar el escenario “" + esc.nombre + "”?\nEsta acción no se puede deshacer.")) return;
    delete escenarios[activo];
    if (borrados.indexOf(activo) === -1) borrados.push(activo);
    activo = Object.keys(escenarios)[0] || null;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-restablecer").addEventListener("click", function () {
    if (!confirm("¿Restablecer todo?\nSe perderán los escenarios creados y las ediciones, volviendo a los presets del archivo data/surgeries.js.")) return;
    localStorage.removeItem(STORAGE_KEY);
    borrados = [];
    cargarEstado();
    renderTodo();
    avisoGuardado("Restablecido a los presets del archivo.");
  });

  // Copia de seguridad completa: escenarios + catálogo propio, en un .json
  document.getElementById("btn-exportar").addEventListener("click", function () {
    var copia = {
      formato: "mio-ionm",
      version: 1,
      fecha: new Date().toISOString(),
      escenarios: escenarios,
      catalogo_usuario: catalogoUsuario,
      borrados: borrados,
      activo: activo
    };
    var blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mio-ionm-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    avisoGuardado("Copia exportada. Guárdala o pásala al otro dispositivo.");
  });

  document.getElementById("btn-importar").addEventListener("click", function () {
    document.getElementById("fichero-importar").click();
  });

  document.getElementById("fichero-importar").addEventListener("change", function (e) {
    var fichero = e.target.files && e.target.files[0];
    if (!fichero) return;
    var lector = new FileReader();
    lector.onload = function () {
      var copia;
      try {
        copia = JSON.parse(lector.result);
      } catch (err) {
        alert("El archivo no es un JSON válido.");
        return;
      }
      if (!copia || copia.formato !== "mio-ionm") {
        alert("Este archivo no parece una copia de la herramienta.");
        return;
      }
      var nEsc = Object.keys(copia.escenarios || {}).length;
      var nMat = (copia.catalogo_usuario || []).length;
      if (!confirm(
        "Importar copia del " + (copia.fecha || "").slice(0, 10) + ":\n" +
        "· " + nEsc + " escenario(s)\n· " + nMat + " material(es) propios\n\n" +
        "Sustituye lo que tengas ahora en este navegador. ¿Continuar?"
      )) return;

      escenarios = copia.escenarios || {};
      catalogoUsuario = copia.catalogo_usuario || [];
      borrados = copia.borrados || [];
      activo = copia.activo && escenarios[copia.activo] ? copia.activo : Object.keys(escenarios)[0] || null;
      reconstruirCatalogo();
      guardarEstado();
      renderTodo();
      avisoGuardado("Copia importada correctamente.");
    };
    lector.readAsText(fichero);
    e.target.value = "";
  });

  document.getElementById("btn-imprimir").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("catalogo-buscar").addEventListener("input", function () {
    renderCatalogo();
    seleccionar(seleccionado); // mantiene el resaltado tras filtrar
  });

  document.getElementById("bs-cancelar").addEventListener("click", function () {
    seleccionar(null);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") seleccionar(null);
  });

  // Modo quirófano: deja solo el montaje y el resumen, sin herramientas de edición
  var MODO_KEY = "mio_ionm_modo_quirofano";

  function aplicarModoQuirofano(activo) {
    document.body.classList.toggle("modo-quirofano", activo);
    var btn = document.getElementById("btn-quirofano");
    btn.classList.toggle("activo", activo);
    btn.textContent = activo ? "Salir del modo quirófano" : "Modo quirófano";
    try { localStorage.setItem(MODO_KEY, activo ? "1" : "0"); } catch (e) { /* sin persistencia */ }
    if (activo) seleccionar(null);
    // La subida automática se pausa en quirófano para no depender de la red
    // durante la cirugía; al salir se manda lo que se haya acumulado.
    if (!activo && sync.pendiente) programarSubida();
    pintarEstadoSync();
  }

  document.getElementById("btn-quirofano").addEventListener("click", function () {
    aplicarModoQuirofano(!document.body.classList.contains("modo-quirofano"));
  });

  document.getElementById("btn-plegar").addEventListener("click", function () {
    var panel = document.getElementById("panel-catalogo");
    panel.classList.toggle("plegado");
    this.textContent = panel.classList.contains("plegado") ? "▸" : "▾";
  });

  /* ---------------------------------------------------------------- *
   * Arranque
   * ---------------------------------------------------------------- */
  cargarEstado();
  cargarSync();
  pintarEstadoSync();
  renderPerfilSelect();
  renderTodo();
  try {
    aplicarModoQuirofano(localStorage.getItem(MODO_KEY) === "1");
  } catch (e) {
    aplicarModoQuirofano(false);
  }
  avisoGuardado(syncActivo()
    ? "Los cambios se guardan solos y se suben a GitHub."
    : "Los cambios se guardan solos en este navegador.");
  // Traer lo último de GitHub al abrir, sin preguntar si no hay nada local
  // sin subir. Si lo hay, sube en vez de bajar.
  bajarAuto();
})();
