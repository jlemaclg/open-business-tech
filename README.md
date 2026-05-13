# Open Business Tech Academy

Plataforma de aprendizaje técnico autoalojada en HTML estático para consultores
de Open Business de Minsait. Cierra el gap técnico (APIs, REST, TLS, mTLS,
OAuth, OpenID Connect, FAPI 2.0, ISO 20022) sin frameworks ni build step.

## Cómo abrir

Cualquier navegador moderno. Abre `index.html` desde la raíz. **Sin instalación,
sin descargas, sin terminal.** El consultor abre el archivo y navega.

> **Nota técnica para mantenedores:** algunos Chrome bloquean `fetch` sobre
> `file://`. Si en desarrollo local te ocurre, sirve la carpeta con
> `python -m http.server 8000` y abre http://localhost:8000. En SharePoint
> Minsait (producción) no aplica — `fetch` funciona porque se sirve por HTTP.

## Cero dependencias externas

El proyecto no requiere `npm install`, no descarga librerías de CDN, no
ejecuta scripts de setup. Toda la lógica (HTML, CSS, JS) vive en el repo.
Si en algún momento se decide activar resaltado de código o renderizado
de Markdown, se hará añadiendo el archivo correspondiente a `assets/js/`
sin romper la promesa de "abrir y navegar".

## Estructura

```
open-business-tech-academy/
├── index.html              # Hub: dashboard, ruta, progreso, objetivos
├── README.md               # Este archivo
│
├── assets/
│   ├── css/
│   │   ├── theme.css       # Tokens Minsait (paleta, tipografía, sombras)
│   │   ├── components.css  # Estilos de los componentes
│   │   └── modulo.css      # Layout específico de módulos
│   │
│   ├── components/         # Biblioteca de componentes JS
│   │   ├── hero-modulo.js
│   │   ├── por-que-importa.js
│   │   ├── objetivos-grid.js
│   │   ├── stepper-flow.js
│   │   ├── comparativa-tabs.js
│   │   ├── ejemplo-real.js
│   │   ├── dialogo-transferencia.js
│   │   ├── quiz-engine.js
│   │   ├── badge-modal.js
│   │   ├── footer-completar.js
│   │   └── glosario-tooltip.js
│   │
│   ├── js/
│   │   ├── app.js           # Bootstrap del hub y vistas globales
│   │   ├── progress.js      # Gestor de localStorage (XP, badges, módulos)
│   │   ├── glossary.js      # Carga terminos.json y tooltips
│   │   ├── content-loader.js  # Renderiza .md como apoyo
│   │   └── modulo-loader.js   # Orquesta el montaje de un módulo
│   │
│   └── img/
│       ├── badges/          # SVG por badge
│       └── diagramas/       # SVG reusables compartidos
│
├── modulos/
│   ├── 00-bienvenida/
│   ├── 01-fundamentos-api/
│   ├── 02-http-rest-json/
│   ├── 03-seguridad-tls-mtls/   ← MVP, módulo de referencia
│   ├── 04-oauth-openid-fapi/
│   ├── 05-arquitectura-open-finance/
│   ├── 06-estandares-regulatorios/
│   └── 07-casos-uso-tecnicos/
│
├── glosario/
│   ├── index.html
│   └── terminos.json
│
└── chatbot/
    └── index.html           # Placeholder Fase 2
```

Cada módulo:

```
modulos/XX-nombre-kebab/
├── index.html         # Página rica del módulo (la experiencia primaria)
├── modulo-data.json   # Configuración declarativa de los componentes
├── contenido.md       # Apoyo lineal + portable + alimento RAG
├── quiz.json          # Banco de preguntas
└── recursos.json      # Videos, papers, lecturas
```

## Cómo añadir un módulo nuevo

1. Copiar `modulos/03-seguridad-tls-mtls/` a `modulos/XX-mi-modulo/`.
2. Actualizar el `data-modulo` en `index.html` y la cabecera de `contenido.md`.
3. Editar `modulo-data.json` con los componentes que vaya a usar el módulo.
4. Redactar `contenido.md` (apoyo textual, alineado pero no clon del HTML).
5. Rellenar `quiz.json` con 5–10 preguntas y sus explicaciones.
6. Rellenar `recursos.json` con videos y lecturas.
7. Diseñar el SVG del badge en `assets/img/badges/<id>.svg`.
8. Añadir nuevos términos al `glosario/terminos.json`.
9. Registrar el módulo en `index.html` raíz (la ruta del hub).

## Identidad visual

Tokens en `assets/css/theme.css`. Paleta Minsait:

- `--morado` `#4F062A` — granate primario
- `--morado-oscuro` `#260717` — granate profundo
- `--accent` `#FF0054` — rosa Minsait
- `--gris` `#E3E2DA` — gris cerámico
- `--gris-claro` `#F5F4EE` — crema claro

Tipografía:

- Titulares: Georgia serif, peso 400 (nunca bold)
- Cuerpo: system stack (`-apple-system, "Segoe UI", Helvetica, Arial`)

## Componentes

La biblioteca está en `assets/components/`. Cada componente expone una API
homogénea:

```javascript
ComponenteX.montar(contenedor, configuracion);
```

- `contenedor`: nodo DOM donde se inyecta el componente.
- `configuracion`: objeto procedente de `modulo-data.json` para ese componente.

Los componentes no leen contenido directamente — el contenido viene en la
configuración. Esto los hace reutilizables entre módulos.

## Persistencia

Toda la persistencia es local en `localStorage` bajo la clave
`obta:state:v1`. El schema está documentado en `00-arquitectura.md` sección 9.

Para resetear: `localStorage.removeItem('obta:state:v1')` en consola.

## Migración futura (Fase 2)

- `contenido.md` por módulo → ingestible directamente por Confluence,
  Docusaurus, Astro o un LMS Moodle/Docebo.
- `quiz.json` → mapeable a SCORM/xAPI.
- `glosario/terminos.json` → fuente directa de chatbot RAG.
- `localStorage` → reemplazable por backend manteniendo schema.
- Componentes JS vanilla → portables a cualquier stack.

Nada de lo que se construye aquí se tira al migrar.
