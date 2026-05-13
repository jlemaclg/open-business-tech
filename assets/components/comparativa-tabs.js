/* ============================================================
   Componente: comparativa-tabs
   Pestañas que comparan dos cosas desde varias perspectivas.
   Soporta tipos de contenido: grid-2-cards, svg-inline,
   grid-2-listas, texto-libre.
   ============================================================ */

(function (global) {
  'use strict';

  const ICONO_OK  = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  const ICONO_NO  = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function renderItems(items) {
    return (items || []).map(it => {
      const ok = it.check !== false;
      return `<li class="${ok ? 'is-ok' : 'is-no'}">${ok ? ICONO_OK : ICONO_NO} ${it.texto}</li>`;
    }).join('');
  }

  function renderCard(card) {
    if (!card) return '';
    const cls = card.destacada ? 'cmp-comparativa-tabs__card is-destacada' : 'cmp-comparativa-tabs__card';
    const tag = card.tag ? `<span class="cmp-comparativa-tabs__tag">${card.tag}</span>` : '';
    return `
      <div class="${cls}">
        ${tag}
        <h3>${card.titulo || ''}</h3>
        ${card.subtitulo ? `<div class="cmp-comparativa-tabs__subtitle">${card.subtitulo}</div>` : ''}
        <ul class="cmp-comparativa-tabs__features">${renderItems(card.items)}</ul>
      </div>`;
  }

  function renderLista(lista) {
    if (!lista) return '';
    const cls = lista.destacada ? 'cmp-comparativa-tabs__lista is-destacada' : 'cmp-comparativa-tabs__lista';
    const items = (lista.items || []).map(t => `<li>· ${t}</li>`).join('');
    return `
      <div class="${cls}">
        <h3>${lista.titulo || ''}</h3>
        <ul>${items}</ul>
      </div>`;
  }

  function renderPanel(tab) {
    switch (tab.tipo_contenido) {
      case 'grid-2-cards':
        return `<div class="cmp-comparativa-tabs__grid-2">
                  ${renderCard(tab.izquierda)}
                  ${renderCard(tab.derecha)}
                </div>`;
      case 'svg-inline':
        return `<div class="cmp-comparativa-tabs__svg-wrap">${tab.svg || ''}</div>`;
      case 'grid-2-listas':
        return `<div class="cmp-comparativa-tabs__listas">
                  ${renderLista(tab.izquierda)}
                  ${renderLista(tab.derecha)}
                </div>`;
      case 'texto-libre':
      default:
        return `<div>${tab.html || ''}</div>`;
    }
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;
    const tabs = config.tabs || [];
    if (!tabs.length) return;

    const navHTML = tabs.map((t, i) =>
      `<button class="cmp-comparativa-tabs__tab ${i === 0 ? 'is-active' : ''}" data-tab-id="${t.id}">${t.titulo}</button>`
    ).join('');

    const panelsHTML = tabs.map((t, i) =>
      `<div class="cmp-comparativa-tabs__panel ${i === 0 ? 'is-active' : ''}" data-tab-id="${t.id}">${renderPanel(t)}</div>`
    ).join('');

    contenedor.innerHTML = `
      <section class="cmp-comparativa-tabs">
        ${config.titulo ? `<h2 class="cmp-section-title">${config.titulo}</h2>` : ''}
        ${config.subtitulo ? `<p class="cmp-section-subtitle">${config.subtitulo}</p>` : ''}
        <div class="cmp-comparativa-tabs__nav" role="tablist">${navHTML}</div>
        ${panelsHTML}
      </section>`;

    const root = contenedor.querySelector('.cmp-comparativa-tabs');
    const tabBtns = root.querySelectorAll('.cmp-comparativa-tabs__tab');
    const panels  = root.querySelectorAll('.cmp-comparativa-tabs__panel');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('is-active'));
        panels.forEach(p => p.classList.remove('is-active'));
        btn.classList.add('is-active');
        const id = btn.dataset.tabId;
        root.querySelector(`.cmp-comparativa-tabs__panel[data-tab-id="${id}"]`).classList.add('is-active');
      });
    });
  }

  global.ComparativaTabs = { montar };
})(window);
