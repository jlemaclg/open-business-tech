/* ============================================================
   Open Business Tech Academy — glossary.js
   Carga el glosario, lo cachea en memoria y aplica tooltips a
   <span class="glosario-term" data-term="X">término</span>.
   Solo procesa elementos que NO traen ya un .glosario-tooltip inline
   (los inline declarativos del HTML siguen funcionando solos).
   ============================================================ */

(function (global) {
  'use strict';

  let cache = null;
  let cargandoPromise = null;

  // Resolver ruta al JSON desde cualquier nivel (modulos/XX/, glosario/, raíz)
  function rutaTerminos() {
    // Calcula la profundidad relativa al index según el path actual
    const path = location.pathname;
    if (/\/modulos\/[^/]+\/?[^/]*$/.test(path)) return '../../glosario/terminos.json';
    if (/\/glosario\/?[^/]*$/.test(path))      return 'terminos.json';
    if (/\/chatbot\/?[^/]*$/.test(path))       return '../glosario/terminos.json';
    return 'glosario/terminos.json';
  }

  function cargar() {
    if (cache) return Promise.resolve(cache);
    if (cargandoPromise) return cargandoPromise;
    cargandoPromise = fetch(rutaTerminos())
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(json => { cache = json; return cache; })
      .catch(err => {
        console.warn('[glossary] no se pudo cargar terminos.json', err);
        cache = {};
        return cache;
      });
    return cargandoPromise;
  }

  function buscar(termino) {
    if (!cache) return null;
    return cache[termino] || null;
  }

  function aplicarTooltips(rootSelector) {
    const root = typeof rootSelector === 'string'
      ? document.querySelector(rootSelector)
      : (rootSelector || document);
    if (!root) return;
    cargar().then(terminos => {
      const nodos = root.querySelectorAll('.glosario-term[data-term]');
      nodos.forEach(nodo => {
        // Si ya tiene tooltip declarado en HTML, respetar
        if (nodo.querySelector('.glosario-tooltip')) return;
        const key = nodo.dataset.term;
        const t = terminos[key];
        if (!t) return;
        const tip = document.createElement('span');
        tip.className = 'glosario-tooltip';
        tip.innerHTML = '<strong>' + (t.termino_completo || key) + '</strong>' +
                        (t.definicion_corta || '');
        nodo.appendChild(tip);
        // Contabilizar uso al hacer hover (una vez por sesión por término)
        nodo.addEventListener('mouseenter', function once() {
          if (global.Progress && global.Progress.incrementarUsoGlosario) {
            global.Progress.incrementarUsoGlosario();
          }
          nodo.removeEventListener('mouseenter', once);
        });
      });
    });
  }

  global.Glossary = {
    cargar,
    buscar,
    aplicarTooltips
  };
})(window);
