/* ============================================================
   Componente: capacidad-ecosistema
   Constructor de la matriz de capacidad operativa del ecosistema
   para talleres presenciales de co-creación.

   - N dimensiones (típicamente 8 SLAs) × N horizontes
     (típicamente 3: corto / medio / largo plazo).
   - Por cada celda (dimensión × horizonte), captura cinco inputs:
       · capacidad EF agregada (1–5)         — solo EF declara
       · esfuerzo EF (bajo / medio / alto)   — solo EF declara
       · necesidad consumidor (1–5)          — fintech/PSBI declara
       · prioridad consumidor (crítica /
         deseable / opcional)                — fintech/PSBI declara
       · umbral regulador (1–5)              — regulador declara
   - Anchor "Brasil sostiene X" siempre visible por dimensión.
   - Visualiza gap (cap EF vs necesidad consumidor) y banderas
     (gap × esfuerzo alto × prioridad crítica).
   - Persiste en localStorage con clave propia.
   - Emite evento 'capacidad-ecosistema:update' para que
     componentes de export reaccionen.
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'obta:capacidad-ecosistema:v1';

  function leerEstado() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (e) { return {}; }
  }
  function guardarEstado(estado) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); }
    catch (e) { console.warn('[capacidad-ecosistema] no se pudo guardar', e); }
  }
  function emitirCambio() {
    try {
      window.dispatchEvent(new CustomEvent('capacidad-ecosistema:update', {
        detail: leerEstado()
      }));
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function celdaKey(dimId, horizId) { return dimId + '__' + horizId; }

  /* ---- Render ---- */

  function renderHorizonteTabs(horizontes, activoId) {
    return '<div class="cmp-cap-eco__horizontes" role="tablist">' +
      horizontes.map(h =>
        '<button class="cmp-cap-eco__horizonte ' + (h.id === activoId ? 'is-active' : '') +
          '" data-horizonte-id="' + esc(h.id) + '" type="button">' +
          '<span class="cmp-cap-eco__horizonte-label">' + esc(h.label) + '</span>' +
          (h.sub ? '<span class="cmp-cap-eco__horizonte-sub">' + esc(h.sub) + '</span>' : '') +
        '</button>'
      ).join('') +
    '</div>';
  }

  function renderEscala1a5(prefix, dimId, horizId, valorActual, kind, anclas) {
    const anchorMin = anclas && anclas[0] ? anclas[0] : 'muy poco';
    const anchorMax = anclas && anclas[1] ? anclas[1] : 'pleno';
    let html = '<div class="cmp-cap-eco__escala-wrap">';
    html += '<div class="cmp-cap-eco__escala" data-kind="' + kind + '">';
    for (let v = 1; v <= 5; v++) {
      const activo = String(valorActual) === String(v);
      html += '<button class="cmp-cap-eco__esc-btn ' + (activo ? 'is-active' : '') + '" ' +
        'data-input-kind="' + kind + '" data-input-val="' + v + '" ' +
        'data-cell-dim="' + esc(dimId) + '" data-cell-horiz="' + esc(horizId) + '" ' +
        'type="button">' + v + '</button>';
    }
    html += '</div>';
    html += '<div class="cmp-cap-eco__escala-anclas"><span>1 · ' + esc(anchorMin) + '</span><span>5 · ' + esc(anchorMax) + '</span></div>';
    html += '</div>';
    return html;
  }

  function renderBotones(opciones, dimId, horizId, valorActual, kind, claseColor) {
    return '<div class="cmp-cap-eco__botones">' +
      opciones.map(o => {
        const activo = valorActual === o.val;
        return '<button class="cmp-cap-eco__btn ' + (activo ? 'is-active' : '') +
          ' is-' + claseColor + '-' + o.val + '" ' +
          'data-input-kind="' + kind + '" data-input-val="' + esc(o.val) + '" ' +
          'data-cell-dim="' + esc(dimId) + '" data-cell-horiz="' + esc(horizId) + '" ' +
          'type="button">' + esc(o.label) + '</button>';
      }).join('') +
    '</div>';
  }

  function calcularGap(celda) {
    const cap = parseInt(celda && celda.capacidad_ef, 10);
    const nec = parseInt(celda && celda.necesidad_consumidor, 10);
    if (!cap || !nec) return null;
    return nec - cap; // positivo = consumidor pide más de lo que EF declara
  }

  function indicadorGap(celda) {
    const gap = calcularGap(celda);
    if (gap === null) return '<div class="cmp-cap-eco__gap is-vacio">Faltan inputs para medir gap</div>';
    if (gap === 0) return '<div class="cmp-cap-eco__gap is-zero">Sin gap · EFs y consumidores alineados</div>';
    if (gap > 0)  return '<div class="cmp-cap-eco__gap is-pos">Gap +' + gap + ' · consumidor pide más</div>';
    return '<div class="cmp-cap-eco__gap is-neg">Gap ' + gap + ' · EF declara capacidad superior a la pedida</div>';
  }

  function indicadorBandera(celda) {
    const gap = calcularGap(celda);
    if (gap === null) return '';
    const esfuerzoAlto = celda.esfuerzo_ef === 'alto';
    const prioridadCritica = celda.prioridad_consumidor === 'critica';
    if (gap > 0 && esfuerzoAlto && prioridadCritica) {
      return '<div class="cmp-cap-eco__bandera">Bandera levantada · gap positivo + esfuerzo alto + prioridad crítica. Decisión del regulador (plazo, escalonamiento, subsidio).</div>';
    }
    return '';
  }

  function renderDimensionCard(dimension, horizonteId, estado) {
    const key = celdaKey(dimension.id, horizonteId);
    const celda = estado[key] || {};
    const anchorTexto = dimension.anchor_brasil && (dimension.anchor_brasil[horizonteId] || dimension.anchor_brasil.global);

    const optsEsfuerzo = [
      { val: 'bajo',  label: 'Bajo' },
      { val: 'medio', label: 'Medio' },
      { val: 'alto',  label: 'Alto' }
    ];
    const optsPrioridad = [
      { val: 'critica',  label: 'Crítica' },
      { val: 'deseable', label: 'Deseable' },
      { val: 'opcional', label: 'Opcional' }
    ];

    // Contador de inputs capturados (5 total por celda)
    const capturados = ['capacidad_ef','esfuerzo_ef','necesidad_consumidor','prioridad_consumidor','umbral_regulador']
      .filter(k => celda[k]).length;

    return '' +
      '<div class="cmp-cap-eco__dim-card">' +
        '<div class="cmp-cap-eco__dim-head">' +
          '<div>' +
            '<div class="cmp-cap-eco__dim-num">' + esc(dimension.num || '') + '</div>' +
            '<h3 class="cmp-cap-eco__dim-titulo">' + esc(dimension.titulo) + '</h3>' +
            (dimension.descripcion
              ? '<p class="cmp-cap-eco__dim-desc">' + dimension.descripcion + '</p>'
              : '') +
            '<div class="cmp-cap-eco__dim-contador ' + (capturados === 5 ? 'is-completa' : '') + '">' +
              capturados + ' / 5 inputs capturados' +
            '</div>' +
          '</div>' +
          (anchorTexto
            ? '<div class="cmp-cap-eco__anchor"><span class="cmp-cap-eco__anchor-tag">Anchor · Brasil</span><span class="cmp-cap-eco__anchor-texto">' + esc(anchorTexto) + '</span></div>'
            : '') +
        '</div>' +

        '<div class="cmp-cap-eco__inputs-grid">' +

          '<div class="cmp-cap-eco__input-block is-ef">' +
            '<div class="cmp-cap-eco__input-label">' +
              '<span class="cmp-cap-eco__input-rol is-ef">Solo EF declara</span>' +
              '<strong>Capacidad EF</strong>' +
              '<span>Lo que la mesa de EFs declara que puede sostener.</span>' +
            '</div>' +
            renderEscala1a5('capacidad_ef', dimension.id, horizonteId, celda.capacidad_ef, 'capacidad_ef', ['muy poco', 'pleno']) +
          '</div>' +

          '<div class="cmp-cap-eco__input-block is-ef">' +
            '<div class="cmp-cap-eco__input-label">' +
              '<span class="cmp-cap-eco__input-rol is-ef">Solo EF declara</span>' +
              '<strong>Esfuerzo EF</strong>' +
              '<span>Coste de adoptar este nivel.</span>' +
            '</div>' +
            renderBotones(optsEsfuerzo, dimension.id, horizonteId, celda.esfuerzo_ef, 'esfuerzo_ef', 'esfuerzo') +
          '</div>' +

          '<div class="cmp-cap-eco__input-block is-consumer">' +
            '<div class="cmp-cap-eco__input-label">' +
              '<span class="cmp-cap-eco__input-rol is-consumer">Solo consumidor declara</span>' +
              '<strong>Necesidad consumidor</strong>' +
              '<span>Lo que fintechs y PSBIs declaran que necesitan.</span>' +
            '</div>' +
            renderEscala1a5('necesidad_consumidor', dimension.id, horizonteId, celda.necesidad_consumidor, 'necesidad_consumidor', ['no necesito', 'imprescindible']) +
          '</div>' +

          '<div class="cmp-cap-eco__input-block is-consumer">' +
            '<div class="cmp-cap-eco__input-label">' +
              '<span class="cmp-cap-eco__input-rol is-consumer">Solo consumidor declara</span>' +
              '<strong>Prioridad consumidor</strong>' +
              '<span>¿Cuán crítico es para sus casos de uso?</span>' +
            '</div>' +
            renderBotones(optsPrioridad, dimension.id, horizonteId, celda.prioridad_consumidor, 'prioridad_consumidor', 'prioridad') +
          '</div>' +

          '<div class="cmp-cap-eco__input-block is-regulator">' +
            '<div class="cmp-cap-eco__input-label">' +
              '<span class="cmp-cap-eco__input-rol is-regulator">Solo regulador propone</span>' +
              '<strong>Umbral propuesto</strong>' +
              '<span>Nivel que la SBS considera exigible.</span>' +
            '</div>' +
            renderEscala1a5('umbral_regulador', dimension.id, horizonteId, celda.umbral_regulador, 'umbral_regulador', ['mínimo', 'estricto']) +
          '</div>' +

        '</div>' +

        indicadorGap(celda) +
        indicadorBandera(celda) +
      '</div>';
  }

  function renderResumen(config, estado) {
    const dimensiones = config.dimensiones || [];
    const horizontes  = config.horizontes  || [];
    const total = dimensiones.length * horizontes.length;
    let banderas = 0, gapsPositivos = 0, completas = 0;
    horizontes.forEach(h => {
      dimensiones.forEach(d => {
        const c = estado[celdaKey(d.id, h.id)] || {};
        const cap = parseInt(c.capacidad_ef, 10);
        const nec = parseInt(c.necesidad_consumidor, 10);
        if (cap && nec && c.esfuerzo_ef && c.prioridad_consumidor) completas++;
        if (cap && nec) {
          const gap = nec - cap;
          if (gap > 0) gapsPositivos++;
          if (gap > 0 && c.esfuerzo_ef === 'alto' && c.prioridad_consumidor === 'critica') banderas++;
        }
      });
    });
    return '' +
      '<div class="cmp-cap-eco__resumen">' +
        '<div class="cmp-cap-eco__resumen-item"><span>Celdas completas</span><strong>' + completas + ' / ' + total + '</strong></div>' +
        '<div class="cmp-cap-eco__resumen-item"><span>Gaps positivos</span><strong>' + gapsPositivos + '</strong></div>' +
        '<div class="cmp-cap-eco__resumen-item is-flag"><span>Banderas levantadas</span><strong>' + banderas + '</strong></div>' +
      '</div>';
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;
    const dimensiones = config.dimensiones || [];
    const horizontes  = config.horizontes  || [];
    if (!dimensiones.length || !horizontes.length) {
      console.warn('[capacidad-ecosistema] requiere dimensiones y horizontes');
      return;
    }

    let estado = leerEstado();
    let horizonteActivoId = horizontes[0].id;

    function pintar() {
      const root = document.createElement('div');
      root.className = 'cmp-cap-eco';
      const dimsHTML = dimensiones.map(d => renderDimensionCard(d, horizonteActivoId, estado)).join('');
      root.innerHTML =
        '<div class="cmp-cap-eco__header">' +
          '<div>' +
            '<h2>' + (config.titulo || 'Capacidad del ecosistema') + '</h2>' +
            (config.subtitulo
              ? '<p class="cmp-cap-eco__sub">' + config.subtitulo + '</p>'
              : '') +
          '</div>' +
          '<button class="cmp-cap-eco__reset" type="button">Reiniciar matriz</button>' +
        '</div>' +
        renderHorizonteTabs(horizontes, horizonteActivoId) +
        '<div class="cmp-cap-eco__dim-stack">' + dimsHTML + '</div>' +
        renderResumen(config, estado);
      contenedor.innerHTML = '';
      contenedor.appendChild(root);
      enlazar(root);
    }

    function enlazar(root) {
      // Cambio de horizonte
      root.querySelectorAll('.cmp-cap-eco__horizonte[data-horizonte-id]').forEach(function (b) {
        b.addEventListener('click', function () {
          horizonteActivoId = b.dataset.horizonteId;
          pintar();
        });
      });

      // Reset
      const reset = root.querySelector('.cmp-cap-eco__reset');
      if (reset) {
        reset.addEventListener('click', function () {
          if (!Object.keys(estado).length) return;
          if (!window.confirm('Esto borrar\u00e1 todos los inputs capturados en la matriz de capacidad. \u00bfContinuar?')) return;
          estado = {};
          guardarEstado(estado);
          emitirCambio();
          pintar();
        });
      }

      // Inputs en celdas
      root.querySelectorAll('[data-input-kind][data-cell-dim][data-cell-horiz]').forEach(function (b) {
        b.addEventListener('click', function () {
          const dimId   = b.dataset.cellDim;
          const horizId = b.dataset.cellHoriz;
          const kind    = b.dataset.inputKind;
          const val     = b.dataset.inputVal;
          const key     = celdaKey(dimId, horizId);
          const prev    = estado[key] || {};
          if (String(prev[kind]) === String(val)) {
            delete prev[kind];
          } else {
            prev[kind] = val;
          }
          estado[key] = prev;
          guardarEstado(estado);
          emitirCambio();
          pintar();
        });
      });
    }

    pintar();
  }

  global.CapacidadEcosistema = { montar, leerEstado, STORAGE_KEY };
})(window);
