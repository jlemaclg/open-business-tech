/* ============================================================
   Componente: hero-modulo
   Hero granate con eyebrow, título grande con accent, subtítulo,
   meta-info (duración, nivel, badge a desbloquear) y decoración
   SVG de red de nodos.
   ============================================================ */

(function (global) {
  'use strict';

  const ICONOS_META = {
    duracion: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    nivel:    '<svg viewBox="0 0 24 24"><path d="M3 12h6l4-9 4 18 4-9h0"/></svg>',
    badge:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>'
  };

  const DECORACION_SVG = `
    <svg class="cmp-hero-modulo__decoration" viewBox="0 0 400 400" aria-hidden="true">
      <g stroke="white" stroke-width="1" fill="none" opacity="0.6">
        <line x1="100" y1="100" x2="200" y2="200"/>
        <line x1="200" y1="200" x2="300" y2="100"/>
        <line x1="200" y1="200" x2="100" y2="300"/>
        <line x1="200" y1="200" x2="300" y2="300"/>
        <line x1="100" y1="100" x2="300" y2="100"/>
        <line x1="100" y1="300" x2="300" y2="300"/>
      </g>
      <g fill="#FF0054">
        <circle cx="100" cy="100" r="6"/>
        <circle cx="300" cy="100" r="6"/>
        <circle cx="100" cy="300" r="6"/>
        <circle cx="300" cy="300" r="6"/>
      </g>
      <g fill="white">
        <circle cx="200" cy="200" r="10"/>
      </g>
    </svg>`;

  function montar(contenedor, config) {
    if (!contenedor || !config) return;

    const titulo = [
      config.titulo_pre_accent ? `<span>${config.titulo_pre_accent} </span>` : '',
      config.titulo_accent     ? `<span class="accent">${config.titulo_accent}</span>` : '',
      config.titulo_post_accent ? `<span> ${config.titulo_post_accent}</span>` : ''
    ].join('');

    const meta = [];
    if (config.duracion_min) {
      meta.push(`<div class="cmp-hero-modulo__meta-item">${ICONOS_META.duracion}<span>${config.duracion_min} minutos</span></div>`);
    }
    if (config.nivel) {
      meta.push(`<div class="cmp-hero-modulo__meta-item">${ICONOS_META.nivel}<span>Nivel ${config.nivel}</span></div>`);
    }
    if (config.badge_target) {
      meta.push(`<div class="cmp-hero-modulo__meta-item">${ICONOS_META.badge}<span>Badge: ${config.badge_target}</span></div>`);
    }

    contenedor.innerHTML = `
      <section class="cmp-hero-modulo">
        <div class="cmp-hero-modulo__content">
          ${config.eyebrow ? `<div class="cmp-hero-modulo__eyebrow">${config.eyebrow}</div>` : ''}
          <h1 class="cmp-hero-modulo__title">${titulo}</h1>
          ${config.subtitulo ? `<p class="cmp-hero-modulo__subtitle">${config.subtitulo}</p>` : ''}
          ${meta.length ? `<div class="cmp-hero-modulo__meta">${meta.join('')}</div>` : ''}
        </div>
        ${DECORACION_SVG}
      </section>`;
  }

  global.HeroModulo = { montar };
})(window);
