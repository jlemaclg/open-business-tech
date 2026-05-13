/* ============================================================
   Open Business Tech Academy — content-loader.js
   Carga el contenido.md de un módulo y lo renderiza con marked.js
   en un selector dado. Vista de apoyo (lectura alternativa lineal).
   ============================================================ */

(function (global) {
  'use strict';

  function cargarMarkdown(url, selector) {
    const root = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!root) return Promise.resolve();

    return fetch(url)
      .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
      .then(md => {
        // Quitar frontmatter YAML simple si existe
        const limpio = md.replace(/^---[\s\S]*?---\s*/, '');
        if (typeof marked !== 'undefined' && marked.parse) {
          root.innerHTML = marked.parse(limpio);
        } else {
          // Fallback: pre con texto plano
          const pre = document.createElement('pre');
          pre.textContent = limpio;
          root.appendChild(pre);
        }
        // Re-aplicar resaltado de código si hay Prism
        if (typeof Prism !== 'undefined' && Prism.highlightAllUnder) {
          Prism.highlightAllUnder(root);
        }
      })
      .catch(err => {
        console.warn('[content-loader] error cargando ' + url, err);
        root.innerHTML = '<p style="color:#999">No se pudo cargar el contenido.</p>';
      });
  }

  global.ContentLoader = { cargarMarkdown };
})(window);
