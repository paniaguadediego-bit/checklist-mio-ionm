(function () {
  "use strict";

  var DATA = window.SURGERIES_DATA || { material_base: { cajas: [], items: [] }, cirugias: {} };

  var selectEl = document.getElementById("cirugia-select");
  var opcionesContainer = document.getElementById("opciones-container");
  var checklistContainer = document.getElementById("checklist-container");

  var estadoOpciones = {}; // { [cirugiaId]: { [opcionKey]: bool } }

  function cantidadLabel(item) {
    if (item.cantidad !== undefined) return item.cantidad + " ud.";
    if (item.cantidad_pares !== undefined) return item.cantidad_pares + (item.cantidad_pares === 1 ? " par" : " pares");
    if (item.cantidad_paquetes !== undefined) return item.cantidad_paquetes + (item.cantidad_paquetes === 1 ? " paquete" : " paquetes");
    return "";
  }

  function renderItemLi(item, extraClass) {
    var li = document.createElement("li");
    if (extraClass) li.className = extraClass;

    var nombreRow = document.createElement("div");
    nombreRow.className = "item-nombre";

    var nombreSpan = document.createElement("span");
    nombreSpan.textContent = item.item;
    nombreRow.appendChild(nombreSpan);

    var cantidadTxt = cantidadLabel(item);
    if (cantidadTxt) {
      var cantidadSpan = document.createElement("span");
      cantidadSpan.className = "item-cantidad";
      cantidadSpan.textContent = cantidadTxt;
      nombreRow.appendChild(cantidadSpan);
    }
    li.appendChild(nombreRow);

    var materialBits = [];
    if (item.material) materialBits.push(item.material);
    if (item.tipo) materialBits.push("Tipo: " + item.tipo);
    if (materialBits.length) {
      var materialDiv = document.createElement("div");
      materialDiv.className = "item-material";
      materialDiv.textContent = materialBits.join(" · ");
      li.appendChild(materialDiv);
    }

    if (item.detalle) {
      var detalleDiv = document.createElement("div");
      detalleDiv.className = "item-detalle";
      detalleDiv.textContent = item.detalle;
      li.appendChild(detalleDiv);
    }

    if (item.sitios && item.sitios.length) {
      var sitiosDiv = document.createElement("div");
      sitiosDiv.className = "item-sitios";
      item.sitios.forEach(function (sitio) {
        var esObjeto = typeof sitio === "object" && sitio !== null;
        var nombre = esObjeto ? sitio.nombre : sitio;
        var color = esObjeto ? sitio.color : null;
        var chip = document.createElement("span");
        chip.className = "sitio-chip";
        if (color) {
          var dot = document.createElement("span");
          dot.className = "color-dot color-" + color;
          chip.appendChild(dot);
        }
        chip.appendChild(document.createTextNode(nombre));
        sitiosDiv.appendChild(chip);
      });
      li.appendChild(sitiosDiv);
    }

    return li;
  }

  function renderItemList(items, extraClass) {
    var ul = document.createElement("ul");
    ul.className = "item-list";
    if (!items || !items.length) {
      var hint = document.createElement("li");
      hint.className = "empty-hint";
      hint.textContent = "Sin ítems definidos todavía.";
      ul.appendChild(hint);
      return ul;
    }
    items.forEach(function (item) {
      ul.appendChild(renderItemLi(item, extraClass));
    });
    return ul;
  }

  function humanizeCajaName(key) {
    return key.replace(/_/g, " ");
  }

  function cajaInfo(key) {
    var catalogo = DATA.cajas_material || {};
    var info = catalogo[key] || { nombre: "Caja " + humanizeCajaName(key), descripcion: "" };
    if (!info.canales) info.canales = 8;
    if (!info.conector) info.conector = "par";
    if (!info.especiales) info.especiales = [];
    return info;
  }

  function construirUnidades(items, cajaKey) {
    var out = [];
    var contador = 0;
    (items || []).forEach(function (item) {
      if (item.conmutador) {
        contador++;
        var opciones = (item.sitios || []).map(function (sitio) {
          var esObjeto = typeof sitio === "object" && sitio !== null;
          return { nombre: esObjeto ? sitio.nombre : sitio, color: esObjeto ? sitio.color : null };
        });
        out.push({ id: cajaKey + "-u" + contador, label: item.item, tipo: "conmutador", opciones: opciones });
      } else if (item.sitios && item.sitios.length) {
        item.sitios.forEach(function (sitio) {
          var esObjeto = typeof sitio === "object" && sitio !== null;
          var nombre = esObjeto ? sitio.nombre : sitio;
          var color = esObjeto ? sitio.color : null;
          contador++;
          out.push({ id: cajaKey + "-u" + contador, label: nombre, color: color });
        });
      } else {
        var cantidad = item.cantidad || item.cantidad_pares || item.cantidad_paquetes || 1;
        for (var i = 1; i <= cantidad; i++) {
          contador++;
          var label = cantidad > 1 ? item.item + " (" + i + "/" + cantidad + ")" : item.item;
          out.push({ id: cajaKey + "-u" + contador, label: label, color: null });
        }
      }
    });
    return out;
  }

  function crearChipUnidad(unidad) {
    var chip = document.createElement("span");
    chip.className = "pool-chip";
    chip.draggable = true;
    chip.dataset.unidadId = unidad.id;

    if (unidad.tipo === "conmutador") {
      chip.classList.add("chip-conmutador");
      chip.appendChild(document.createTextNode(unidad.label + " "));
      var select = document.createElement("select");
      unidad.opciones.forEach(function (op) {
        var opt = document.createElement("option");
        opt.textContent = op.color ? op.nombre + " (" + op.color + ")" : op.nombre;
        select.appendChild(opt);
      });
      select.addEventListener("mousedown", function (e) { e.stopPropagation(); });
      select.addEventListener("click", function (e) { e.stopPropagation(); });
      chip.appendChild(select);
      return chip;
    }

    if (unidad.color) {
      var dot = document.createElement("span");
      dot.className = "color-dot color-" + unidad.color;
      chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(unidad.label));
    return chip;
  }

  function wireDragDrop(container) {
    var draggedEl = null;

    container.addEventListener("dragstart", function (e) {
      var chip = e.target.closest(".pool-chip");
      if (!chip) return;
      draggedEl = chip;
      chip.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", chip.dataset.unidadId || "x");
    });

    container.addEventListener("dragend", function () {
      if (draggedEl) draggedEl.classList.remove("dragging");
      draggedEl = null;
      container.querySelectorAll(".dragover").forEach(function (el) {
        el.classList.remove("dragover");
      });
    });

    container.addEventListener("dragover", function (e) {
      var target = e.target.closest(".canal-slot, .material-pool");
      if (!target) return;
      e.preventDefault();
      target.classList.add("dragover");
    });

    container.addEventListener("dragleave", function (e) {
      var target = e.target.closest(".canal-slot, .material-pool");
      if (target) target.classList.remove("dragover");
    });

    container.addEventListener("drop", function (e) {
      var target = e.target.closest(".canal-slot, .material-pool");
      if (!target || !draggedEl) return;
      e.preventDefault();
      target.classList.remove("dragover");

      if (target.classList.contains("canal-slot")) {
        var ocupante = target.querySelector(".pool-chip");
        if (ocupante && ocupante !== draggedEl) {
          var pool = container.querySelector(".material-pool");
          pool.appendChild(ocupante);
        }
      }
      target.appendChild(draggedEl);
    });
  }

  function crearSlot(datasetInfo) {
    var slot = document.createElement("div");
    slot.className = "canal-slot";
    Object.keys(datasetInfo || {}).forEach(function (k) {
      slot.dataset[k] = datasetInfo[k];
    });
    return slot;
  }

  function crearConector(clase) {
    var c = document.createElement("span");
    c.className = "conector " + clase;
    return c;
  }

  function crearFilaSimple(etiqueta, conectorClase) {
    var row = document.createElement("div");
    row.className = "canal-row";
    var num = document.createElement("span");
    num.className = "canal-num";
    num.textContent = etiqueta;
    row.appendChild(num);
    var conectores = document.createElement("span");
    conectores.className = "canal-conectores";
    conectores.appendChild(crearConector(conectorClase));
    row.appendChild(conectores);
    var slot = crearSlot({ canal: etiqueta });
    row.appendChild(slot);
    return row;
  }

  function crearFilaPar(etiqueta) {
    var row = document.createElement("div");
    row.className = "canal-row";
    var num = document.createElement("span");
    num.className = "canal-num";
    num.textContent = etiqueta;
    row.appendChild(num);
    var conectores = document.createElement("span");
    conectores.className = "canal-conectores";
    conectores.appendChild(crearConector("rojo"));
    conectores.appendChild(crearConector("negro"));
    row.appendChild(conectores);
    var slot = crearSlot({ canal: etiqueta });
    row.appendChild(slot);
    return row;
  }

  function crearFilaAnodalCatodal(numero) {
    var row = document.createElement("div");
    row.className = "canal-row canal-row-doble";

    var num = document.createElement("span");
    num.className = "canal-num";
    num.textContent = numero;
    row.appendChild(num);

    var mitadA = document.createElement("div");
    mitadA.className = "canal-mitad";
    mitadA.appendChild(crearConector("rojo"));
    mitadA.appendChild(crearSlot({ canal: numero, polo: "anodal" }));
    row.appendChild(mitadA);

    var mitadC = document.createElement("div");
    mitadC.className = "canal-mitad";
    mitadC.appendChild(crearConector("negro"));
    mitadC.appendChild(crearSlot({ canal: numero, polo: "catodal" }));
    row.appendChild(mitadC);

    return row;
  }

  function renderCajaFisica(cajaKey, itemsBase, itemsExtra) {
    var info = cajaInfo(cajaKey);

    var wrap = document.createElement("div");
    wrap.className = "caja-fisica-wrap";

    var header = document.createElement("div");
    header.className = "caja-fisica-header";
    header.textContent = "Vista de caja física — arrastra el material a su entrada";
    wrap.appendChild(header);

    var box = document.createElement("div");
    box.className = "caja-fisica";
    if (info.conector === "anodal_catodal" || info.conector === "individual_2col") {
      box.classList.add("caja-fisica-ancha");
    }

    var tab = document.createElement("div");
    tab.className = "caja-fisica-tab";
    tab.textContent = "kΩ";
    box.appendChild(tab);

    var canalesWrap = document.createElement("div");
    canalesWrap.className = "canales-wrap";
    var i;

    if (info.conector === "anodal_catodal") {
      canalesWrap.classList.add("anodal-catodal-header");
      var cabecera = document.createElement("div");
      cabecera.className = "canal-row canal-row-doble canal-cabecera";
      var espaciador = document.createElement("span");
      espaciador.className = "canal-num";
      cabecera.appendChild(espaciador);
      var etA = document.createElement("div");
      etA.className = "canal-mitad-titulo";
      etA.textContent = "Anodal (rojo)";
      cabecera.appendChild(etA);
      var etC = document.createElement("div");
      etC.className = "canal-mitad-titulo";
      etC.textContent = "Catodal (negro)";
      cabecera.appendChild(etC);
      canalesWrap.appendChild(cabecera);
      for (i = 1; i <= info.canales; i++) {
        canalesWrap.appendChild(crearFilaAnodalCatodal(i));
      }
    } else if (info.conector === "individual_2col") {
      canalesWrap.classList.add("dos-columnas");
      var mitad = Math.ceil(info.canales / 2);
      var colIzq = document.createElement("div");
      colIzq.className = "columna-canales";
      var colDer = document.createElement("div");
      colDer.className = "columna-canales";
      for (i = 1; i <= mitad; i++) {
        colIzq.appendChild(crearFilaSimple(i, "individual"));
      }
      for (i = mitad + 1; i <= info.canales; i++) {
        colDer.appendChild(crearFilaSimple(i, "individual"));
      }
      canalesWrap.appendChild(colIzq);
      canalesWrap.appendChild(colDer);
    } else {
      for (i = 1; i <= info.canales; i++) {
        canalesWrap.appendChild(info.conector === "par" ? crearFilaPar(i) : crearFilaSimple(i, "individual"));
      }
    }
    box.appendChild(canalesWrap);

    if (info.especiales && info.especiales.length) {
      var especialesWrap = document.createElement("div");
      especialesWrap.className = "canales-especiales";
      info.especiales.forEach(function (esp) {
        var row = esp.conector === "par" ? crearFilaPar(esp.nombre) : crearFilaSimple(esp.nombre, esp.color ? esp.color : "individual");
        row.querySelector(".canal-slot").dataset.canal = esp.clave;
        if (esp.nota) {
          var nota = document.createElement("span");
          nota.className = "canal-especial-nota";
          nota.textContent = esp.nota;
          row.appendChild(nota);
        }
        especialesWrap.appendChild(row);
      });
      box.appendChild(especialesWrap);
    }

    var plate = document.createElement("div");
    plate.className = "caja-fisica-plate";
    plate.textContent = info.nombre;
    box.appendChild(plate);

    wrap.appendChild(box);

    var poolHeader = document.createElement("div");
    poolHeader.className = "material-pool-header";
    poolHeader.textContent = "Material sin colocar";
    wrap.appendChild(poolHeader);

    var pool = document.createElement("div");
    pool.className = "material-pool";
    wrap.appendChild(pool);

    var unidades = construirUnidades((itemsBase || []).concat(itemsExtra || []), cajaKey);
    unidades.forEach(function (u) {
      pool.appendChild(crearChipUnidad(u));
    });

    wireDragDrop(wrap);

    return wrap;
  }

  function renderMaterialBase() {
    var base = DATA.material_base || {};
    document.getElementById("base-descripcion").textContent = base.descripcion || "";

    var cajasDiv = document.getElementById("base-cajas");
    cajasDiv.innerHTML = "";
    (base.cajas || []).forEach(function (caja) {
      var chip = document.createElement("span");
      chip.className = "caja-chip";
      chip.textContent = caja;
      cajasDiv.appendChild(chip);
    });

    var itemsUl = document.getElementById("base-items");
    itemsUl.replaceWith(renderItemList(base.items, null));
    // renderItemList creates a new <ul class="item-list">; give it the expected id back
    var newUl = document.querySelector("#material-base .item-list");
    newUl.id = "base-items";
  }

  function populateSelect() {
    Object.keys(DATA.cirugias || {}).forEach(function (id) {
      var cirugia = DATA.cirugias[id];
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = cirugia.nombre || id;
      selectEl.appendChild(opt);
    });
  }

  function itemsExtraActivos(cirugia, cirugiaId) {
    var extra = [];
    if (!cirugia.opciones) return extra;
    var estado = estadoOpciones[cirugiaId] || {};
    Object.keys(cirugia.opciones).forEach(function (key) {
      if (estado[key]) {
        extra = extra.concat(cirugia.opciones[key].items_extra || []);
      }
    });
    return extra;
  }

  function renderOpciones(cirugia, cirugiaId) {
    opcionesContainer.innerHTML = "";
    if (!cirugia.opciones) return;

    if (!estadoOpciones[cirugiaId]) estadoOpciones[cirugiaId] = {};

    Object.keys(cirugia.opciones).forEach(function (key) {
      var opcion = cirugia.opciones[key];
      var wrapper = document.createElement("label");
      wrapper.className = "opcion-checkbox";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!estadoOpciones[cirugiaId][key];
      checkbox.addEventListener("change", function () {
        estadoOpciones[cirugiaId][key] = checkbox.checked;
        renderChecklist(cirugiaId);
      });

      var textDiv = document.createElement("div");
      textDiv.className = "opcion-text";
      var strong = document.createElement("strong");
      strong.textContent = opcion.etiqueta;
      textDiv.appendChild(strong);
      if (opcion.descripcion) {
        var small = document.createElement("small");
        small.textContent = opcion.descripcion;
        textDiv.appendChild(small);
      }

      wrapper.appendChild(checkbox);
      wrapper.appendChild(textDiv);
      opcionesContainer.appendChild(wrapper);
    });
  }

  function ordenCajas(cirugia, cajaKeysConExtras) {
    var catalogoKeys = Object.keys(DATA.cajas_material || {});
    var presentes = Object.keys(cirugia.cajas || {}).concat(cajaKeysConExtras);
    var vistos = {};
    var enCatalogo = catalogoKeys.filter(function (k) {
      var ok = presentes.indexOf(k) !== -1 && !vistos[k];
      if (ok) vistos[k] = true;
      return ok;
    });
    var fueraDeCatalogo = presentes.filter(function (k) {
      var ok = catalogoKeys.indexOf(k) === -1 && !vistos[k];
      if (ok) vistos[k] = true;
      return ok;
    });
    return enCatalogo.concat(fueraDeCatalogo);
  }

  function renderChecklist(cirugiaId) {
    checklistContainer.innerHTML = "";
    var cirugia = (DATA.cirugias || {})[cirugiaId];
    if (!cirugia) return;

    var header = document.createElement("div");
    header.className = "cirugia-header";
    var h2 = document.createElement("h2");
    h2.textContent = cirugia.nombre;
    header.appendChild(h2);
    if (cirugia.modalidades && cirugia.modalidades.length) {
      var modDiv = document.createElement("div");
      modDiv.className = "modalidades";
      cirugia.modalidades.forEach(function (m) {
        var chip = document.createElement("span");
        chip.className = "modalidad-chip";
        chip.textContent = m;
        modDiv.appendChild(chip);
      });
      header.appendChild(modDiv);
    }
    checklistContainer.appendChild(header);

    if (cirugia.pendiente) {
      var pend = document.createElement("div");
      pend.className = "pendiente-nota";
      pend.innerHTML = "<strong>Pendiente de confirmar:</strong>";
      pend.appendChild(document.createTextNode(cirugia.pendiente));
      checklistContainer.appendChild(pend);
    }

    var grid = document.createElement("div");
    grid.className = "cajas-grid";

    var cajas = cirugia.cajas || {};
    var extraActivos = itemsExtraActivos(cirugia, cirugiaId);
    var extrasConCaja = extraActivos.filter(function (i) { return !!i.caja; });
    var extrasSinCaja = extraActivos.filter(function (i) { return !i.caja; });
    var cajaKeysConExtras = extrasConCaja.map(function (i) { return i.caja; });

    ordenCajas(cirugia, cajaKeysConExtras).forEach(function (cajaKey) {
      var itemsBase = cajas[cajaKey] || [];
      var itemsExtraDeCaja = extrasConCaja.filter(function (i) { return i.caja === cajaKey; });
      if (!itemsBase.length && !itemsExtraDeCaja.length) return;

      var info = cajaInfo(cajaKey);
      var cajaCard = document.createElement("div");
      cajaCard.className = "card caja-card";
      var h3 = document.createElement("h3");
      h3.textContent = info.nombre;
      cajaCard.appendChild(h3);
      if (info.descripcion) {
        var desc = document.createElement("p");
        desc.className = "caja-desc";
        desc.textContent = info.descripcion;
        cajaCard.appendChild(desc);
      }

      var ul = renderItemList(itemsBase, null);
      itemsExtraDeCaja.forEach(function (item) {
        ul.appendChild(renderItemLi(item, "item-extra"));
      });
      // quita el mensaje "sin ítems" si al final sí hay contenido de opciones
      if (itemsBase.length === 0 && itemsExtraDeCaja.length > 0) {
        var hint = ul.querySelector(".empty-hint");
        if (hint) hint.remove();
      }
      cajaCard.appendChild(ul);
      cajaCard.appendChild(renderCajaFisica(cajaKey, itemsBase, itemsExtraDeCaja));
      grid.appendChild(cajaCard);
    });

    if (extrasSinCaja.length) {
      var extraCard = document.createElement("div");
      extraCard.className = "card caja-card";
      var h3e = document.createElement("h3");
      h3e.textContent = "Material añadido por opciones";
      extraCard.appendChild(h3e);
      extraCard.appendChild(renderItemList(extrasSinCaja, "item-extra"));
      grid.appendChild(extraCard);
    }

    if (cirugia.sin_asignar && cirugia.sin_asignar.length) {
      var sinAsigCard = document.createElement("div");
      sinAsigCard.className = "card caja-card sin-asignar";
      var h3s = document.createElement("h3");
      h3s.textContent = "Sin asignar todavía";
      sinAsigCard.appendChild(h3s);
      sinAsigCard.appendChild(renderItemList(cirugia.sin_asignar, null));
      grid.appendChild(sinAsigCard);
    }

    checklistContainer.appendChild(grid);
  }

  selectEl.addEventListener("change", function () {
    var cirugiaId = selectEl.value;
    opcionesContainer.innerHTML = "";
    checklistContainer.innerHTML = "";
    if (!cirugiaId) return;
    var cirugia = DATA.cirugias[cirugiaId];
    renderOpciones(cirugia, cirugiaId);
    renderChecklist(cirugiaId);
  });

  renderMaterialBase();
  populateSelect();
})();
