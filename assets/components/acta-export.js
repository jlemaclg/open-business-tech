/* ============================================================
   Componente: acta-export
   Genera dos exports del taller presencial:
     · Ficha-resumen (Markdown corto, para circular)
     · Acta detallada (Markdown largo con todos los inputs)
   Lee del localStorage los estados de:
     · taller-setup     (obta:taller-setup:v1)
     · perfil-builder   (obta:perfil-fapi-cocreacion:v1)
     · capacidad-eco    (obta:capacidad-ecosistema:v1)
   Ofrece dos botones: Descargar / Imprimir (versión print-friendly).
   ============================================================ */

(function (global) {
  'use strict';

  function leerJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmt(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback || '—';
    return String(v);
  }

  function contarFlags(capacidad) {
    if (!capacidad) return 0;
    let n = 0;
    Object.values(capacidad).forEach(c => {
      const cap = parseInt(c.capacidad_ef, 10);
      const nec = parseInt(c.necesidad_consumidor, 10);
      if (cap && nec && (nec - cap) > 0 && c.esfuerzo_ef === 'alto' && c.prioridad_consumidor === 'critica') n++;
    });
    return n;
  }

  function buildFichaResumen(config, setup, perfil, capacidad) {
    const fapi = config.fapi || {};
    const sla  = config.sla  || {};
    const fechaTexto = setup && setup.fecha ? setup.fecha : new Date().toISOString().slice(0,10);
    const titulo = setup && setup.titulo_taller ? setup.titulo_taller : 'Taller de co-creación';
    const facilitador = setup && setup.facilitador ? setup.facilitador : 'Minsait · Open Business';

    let md = '# Ficha-resumen · ' + titulo + '\n\n';
    md += '**Fecha:** ' + fechaTexto + '  \n';
    md += '**Facilitador:** ' + facilitador + '  \n';
    if (setup && setup.roles) {
      const totales = Object.entries(setup.roles).map(([k, n]) => k + ': ' + n).join(' · ');
      md += '**Composición:** ' + totales + '\n\n';
    } else {
      md += '\n';
    }

    md += '## Perfil FAPI 2.0\n\n';
    if (perfil && Object.keys(perfil).length && fapi.decisiones) {
      fapi.decisiones.forEach(d => {
        const entry = perfil[d.id];
        if (!entry) { md += '- **' + d.num + ' ' + d.pregunta_corta + ':** _sin decidir_\n'; return; }
        const opcionId = (typeof entry === 'object') ? entry.opcion : entry;
        const opcion = (d.opciones || []).find(o => o.id === opcionId);
        const label = opcion ? opcion.label : '—';
        const esf = (typeof entry === 'object') ? entry.esfuerzo_ef : null;
        const pri = (typeof entry === 'object') ? entry.prioridad_consumidor : null;
        let extras = [];
        if (esf) extras.push('esfuerzo EF: ' + esf);
        if (pri) extras.push('prioridad cons: ' + pri);
        md += '- **' + d.num + ' ' + d.pregunta_corta + ':** ' + label +
          (extras.length ? ' _(' + extras.join(' · ') + ')_' : '') + '\n';
      });
    } else {
      md += '_Sin decisiones registradas._\n';
    }
    md += '\n';

    md += '## SLAs del ecosistema · estado por horizonte\n\n';
    if (capacidad && Object.keys(capacidad).length && sla.dimensiones && sla.horizontes) {
      sla.horizontes.forEach(h => {
        md += '### ' + h.label + '\n\n';
        md += '| Dimensión | Cap. EF | Esfuerzo | Necesidad | Prioridad | Umbral reg. | Gap |\n';
        md += '|---|---|---|---|---|---|---|\n';
        sla.dimensiones.forEach(d => {
          const c = capacidad[d.id + '__' + h.id] || {};
          const cap = parseInt(c.capacidad_ef, 10);
          const nec = parseInt(c.necesidad_consumidor, 10);
          const gap = (cap && nec) ? (nec - cap) : '—';
          md += '| ' + d.titulo + ' | ' + fmt(c.capacidad_ef) + ' | ' + fmt(c.esfuerzo_ef) + ' | ' +
                fmt(c.necesidad_consumidor) + ' | ' + fmt(c.prioridad_consumidor) + ' | ' +
                fmt(c.umbral_regulador) + ' | ' + gap + ' |\n';
        });
        md += '\n';
      });
    } else {
      md += '_Sin inputs registrados._\n\n';
    }

    md += '## Banderas levantadas\n\n';
    const flags = contarFlags(capacidad);
    md += (flags > 0
      ? '**' + flags + '** combinacion(es) de gap positivo + esfuerzo alto + prioridad crítica. Requieren decisión del regulador (plazo / escalonamiento / subsidio).\n'
      : 'Ninguna combinación gap × esfuerzo alto × prioridad crítica registrada.\n');

    return md;
  }

  function buildActaDetallada(config, setup, perfil, capacidad) {
    const fapi = config.fapi || {};
    const sla  = config.sla  || {};
    const titulo = setup && setup.titulo_taller ? setup.titulo_taller : 'Taller de co-creación';

    let md = '# Acta detallada · ' + titulo + '\n\n';

    // Cabecera
    md += '## Cabecera\n\n';
    md += '- **Fecha:** ' + fmt(setup && setup.fecha) + '\n';
    md += '- **Facilitador:** ' + fmt(setup && setup.facilitador) + '\n';
    md += '- **Iniciado a las:** ' + fmt(setup && setup.iniciado_at) + '\n';
    md += '- **Bloques activos:** ' + (setup && setup.bloques
      ? Object.entries(setup.bloques).filter(([k,v]) => v).map(([k]) => k).join(', ')
      : '—') + '\n';
    if (setup && setup.roles) {
      md += '- **Composición de la mesa:**\n';
      Object.entries(setup.roles).forEach(([rol, n]) => {
        md += '  - ' + rol + ': ' + n + '\n';
      });
    }
    md += '\n';

    // Bloque 1 — Perfil FAPI completo
    md += '## Bloque 1 · Perfil FAPI 2.0 (detalle por decisión)\n\n';
    if (fapi.decisiones) {
      fapi.decisiones.forEach(d => {
        md += '### ' + d.num + ' · ' + d.pregunta + '\n\n';
        if (d.anchor_brasil && (d.anchor_brasil.opcion || d.anchor_brasil.label)) {
          const opcionRef = d.anchor_brasil.opcion ? (d.opciones || []).find(o => o.id === d.anchor_brasil.opcion) : null;
          md += '> **Anchor Brasil:** ' + (d.anchor_brasil.label || (opcionRef ? opcionRef.label : '—'));
          if (d.anchor_brasil.nota) md += ' — ' + d.anchor_brasil.nota;
          md += '\n\n';
        }
        const entry = perfil && perfil[d.id];
        if (!entry) { md += '_Sin decidir._\n\n'; return; }
        const opcionId = (typeof entry === 'object') ? entry.opcion : entry;
        const opcion = (d.opciones || []).find(o => o.id === opcionId);
        md += '- **Opción adoptada:** ' + (opcion ? opcion.label : '—') + '\n';
        if (opcion && opcion.descripcion) md += '- **Descripción:** ' + opcion.descripcion + '\n';
        if (typeof entry === 'object') {
          md += '- **Esfuerzo declarado por EFs:** ' + fmt(entry.esfuerzo_ef) + '\n';
          md += '- **Prioridad declarada por consumidores:** ' + fmt(entry.prioridad_consumidor) + '\n';
        }
        md += '\n';
      });
    } else {
      md += '_Bloque no incluido en la sesión._\n\n';
    }

    // Bloque 2 — SLAs detalle
    md += '## Bloque 2 · SLAs del ecosistema (detalle por dimensión × horizonte)\n\n';
    if (sla.dimensiones && sla.horizontes) {
      sla.dimensiones.forEach(d => {
        md += '### ' + d.titulo + '\n\n';
        if (d.descripcion) md += d.descripcion + '\n\n';
        sla.horizontes.forEach(h => {
          const anchorTexto = d.anchor_brasil && (d.anchor_brasil[h.id] || d.anchor_brasil.global);
          md += '#### ' + h.label + '\n\n';
          if (anchorTexto) md += '> **Anchor Brasil:** ' + anchorTexto + '\n\n';
          const c = (capacidad && capacidad[d.id + '__' + h.id]) || {};
          md += '- Capacidad EF: ' + fmt(c.capacidad_ef) + '\n';
          md += '- Esfuerzo EF: ' + fmt(c.esfuerzo_ef) + '\n';
          md += '- Necesidad consumidor: ' + fmt(c.necesidad_consumidor) + '\n';
          md += '- Prioridad consumidor: ' + fmt(c.prioridad_consumidor) + '\n';
          md += '- Umbral regulador: ' + fmt(c.umbral_regulador) + '\n';
          const cap = parseInt(c.capacidad_ef, 10);
          const nec = parseInt(c.necesidad_consumidor, 10);
          if (cap && nec) {
            const gap = nec - cap;
            md += '- **Gap (necesidad − capacidad):** ' + gap + '\n';
            if (gap > 0 && c.esfuerzo_ef === 'alto' && c.prioridad_consumidor === 'critica') {
              md += '- **Bandera levantada** (decisión del regulador requerida)\n';
            }
          }
          md += '\n';
        });
      });
    } else {
      md += '_Bloque no incluido en la sesión._\n\n';
    }

    md += '---\n\n';
    md += '_Generado por Open Business Tech Academy · acta-export._\n';
    return md;
  }

  function descargarMarkdown(filename, contenido) {
    const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;

    function pintar() {
      const setup     = leerJSON('obta:taller-setup:v1');
      const perfil    = leerJSON('obta:perfil-fapi-cocreacion:v1');
      const capacidad = leerJSON('obta:capacidad-ecosistema:v1');

      // Calcular contadores rápidos para mostrar al facilitador
      const decisionesTomadas = perfil ? Object.values(perfil).filter(e =>
        e && ((typeof e === 'string') || e.opcion)).length : 0;
      const celdasCompletas = capacidad ? Object.values(capacidad).filter(c =>
        c.capacidad_ef && c.esfuerzo_ef && c.necesidad_consumidor && c.prioridad_consumidor).length : 0;
      const banderas = contarFlags(capacidad);

      const root = document.createElement('div');
      root.className = 'cmp-acta-export';
      root.innerHTML =
        '<div class="cmp-acta-export__header">' +
          '<div class="cmp-acta-export__eyebrow">' + esc(config.eyebrow || 'Cierre del taller') + '</div>' +
          '<h2>' + esc(config.titulo || 'Exportar ficha-resumen y acta detallada') + '</h2>' +
          (config.subtitulo ? '<p class="cmp-acta-export__sub">' + config.subtitulo + '</p>' : '') +
        '</div>' +

        '<div class="cmp-acta-export__counters">' +
          '<div class="cmp-acta-export__counter"><span>Decisiones FAPI tomadas</span><strong>' + decisionesTomadas + '</strong></div>' +
          '<div class="cmp-acta-export__counter"><span>Celdas SLA completas</span><strong>' + celdasCompletas + '</strong></div>' +
          '<div class="cmp-acta-export__counter is-flag"><span>Banderas levantadas</span><strong>' + banderas + '</strong></div>' +
        '</div>' +

        '<div class="cmp-acta-export__actions">' +
          '<button class="cmp-acta-export__btn is-primary" data-action="download-ficha" type="button">Descargar ficha-resumen (.md)</button>' +
          '<button class="cmp-acta-export__btn" data-action="download-acta" type="button">Descargar acta detallada (.md)</button>' +
          '<button class="cmp-acta-export__btn" data-action="refresh" type="button">Recargar inputs</button>' +
        '</div>' +

        '<details class="cmp-acta-export__preview">' +
          '<summary>Previsualizar ficha-resumen</summary>' +
          '<pre data-preview="ficha"></pre>' +
        '</details>' +
        '<details class="cmp-acta-export__preview">' +
          '<summary>Previsualizar acta detallada</summary>' +
          '<pre data-preview="acta"></pre>' +
        '</details>';

      contenedor.innerHTML = '';
      contenedor.appendChild(root);

      const ficha = buildFichaResumen(config, setup, perfil, capacidad);
      const acta  = buildActaDetallada(config, setup, perfil, capacidad);
      const prevFicha = root.querySelector('[data-preview="ficha"]');
      const prevActa  = root.querySelector('[data-preview="acta"]');
      if (prevFicha) prevFicha.textContent = ficha;
      if (prevActa)  prevActa.textContent  = acta;

      root.querySelector('[data-action="download-ficha"]').addEventListener('click', () => {
        const slug = (setup && setup.titulo_taller ? setup.titulo_taller : 'taller').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        descargarMarkdown('ficha-resumen-' + slug + '.md', ficha);
      });
      root.querySelector('[data-action="download-acta"]').addEventListener('click', () => {
        const slug = (setup && setup.titulo_taller ? setup.titulo_taller : 'taller').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        descargarMarkdown('acta-detallada-' + slug + '.md', acta);
      });
      root.querySelector('[data-action="refresh"]').addEventListener('click', pintar);
    }

    pintar();

    // Repintar cuando otros componentes emitan cambios
    window.addEventListener('perfil-builder:update', pintar);
    window.addEventListener('capacidad-ecosistema:update', pintar);
    window.addEventListener('taller-setup:update', pintar);
  }

  global.ActaExport = { montar };
})(window);
