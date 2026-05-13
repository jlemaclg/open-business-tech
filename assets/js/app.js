/* ============================================================
   Open Business Tech Academy — app.js
   Bootstrap mínimo para el hub y vistas globales (no módulos).
   - Inicializa estado en localStorage si es primera visita.
   - Pinta consultor/XP en el topbar de la vista actual.
   - Aplica tooltips de glosario en la página.
   ============================================================ */

(function (global) {
  'use strict';

  function pintarTopbar() {
    const infoEl = document.querySelector('.consultor-info');
    if (!infoEl || !global.Progress) return;
    const estado = global.Progress.leer();
    const nivel  = global.Progress.obtenerNivelInfo();
    infoEl.innerHTML = (estado.consultor.nombre_alias || 'Consultor') +
      ' · Nivel ' + nivel.nivel + ' · ' +
      '<span class="consultor-xp">' + estado.progreso.xp_total + ' XP</span>';
  }

  function init() {
    if (global.Progress) global.Progress.leer(); // garantiza estado
    pintarTopbar();
    if (global.Glossary) global.Glossary.aplicarTooltips(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.App = { init, pintarTopbar };
})(window);
