/* ============================================================
   Componente: stepper-flow
   Flujo paso a paso entre dos actores. El aprendiz avanza con
   "Siguiente / Anterior", los mensajes se activan progresivamente
   y la explicación + analogía se actualizan dinámicamente.

   Uso típico: handshakes (TLS, OAuth), iniciación de pagos, DCR.
   ============================================================ */

(function (global) {
  'use strict';

  const ICONOS_ACTOR = {
    laptop:  '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    server:  '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    mobile:  '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    bank:    '<svg viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>',
    cloud:   '<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    shield:  '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    key:     '<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15 19 4l1 1 1 1-3 3-2-2-1.5 1.5 2 2-1 1-2-2-1.5 1.5 2 2"/></svg>',
    user:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>'
  };

  function actorHTML(actor) {
    const svg = ICONOS_ACTOR[actor.icono] || ICONOS_ACTOR.server;
    return `
      <div class="cmp-stepper-flow__actor" data-actor-id="${actor.id || ''}">
        <div class="cmp-stepper-flow__actor-icon">${svg}</div>
        <div class="cmp-stepper-flow__actor-label">${actor.label || ''}</div>
        <div class="cmp-stepper-flow__actor-sublabel">${actor.sublabel || ''}</div>
      </div>`;
  }

  function mensajeHTML(paso, idx, fromActorId) {
    const fromCls = paso.from === fromActorId ? 'from-client' : 'from-server';
    const numCls = idx + 1;
    const titulo = paso.titulo || '';
    const snippet = paso.snippet || '';

    return `
      <div class="cmp-stepper-flow__message ${fromCls}" data-step="${numCls}">
        <span class="cmp-stepper-flow__message-step">${numCls}</span>
        <span class="cmp-stepper-flow__message-content">
          <strong>${titulo}</strong>
          ${snippet ? `<br><span style="font-size:11px;opacity:0.75">"${snippet}"</span>` : ''}
        </span>
        <span class="cmp-stepper-flow__message-arrow">${paso.from === fromActorId ? '→' : '←'}</span>
      </div>`;
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;
    const actores = config.actores || [];
    const pasos = config.pasos || [];
    if (actores.length < 2 || !pasos.length) {
      console.warn('[stepper-flow] requiere al menos 2 actores y 1 paso');
      return;
    }
    const fromId = actores[0].id || 'client';

    const numHeader = config.numero_concepto != null
      ? `<div class="cmp-stepper-flow__num">${config.numero_concepto}</div>`
      : '';

    contenedor.innerHTML = `
      <section class="cmp-stepper-flow">
        <div class="cmp-stepper-flow__header">
          ${numHeader}
          <div class="cmp-stepper-flow__titulo">
            <h2>${config.titulo || ''}</h2>
            ${config.subtitulo ? `<p>${config.subtitulo}</p>` : ''}
          </div>
        </div>

        <div class="cmp-stepper-flow__stage">
          <div class="cmp-stepper-flow__actors">
            ${actorHTML(actores[0])}
            <div class="cmp-stepper-flow__channel">
              ${pasos.map((p, i) => mensajeHTML(p, i, fromId)).join('')}
            </div>
            ${actorHTML(actores[1])}
          </div>
        </div>

        <div class="cmp-stepper-flow__controls">
          <button class="cmp-stepper-flow__btn" data-role="prev" disabled>← Anterior</button>
          <span class="cmp-stepper-flow__counter" data-role="counter">Paso 1 de ${pasos.length}</span>
          <button class="cmp-stepper-flow__btn is-primary" data-role="next">Siguiente →</button>
        </div>

        <div class="cmp-stepper-flow__explanation" data-role="explanation">
          <h4 data-role="exp-title"></h4>
          <p data-role="exp-text"></p>
          <div class="cmp-stepper-flow__analogia" data-role="exp-analogia"></div>
        </div>
      </section>`;

    // Lógica
    const root = contenedor.querySelector('.cmp-stepper-flow');
    const messages = root.querySelectorAll('.cmp-stepper-flow__message');
    const btnPrev = root.querySelector('[data-role="prev"]');
    const btnNext = root.querySelector('[data-role="next"]');
    const counter = root.querySelector('[data-role="counter"]');
    const expTitle = root.querySelector('[data-role="exp-title"]');
    const expText  = root.querySelector('[data-role="exp-text"]');
    const expAna   = root.querySelector('[data-role="exp-analogia"]');

    let actual = 1;
    const max = pasos.length;

    function pintar() {
      messages.forEach(m => {
        const step = parseInt(m.dataset.step, 10);
        m.classList.toggle('is-active', step <= actual);
      });
      counter.textContent = `Paso ${actual} de ${max}`;
      btnPrev.disabled = actual === 1;
      btnNext.disabled = actual === max;
      btnNext.textContent = actual === max ? '✓ Completado' : 'Siguiente →';

      const p = pasos[actual - 1];
      expTitle.textContent = `${actual} · ${p.titulo || ''}`;
      expText.textContent = p.explicacion || '';
      if (p.analogia) {
        expAna.style.display = '';
        expAna.innerHTML = `<strong>Analogía:</strong> ${p.analogia}`;
      } else {
        expAna.style.display = 'none';
      }
    }

    btnNext.addEventListener('click', () => { if (actual < max) { actual++; pintar(); }});
    btnPrev.addEventListener('click', () => { if (actual > 1)   { actual--; pintar(); }});

    pintar();
  }

  global.StepperFlow = { montar };
})(window);
