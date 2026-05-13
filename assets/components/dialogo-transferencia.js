/* ============================================================
   Componente: dialogo-transferencia
   Bocadillos cliente arquitecto vs. tú. Test real de aplicación.
   Soporta variante intercambios=[{cliente, tu}, ...] para multi-turno.
   ============================================================ */

(function (global) {
  'use strict';

  const ICONO_BUBBLE = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  function bocadillos(clientePregunta, tuRespuesta) {
    return `
      <div class="cmp-dialogo__bocadillos">
        <div class="cmp-dialogo__bocadillo is-cliente">
          <span class="quien">Cliente arquitecto</span>
          ${clientePregunta}
        </div>
        <div class="cmp-dialogo__bocadillo is-tu">
          <span class="quien">Tú</span>
          ${tuRespuesta}
        </div>
      </div>`;
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;

    let dialogos = '';
    if (config.intercambios && config.intercambios.length) {
      dialogos = config.intercambios
        .map(i => bocadillos(i.cliente, i.tu))
        .join('');
    } else if (config.pregunta_cliente && config.respuesta_consultor) {
      dialogos = bocadillos(config.pregunta_cliente, config.respuesta_consultor);
    }

    contenedor.innerHTML = `
      <section class="cmp-dialogo">
        <div class="cmp-dialogo__icon">${ICONO_BUBBLE}</div>
        <div>
          <h2>${config.titulo || ''}</h2>
          ${config.subtitulo ? `<p class="cmp-dialogo__subtitle">${config.subtitulo}</p>` : ''}
          ${dialogos}
        </div>
      </section>`;
  }

  global.DialogoTransferencia = { montar };
})(window);
