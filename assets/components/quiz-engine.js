/* ============================================================
   Componente: quiz-engine
   Motor de quiz multi-pregunta con feedback inline.
   Soporta tipos: single_choice (MVP), multiple_choice (TODO),
   true_false (TODO), match (TODO).
   ============================================================ */

(function (global) {
  'use strict';

  const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function montar(contenedor, config, contexto) {
    if (!contenedor || !config) return;
    const quiz = config.quiz || { preguntas: [] };
    const preguntas = (quiz.preguntas || []).filter(p => p && p.opciones);
    if (!preguntas.length) {
      contenedor.innerHTML = '<div style="padding:40px;color:#999">Quiz vacío.</div>';
      return;
    }

    const moduloId = (contexto && contexto.moduloId) || quiz.modulo;
    const xpAprobado = (contexto && contexto.xpQuiz)         || 50;
    const xpPerfecto = (contexto && contexto.xpQuizPerfecto) || 20;

    contenedor.innerHTML = `
      <section class="cmp-quiz" id="quiz-${moduloId}">
        <div class="cmp-quiz__header">
          <h2>Comprueba lo <span class="accent">aprendido</span></h2>
          <div class="cmp-quiz__progress">
            <span data-role="progress-text">Pregunta 1 de ${preguntas.length}</span>
            <div class="cmp-quiz__dots" data-role="dots">
              ${preguntas.map((_, i) => `<div class="cmp-quiz__dot ${i === 0 ? 'is-active' : ''}"></div>`).join('')}
            </div>
          </div>
        </div>
        <div data-role="pregunta-host"></div>
      </section>`;

    const root = contenedor.querySelector('.cmp-quiz');
    const dotsEl = root.querySelector('[data-role="dots"]');
    const progressTextEl = root.querySelector('[data-role="progress-text"]');
    const host = root.querySelector('[data-role="pregunta-host"]');

    let idx = 0;
    let respuestas = [];

    function pintarPregunta() {
      const p = preguntas[idx];
      const opciones = p.opciones.map((opt, i) =>
        `<button class="cmp-quiz__opcion" data-correct="${i === p.correcta}">
          <span class="cmp-quiz__letra">${LETRAS[i]}</span>${opt}
        </button>`).join('');

      host.innerHTML = `
        <div class="cmp-quiz__pregunta">
          <div class="cmp-quiz__numero">PREGUNTA ${idx + 1}</div>
          <div class="cmp-quiz__enunciado">${p.enunciado}</div>
          <div class="cmp-quiz__opciones">${opciones}</div>
          <div class="cmp-quiz__feedback" data-role="feedback">
            <h4 data-role="feedback-title"></h4>
            <p data-role="feedback-text"></p>
          </div>
          <button class="cmp-quiz__btn-siguiente" data-role="btn-siguiente">${idx + 1 < preguntas.length ? 'Siguiente pregunta →' : 'Ver resultado'}</button>
        </div>`;

      const btnSig = host.querySelector('[data-role="btn-siguiente"]');
      const fbBox  = host.querySelector('[data-role="feedback"]');
      const fbTit  = host.querySelector('[data-role="feedback-title"]');
      const fbTxt  = host.querySelector('[data-role="feedback-text"]');
      const opciones_btn = host.querySelectorAll('.cmp-quiz__opcion');

      opciones_btn.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const correcto = i === p.correcta;
          opciones_btn.forEach((b, j) => {
            b.disabled = true;
            if (j === p.correcta) b.classList.add('is-correct');
          });
          if (!correcto) btn.classList.add('is-wrong');

          fbBox.classList.add('is-show');
          fbBox.classList.add(correcto ? 'is-correct' : 'is-wrong');
          fbTit.textContent = correcto ? '✓ Correcto' : '✗ No es esa';
          fbTxt.textContent = correcto
            ? (p.explicacion_correcto || '')
            : (p.explicacion_incorrecto || '');

          btnSig.classList.add('is-show');
          respuestas.push({ id: p.id, correcta: correcto });

          // Actualiza dots
          const dots = dotsEl.querySelectorAll('.cmp-quiz__dot');
          dots[idx].classList.remove('is-active');
          dots[idx].classList.add(correcto ? 'is-correct' : 'is-wrong');
          if (idx + 1 < preguntas.length) dots[idx + 1].classList.add('is-active');

          // Actualiza progress strip al 60% al responder primera, 80% a media, etc.
          if (global.ModuloLoader) {
            const pctResp = Math.round(60 + (idx / preguntas.length) * 30);
            global.ModuloLoader.actualizarProgresoStrip(Math.min(95, pctResp));
          }
        });
      });

      btnSig.addEventListener('click', () => {
        idx++;
        if (idx < preguntas.length) {
          progressTextEl.textContent = `Pregunta ${idx + 1} de ${preguntas.length}`;
          pintarPregunta();
        } else {
          mostrarResumen();
        }
      });
    }

    function mostrarResumen() {
      const aciertos = respuestas.filter(r => r.correcta).length;
      const score = Math.round((aciertos / preguntas.length) * 100);

      host.innerHTML = `
        <div class="cmp-quiz__resumen">
          <h3>Has terminado el quiz</h3>
          <div class="score">${score}%</div>
          <p>${aciertos} aciertos de ${preguntas.length} preguntas.</p>
          <p style="margin-top:12px;color:#666;font-size:13px;">
            ${score >= 70 ? '¡Aprobado! Ya puedes marcar el módulo como completado.' :
              'Por debajo del 70%. Revisa los conceptos y vuelve a intentarlo.'}
          </p>
        </div>`;

      if (global.Progress && moduloId) {
        global.Progress.registrarQuiz(moduloId, score, xpAprobado, xpPerfecto);
      }
      // Habilita el botón de "Marcar como completado" si existe
      const btnCompletar = document.querySelector('.cmp-footer-completar__btn');
      if (btnCompletar && score >= 70) btnCompletar.disabled = false;
      // Pinta el topbar (XP actualizada)
      if (global.App && global.App.pintarTopbar) global.App.pintarTopbar();
    }

    pintarPregunta();
  }

  global.QuizEngine = { montar };
})(window);
