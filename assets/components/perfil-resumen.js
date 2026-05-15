/* ============================================================
   Componente: perfil-resumen
   Lee el perfil construido por perfil-builder en localStorage
   y muestra la ficha resumen. Soporta exportación a Markdown
   y reset del perfil.

   Se redibuja automáticamente cuando el perfil-builder emite
   el evento 'perfil-builder:update'.
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY = (global.PerfilBuilder && global.PerfilBuilder.STORAGE_KEY) || 'obta:perfil-fapi:v1';

  function leerPerfil() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
  }
  function guardarPerfil(estado) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function findOpcion(decision, opcionId) {
    return (decision.opciones || []).find(o => o.id === opcionId);
  }

  function generarMarkdown(config, estado) {
    const decisiones = config.decisiones || [];
    const lines = [];
    lines.push('# ' + (config.titulo_export || 'Perfil FAPI 2.0 — Borrador'));
    lines.push('');
    lines.push('_Generado por Open Business Tech Academy — Módulo 04b._');
    lines.push('_Fecha: ' + new Date().toISOString().slice(0, 10) + '_');
    lines.push('');
    lines.push('Este documento recoge las decisiones tomadas durante el ejercicio de diseño ' +
               'de un perfil FAPI 2.0. Es un borrador de trabajo, no un documento normativo.');
    lines.push('');

    // Agrupar por categoría preservando el orden de aparición
    const categorias = [];
    const mapaCat = {};
    decisiones.forEach(d => {
      const k = d.categoria || 'General';
      if (!mapaCat[k]) { mapaCat[k] = []; categorias.push(k); }
      mapaCat[k].push(d);
    });

    categorias.forEach(cat => {
      lines.push('## ' + cat);
      lines.push('');
      mapaCat[cat].forEach(d => {
        const elegida = estado[d.id];
        const opcion = elegida ? findOpcion(d, elegida) : null;
        lines.push('### ' + d.num + '. ' + d.pregunta);
        lines.push('');
        if (opcion) {
          lines.push('**Decisión:** ' + opcion.label + (opcion.tag ? ' _(' + opcion.tag + ')_' : ''));
          lines.push('');
          if (opcion.descripcion) {
            // Strip HTML tags
            lines.push('_' + opcion.descripcion.replace(/<[^>]+>/g, '') + '_');
            lines.push('');
          }
          if (Array.isArray(opcion.trade_offs) && opcion.trade_offs.length) {
            lines.push('Implicaciones operativas:');
            opcion.trade_offs.forEach(t => {
              lines.push('- ' + t.replace(/<[^>]+>/g, ''));
            });
            lines.push('');
          }
        } else {
          lines.push('**Decisión:** _pendiente_');
          lines.push('');
        }
      });
    });

    lines.push('---');
    lines.push('');
    lines.push('Fuente: Open Business Tech Academy · Módulo 04b — Construyendo un perfil FAPI 2.0 propio.');
    return lines.join('\n');
  }

  function descargarMarkdown(contenido, nombre) {
    try {
      const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre || 'perfil-fapi.md';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      // Fallback: copiar al portapapeles
      try {
        navigator.clipboard.writeText(contenido);
        alert('No se pudo descargar el archivo, el contenido se ha copiado al portapapeles.');
      } catch (e2) {
        alert('No se pudo exportar el perfil. Considera revisar permisos del navegador.');
      }
    }
  }

  function renderFichaHTML(config, estado) {
    const decisiones = config.decisiones || [];
    const total = decisiones.length;
    const decididas = decisiones.filter(d => estado[d.id]).length;
    const completo = decididas === total;

    const categorias = [];
    const mapaCat = {};
    decisiones.forEach(d => {
      const k = d.categoria || 'General';
      if (!mapaCat[k]) { mapaCat[k] = []; categorias.push(k); }
      mapaCat[k].push(d);
    });

    let html = '<section class="cmp-perfil-resumen">';
    html += '<div class="cmp-perfil-resumen__header">';
    html += '<div>';
    html += '<h2>' + (config.titulo || 'Ficha del perfil construido') + '</h2>';
    if (config.subtitulo) {
      html += '<p class="cmp-perfil-resumen__sub">' + config.subtitulo + '</p>';
    }
    html += '</div>';
    html += '<div class="cmp-perfil-resumen__cta">';
    html += '<div class="cmp-perfil-resumen__estado ' + (completo ? 'is-complete' : 'is-partial') + '">';
    html += completo
      ? 'Perfil completo · ' + total + ' decisiones'
      : decididas + ' de ' + total + ' decisiones';
    html += '</div>';
    html += '<button class="cmp-perfil-resumen__btn is-primary" data-action="export" type="button">' +
              'Exportar a Markdown</button>';
    html += '<button class="cmp-perfil-resumen__btn" data-action="reset" type="button">' +
              'Empezar perfil nuevo</button>';
    html += '</div>';
    html += '</div>';

    if (decididas === 0) {
      html += '<div class="cmp-perfil-resumen__empty">' +
        'Aún no has tomado ninguna decisión. Usa el constructor de más arriba para ' +
        'empezar el perfil; cuando hayas resuelto al menos una decisión, esta ficha ' +
        'la mostrará y podrás exportarla en cualquier momento.' +
      '</div>';
      html += '</section>';
      return html;
    }

    categorias.forEach(cat => {
      html += '<div class="cmp-perfil-resumen__cat">';
      html += '<div class="cmp-perfil-resumen__cat-label">' + esc(cat) + '</div>';
      html += '<div class="cmp-perfil-resumen__cat-items">';
      mapaCat[cat].forEach(d => {
        const elegida = estado[d.id];
        const opcion = elegida ? findOpcion(d, elegida) : null;
        html += '<div class="cmp-perfil-resumen__item ' + (opcion ? 'is-decided' : 'is-pending') + '">';
        html += '<div class="cmp-perfil-resumen__item-num">' + esc(d.num) + '</div>';
        html += '<div class="cmp-perfil-resumen__item-body">';
        html += '<div class="cmp-perfil-resumen__item-q">' + esc(d.pregunta_corta || d.pregunta) + '</div>';
        if (opcion) {
          html += '<div class="cmp-perfil-resumen__item-a">';
          html += '<span class="cmp-perfil-resumen__chip">' + esc(opcion.label);
          if (opcion.tag) html += ' · <em>' + esc(opcion.tag) + '</em>';
          html += '</span>';
          html += '</div>';
        } else {
          html += '<div class="cmp-perfil-resumen__item-a is-pending">Pendiente</div>';
        }
        html += '</div></div>';
      });
      html += '</div></div>';
    });

    html += '</section>';
    return html;
  }

  function montar(contenedor, config) {
    if (!contenedor) return;
    let estado = leerPerfil();

    function pintar() {
      estado = leerPerfil();
      contenedor.innerHTML = renderFichaHTML(config, estado);
      const root = contenedor.querySelector('.cmp-perfil-resumen');
      if (!root) return;

      // Exportar
      const btnExport = root.querySelector('[data-action="export"]');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          const md = generarMarkdown(config, estado);
          const ts = new Date().toISOString().slice(0, 10);
          descargarMarkdown(md, 'perfil-fapi-' + ts + '.md');
        });
      }

      // Reset
      const btnReset = root.querySelector('[data-action="reset"]');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          const ok = window.confirm(
            'Esto borrará todas las decisiones que hayas tomado. ¿Continuar?'
          );
          if (!ok) return;
          guardarPerfil({});
          try { window.dispatchEvent(new CustomEvent('perfil-builder:update')); } catch (e) {}
          pintar();
        });
      }
    }

    pintar();

    // Reaccionar a cambios del perfil-builder
    window.addEventListener('perfil-builder:update', () => pintar());
  }

  global.PerfilResumen = { montar };
})(window);
