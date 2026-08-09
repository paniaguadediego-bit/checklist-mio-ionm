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
    return catalogo[key] || { nombre: "Caja " + humanizeCajaName(key), descripcion: "" };
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
