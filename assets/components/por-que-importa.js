/* ============================================================
   Componente: por-que-importa
   Card destacada con icono, título, párrafos y cita ancla.
   Soporta inline glosario-term en los párrafos (renderiza HTML directo).
   ============================================================ */

(function (global) {
  'use strict';

  const ICONOS = {
    alerta:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    objetivo: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    pregunta: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    escudo:   '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  };

  function montar(contenedor, config) {
    if (!contenedor || !config) return;
    const icono = ICONOS[config.icono] || ICONOS.alerta;
    const parrafos = (config.parrafos || []).map(p => `<p>${p}</p>`).join('');

    contenedor.innerHTML = `
      <div class="cmp-por-que-importa">
        <div class="cmp-por-que-importa__icon">${icono}</div>
        <div class="cmp-por-que-importa__text">
          <h2>${config.titulo || ''}</h2>
          ${parrafos}
          ${config.cita ? `<div class="cmp-por-que-importa__quote">${config.cita}</div>` : ''}
        </div>
      </div>`;

    // Re-aplicar tooltips si hay glosario-term embebidos
    if (global.Glossary) global.Glossary.aplicarTooltips(contenedor);
  }

  global.PorQueImporta = { montar };
})(window);
