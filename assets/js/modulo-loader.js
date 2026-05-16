/* ============================================================
   Open Business Tech Academy — modulo-loader.js
   Orquesta el montaje de un módulo:
   1. Lee modulo-data.json
   2. Pinta el hero (componente hero-modulo)
   3. Itera por componentes[] y los monta en #modulo-root
   4. Carga el quiz al llegar al componente quiz
   5. Inicializa progreso del módulo y bind del botón "completar"
   ============================================================ */

(function (global) {
  'use strict';

  const COMPONENTES_DISPONIBLES = {
    'hero-modulo':            'HeroModulo',
    'por-que-importa':        'PorQueImporta',
    'objetivos-grid':         'ObjetivosGrid',
    'stepper-flow':           'StepperFlow',
    'comparativa-tabs':       'ComparativaTabs',
    'perfil-builder':         'PerfilBuilder',
    'perfil-resumen':         'PerfilResumen',
    'token-inspector':        'TokenInspector',
    'ejemplo-real':           'EjemploReal',
    'dialogo-transferencia':  'DialogoTransferencia',
    'recursos-panel':         'RecursosPanel',
    'quiz-engine':            'QuizEngine',
    'footer-completar':       'FooterCompletar',
    'badge-modal':            'BadgeModal',
    'taller-setup':           'TallerSetup',
    'capacidad-ecosistema':   'CapacidadEcosistema',
    'acta-export':            'ActaExport'
  };

  function montarComponente(tipo, contenedor, config, contexto) {
    const nombreObj = COMPONENTES_DISPONIBLES[tipo];
    if (!nombreObj) {
      console.warn('[modulo-loader] componente desconocido: ' + tipo);
      return;
    }
    const Cmp = global[nombreObj];
    if (!Cmp || typeof Cmp.montar !== 'function') {
      console.warn('[modulo-loader] componente no cargado o sin montar(): ' + tipo);
      return;
    }
    Cmp.montar(contenedor, config, contexto);
  }

  function pintarHero(rootContainer, dataHero) {
    if (!dataHero) return;
    const heroEl = document.createElement('div');
    heroEl.id = 'hero-host';
    rootContainer.parentNode.insertBefore(heroEl, rootContainer);
    montarComponente('hero-modulo', heroEl, dataHero);
  }

  function actualizarTopbar(modData) {
    const tituloEl = document.querySelector('.topbar-title');
    if (tituloEl && modData.modulo && modData.titulo_topbar) {
      tituloEl.innerHTML = 'Módulo ' + modData.modulo.split('-')[0] +
        ' · <span class="accent">' + modData.titulo_topbar + '</span>';
    }
    const xpEl = document.querySelector('.consultor-xp');
    if (xpEl && global.Progress) {
      const estado = global.Progress.leer();
      const nivel = global.Progress.obtenerNivelInfo();
      const infoEl = document.querySelector('.consultor-info');
      if (infoEl) {
        infoEl.innerHTML = (estado.consultor.nombre_alias || 'Consultor') +
          ' · Nivel ' + nivel.nivel + ' · ' +
          '<span class="consultor-xp">' + estado.progreso.xp_total + ' XP</span>';
      }
    }
  }

  function actualizarProgresoStrip(porcentaje) {
    const fill = document.querySelector('.progress-bar-fill');
    const txt = document.querySelectorAll('.progress-strip .progress-label');
    if (fill) fill.style.width = porcentaje + '%';
    if (txt && txt.length >= 2) txt[1].textContent = porcentaje + '%';
  }

  function cargar(opciones) {
    const root = document.querySelector(opciones.rootSelector);
    if (!root) {
      console.error('[modulo-loader] no existe el root ' + opciones.rootSelector);
      return;
    }

    let datos = null;
    let quizDatos = null;
    let recursos = null;

    Promise.all([
      fetch(opciones.dataUrl).then(r => r.json()),
      opciones.quizUrl     ? fetch(opciones.quizUrl).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
      opciones.recursosUrl ? fetch(opciones.recursosUrl).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null)
    ]).then(([d, q, r]) => {
      datos = d; quizDatos = q; recursos = r;
      pintar(root, datos, quizDatos, recursos);
    }).catch(err => {
      console.error('[modulo-loader] error cargando datos del módulo', err);
      root.innerHTML = '<div style="padding:60px; text-align:center; color:#999">' +
        'No se pudo cargar el módulo. Verifica que modulo-data.json esté presente.</div>';
    });
  }

  /* ---- Gates secuenciales (para talleres con bloques) ---- */

  function _leerJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || null; } catch (e) { return null; }
  }

  // Decide si un componente está "completo" según su tipo y datos declarados.
  // Sirve para que un componente posterior con gate sepa si puede liberarse.
  /* ---- Gates secuenciales ---- */
  function _leerJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || null; } catch (e) { return null; }
  }

  function estaCompleto(comp) {
    if (!comp) return true;
    switch (comp.tipo) {
      case 'taller-setup': {
        const s = _leerJSON('obta:taller-setup:v1') || {};
        return !!s.iniciado;
      }
      case 'perfil-builder': {
        const s = _leerJSON(comp.modo_cocreacion ? 'obta:perfil-fapi-cocreacion:v1' : 'obta:perfil-fapi:v1') || {};
        const total = (comp.decisiones || []).length;
        if (total === 0) return true;
        const completas = (comp.decisiones || []).filter(function (d) {
          const e = s[d.id];
          if (!e) return false;
          if (comp.modo_cocreacion) return e && e.opcion && e.esfuerzo_ef && e.prioridad_consumidor;
          return typeof e === 'string' ? !!e : !!e.opcion;
        }).length;
        return completas === total;
      }
      case 'capacidad-ecosistema': {
        const s = _leerJSON('obta:capacidad-ecosistema:v1') || {};
        const dim = (comp.dimensiones || []).length;
        const hor = (comp.horizontes  || []).length;
        const total = dim * hor;
        if (total === 0) return true;
        let count = 0;
        (comp.dimensiones || []).forEach(function (d) {
          (comp.horizontes || []).forEach(function (h) {
            const cc = s[d.id + '__' + h.id] || {};
            if (cc.capacidad_ef && cc.esfuerzo_ef && cc.necesidad_consumidor && cc.prioridad_consumidor && cc.umbral_regulador) count++;
          });
        });
        return count === total;
      }
      default: return true;
    }
  }

  const EVENTOS_REEVALUAR = ['taller-setup:update', 'perfil-builder:update', 'capacidad-ecosistema:update'];

  function montarConGate(wrap, comp, contexto, montarReal) {
    if (!comp.gate || !comp.gate.requiere) { montarReal(); return; }
    const datos = contexto._datosCompletos || {};
    const requeridoTipo = comp.gate.requiere;
    const requeridoComp = (datos.componentes || []).find(function (c) { return c.tipo === requeridoTipo; });
    function liberado() {
      if (wrap._gateLiberadoManual) return true;
      return estaCompleto(requeridoComp);
    }
    let yaMontado = false;
    function pintarGate() {
      if (liberado()) {
        if (yaMontado) return;
        wrap.innerHTML = '';
        wrap.classList.remove('is-gated');
        yaMontado = true;
        montarReal();
        return;
      }
      wrap.classList.add('is-gated');
      wrap.innerHTML =
        '<div class="cmp-gate">' +
          '<div class="cmp-gate__lock">' +
            '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
              '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
            '</svg>' +
          '</div>' +
          '<div class="cmp-gate__body">' +
            '<div class="cmp-gate__label">' + (comp.gate.label || 'Bloque bloqueado') + '</div>' +
            '<p>' + (comp.gate.descripcion || 'Completa el bloque anterior para desbloquear esta secci\u00f3n.') + '</p>' +
            '<button class="cmp-gate__liberar" type="button">Liberar manualmente \u00b7 facilitador</button>' +
          '</div>' +
        '</div>';
      const btn = wrap.querySelector('.cmp-gate__liberar');
      if (btn) {
        btn.addEventListener('click', function () {
          const ok = window.confirm('\u00bfSeguro? Vas a desbloquear este bloque manualmente. Quedar\u00e1n inputs sin completar en el bloque anterior y eso saldr\u00e1 reflejado en el acta. Solo el facilitador deber\u00eda usar esta opci\u00f3n.');
          if (!ok) return;
          wrap._gateLiberadoManual = true;
          pintarGate();
        });
      }
    }
    EVENTOS_REEVALUAR.forEach(function (ev) { window.addEventListener(ev, pintarGate); });
    pintarGate();
  }

  function pintar(root, datos, quizDatos, recursos) {
    actualizarTopbar(datos);
    const contexto = {
      moduloId: datos.modulo,
      badge:    datos.badge,
      xpLectura: datos.xp_lectura || 30,
      xpQuiz:    datos.xp_quiz    || 50,
      xpQuizPerfecto: datos.xp_quiz_perfecto || 20,
      _datosCompletos: datos
    };

    const heroData = (datos.componentes || []).find(function (c) { return c.tipo === 'hero-modulo'; });
    if (heroData) pintarHero(root, heroData);

    (datos.componentes || []).forEach(function (comp) {
      if (comp.tipo === 'hero-modulo') return;
      const wrap = document.createElement('div');
      wrap.dataset.componente = comp.tipo;
      root.appendChild(wrap);

      const montarReal = function () {
        if (comp.tipo === 'quiz-engine' && quizDatos) {
          montarComponente('quiz-engine', wrap, Object.assign({}, comp, { quiz: quizDatos }), contexto);
        } else if (comp.tipo === 'recursos-panel') {
          montarComponente('recursos-panel', wrap, Object.assign({}, comp, { recursos: recursos }), contexto);
        } else {
          montarComponente(comp.tipo, wrap, comp, contexto);
        }
      };
      montarConGate(wrap, comp, contexto, montarReal);
    });

    let leidoYa = false;
    window.addEventListener('scroll', function () {
      if (leidoYa) return;
      const docH = document.documentElement.scrollHeight;
      const win  = window.innerHeight;
      const top  = window.scrollY;
      if ((top + win) / docH > 0.7) {
        leidoYa = true;
        if (global.Progress) {
          global.Progress.marcarLeido(contexto.moduloId, contexto.xpLectura);
        }
      }
    }, { passive: true });

    if (global.Progress) {
      const p = global.Progress.progresoModulo(contexto.moduloId);
      actualizarProgresoStrip(Math.max(p.porcentaje, 5));
    } else {
      actualizarProgresoStrip(5);
    }
  }

  global.ModuloLoader = { cargar, actualizarProgresoStrip };
})(window);
