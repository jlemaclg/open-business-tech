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
    'ejemplo-real':           'EjemploReal',
    'dialogo-transferencia':  'DialogoTransferencia',
    'quiz-engine':            'QuizEngine',
    'footer-completar':       'FooterCompletar',
    'badge-modal':            'BadgeModal'
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

  function pintar(root, datos, quizDatos, recursos) {
    actualizarTopbar(datos);

    const contexto = {
      moduloId: datos.modulo,
      badge:    datos.badge,
      xpLectura: datos.xp_lectura || 30,
      xpQuiz:    datos.xp_quiz    || 50,
      xpQuizPerfecto: datos.xp_quiz_perfecto || 20
    };

    // Pintar hero (fuera del root, antes del main)
    const heroData = (datos.componentes || []).find(c => c.tipo === 'hero-modulo');
    if (heroData) pintarHero(root, heroData);

    // Pintar resto de componentes
    (datos.componentes || []).forEach(comp => {
      if (comp.tipo === 'hero-modulo') return; // ya pintado
      const wrap = document.createElement('div');
      wrap.dataset.componente = comp.tipo;
      root.appendChild(wrap);

      if (comp.tipo === 'quiz-engine' && quizDatos) {
        // Inyectar config del quiz
        montarComponente('quiz-engine', wrap, Object.assign({}, comp, {
          quiz: quizDatos
        }), contexto);
      } else {
        montarComponente(comp.tipo, wrap, comp, contexto);
      }
    });

    // Marcar como leído al final del scroll (umbral 70%)
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

    // Estado inicial del progress strip según progreso previo
    if (global.Progress) {
      const p = global.Progress.progresoModulo(contexto.moduloId);
      actualizarProgresoStrip(Math.max(p.porcentaje, 5));
    } else {
      actualizarProgresoStrip(5);
    }
  }

  global.ModuloLoader = {
    cargar,
    actualizarProgresoStrip
  };
})(window);
