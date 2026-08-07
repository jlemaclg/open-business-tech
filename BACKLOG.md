# Backlog — Open Business Tech Academy

Mejoras y funcionalidades pendientes de priorizar.  
Para proponer algo nuevo, abre un [Issue en GitHub](https://github.com/jlemaclg/open-business-tech/issues).

---

## En curso

*(nada actualmente)*

---

## Pendiente

| # | Título | Tipo | Prioridad |
|---|--------|------|-----------|
| 1 | Contenido módulo 05 — Arquitectura Open Finance | Contenido | Alta |
| 2 | Contenido módulos 06–07 | Contenido | Media |
| 3 | Generalizar 04d como plantilla de taller reutilizable (más allá de Perú) | Arquitectura | Media |
| 4 | Sesiones y progreso persistente (Supabase) | Feature | Media |
| 5 | Diseño responsive mobile/tablet | UX | Media |
| 6 | Integración chatbot | Feature | Baja |
| 7 | Script de build para publicar actualizaciones | Arquitectura | Baja |
| 8 | Sincronizar catálogo de componentes del README con `assets/components/` real | Documentación | Media |

---

## Detalle

### 1 · Módulo 05 — Arquitectura Open Finance
Es ahora el bloqueante real de la ruta: el propio módulo 04 lo referencia como siguiente paso ("Próximo paso") y 04c lo tenía como prerrequisito hasta esta revisión (corregido — ver CHANGELOG 1.2.0). Sin 05, el mapa 00→07 tiene un hueco justo en el centro. Requiere `modulo-data.json`, `quiz.json`, `recursos.json`, `contenido.md` e `index.html`.

### 2 · Contenido módulos 06–07
- [x] 04 — OAuth, OpenID Connect y FAPI ✅
- [x] 04b — Perfil FAPI 2.0 propio ✅
- [x] 04c — SLAs y requisitos operativos ✅
- [x] 04d — Taller Perú (co-creación) ✅ — publicado como ejemplo de taller
- [ ] 05 — Arquitectura Open Finance
- [ ] 06 — Estándares regulatorios
- [ ] 07 — Casos de uso técnicos

### 3 · Generalizar 04d como plantilla de taller
04d nació como ejercicio para Perú, con textos y anchors (Open Finance Brasil) hardcodeados en `modulo-data.json`. Se libera tal cual, como ejemplo funcionando de módulo tipo "taller". Queda pendiente evaluar si merece parametrizarse (país, anchor, banco de decisiones) para reutilizarse en otras jurisdicciones sin duplicar el módulo entero.

### 4 · Sesiones y progreso persistente (Supabase)
Actualmente el progreso vive solo en `localStorage` del navegador. Si el alumno cambia de dispositivo, pierde su avance.
- Supabase Auth (email/contraseña)
- Modificar `progress.js` para sincronizar con base de datos
- Dashboard para el profesor con avance de todos los alumnos
- Capa gratuita suficiente para el MVP
- **Esfuerzo estimado:** ~2 días

### 5 · Diseño responsive mobile/tablet
El viewport está fijado a `1280px`, bloqueando el responsive. Componentes más complejos de adaptar: `stepper-flow` y `comparativa-tabs`.
- **Esfuerzo estimado:** ~2–3 días

### 6 · Integración chatbot
El apartado `/chatbot/` existe como placeholder. Pendiente de definir caso de uso concreto antes de implementar.

### 7 · Script de build para publicar actualizaciones
Un script PowerShell que automatice: `git add` + `git commit` + `git push` en un solo comando al actualizar contenido.
- **Esfuerzo estimado:** ~2 horas

### 8 · Sincronizar catálogo de componentes del README
El README documenta 11 componentes; el repo ya tiene 19 (`perfil-builder`, `perfil-resumen`, `taller-setup`, `capacidad-ecosistema`, `acta-export`, `taller-votacion`, `recursos-panel`, `token-inspector` no están documentados). También falta documentar el campo `tipo` (`profundizacion` / `taller`) de las entradas de `RUTA` en `index.html`.

---

## Completado

| Versión | Descripción |
|---------|-------------|
| 1.3.0 | Quizzes 04b/04c, activación de 04d, fix prerrequisito 04c, limpieza de repo |
| 1.2.0 | Módulos 04b/04c/04d (contenido) |
| 1.1.0 | Módulo 04 OAuth/FAPI + token-inspector |
| 1.0.0 | Plataforma base publicada en GitHub Pages con módulos 01–03 |
