/* ============================================================
   Componente: perfil-builder
   Constructor interactivo del perfil FAPI 2.0 de la jurisdicción.

   - Presenta N decisiones agrupadas en categorías.
   - El usuario/grupo elige una opción por decisión.
   - Persiste en localStorage (clave dedicada, no contamina el
     progreso del consultor).
   - Dos modos visuales:
       · individual: grid panorámico + panel expandido.
       · taller: una decisión en pantalla, layout grande,
         pensado para proyectar.
   - Emite eventos custom 'perfil-builder:update' al window
     para que el perfil-resumen reaccione.

   MODO CO-CREACIÓN (nuevo, opcional):
   - Se activa con config.modo_cocreacion = true.
   - Usa storage key separada (no contamina el 04b).
   - Por cada decisión, además de la opción elegida, captura:
       · esfuerzo declarado por las EFs (bajo/medio/alto)
       · prioridad declarada por los consumidores
         (crítica/deseable/opcional)
   - Muestra banner anchor "Brasil sostiene X" cuando la
     decisión declara decision.anchor_brasil = {opcion_id, nota}.

   Datos: el modulo-data.json declara las decisiones con su
   pregunta, categoría, opciones y trade-offs.
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY            = 'obta:perfil-fapi:v1';
  const STORAGE_KEY_COCREACION = 'obta:perfil-fapi-cocreacion:v1';

  /* ---- Persistencia ---- */
  function _claveStorage(cocreacion) {
    return cocreacion ? STORAGE_KEY_COCREACION : STORAGE_KEY;
  }
  function leerPerfil(cocreacion) {
    try {
      const raw = localStorage.getItem(_claveStorage(cocreacion));
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (e) {
      return {};
    }
  }
  function guardarPerfil(estado, cocreacion) {
    try { localStorage.setItem(_claveStorage(cocreacion), JSON.stringify(estado)); }
    catch (e) { console.warn('[perfil-builder] no se pudo guardar', e); }
  }
  function emitirCambio(cocreacion) {
    try {
      window.dispatchEvent(new CustomEvent('perfil-builder:update', {
        detail: {
          estado: leerPerfil(cocreacion),
          modo_cocreacion: !!cocreacion
        }
      }));
    } catch (e) { /* navegadores antiguos */ }
  }

  /* ---- Utilidades ---- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function findOpcion(decision, opcionId) {
    return (decision.opciones || []).find(o => o.id === opcionId);
  }
  // Acceso uniforme al "voto" sea cual sea el modo de almacenamiento
  function opcionElegidaId(entry) {
    if (entry == null) return null;
    if (typeof entry === 'string') return entry;            // modo individual clásico
    if (typeof entry === 'object') return entry.opcion || null; // modo cocreación
    return null;
  }

  /* ---- Render ---- */

  function renderEncabezado(config, estado, totalDecisiones, decididas, cocreacion) {
    const subSala = cocreacion
      ? '<div class="cmp-perfil-builder__sala-rol">'
        + '<span class="cmp-perfil-builder__sala-tag is-ef">EF declara capacidad + esfuerzo</span>'
        + '<span class="cmp-perfil-builder__sala-tag is-consumer">Consumidor declara prioridad</span>'
        + '<span class="cmp-perfil-builder__sala-tag is-anchor">Anchor: Brasil</span>'
        + '</div>'
      : '';
    return '' +
      '<div class="cmp-perfil-builder__header' + (cocreacion ? ' is-cocreacion' : '') + '">' +
        '<div class="cmp-perfil-builder__title-row">' +
          '<div>' +
            '<h2>' + (config.titulo || 'Tu perfil FAPI 2.0') + '</h2>' +
            (config.subtitulo
              ? '<p class="cmp-perfil-builder__sub">' + config.subtitulo + '</p>'
              : '') +
            subSala +
          '</div>' +
          '<div class="cmp-perfil-builder__modos">' +
            '<button class="cmp-perfil-builder__modo-btn is-active" data-modo="individual">' +
              (cocreacion ? 'Vista panorama' : 'Modo individual') +
            '</button>' +
            '<button class="cmp-perfil-builder__modo-btn" data-modo="taller">Vista taller</button>' +
          '</div>' +
        '</div>' +
        '<div class="cmp-perfil-builder__progress-row">' +
          '<div class="cmp-perfil-builder__progress-wrap">' +
            '<div class="cmp-perfil-builder__progress-fill" style="width:' +
              Math.round(decididas / totalDecisiones * 100) + '%"></div>' +
          '</div>' +
          '<div class="cmp-perfil-builder__progress-text">' +
            decididas + ' de ' + totalDecisiones + ' decisiones tomadas' +
          '</div>' +
          '<button class="cmp-perfil-builder__reset" type="button">' +
            (cocreacion ? 'Reiniciar taller' : 'Empezar perfil nuevo') +
          '</button>' +
        '</div>' +
      '</div>';
  }

  function renderCardPanorama(decision, estado, cocreacion) {
    const entry = estado[decision.id];
    const elegidaId = opcionElegidaId(entry);
    const opcion = elegidaId ? findOpcion(decision, elegidaId) : null;
    const decidida = !!opcion;
    // En cocreación, "decidida" requiere también esfuerzo+prioridad capturados
    const completa = cocreacion
      ? decidida && entry && entry.esfuerzo_ef && entry.prioridad_consumidor
      : decidida;

    let chipExtra = '';
    if (cocreacion && decidida && entry) {
      const esf = entry.esfuerzo_ef
        ? '<span class="cmp-perfil-builder__chip-ef is-' + esc(entry.esfuerzo_ef) + '">esf ' + esc(entry.esfuerzo_ef) + '</span>'
        : '<span class="cmp-perfil-builder__chip-ef is-pending">esf —</span>';
      const pri = entry.prioridad_consumidor
        ? '<span class="cmp-perfil-builder__chip-cons is-' + esc(entry.prioridad_consumidor) + '">pri ' + esc(entry.prioridad_consumidor) + '</span>'
        : '<span class="cmp-perfil-builder__chip-cons is-pending">pri —</span>';
      chipExtra = '<div class="cmp-perfil-builder__card-extras">' + esf + pri + '</div>';
    }

    return '' +
      '<button class="cmp-perfil-builder__card ' + (completa ? 'is-decided' : (decidida ? 'is-partial' : 'is-pending')) + '"' +
              ' data-decision-id="' + esc(decision.id) + '" type="button">' +
        '<div class="cmp-perfil-builder__card-top">' +
          '<span class="cmp-perfil-builder__card-num">' + esc(decision.num) + '</span>' +
          '<span class="cmp-perfil-builder__card-cat">' + esc(decision.categoria) + '</span>' +
        '</div>' +
        '<div class="cmp-perfil-builder__card-q">' + esc(decision.pregunta_corta || decision.pregunta) + '</div>' +
        '<div class="cmp-perfil-builder__card-status">' +
          (decidida
            ? '<span class="cmp-perfil-builder__chip is-decided">' + esc(opcion.label) + '</span>'
            : '<span class="cmp-perfil-builder__chip is-pending">Sin decidir</span>') +
        '</div>' +
        chipExtra +
      '</button>';
  }

  function renderPanoramaIndividual(config, estado, cocreacion) {
    const decisiones = config.decisiones || [];
    const categorias = {};
    decisiones.forEach(d => {
      const k = d.categoria || 'General';
      if (!categorias[k]) categorias[k] = [];
      categorias[k].push(d);
    });

    let html = '<div class="cmp-perfil-builder__panorama">';
    Object.keys(categorias).forEach(cat => {
      html += '<div class="cmp-perfil-builder__cat-block">' +
        '<div class="cmp-perfil-builder__cat-label">' + esc(cat) + '</div>' +
        '<div class="cmp-perfil-builder__cat-grid">' +
          categorias[cat].map(d => renderCardPanorama(d, estado, cocreacion)).join('') +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderAnchorBrasil(decision) {
    if (!decision.anchor_brasil) return '';
    const ab = decision.anchor_brasil;
    const opcionRef = ab.opcion ? findOpcion(decision, ab.opcion) : null;
    const labelRef = ab.label || (opcionRef ? opcionRef.label : null);
    const nota = ab.nota || '';
    if (!labelRef && !nota) return '';
    return '' +
      '<div class="cmp-perfil-builder__anchor">' +
        '<div class="cmp-perfil-builder__anchor-tag">Anchor · Open Finance Brasil</div>' +
        '<div class="cmp-perfil-builder__anchor-body">' +
          (labelRef ? '<strong>Brasil sostiene: ' + esc(labelRef) + '</strong>' : '') +
          (nota ? '<p>' + nota + '</p>' : '') +
        '</div>' +
      '</div>';
  }

  function renderOpcion(decision, opcion, estado, cocreacion) {
    const entry = estado[decision.id];
    const elegida = opcionElegidaId(entry) === opcion.id;
    const esAnchor = decision.anchor_brasil && decision.anchor_brasil.opcion === opcion.id;
    const cls = [
      'cmp-perfil-builder__option',
      elegida ? 'is-elegida' : '',
      cocreacion && esAnchor ? 'is-anchor-brasil' : ''
    ].filter(Boolean).join(' ');
    return '' +
      '<button class="' + cls + '"' +
              ' data-option-id="' + esc(opcion.id) + '" type="button">' +
        '<div class="cmp-perfil-builder__option-head">' +
          '<span class="cmp-perfil-builder__option-label">' + esc(opcion.label) + '</span>' +
          (opcion.tag ? '<span class="cmp-perfil-builder__option-tag">' + esc(opcion.tag) + '</span>' : '') +
          (cocreacion && esAnchor ? '<span class="cmp-perfil-builder__option-anchor-mark">Brasil</span>' : '') +
        '</div>' +
        (opcion.descripcion
          ? '<p class="cmp-perfil-builder__option-desc">' + opcion.descripcion + '</p>'
          : '') +
        (Array.isArray(opcion.trade_offs) && opcion.trade_offs.length
          ? '<ul class="cmp-perfil-builder__option-tradeoffs">' +
              opcion.trade_offs.map(t => '<li>' + t + '</li>').join('') +
            '</ul>'
          : '') +
      '</button>';
  }

  function renderCapturasCocreacion(decision, estado) {
    const entry = estado[decision.id];
    if (!entry || !opcionElegidaId(entry)) {
      return '<p class="cmp-perfil-builder__cocreacion-hint">Elige una opción para capturar esfuerzo y prioridad.</p>';
    }
    const esf = entry.esfuerzo_ef || '';
    const pri = entry.prioridad_consumidor || '';
    const optBtn = (val, label, active, kind) =>
      '<button class="cmp-perfil-builder__capt-btn' + (active ? ' is-active' : '') + ' is-' + kind + '" ' +
        'data-capt="' + kind + '" data-capt-val="' + val + '" type="button">' + esc(label) + '</button>';

    const completo = !!esf && !!pri;
    const faltan = [!esf && 'esfuerzo EF', !pri && 'prioridad consumidor'].filter(Boolean);

    return '' +
      '<div class="cmp-perfil-builder__cocreacion-block">' +
        '<div class="cmp-perfil-builder__capt-row">' +
          '<div class="cmp-perfil-builder__capt-label">' +
            '<span class="cmp-perfil-builder__capt-rol is-ef">Solo EF declara</span>' +
            '<strong>Esfuerzo declarado por las EFs</strong>' +
            '<span>¿Qué coste de implementación supone adoptar esta opción?</span>' +
          '</div>' +
          '<div class="cmp-perfil-builder__capt-controls">' +
            optBtn('bajo',  'Bajo',  esf === 'bajo',  'esfuerzo_ef') +
            optBtn('medio', 'Medio', esf === 'medio', 'esfuerzo_ef') +
            optBtn('alto',  'Alto',  esf === 'alto',  'esfuerzo_ef') +
          '</div>' +
        '</div>' +
        '<div class="cmp-perfil-builder__capt-row">' +
          '<div class="cmp-perfil-builder__capt-label">' +
            '<span class="cmp-perfil-builder__capt-rol is-consumer">Solo consumidor declara</span>' +
            '<strong>Prioridad declarada por los consumidores</strong>' +
            '<span>¿Qué tan crítico es esto para fintechs y PSBIs en la mesa?</span>' +
          '</div>' +
          '<div class="cmp-perfil-builder__capt-controls">' +
            optBtn('critica',  'Crítica',  pri === 'critica',  'prioridad_consumidor') +
            optBtn('deseable', 'Deseable', pri === 'deseable', 'prioridad_consumidor') +
            optBtn('opcional', 'Opcional', pri === 'opcional', 'prioridad_consumidor') +
          '</div>' +
        '</div>' +
        // Estado de la decisión: completa / falta capturar
        (completo
          ? '<div class="cmp-perfil-builder__estado is-completa">Decisión completa</div>'
          : '<div class="cmp-perfil-builder__estado is-incompleta">Falta capturar: ' + faltan.join(' y ') + '</div>') +
        // Bandera: alto esfuerzo + crítica = punto de tensión (solo si AMBOS están definidos)
        (esf === 'alto' && pri === 'critica'
          ? '<div class="cmp-perfil-builder__flag"><strong>Bandera levantada</strong> \u00b7 esfuerzo alto + prioridad cr\u00edtica. Requiere decisi\u00f3n del regulador (plazo / escalonamiento / subsidio).</div>'
          : '') +
      '</div>';
  }

  function renderDetalle(decision, estado, modo, idx, total, cocreacion) {
    const navTaller = modo === 'taller'
      ? '<div class="cmp-perfil-builder__taller-nav">' +
          '<button class="cmp-perfil-builder__nav-btn" data-nav="prev" ' +
            (idx === 0 ? 'disabled' : '') + ' type="button">\u2190 Anterior</button>' +
          '<span class="cmp-perfil-builder__nav-counter">Decisi\u00f3n ' + (idx + 1) + ' de ' + total + '</span>' +
          '<button class="cmp-perfil-builder__nav-btn is-primary" data-nav="next" ' +
            (idx === total - 1 ? 'disabled' : '') + ' type="button">Siguiente \u2192</button>' +
        '</div>'
      : '';

    return '' +
      '<div class="cmp-perfil-builder__detalle' + (cocreacion ? ' is-cocreacion' : '') + '">' +
        (modo !== 'taller'
          ? '<button class="cmp-perfil-builder__back" type="button">\u2190 Volver al panorama</button>'
          : '') +
        '<div class="cmp-perfil-builder__detalle-head">' +
          '<div class="cmp-perfil-builder__detalle-num">' + esc(decision.num) + '</div>' +
          '<div>' +
            '<div class="cmp-perfil-builder__detalle-cat">' + esc(decision.categoria) + '</div>' +
            '<h3 class="cmp-perfil-builder__detalle-q">' + esc(decision.pregunta) + '</h3>' +
            (decision.contexto
              ? '<p class="cmp-perfil-builder__detalle-contexto">' + decision.contexto + '</p>'
              : '') +
          '</div>' +
        '</div>' +
        (cocreacion ? renderAnchorBrasil(decision) : '') +
        '<div class="cmp-perfil-builder__options-grid">' +
          (decision.opciones || []).map(function (o) { return renderOpcion(decision, o, estado, cocreacion); }).join('') +
        '</div>' +
        (cocreacion ? renderCapturasCocreacion(decision, estado) : '') +
        (decision.nota
          ? '<p class="cmp-perfil-builder__nota">' + decision.nota + '</p>'
          : '') +
        navTaller +
      '</div>';
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;
    const decisiones = config.decisiones || [];
    if (!decisiones.length) {
      console.warn('[perfil-builder] sin decisiones definidas');
      return;
    }
    const cocreacion = !!config.modo_cocreacion;

    let estado = leerPerfil(cocreacion);
    let modo = 'individual';
    let decisionActivaId = null;
    let decisionActivaIdx = 0;

    function decididas() {
      return decisiones.filter(function (d) {
        const entry = estado[d.id];
        const elegida = opcionElegidaId(entry);
        if (!elegida) return false;
        if (cocreacion) return entry && entry.esfuerzo_ef && entry.prioridad_consumidor;
        return true;
      }).length;
    }

    function setOpcion(decisionId, opcionId) {
      if (cocreacion) {
        const prev = (estado[decisionId] && typeof estado[decisionId] === 'object') ? estado[decisionId] : {};
        estado[decisionId] = Object.assign({}, prev, { opcion: opcionId });
      } else {
        estado[decisionId] = opcionId;
      }
    }

    function setCaptura(decisionId, kind, val) {
      if (!cocreacion) return;
      const prev = (estado[decisionId] && typeof estado[decisionId] === 'object') ? estado[decisionId] : {};
      prev[kind] = val;
      estado[decisionId] = prev;
    }

    function pintar() {
      const total = decisiones.length;
      const root = document.createElement('div');
      root.className = 'cmp-perfil-builder' + (modo === 'taller' ? ' is-taller' : '') + (cocreacion ? ' is-cocreacion' : '');
      let bodyHTML = '';

      if (modo === 'individual' && !decisionActivaId) {
        bodyHTML = renderPanoramaIndividual(config, estado, cocreacion);
      } else if (modo === 'individual' && decisionActivaId) {
        const d = decisiones.find(function (x) { return x.id === decisionActivaId; });
        if (d) bodyHTML = renderDetalle(d, estado, modo, decisiones.indexOf(d), total, cocreacion);
        else bodyHTML = renderPanoramaIndividual(config, estado, cocreacion);
      } else {
        const d = decisiones[decisionActivaIdx] || decisiones[0];
        bodyHTML = renderDetalle(d, estado, modo, decisionActivaIdx, total, cocreacion);
      }

      root.innerHTML = renderEncabezado(config, estado, total, decididas(), cocreacion) +
                       '<div class="cmp-perfil-builder__body">' + bodyHTML + '</div>';
      contenedor.innerHTML = '';
      contenedor.appendChild(root);
      enlazar(root);
    }

    function enlazar(root) {
      root.querySelectorAll('.cmp-perfil-builder__modo-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          modo = btn.dataset.modo;
          if (modo === 'taller') {
            decisionActivaId = null;
            const pendienteIdx = decisiones.findIndex(function (d) { return !opcionElegidaId(estado[d.id]); });
            decisionActivaIdx = pendienteIdx >= 0 ? pendienteIdx : 0;
          } else {
            decisionActivaId = null;
          }
          pintar();
        });
      });

      const reset = root.querySelector('.cmp-perfil-builder__reset');
      if (reset) {
        reset.addEventListener('click', function () {
          if (!Object.keys(estado).length) return;
          const ok = window.confirm(
            cocreacion
              ? 'Esto borrar\u00e1 todas las decisiones, esfuerzos y prioridades capturadas en el taller. \u00bfContinuar?'
              : 'Esto borrar\u00e1 todas las decisiones que hayas tomado en este perfil. \u00bfContinuar?'
          );
          if (!ok) return;
          estado = {};
          guardarPerfil(estado, cocreacion);
          emitirCambio(cocreacion);
          decisionActivaId = null;
          decisionActivaIdx = 0;
          pintar();
        });
      }

      root.querySelectorAll('.cmp-perfil-builder__card[data-decision-id]').forEach(function (cc) {
        cc.addEventListener('click', function () {
          decisionActivaId = cc.dataset.decisionId;
          pintar();
        });
      });

      const back = root.querySelector('.cmp-perfil-builder__back');
      if (back) {
        back.addEventListener('click', function () {
          decisionActivaId = null;
          pintar();
        });
      }

      root.querySelectorAll('.cmp-perfil-builder__option[data-option-id]').forEach(function (b) {
        b.addEventListener('click', function () {
          const decision = decisiones.find(function (d) {
            return modo === 'taller'
              ? d.id === decisiones[decisionActivaIdx].id
              : d.id === decisionActivaId;
          });
          if (!decision) return;
          setOpcion(decision.id, b.dataset.optionId);
          guardarPerfil(estado, cocreacion);
          emitirCambio(cocreacion);
          if (cocreacion) { pintar(); return; }
          if (modo === 'individual') {
            decisionActivaId = null;
            pintar();
          } else {
            if (decisionActivaIdx < decisiones.length - 1) decisionActivaIdx++;
            pintar();
          }
        });
      });

      root.querySelectorAll('.cmp-perfil-builder__capt-btn[data-capt]').forEach(function (b) {
        b.addEventListener('click', function () {
          const decision = decisiones.find(function (d) {
            return modo === 'taller'
              ? d.id === decisiones[decisionActivaIdx].id
              : d.id === decisionActivaId;
          });
          if (!decision) return;
          setCaptura(decision.id, b.dataset.capt, b.dataset.captVal);
          guardarPerfil(estado, cocreacion);
          emitirCambio(cocreacion);
          pintar();
        });
      });

      root.querySelectorAll('.cmp-perfil-builder__nav-btn[data-nav]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.disabled) return;
          if (b.dataset.nav === 'prev' && decisionActivaIdx > 0) decisionActivaIdx--;
          if (b.dataset.nav === 'next' && decisionActivaIdx < decisiones.length - 1) decisionActivaIdx++;
          pintar();
        });
      });
    }

    pintar();
  }

  global.PerfilBuilder = {
    montar,
    leerPerfil,
    STORAGE_KEY,
    STORAGE_KEY_COCREACION
  };
})(window);
