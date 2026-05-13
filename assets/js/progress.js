/* ============================================================
   Open Business Tech Academy — progress.js
   Gestor de estado del consultor en localStorage.
   Clave única: obta:state:v1
   Schema documentado en 00-arquitectura.md sección 9.
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'obta:state:v1';

  // Niveles según arquitectura
  const NIVELES = [
    { nivel: 1, nombre: 'Aprendiz',                xp_min: 0    },
    { nivel: 2, nombre: 'Practicante',             xp_min: 200  },
    { nivel: 3, nombre: 'Especialista',            xp_min: 500  },
    { nivel: 4, nombre: 'Embajador Open Finance',  xp_min: 1000 }
  ];

  const ESTADO_INICIAL = {
    version: 1,
    consultor: {
      nombre_alias: 'Consultor',
      ingreso_primer_dia: null,
      ultima_visita: null
    },
    progreso: {
      xp_total: 0,
      nivel: 1,
      modulos: {},
      badges_desbloqueados: [],
      racha_dias: 0,
      objetivo_personal: null,
      uso_glosario: 0
    }
  };

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function hoyISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function leer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const inicial = clonar(ESTADO_INICIAL);
        inicial.consultor.ingreso_primer_dia = hoyISO();
        inicial.consultor.ultima_visita = hoyISO();
        guardar(inicial);
        return inicial;
      }
      const parsed = JSON.parse(raw);
      // migración futura: parsed.version < 1, etc.
      return parsed;
    } catch (e) {
      console.warn('[progress] estado corrupto, reseteando', e);
      const inicial = clonar(ESTADO_INICIAL);
      guardar(inicial);
      return inicial;
    }
  }

  function guardar(estado) {
    estado.consultor.ultima_visita = hoyISO();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }

  function calcularNivel(xp) {
    let actual = NIVELES[0];
    for (const n of NIVELES) {
      if (xp >= n.xp_min) actual = n;
    }
    return actual;
  }

  function obtenerNivelInfo() {
    const estado = leer();
    return calcularNivel(estado.progreso.xp_total);
  }

  function sumarXP(cantidad, motivo) {
    const estado = leer();
    estado.progreso.xp_total += cantidad;
    const nivelNuevo = calcularNivel(estado.progreso.xp_total);
    const subioNivel = nivelNuevo.nivel > estado.progreso.nivel;
    estado.progreso.nivel = nivelNuevo.nivel;
    guardar(estado);
    if (motivo) console.info('[progress] +' + cantidad + ' XP — ' + motivo);
    return { xp_total: estado.progreso.xp_total, subio_nivel: subioNivel, nivel: nivelNuevo };
  }

  function marcarLeido(moduloId, xp) {
    const estado = leer();
    const m = estado.progreso.modulos[moduloId] || {};
    if (!m.leido) {
      m.leido = true;
      m.leido_en = hoyISO();
      estado.progreso.modulos[moduloId] = m;
      guardar(estado);
      if (xp) sumarXP(xp, 'leído ' + moduloId);
    }
    return estado.progreso.modulos[moduloId];
  }

  function registrarQuiz(moduloId, score, xpAprobado, xpPerfecto) {
    const estado = leer();
    const m = estado.progreso.modulos[moduloId] || {};
    const previo = m.quiz_score || 0;
    m.quiz_score = Math.max(previo, score);
    m.quiz_intentos = (m.quiz_intentos || 0) + 1;
    estado.progreso.modulos[moduloId] = m;
    guardar(estado);

    let xpGanada = 0;
    // Solo se otorga XP la primera vez que se aprueba (evita farming)
    if (previo < 70 && score >= 70) {
      xpGanada += xpAprobado || 0;
      sumarXP(xpAprobado || 0, 'quiz aprobado ' + moduloId);
    }
    if (previo < 100 && score === 100) {
      xpGanada += xpPerfecto || 0;
      sumarXP(xpPerfecto || 0, 'quiz perfecto ' + moduloId);
    }
    return { score: m.quiz_score, xp_ganada: xpGanada };
  }

  function completarModulo(moduloId, badgeId) {
    const estado = leer();
    const m = estado.progreso.modulos[moduloId] || {};
    m.completado = true;
    m.completado_en = hoyISO();
    estado.progreso.modulos[moduloId] = m;
    if (badgeId && !estado.progreso.badges_desbloqueados.includes(badgeId)) {
      estado.progreso.badges_desbloqueados.push(badgeId);
    }
    guardar(estado);
    return m;
  }

  function tieneBadge(badgeId) {
    return leer().progreso.badges_desbloqueados.includes(badgeId);
  }

  function progresoModulo(moduloId) {
    const m = leer().progreso.modulos[moduloId];
    if (!m) return { porcentaje: 0, completado: false };
    let pct = 0;
    if (m.leido) pct += 50;
    if (m.quiz_score >= 70) pct += 30;
    if (m.completado) pct = 100;
    return { porcentaje: pct, completado: !!m.completado, leido: !!m.leido, quiz_score: m.quiz_score || 0 };
  }

  function setObjetivoPersonal(moduloTarget, fechaTargetISO) {
    const estado = leer();
    estado.progreso.objetivo_personal = {
      modulo_target: moduloTarget,
      fecha_target: fechaTargetISO,
      definido_en: hoyISO()
    };
    guardar(estado);
  }

  function incrementarUsoGlosario() {
    const estado = leer();
    estado.progreso.uso_glosario += 1;
    guardar(estado);
    return estado.progreso.uso_glosario;
  }

  function resetear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // API pública
  global.Progress = {
    leer,
    guardar,
    sumarXP,
    obtenerNivelInfo,
    marcarLeido,
    registrarQuiz,
    completarModulo,
    tieneBadge,
    progresoModulo,
    setObjetivoPersonal,
    incrementarUsoGlosario,
    resetear,
    NIVELES
  };
})(window);
