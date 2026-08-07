# Changelog

Todos los cambios relevantes del producto se documentan en este archivo.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [1.3.0] — 2026-08-07

### Añadido
- Quiz de 6 preguntas para el módulo 04b · Construyendo un perfil FAPI 2.0 propio
- Quiz de 7 preguntas para el módulo 04c · SLAs y requisitos operativos
- Módulo 04d · Taller Perú activado en la ruta (antes `disponible: false`, publicado como ejemplo funcionando de módulo tipo "taller")

### Corregido
- Prerrequisito de 04c apuntaba a `05-arquitectura-open-finance`, un módulo sin contenido; corregido a `04-oauth-openid-fapi`

### Infraestructura
- `node_modules/` deja de trackearse en git (añadido a `.gitignore`)
- `.gitattributes` añadido para normalizar line endings (CRLF/LF) y evitar diffs de ruido

---

## [1.2.0] — 2026-05-17

### Añadido
- Módulo 04b · Construyendo un perfil FAPI 2.0 propio (autoformación + taller facilitado)
- Módulo 04c · SLAs y requisitos operativos en Open Finance (UK, Brasil, Chile, Colombia)
- Módulo 04d · Taller Perú — Perfil FAPI 2.0 + SLAs (co-creación)
- Componentes: `perfil-builder`, `perfil-resumen`, `taller-setup`, `capacidad-ecosistema`, `acta-export`, `taller-votacion`, `recursos-panel`
- Nuevo tipo de entrada de ruta `tipo: 'profundizacion'` / `tipo: 'taller'` junto al lineal

> **Nota:** 04b/04c/04d se publicaron en varios commits entre el 13 y el 17 de mayo
> sin registrarse en su momento en este archivo. Esta entrada consolida ese trabajo
> retroactivamente.

---

## [1.1.0] — 2026-05-13

### Añadido
- Módulo 04 · OAuth, OpenID Connect y FAPI — contenido completo con quiz
- Componente `token-inspector.js`
- Nuevos términos en el glosario

### Modificado
- `components.css` — estilos para nuevos componentes del módulo 04
- `modulo-loader.js` — mejoras para soportar módulo 04
- `index.html` — módulo 04 visible en la ruta de aprendizaje

---

## [1.0.0] — 2026-05-13

### Añadido
- Plataforma base Open Business Tech Academy publicada en GitHub Pages
- Sistema de progreso y XP persistido en localStorage (`progress.js`)
- Módulo 01 · Fundamentos de API — contenido completo con quiz (8 preguntas)
- Módulo 02 · HTTP, REST y JSON — contenido completo con quiz
- Módulo 03 · Seguridad de transporte (TLS/mTLS) — contenido completo con quiz (8 preguntas)
- Módulos 04–07 reservados (estructura creada, contenido pendiente)
- Biblioteca de componentes: `hero-modulo`, `por-que-importa`, `objetivos-grid`, `stepper-flow`, `comparativa-tabs`, `ejemplo-real`, `dialogo-transferencia`, `quiz-engine`, `footer-completar`, `badge-modal`
- Sistema de badges por módulo completado (8 badges diseñados en SVG)
- Glosario interactivo con términos Open Finance
- Página de bienvenida / ruta de aprendizaje (`index.html`)
- Chatbot placeholder (pendiente de integración)

### Arquitectura
- Proyecto 100% estático (HTML + CSS + JS vanilla), sin dependencias de build
- Datos de módulo separados en `modulo-data.json`, `quiz.json`, `recursos.json`
- Carga dinámica de módulos via `modulo-loader.js` con `fetch()`
- Requiere servidor HTTP local o GitHub Pages (no funciona con `file://` por restricciones de `fetch`)

---

## [Próximas versiones — Backlog]

Ver [Issues](https://github.com/jlemaclg/open-business-tech/issues) para el detalle completo.
