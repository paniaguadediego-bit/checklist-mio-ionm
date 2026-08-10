(function () {
  "use strict";

  var DATA = window.SURGERIES_DATA || {};
  var CAJAS = DATA.cajas_material || {};
  var CATALOGO = DATA.catalogo_material || [];
  var TECNICAS = DATA.tecnicas || [];
  var PERFILES = DATA.perfiles_procedimiento || [];
  var STORAGE_KEY = "mio_ionm_escenarios_v1";

  // Índice de técnicas: id -> técnica
  var TECS = {};
  TECNICAS.forEach(function (g) {
    (g.items || []).forEach(function (t) { TECS[t.id] = t; });
  });

  /* ---------------------------------------------------------------- *
   * Índice del catálogo: id -> item (con su categoría)
   * ---------------------------------------------------------------- */
  var ITEMS = {};
  CATALOGO.forEach(function (grupo) {
    (grupo.items || []).forEach(function (item) {
      ITEMS[item.id] = Object.assign({}, item, {
        categoria: grupo.categoria,
        // Material que se prepara pero no se conecta a ninguna entrada
        sin_entrada: !!(item.sin_entrada || grupo.sin_entrada)
      });
    });
  });

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
    var guardado = null;
    try {
      guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      guardado = null;
    }
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

  function guardarEstado() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        escenarios: escenarios,
        activo: activo,
        borrados: borrados
      }));
      avisoGuardado("Guardado en este navegador · " + new Date().toLocaleTimeString("es-ES"));
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
    }
  }

  function colocar(cajaKey, entradaId, itemId) {
    asignacionesDe(cajaKey)[entradaId] = itemId;
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
    if (item.nota) chip.title = item.nota;

    if (item.color) {
      var dot = document.createElement("span");
      dot.className = "color-dot color-" + item.color;
      chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(item.nombre));

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
      var quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "chip-quitar";
      quitar.textContent = "✕";
      quitar.title = "Quitar de esta entrada";
      quitar.addEventListener("click", function (e) {
        e.stopPropagation();
        delete asignacionesDe(opciones.cajaKey)[opciones.entradaId];
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

      // Mover dentro/entre cajas: liberar el origen
      if (arrastrando.origenCaja) {
        delete asignacionesDe(arrastrando.origenCaja)[arrastrando.origenEntrada];
      }
      asignacionesDe(destinoCaja)[destinoEntrada] = arrastrando.itemId;
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
      var h = document.createElement("h4");
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
      var h = document.createElement("h4");
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

    var h3 = document.createElement("h3");
    h3.textContent = info.nombre;
    card.appendChild(h3);

    var usadas = entradas.filter(function (e) {
      return !!asignacionesDe(cajaKey)[e.id];
    }).length;
    var contador = document.createElement("span");
    contador.className = "caja-contador" + (usadas === 0 ? " vacia" : "");
    contador.textContent = usadas + " / " + entradas.length + " entradas";
    card.appendChild(contador);

    if (info.descripcion) {
      var d = document.createElement("p");
      d.className = "caja-desc";
      d.textContent = info.descripcion;
      card.appendChild(d);
    }

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
        var etiqueta = ent.polo ? ent.etiqueta + " " + ent.polo : ent.etiqueta;
        var nombre = item.nombre;
        if (item.conmutador) {
          var sel = esc.conmutador && esc.conmutador[cajaKey + "/" + ent.id];
          if (sel) nombre += " → " + sel;
        }
        detalle.push({ entrada: etiqueta, nombre: nombre, color: item.color });
        // media_unidad: dos entradas que salen del mismo paquete (Erb1 + Erb2)
        totalMaterial[item.material] = (totalMaterial[item.material] || 0) + (item.media_unidad ? 0.5 : 1);
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
      totalMaterial[item.material] = (totalMaterial[item.material] || 0) + 1;
    });

    if (!totalEntradas && !extras.length) {
      cont.insertAdjacentHTML("beforeend",
        '<p class="empty-hint">Escenario vacío. Arrastra material del catálogo a las entradas de las cajas.</p>');
      return;
    }

    // Bloque: material total
    var secMat = document.createElement("div");
    secMat.className = "resumen-bloque";
    secMat.innerHTML = "<h3>Material a preparar</h3>";
    var tablaMat = document.createElement("table");
    tablaMat.className = "tabla-resumen";
    tablaMat.innerHTML = "<thead><tr><th>Material</th><th>Cantidad</th></tr></thead>";
    var tbodyMat = document.createElement("tbody");
    Object.keys(totalMaterial).sort().forEach(function (mat) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      td1.textContent = mat;
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
    cont.appendChild(secMat);

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
    cont.appendChild(secCajas);

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
      cont.appendChild(secEx);
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

  document.getElementById("btn-exportar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    var salida = {};
    salida[activo] = esc;
    var texto = JSON.stringify(salida, null, 2);
    var w = window.open("", "_blank", "width=700,height=600");
    if (!w) {
      prompt("Copia este JSON y pégalo en data/surgeries.js dentro de \"escenarios\":", texto);
      return;
    }
    w.document.write(
      "<title>Exportar escenario</title>" +
      '<p style="font:14px sans-serif">Copia esto y pégalo en <b>data/surgeries.js</b>, dentro de <b>"escenarios"</b>, para que el preset sea permanente y viaje por git.</p>' +
      '<textarea style="width:100%;height:80%;font:12px monospace">' +
      texto.replace(/</g, "&lt;") + "</textarea>"
    );
    w.document.close();
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

  document.getElementById("btn-plegar").addEventListener("click", function () {
    var panel = document.getElementById("panel-catalogo");
    panel.classList.toggle("plegado");
    this.textContent = panel.classList.contains("plegado") ? "▸" : "▾";
  });

  /* ---------------------------------------------------------------- *
   * Arranque
   * ---------------------------------------------------------------- */
  cargarEstado();
  renderPerfilSelect();
  renderTodo();
  avisoGuardado("Los cambios se guardan solos en este navegador.");
})();
