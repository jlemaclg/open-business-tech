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

   Datos: el modulo-data.json declara las decisiones con su
   pregunta, categoría, opciones y trade-offs.
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'obta:perfil-fapi:v1';

  /* ---- Persistencia ---- */
  function leerPerfil() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (e) {
      return {};
    }
  }
  function guardarPerfil(estado) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); }
    catch (e) { console.warn('[perfil-builder] no se pudo guardar', e); }
  }
  function emitirCambio() {
    try {
      window.dispatchEvent(new CustomEvent('perfil-builder:update', {
        detail: leerPerfil()
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

  /* ---- Render ---- */

  function renderEncabezado(config, estado, totalDecisiones, decididas) {
    return '' +
      '<div class="cmp-perfil-builder__header">' +
        '<div class="cmp-perfil-builder__title-row">' +
          '<div>' +
            '<h2>' + (config.titulo || 'Tu perfil FAPI 2.0') + '</h2>' +
            (config.subtitulo
              ? '<p class="cmp-perfil-builder__sub">' + config.subtitulo + '</p>'
              : '') +
          '</div>' +
          '<div class="cmp-perfil-builder__modos">' +
            '<button class="cmp-perfil-builder__modo-btn is-active" data-modo="individual">Modo individual</button>' +
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
          '<button class="cmp-perfil-builder__reset" type="button">Empezar perfil nuevo</button>' +
        '</div>' +
      '</div>';
  }

  function renderCardPanorama(decision, estado) {
    const elegida = estado[decision.id];
    const opcion = elegida ? findOpcion(decision, elegida) : null;
    const decidida = !!opcion;
    return '' +
      '<button class="cmp-perfil-builder__card ' + (decidida ? 'is-decided' : 'is-pending') + '"' +
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
      '</button>';
  }

  function renderPanoramaIndividual(config, estado) {
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
          categorias[cat].map(d => renderCardPanorama(d, estado)).join('') +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderOpcion(decision, opcion, estado) {
    const elegida = estado[decision.id] === opcion.id;
    return '' +
      '<button class="cmp-perfil-builder__option ' + (elegida ? 'is-elegida' : '') + '"' +
              ' data-option-id="' + esc(opcion.id) + '" type="button">' +
        '<div class="cmp-perfil-builder__option-head">' +
          '<span class="cmp-perfil-builder__option-label">' + esc(opcion.label) + '</span>' +
          (opcion.tag ? '<span class="cmp-perfil-builder__option-tag">' + esc(opcion.tag) + '</span>' : '') +
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

  function renderDetalle(decision, estado, modo, idx, total) {
    const navTaller = modo === 'taller'
      ? '<div class="cmp-perfil-builder__taller-nav">' +
          '<button class="cmp-perfil-builder__nav-btn" data-nav="prev" ' +
            (idx === 0 ? 'disabled' : '') + ' type="button">← Anterior</button>' +
          '<span class="cmp-perfil-builder__nav-counter">Decisión ' + (idx + 1) + ' de ' + total + '</span>' +
          '<button class="cmp-perfil-builder__nav-btn is-primary" data-nav="next" ' +
            (idx === total - 1 ? 'disabled' : '') + ' type="button">Siguiente →</button>' +
        '</div>'
      : '';

    return '' +
      '<div class="cmp-perfil-builder__detalle">' +
        (modo !== 'taller'
          ? '<button class="cmp-perfil-builder__back" type="button">← Volver al panorama</button>'
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
        '<div class="cmp-perfil-builder__options-grid">' +
          (decision.opciones || []).map(o => renderOpcion(decision, o, estado)).join('') +
        '</div>' +
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

    // Estado interno (no persiste): modo + decisión activa
    let estado = leerPerfil();
    let modo = 'individual';            // 'individual' | 'taller'
    let decisionActivaId = null;        // null = vista panorama (modo individual)
    let decisionActivaIdx = 0;          // índice para taller

    function decididas() {
      return decisiones.filter(d => estado[d.id]).length;
    }

    function pintar() {
      const total = decisiones.length;
      const root = document.createElement('div');
      root.className = 'cmp-perfil-builder' + (modo === 'taller' ? ' is-taller' : '');
      let bodyHTML = '';

      if (modo === 'individual' && !decisionActivaId) {
        bodyHTML = renderPanoramaIndividual(config, estado);
      } else if (modo === 'individual' && decisionActivaId) {
        const d = decisiones.find(x => x.id === decisionActivaId);
        if (d) bodyHTML = renderDetalle(d, estado, modo, decisiones.indexOf(d), total);
        else bodyHTML = renderPanoramaIndividual(config, estado);
      } else {
        // modo taller — siempre una decisión activa
        const d = decisiones[decisionActivaIdx] || decisiones[0];
        bodyHTML = renderDetalle(d, estado, modo, decisionActivaIdx, total);
      }

      root.innerHTML = renderEncabezado(config, estado, total, decididas()) +
                       '<div class="cmp-perfil-builder__body">' + bodyHTML + '</div>';
      contenedor.innerHTML = '';
      contenedor.appendChild(root);
      enlazar(root);
    }

    function enlazar(root) {
      // Cambio de modo
      root.querySelectorAll('.cmp-perfil-builder__modo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modo = btn.dataset.modo;
          if (modo === 'taller') {
            decisionActivaId = null;
            // arrancar en la primera decisión sin decidir, o en la 0
            const pendienteIdx = decisiones.findIndex(d => !estado[d.id]);
            decisionActivaIdx = pendienteIdx >= 0 ? pendienteIdx : 0;
          } else {
            decisionActivaId = null;
          }
          pintar();
        });
      });

      // Reset
      const reset = root.querySelector('.cmp-perfil-builder__reset');
      if (reset) {
        reset.addEventListener('click', () => {
          if (!Object.keys(estado).length) return;
          const ok = window.confirm(
            'Esto borrará todas las decisiones que hayas tomado en este perfil. ¿Continuar?'
          );
          if (!ok) return;
          estado = {};
          guardarPerfil(estado);
          emitirCambio();
          decisionActivaId = null;
          decisionActivaIdx = 0;
          pintar();
        });
      }

      // Click en card de panorama → entra a detalle
      root.querySelectorAll('.cmp-perfil-builder__card[data-decision-id]').forEach(c => {
        c.addEventListener('click', () => {
          decisionActivaId = c.dataset.decisionId;
          pintar();
        });
      });

      // Back
      const back = root.querySelector('.cmp-perfil-builder__back');
      if (back) {
        back.addEventListener('click', () => {
          decisionActivaId = null;
          pintar();
        });
      }

      // Click en opción → registra elección
      root.querySelectorAll('.cmp-perfil-builder__option[data-option-id]').forEach(b => {
        b.addEventListener('click', () => {
          const decision = decisiones.find(d =>
            modo === 'taller'
              ? d.id === decisiones[decisionActivaIdx].id
              : d.id === decisionActivaId
          );
          if (!decision) return;
          estado[decision.id] = b.dataset.optionId;
          guardarPerfil(estado);
          emitirCambio();
          // En modo individual, tras decidir vuelve al panorama
          if (modo === 'individual') {
            decisionActivaId = null;
            pintar();
          } else {
            // En modo taller, avanza al siguiente si no estamos en el último
            if (decisionActivaIdx < decisiones.length - 1) {
              decisionActivaIdx++;
            }
            pintar();
          }
        });
      });

      // Navegación taller
      root.querySelectorAll('.cmp-perfil-builder__nav-btn[data-nav]').forEach(b => {
        b.addEventListener('click', () => {
          if (b.disabled) return;
          if (b.dataset.nav === 'prev' && decisionActivaIdx > 0) decisionActivaIdx--;
          if (b.dataset.nav === 'next' && decisionActivaIdx < decisiones.length - 1) decisionActivaIdx++;
          pintar();
        });
      });
    }

    pintar();
  }

  global.PerfilBuilder = { montar, leerPerfil, STORAGE_KEY };
})(window);
