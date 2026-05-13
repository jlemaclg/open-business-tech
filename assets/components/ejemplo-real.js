/* ============================================================
   Componente: ejemplo-real
   Card oscura granate con caso real LATAM/España + flow numerado.
   ============================================================ */

(function (global) {
  'use strict';

  function montar(contenedor, config) {
    if (!contenedor || !config) return;

    const titulo = [
      config.titulo_pre_accent ? `${config.titulo_pre_accent} ` : '',
      config.titulo_accent ? `<span class="accent">${config.titulo_accent}</span>` : '',
      config.titulo_post_accent ? ` ${config.titulo_post_accent}` : ''
    ].join('');

    const parrafos = (config.parrafos || []).map(p => `<p>${p}</p>`).join('');

    const flow = (config.flow_pasos || []).map(s => `
      <div class="cmp-ejemplo-real__step">
        <div class="cmp-ejemplo-real__num">${s.num}</div>
        <div class="cmp-ejemplo-real__text">${s.texto}</div>
      </div>`).join('');

    contenedor.innerHTML = `
      <section class="cmp-ejemplo-real">
        <div class="cmp-ejemplo-real__grid">
          <div>
            ${config.etiqueta ? `<div class="cmp-ejemplo-real__eyebrow">${config.etiqueta}</div>` : ''}
            <h2>${titulo}</h2>
            ${parrafos}
          </div>
          ${flow ? `<div class="cmp-ejemplo-real__flow">${flow}</div>` : ''}
        </div>
      </section>`;
  }

  global.EjemploReal = { montar };
})(window);
