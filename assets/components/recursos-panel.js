/* ============================================================
   Componente: recursos-panel
   Muestra lecturas de recursos.json + enlace a contenido.md
   + vídeos (o "próximamente" desde videos_planeados).
   ============================================================ */

(function (global) {
  'use strict';

  var ICONO_LECTURA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
  var ICONO_VIDEO   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
  var ICONO_DOC     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  var ICONO_RELOJ   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

  var TIPO_LABEL = {
    'referencia-regional': 'Regional',
    'spec-regional':       'Spec',
    'spec':                'Spec',
    'regulacion':          'Regulación'
  };

  function montar(contenedor, config, contexto) {
    if (!contenedor) return;

    var recursos   = config.recursos        || {};
    var lecturas   = recursos.lecturas      || [];
    var videos     = recursos.videos        || [];
    var planeados  = recursos.videos_planeados || [];

    /* ── Lecturas ──────────────────────────────────────────── */
    var lecturasItems = lecturas.map(function (l) {
      var tipoTag  = TIPO_LABEL[l.tipo] || l.tipo || 'Recurso';
      var tituloEl = l.url
        ? '<a class="cmp-recursos__titulo" href="' + l.url + '" target="_blank" rel="noopener">' + l.titulo + '</a>'
        : '<span class="cmp-recursos__titulo cmp-recursos__titulo--nolink">' + l.titulo + '</span>';
      return '<div class="cmp-recursos__item' + (l.obligatorio ? ' cmp-recursos__item--obligatorio' : '') + '">' +
        '<div class="cmp-recursos__item-icon">' + ICONO_LECTURA + '</div>' +
        '<div class="cmp-recursos__item-body">' +
          '<div class="cmp-recursos__item-meta">' +
            '<span class="cmp-recursos__badge-tipo">' + tipoTag + '</span>' +
            (l.obligatorio ? '<span class="cmp-recursos__badge-oblig">Obligatorio</span>' : '') +
            '<span class="cmp-recursos__tiempo">' + ICONO_RELOJ + ' ' + (l.tiempo_min || '?') + ' min</span>' +
          '</div>' +
          tituloEl +
          '<p class="cmp-recursos__desc">' + (l.descripcion || '') + '</p>' +
        '</div>' +
      '</div>';
    }).join('');

    /* ── MD (lectura completa) ─────────────────────────────── */
    var mdItem = '<div class="cmp-recursos__item cmp-recursos__item--md">' +
      '<div class="cmp-recursos__item-icon">' + ICONO_DOC + '</div>' +
      '<div class="cmp-recursos__item-body">' +
        '<div class="cmp-recursos__item-meta">' +
          '<span class="cmp-recursos__badge-tipo">Lectura</span>' +
          '<span class="cmp-recursos__tiempo">' + ICONO_RELOJ + ' texto completo</span>' +
        '</div>' +
        '<a class="cmp-recursos__titulo" href="contenido.md" target="_blank" rel="noopener">Texto completo del módulo (contenido.md)</a>' +
        '<p class="cmp-recursos__desc">Versión lineal del módulo en Markdown. Ideal para revisar el contenido completo o usarlo como referencia rápida.</p>' +
      '</div>' +
    '</div>';

    /* ── Vídeos ────────────────────────────────────────────── */
    var videosItems = '';
    if (videos.length > 0) {
      videosItems = videos.map(function (v) {
        if (v.pendiente) {
          return '<div class="cmp-recursos__item cmp-recursos__item--pendiente">' +
            '<div class="cmp-recursos__item-icon">' + ICONO_VIDEO + '</div>' +
            '<div class="cmp-recursos__item-body">' +
              '<div class="cmp-recursos__item-meta">' +
                '<span class="cmp-recursos__badge-tipo">Vídeo</span>' +
                '<span class="cmp-recursos__badge-pronto">Próximamente</span>' +
                '<span class="cmp-recursos__tiempo">' + ICONO_RELOJ + ' ~' + (v.duracion_min || '?') + ' min</span>' +
              '</div>' +
              '<span class="cmp-recursos__titulo cmp-recursos__titulo--nolink">' + v.titulo + '</span>' +
              (v.descripcion ? '<p class="cmp-recursos__desc">' + v.descripcion.replace(/ TODO:[^.]+\.?/g, '').trim() + '</p>' : '') +
            '</div>' +
          '</div>';
        }
        var tituloEl = v.url
          ? '<a class="cmp-recursos__titulo" href="' + v.url + '" target="_blank" rel="noopener">' + v.titulo + '</a>'
          : '<span class="cmp-recursos__titulo cmp-recursos__titulo--nolink">' + v.titulo + '</span>';
        return '<div class="cmp-recursos__item">' +
          '<div class="cmp-recursos__item-icon">' + ICONO_VIDEO + '</div>' +
          '<div class="cmp-recursos__item-body">' +
            '<div class="cmp-recursos__item-meta">' +
              '<span class="cmp-recursos__badge-tipo">Vídeo</span>' +
              '<span class="cmp-recursos__tiempo">' + ICONO_RELOJ + ' ' + (v.duracion_min || '?') + ' min</span>' +
            '</div>' +
            tituloEl +
          '</div>' +
        '</div>';
      }).join('');
    } else if (planeados.length > 0) {
      videosItems = planeados.map(function (v) {
        return '<div class="cmp-recursos__item cmp-recursos__item--pendiente">' +
          '<div class="cmp-recursos__item-icon">' + ICONO_VIDEO + '</div>' +
          '<div class="cmp-recursos__item-body">' +
            '<div class="cmp-recursos__item-meta">' +
              '<span class="cmp-recursos__badge-tipo">Vídeo</span>' +
              '<span class="cmp-recursos__badge-pronto">Próximamente</span>' +
              '<span class="cmp-recursos__tiempo">' + ICONO_RELOJ + ' ~' + (v.duracion_estimada_min || '?') + ' min</span>' +
            '</div>' +
            '<span class="cmp-recursos__titulo cmp-recursos__titulo--nolink">' + v.nombre_provisional + '</span>' +
            '<p class="cmp-recursos__desc">En preparación · ' + (v.responsable || '') + '</p>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    contenedor.innerHTML =
      '<section class="cmp-recursos">' +
        '<div class="cmp-recursos__header">' +
          '<h2>Recursos del módulo</h2>' +
          '<p>Lecturas y vídeos para reforzar y ampliar lo aprendido.</p>' +
        '</div>' +
        '<div class="cmp-recursos__grupo">' +
          '<h3 class="cmp-recursos__grupo-titulo">Lecturas</h3>' +
          lecturasItems +
          mdItem +
        '</div>' +
        (videosItems
          ? '<div class="cmp-recursos__grupo"><h3 class="cmp-recursos__grupo-titulo">Vídeos</h3>' + videosItems + '</div>'
          : '') +
      '</section>';
  }

  global.RecursosPanel = { montar };
})(window);
