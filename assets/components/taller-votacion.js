/* ============================================================
   Componente: taller-votacion
   Activa la interactividad de los bloques de votación punto-a-punto
   que se inyectan como HTML inline dentro de comparativa-tabs (u
   otros contenedores). No renderiza nada por sí mismo — engancha
   handlers de forma delegativa y persiste en localStorage.

   Estructura HTML esperada (resumida):

   <div class="tv-bloque" data-bloque-id="marcha-blanca">
     ...
     <ul class="tv-puntos">
       <li class="tv-punto" data-punto-id="disp">
         <div class="tv-punto__texto">...</div>
         <div class="tv-punto__botonera">
           <button class="tv-vote-btn" data-voto="acuerdo">...</button>
           <button class="tv-vote-btn" data-voto="no">...</button>
           <button class="tv-vote-btn" data-voto="propuesta">...</button>
         </div>
         <div class="tv-punto__propuesta" hidden>
           <input type="text" />
         </div>
         <div class="tv-punto__observacion">
           <textarea></textarea>
         </div>
       </li>
       ...
     </ul>
     <div class="tv-consenso">
       <div class="tv-consenso__botonera">
         <button class="tv-consenso-btn" data-consenso="unanime">Unánime</button>
         <button class="tv-consenso-btn" data-consenso="mayoria">Por mayoría</button>
       </div>
       <div class="tv-consenso__notas">
         <textarea></textarea>
       </div>
       <div class="tv-consenso__resumen" hidden></div>
     </div>
   </div>

   Persistencia: clave por módulo + bloque, no contamina el progreso
   del consultor ni el perfil-builder.
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_PREFIX = 'obta:taller-votacion:v1';

  /* ---- Helpers de storage ---- */
  function _moduloId() {
    const body = document.body;
    return (body && body.dataset && body.dataset.modulo) || 'modulo-desconocido';
  }

  function _claveBloque(bloqueId) {
    return STORAGE_PREFIX + ':' + _moduloId() + ':' + bloqueId;
  }

  function leerBloque(bloqueId) {
    try {
      const raw = localStorage.getItem(_claveBloque(bloqueId));
      if (!raw) return { puntos: {}, consenso: null, notasConsenso: '' };
      const parsed = JSON.parse(raw);
      return {
        puntos: parsed.puntos || {},
        consenso: parsed.consenso || null,
        notasConsenso: parsed.notasConsenso || ''
      };
    } catch (e) {
      return { puntos: {}, consenso: null, notasConsenso: '' };
    }
  }

  function guardarBloque(bloqueId, estado) {
    try {
      localStorage.setItem(_claveBloque(bloqueId), JSON.stringify(estado));
    } catch (e) {
      console.warn('[taller-votacion] no se pudo guardar', e);
    }
  }

  /* ---- Resumen consenso ---- */
  function actualizarResumen(bloqueEl) {
    const resumen = bloqueEl.querySelector('.tv-consenso__resumen');
    if (!resumen) return;
    const puntos  = bloqueEl.querySelectorAll('.tv-punto');
    let acuerdo = 0, no = 0, propuesta = 0, sinVotar = 0;
    puntos.forEach(p => {
      const v = p.getAttribute('data-voto');
      if (v === 'acuerdo')        acuerdo++;
      else if (v === 'no')        no++;
      else if (v === 'propuesta') propuesta++;
      else                        sinVotar++;
    });
    const consensoBtn = bloqueEl.querySelector('.tv-consenso-btn.is-active');
    const consensoLabel = consensoBtn
      ? consensoBtn.getAttribute('data-consenso') === 'unanime'
        ? 'Unánime'
        : 'Por mayoría'
      : null;

    const partes = [];
    partes.push(`<strong>${acuerdo}</strong> de acuerdo`);
    if (no > 0)        partes.push(`<strong>${no}</strong> en contra`);
    if (propuesta > 0) partes.push(`<strong>${propuesta}</strong> con propuesta`);
    if (sinVotar > 0)  partes.push(`<strong>${sinVotar}</strong> sin votar`);
    if (consensoLabel) partes.push(`cierre: <strong>${consensoLabel}</strong>`);

    resumen.innerHTML = partes.join(' · ');
    resumen.hidden = false;
  }

  /* ---- Aplicar estado a un bloque (al cargar) ---- */
  function hidratarBloque(bloqueEl) {
    const bloqueId = bloqueEl.getAttribute('data-bloque-id');
    if (!bloqueId) return;
    const estado = leerBloque(bloqueId);

    // Puntos
    bloqueEl.querySelectorAll('.tv-punto').forEach(punto => {
      const puntoId = punto.getAttribute('data-punto-id');
      const datos = estado.puntos[puntoId] || {};
      if (datos.voto) {
        punto.setAttribute('data-voto', datos.voto);
        punto.querySelectorAll('.tv-vote-btn').forEach(btn => {
          btn.classList.toggle('is-active', btn.getAttribute('data-voto') === datos.voto);
        });
      }
      const propuestaWrap = punto.querySelector('.tv-punto__propuesta');
      const propuestaInput = propuestaWrap ? propuestaWrap.querySelector('input') : null;
      if (propuestaWrap && propuestaInput) {
        propuestaWrap.hidden = datos.voto !== 'propuesta';
        if (datos.propuesta) propuestaInput.value = datos.propuesta;
      }
      const obs = punto.querySelector('.tv-punto__observacion textarea');
      if (obs && datos.observacion) obs.value = datos.observacion;
    });

    // Consenso
    if (estado.consenso) {
      bloqueEl.querySelectorAll('.tv-consenso-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.getAttribute('data-consenso') === estado.consenso);
      });
    }
    const notasEl = bloqueEl.querySelector('.tv-consenso__notas textarea');
    if (notasEl && estado.notasConsenso) notasEl.value = estado.notasConsenso;

    actualizarResumen(bloqueEl);
  }

  /* ---- Persistir cambios desde el DOM ---- */
  function persistirBloque(bloqueEl) {
    const bloqueId = bloqueEl.getAttribute('data-bloque-id');
    if (!bloqueId) return;
    const estado = { puntos: {}, consenso: null, notasConsenso: '' };

    bloqueEl.querySelectorAll('.tv-punto').forEach(punto => {
      const puntoId = punto.getAttribute('data-punto-id');
      if (!puntoId) return;
      const voto = punto.getAttribute('data-voto') || null;
      const propuestaInput = punto.querySelector('.tv-punto__propuesta input');
      const obs = punto.querySelector('.tv-punto__observacion textarea');
      estado.puntos[puntoId] = {
        voto: voto,
        propuesta: propuestaInput ? propuestaInput.value : '',
        observacion: obs ? obs.value : ''
      };
    });

    const consensoActivo = bloqueEl.querySelector('.tv-consenso-btn.is-active');
    estado.consenso = consensoActivo ? consensoActivo.getAttribute('data-consenso') : null;
    const notasEl = bloqueEl.querySelector('.tv-consenso__notas textarea');
    estado.notasConsenso = notasEl ? notasEl.value : '';

    guardarBloque(bloqueId, estado);
    actualizarResumen(bloqueEl);
  }

  /* ---- Handlers (delegación a nivel document) ---- */

  function onClick(ev) {
    const voteBtn = ev.target.closest('.tv-vote-btn');
    if (voteBtn) {
      const punto = voteBtn.closest('.tv-punto');
      const bloque = voteBtn.closest('.tv-bloque');
      if (!punto || !bloque) return;
      const nuevoVoto = voteBtn.getAttribute('data-voto');
      const votoActual = punto.getAttribute('data-voto');

      if (votoActual === nuevoVoto) {
        // toggle off (permite borrar el voto)
        punto.removeAttribute('data-voto');
        punto.querySelectorAll('.tv-vote-btn').forEach(b => b.classList.remove('is-active'));
      } else {
        punto.setAttribute('data-voto', nuevoVoto);
        punto.querySelectorAll('.tv-vote-btn').forEach(b => {
          b.classList.toggle('is-active', b.getAttribute('data-voto') === nuevoVoto);
        });
      }

      const propuestaWrap = punto.querySelector('.tv-punto__propuesta');
      if (propuestaWrap) {
        propuestaWrap.hidden = punto.getAttribute('data-voto') !== 'propuesta';
        if (!propuestaWrap.hidden) {
          const inp = propuestaWrap.querySelector('input');
          if (inp) setTimeout(() => inp.focus(), 30);
        }
      }
      persistirBloque(bloque);
      return;
    }

    const consensoBtn = ev.target.closest('.tv-consenso-btn');
    if (consensoBtn) {
      const bloque = consensoBtn.closest('.tv-bloque');
      if (!bloque) return;
      const nuevo = consensoBtn.getAttribute('data-consenso');
      const activos = bloque.querySelectorAll('.tv-consenso-btn.is-active');
      const yaActivo = consensoBtn.classList.contains('is-active');
      activos.forEach(b => b.classList.remove('is-active'));
      if (!yaActivo) consensoBtn.classList.add('is-active');
      persistirBloque(bloque);
      return;
    }
  }

  function onInput(ev) {
    const target = ev.target;
    if (!target) return;
    const bloque = target.closest('.tv-bloque');
    if (!bloque) return;
    if (target.matches('.tv-punto__propuesta input') ||
        target.matches('.tv-punto__observacion textarea') ||
        target.matches('.tv-consenso__notas textarea')) {
      // Debounce ligero
      clearTimeout(target._tvSaveT);
      target._tvSaveT = setTimeout(() => persistirBloque(bloque), 220);
    }
  }

  /* ---- API pública ---- */

  function escanearYActivar(rootEl) {
    const root = rootEl || document;
    root.querySelectorAll('.tv-bloque').forEach(hidratarBloque);
  }

  // Engancha listeners una sola vez
  let _enganchado = false;
  function init() {
    if (_enganchado) return;
    document.addEventListener('click', onClick, false);
    document.addEventListener('input', onInput, false);
    _enganchado = true;
    escanearYActivar(document);
  }

  // Auto-init al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-escaneo cuando el modulo-loader termina de inyectar componentes
  // (los .tv-bloque pueden aparecer DESPUÉS del DOMContentLoaded inicial).
  // Sondeo ligero durante 3 segundos como red de seguridad sin acoplarse
  // a la API interna del modulo-loader.
  let _intentos = 0;
  const _polling = setInterval(() => {
    _intentos++;
    escanearYActivar(document);
    if (_intentos >= 6) clearInterval(_polling); // ~3s
  }, 500);

  // También se expone para invocación manual desde el modulo-loader si
  // en el futuro éste dispara un evento de "componentes listos".
  global.TallerVotacion = {
    init: init,
    escanearYActivar: escanearYActivar,
    leerBloque: leerBloque,
    guardarBloque: guardarBloque
  };

})(window);
