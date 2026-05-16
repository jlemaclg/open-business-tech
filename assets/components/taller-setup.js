/* ============================================================
   Componente: taller-setup
   Pantalla inicial del taller presencial de co-creación.
   El facilitador (Minsait) configura:
     · composición de la mesa (cuántas EF, fintechs, regulador,
       cámaras, otros)
     · bloques activos (perfil FAPI / SLAs / ambos)
     · idioma de la ficha de salida
   Y firma las reglas del juego antes de arrancar.

   Persiste en localStorage para que el resto del módulo lea
   la configuración (y, por ejemplo, el acta-export la incluya).
   Emite 'taller-setup:update' cuando cambia.
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'obta:taller-setup:v1';

  function leerSetup() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (e) { return {}; }
  }
  function guardarSetup(setup) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(setup)); }
    catch (e) { console.warn('[taller-setup] no se pudo guardar', e); }
  }
  function emitirCambio() {
    try { window.dispatchEvent(new CustomEvent('taller-setup:update', { detail: leerSetup() })); }
    catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const SVG_MINUS = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const SVG_PLUS  = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

  function renderComposicionFila(rol, label, descr, count) {
    return '' +
      '<div class="cmp-taller-setup__rol-row">' +
        '<div class="cmp-taller-setup__rol-label"><strong>' + esc(label) + '</strong><span>' + esc(descr) + '</span></div>' +
        '<div class="cmp-taller-setup__rol-controls">' +
          '<button class="cmp-taller-setup__rol-btn" data-rol="' + esc(rol) + '" data-delta="-1" type="button" aria-label="Disminuir">' + SVG_MINUS + '</button>' +
          '<span class="cmp-taller-setup__rol-count" data-rol-count="' + esc(rol) + '">' + count + '</span>' +
          '<button class="cmp-taller-setup__rol-btn" data-rol="' + esc(rol) + '" data-delta="+1" type="button" aria-label="Aumentar">' + SVG_PLUS + '</button>' +
        '</div>' +
      '</div>';
  }

  function renderBloqueToggle(id, label, descr, activo) {
    return '' +
      '<button class="cmp-taller-setup__bloque ' + (activo ? 'is-active' : '') + '" ' +
              'data-bloque-id="' + esc(id) + '" type="button">' +
        '<div class="cmp-taller-setup__bloque-check">' +
          (activo ? '<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
        '</div>' +
        '<div class="cmp-taller-setup__bloque-body">' +
          '<strong>' + esc(label) + '</strong>' +
          '<p>' + esc(descr) + '</p>' +
        '</div>' +
      '</button>';
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;
    const rolesDefault = config.roles_default || [
      { id: 'ef',        label: 'Entidades Financieras (EF)', descr: 'Bancos / IPI / IPC. Únicas obligadas a sostener los SLAs.' },
      { id: 'fintech',   label: 'Fintechs / PSBI / PSIP',     descr: 'Consumidores. Declaran necesidad y prioridad.' },
      { id: 'regulador', label: 'Regulador',                  descr: 'SBS u homólogo. Propone umbrales y modera.' },
      { id: 'camara',    label: 'Cámaras y gremios',          descr: 'Asbanc u homólogos. Observan, consolidan, median.' },
      { id: 'otros',     label: 'Otros actores',              descr: 'Consultoría, academia, observadores invitados.' }
    ];
    const bloquesDefault = config.bloques_default || [
      { id: 'fapi',  label: 'Bloque 1 · Perfil FAPI 2.0',           descr: '12 decisiones de seguridad / consentimiento / ciclo de vida.' },
      { id: 'slas',  label: 'Bloque 2 · SLAs del ecosistema',       descr: '8 dimensiones operativas × 3 horizontes (corto / medio / largo).' }
    ];

    // Estado inicial: si hay setup previo en localStorage úsalo; si no, inicializar
    let setup = leerSetup();
    if (!setup.roles) {
      setup.roles = {};
      rolesDefault.forEach(r => { setup.roles[r.id] = (r.id === 'ef' || r.id === 'fintech') ? 2 : 1; });
    }
    if (!setup.bloques) {
      setup.bloques = { fapi: true, slas: true };
    }
    if (!setup.titulo_taller) setup.titulo_taller = config.titulo_default || 'Taller de co-creación';
    if (!setup.fecha) setup.fecha = new Date().toISOString().slice(0, 10);
    if (!setup.facilitador) setup.facilitador = config.facilitador_default || 'Minsait · Open Business';

    function totalParticipantes() {
      return Object.values(setup.roles || {}).reduce((s, n) => s + (parseInt(n, 10) || 0), 0);
    }

    function pintar() {
      const root = document.createElement('div');
      root.className = 'cmp-taller-setup';
      root.innerHTML =
        '<div class="cmp-taller-setup__header">' +
          '<div class="cmp-taller-setup__eyebrow">' + (config.eyebrow || 'Setup del taller') + '</div>' +
          '<h2>' + (config.titulo || 'Configurar la sala antes de arrancar') + '</h2>' +
          (config.subtitulo ? '<p class="cmp-taller-setup__sub">' + config.subtitulo + '</p>' : '') +
        '</div>' +

        '<div class="cmp-taller-setup__grid">' +

          '<section class="cmp-taller-setup__section">' +
            '<h3>Datos del taller</h3>' +
            '<label class="cmp-taller-setup__field">' +
              '<span>Título</span>' +
              '<input type="text" data-field="titulo_taller" value="' + esc(setup.titulo_taller) + '" />' +
            '</label>' +
            '<label class="cmp-taller-setup__field">' +
              '<span>Fecha</span>' +
              '<input type="date" data-field="fecha" value="' + esc(setup.fecha) + '" />' +
            '</label>' +
            '<label class="cmp-taller-setup__field">' +
              '<span>Facilitador</span>' +
              '<input type="text" data-field="facilitador" value="' + esc(setup.facilitador) + '" />' +
            '</label>' +
          '</section>' +

          '<section class="cmp-taller-setup__section">' +
            '<h3>Composición de la mesa</h3>' +
            '<p class="cmp-taller-setup__hint">Indica cuántos participantes hay por rol. El total se muestra abajo.</p>' +
            '<div class="cmp-taller-setup__roles">' +
              rolesDefault.map(r => renderComposicionFila(r.id, r.label, r.descr, setup.roles[r.id] || 0)).join('') +
            '</div>' +
            '<div class="cmp-taller-setup__total"><span>Total participantes</span><strong>' + totalParticipantes() + '</strong></div>' +
          '</section>' +

          '<section class="cmp-taller-setup__section is-wide">' +
            '<h3>Bloques activos</h3>' +
            '<p class="cmp-taller-setup__hint">El día completo cubre los dos bloques. Desactiva uno si la sesión se enfoca solo en una mitad.</p>' +
            '<div class="cmp-taller-setup__bloques">' +
              bloquesDefault.map(b => renderBloqueToggle(b.id, b.label, b.descr, !!setup.bloques[b.id])).join('') +
            '</div>' +
          '</section>' +

          '<section class="cmp-taller-setup__section is-wide">' +
            '<h3>Reglas del juego</h3>' +
            '<ul class="cmp-taller-setup__reglas">' +
              '<li><strong>EF declara capacidad y esfuerzo</strong> — solo las EFs marcan qué pueden sostener y a qué coste. Son las que tienen que cumplir.</li>' +
              '<li><strong>Fintechs / consumidores declaran necesidad y prioridad</strong> — no votan capacidad, marcan qué necesitan que la EF sostenga y cuán crítico es.</li>' +
              '<li><strong>Regulador propone umbral</strong> — la SBS marca el nivel exigible que considera razonable; puede dejarlo flexible.</li>' +
              '<li><strong>Cámaras y otros actores observan y consolidan</strong> — no votan números, pero pueden registrar comentarios cualitativos.</li>' +
              '<li><strong>Anchor Brasil siempre visible</strong> — cada decisión / dimensión arranca con la opción que Open Finance Brasil ya sostiene. La conversación es "hasta dónde adoptamos Brasil", no "qué hacemos".</li>' +
              '<li><strong>Input agregado anónimo</strong> — las EFs como bloque, no por nombre. Las cámaras consolidan en sala.</li>' +
            '</ul>' +
          '</section>' +

        '</div>' +

        '<div class="cmp-taller-setup__cta">' +
          '<button class="cmp-taller-setup__guardar" type="button">Guardar configuración y empezar taller</button>' +
        '</div>';

      contenedor.innerHTML = '';
      contenedor.appendChild(root);
      enlazar(root);
    }

    function enlazar(root) {
      // Inputs de texto / fecha
      root.querySelectorAll('input[data-field]').forEach(inp => {
        inp.addEventListener('change', () => {
          setup[inp.dataset.field] = inp.value;
          guardarSetup(setup);
          emitirCambio();
        });
      });

      // Botones +/- por rol
      root.querySelectorAll('.cmp-taller-setup__rol-btn[data-rol][data-delta]').forEach(b => {
        b.addEventListener('click', () => {
          const rol = b.dataset.rol;
          const delta = parseInt(b.dataset.delta, 10);
          setup.roles[rol] = Math.max(0, (parseInt(setup.roles[rol], 10) || 0) + delta);
          guardarSetup(setup);
          emitirCambio();
          // Actualizar solo el contador
          const out = root.querySelector('[data-rol-count="' + rol + '"]');
          if (out) out.textContent = setup.roles[rol];
          const tot = root.querySelector('.cmp-taller-setup__total strong');
          if (tot) tot.textContent = totalParticipantes();
        });
      });

      // Toggle de bloques
      root.querySelectorAll('.cmp-taller-setup__bloque[data-bloque-id]').forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.bloqueId;
          setup.bloques[id] = !setup.bloques[id];
          guardarSetup(setup);
          emitirCambio();
          pintar();
        });
      });
      // CTA guardar — emite evento (libera gate) y hace scroll al siguiente bloque
      const guardar = root.querySelector('.cmp-taller-setup__guardar');
      if (guardar) {
        guardar.addEventListener('click', function () {
          setup.iniciado = true;
          setup.iniciado_at = new Date().toISOString();
          guardarSetup(setup);
          emitirCambio();
          guardar.textContent = '\u2713 Configuraci\u00f3n guardada \u00b7 pasando al Bloque 1';
          guardar.disabled = true;
          setTimeout(function () {
            const wrapActual = root.closest('[data-componente="taller-setup"]');
            let siguiente = wrapActual ? wrapActual.nextElementSibling : null;
            while (siguiente && !siguiente.dataset.componente) siguiente = siguiente.nextElementSibling;
            if (siguiente && typeof siguiente.scrollIntoView === 'function') {
              siguiente.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 250);
        });
      }
    }

    pintar();
  }

  global.TallerSetup = { montar, leerSetup, STORAGE_KEY };
})(window);
