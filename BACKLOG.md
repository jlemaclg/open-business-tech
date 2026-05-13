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
| 1 | Contenido módulos 04–07 | Contenido | Alta |
| 2 | Sesiones y progreso persistente (Supabase) | Feature | Media |
| 3 | Diseño responsive mobile/tablet | UX | Media |
| 4 | Integración chatbot | Feature | Baja |
| 5 | Script de build para publicar actualizaciones | Arquitectura | Baja |

---

## Detalle

### 1 · Contenido módulos 04–07
Módulos con estructura creada pero sin contenido. Cada uno requiere `modulo-data.json`, `quiz.json`, `recursos.json`, `contenido.md` e `index.html`.
- [ ] 04 — OAuth, OpenID Connect y FAPI
- [ ] 05 — Arquitectura Open Finance
- [ ] 06 — Estándares regulatorios
- [ ] 07 — Casos de uso técnicos

### 2 · Sesiones y progreso persistente (Supabase)
Actualmente el progreso vive solo en `localStorage` del navegador. Si el alumno cambia de dispositivo, pierde su avance.
- Supabase Auth (email/contraseña)
- Modificar `progress.js` para sincronizar con base de datos
- Dashboard para el profesor con avance de todos los alumnos
- Capa gratuita suficiente para el MVP
- **Esfuerzo estimado:** ~2 días

### 3 · Diseño responsive mobile/tablet
El viewport está fijado a `1280px`, bloqueando el responsive. Componentes más complejos de adaptar: `stepper-flow` y `comparativa-tabs`.
- **Esfuerzo estimado:** ~2–3 días

### 4 · Integración chatbot
El apartado `/chatbot/` existe como placeholder. Pendiente de definir caso de uso concreto antes de implementar.

### 5 · Script de build para publicar actualizaciones
Un script PowerShell que automatice: `git add` + `git commit` + `git push` en un solo comando al actualizar contenido.
- **Esfuerzo estimado:** ~2 horas

---

## Completado

| Versión | Descripción |
|---------|-------------|
| 1.0.0 | Plataforma base publicada en GitHub Pages con módulos 01–03 |
