/* ============================================================
   Componente: footer-completar
   CTA de cierre con botón "Marcar como completado". Dispara el
   badge-modal y persiste el estado en progress.js.
   ============================================================ */

(function (global) {
  'use strict';

  const ICONO_OK = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';

  function montar(contenedor, config, contexto) {
    if (!contenedor) return;
    const cfg = config || {};
    const moduloId = (contexto && contexto.moduloId) || cfg.modulo;
    const badge = (contexto && contexto.badge) || cfg.badge || {};
    const xpTotal = (contexto && (contexto.xpLectura + contexto.xpQuiz)) ||
                     ((cfg.xp_lectura || 30) + (cfg.xp_quiz || 50));

    const completadoYa = global.Progress && global.Progress.progresoModulo(moduloId).completado;

    contenedor.innerHTML = `
      <div class="cmp-footer-completar">
        <div>
          <h3>${cfg.titulo || '¿Listo para desbloquear el badge?'}</h3>
          <p>${cfg.subtitulo || `Marca el módulo como completado para sumar ${xpTotal} XP y desbloquear "${badge.nombre || ''}"`}</p>
        </div>
        <button class="cmp-footer-completar__btn" data-role="completar" ${completadoYa ? 'disabled' : ''}>
          ${ICONO_OK}
          ${completadoYa ? 'Módulo completado' : 'Marcar como completado'}
        </button>
      </div>`;

    const btn = contenedor.querySelector('[data-role="completar"]');
    if (!btn || completadoYa) return;

    btn.addEventListener('click', () => {
      if (global.Progress) {
        global.Progress.completarModulo(moduloId, badge.id);
      }
      if (global.ModuloLoader) global.ModuloLoader.actualizarProgresoStrip(100);
      if (global.BadgeModal) {
        global.BadgeModal.abrir({
          badge: badge,
          xpTotal: xpTotal,
          onClose: cfg.onClose
        });
      }
      btn.disabled = true;
      btn.innerHTML = ICONO_OK + ' Módulo completado';
      if (global.App && global.App.pintarTopbar) global.App.pintarTopbar();
    });
  }

  global.FooterCompletar = { montar };
})(window);
