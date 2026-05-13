/* ============================================================
   Componente: objetivos-grid
   Grid de cards con número, título y descripción. 3, 4 o 6 columnas.
   ============================================================ */

(function (global) {
  'use strict';

  function montar(contenedor, config) {
    if (!contenedor || !config) return;
    const items = config.items || [];
    const cols = items.length === 3 ? 'cols-3' : items.length === 6 ? 'cols-6' : '';

    const cards = items.map(it => `
      <div class="cmp-objetivos-grid__card">
        <div class="cmp-objetivos-grid__num">${it.num || ''}</div>
        <h3>${it.titulo || ''}</h3>
        <p>${it.descripcion || ''}</p>
      </div>`).join('');

    contenedor.innerHTML = `
      <section class="cmp-objetivos-grid">
        ${config.titulo ? `<h2 class="cmp-section-title">${config.titulo}</h2>` : ''}
        ${config.subtitulo ? `<p class="cmp-section-subtitle">${config.subtitulo}</p>` : ''}
        <div class="cmp-objetivos-grid__items ${cols}">${cards}</div>
      </section>`;
  }

  global.ObjetivosGrid = { montar };
})(window);
