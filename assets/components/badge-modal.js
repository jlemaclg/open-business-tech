/* ============================================================
   Componente: badge-modal
   Modal celebratorio de desbloqueo de badge. Singleton: solo hay
   uno en el DOM en cada momento. Se invoca con BadgeModal.abrir({}).
   ============================================================ */

(function (global) {
  'use strict';

  const HOST_ID = 'cmp-badge-modal-host';

  function asegurarHost() {
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElement('div');
      host.id = HOST_ID;
      document.body.appendChild(host);
    }
    return host;
  }

  function buildSVG(svgInline) {
    if (svgInline) return svgInline;
    // Fallback genérico — escudo + candado
    return `
      <svg viewBox="0 0 200 200">
        <defs>
          <linearGradient id="bm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4F062A"/>
            <stop offset="100%" stop-color="#260717"/>
          </linearGradient>
        </defs>
        <polygon points="100,10 180,55 180,145 100,190 20,145 20,55"
                 fill="url(#bm-grad)" stroke="#FF0054" stroke-width="3"/>
        <polygon points="100,30 162,65 162,135 100,170 38,135 38,65"
                 fill="none" stroke="#FF0054" stroke-width="1" opacity="0.4"/>
        <rect x="84" y="92" width="32" height="26" fill="#FF0054" rx="3"/>
        <path d="M 90 92 L 90 80 Q 90 72 100 72 Q 110 72 110 80 L 110 92"
              fill="none" stroke="#FF0054" stroke-width="3"/>
        <circle cx="100" cy="105" r="3" fill="white"/>
      </svg>`;
  }

  function abrir(opciones) {
    const o = opciones || {};
    const badge = o.badge || {};
    const xpTotal = o.xpTotal || 0;
    const host = asegurarHost();

    const nombre = badge.nombre || 'Logro';
    // Si el nombre tiene varias palabras, ponemos accent en la primera
    const partes = nombre.split(' ');
    const primero = partes.shift();
    const resto = partes.join(' ');
    const tituloHTML = `<span class="accent">${primero}</span>${resto ? ' ' + resto : ''}`;

    host.innerHTML = `
      <div class="cmp-badge-modal is-show" data-role="modal">
        <div class="cmp-badge-modal__content">
          <div class="cmp-badge-modal__eyebrow">BADGE DESBLOQUEADO</div>
          <div class="cmp-badge-modal__svg" data-role="svg-host">${buildSVG(badge.svg_inline)}</div>
          <h2>${tituloHTML}</h2>
          <p>${badge.descripcion || 'Has completado el módulo.'}</p>
          <div class="cmp-badge-modal__xp">+${xpTotal} XP</div>
          <button class="cmp-badge-modal__close" data-role="close">${o.cta || 'Continuar'}</button>
        </div>
      </div>`;

    // Si se ha pasado svg_url y no hay svg_inline, hacer fetch y reemplazar
    if (badge.svg_url && !badge.svg_inline) {
      fetch(badge.svg_url)
        .then(r => r.ok ? r.text() : null)
        .then(svg => {
          if (svg) {
            const slot = host.querySelector('[data-role="svg-host"]');
            if (slot) slot.innerHTML = svg;
          }
        })
        .catch(() => { /* fallback ya está pintado */ });
    }

    const modal = host.querySelector('[data-role="modal"]');
    const btn = host.querySelector('[data-role="close"]');
    btn.addEventListener('click', () => {
      modal.classList.remove('is-show');
      if (typeof o.onClose === 'function') o.onClose();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('is-show');
    });
  }

  function cerrar() {
    const host = document.getElementById(HOST_ID);
    if (!host) return;
    const m = host.querySelector('.cmp-badge-modal');
    if (m) m.classList.remove('is-show');
  }

  // El componente también responde a montar() del modulo-loader
  // (en este caso no pinta nada — solo asegura el host).
  function montar() {
    asegurarHost();
  }

  global.BadgeModal = { abrir, cerrar, montar };
})(window);
