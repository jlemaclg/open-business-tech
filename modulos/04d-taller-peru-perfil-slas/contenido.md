---
titulo: Taller Perú — Perfil FAPI 2.0 + SLAs · co-creación del ecosistema
modulo: 04d-taller-peru-perfil-slas
nivel: avanzado
tipo: taller
duracion_min: 240
prerrequisitos:
  - 04-oauth-openid-fapi
  - 04b-fapi-perfil-propio
  - 04c-slas-requisitos-operativos
audiencia:
  - Entidades Financieras peruanas (bancos, cajas, financieras)
  - Fintechs / consumidores (PSBI / PSIP)
  - Superintendencia de Banca, Seguros y AFP (SBS)
  - Cámaras y gremios (Asbanc u homólogos)
anchors:
  - Open Finance Brasil (BACEN) — referente operativo y normativo
badge:
  id: co-creador-peru
  nombre: Co-creador del Ecosistema Peruano
---

# Taller Perú · Perfil FAPI 2.0 + SLAs

## Propósito

Perú arranca su construcción de Open Finance con un Directorio confirmado por la SBS pero sin propuesta regulatoria operativa cerrada sobre el perfil técnico ni sobre los SLAs del ecosistema. Este taller presencial está diseñado para que una mesa mixta — Entidades Financieras, fintechs, regulador y cámaras — produzca, en un día, un borrador estructurado de la posición técnica del ecosistema, anclado en la práctica brasileña y con compromisos operativos concretos por parte de las EFs.

## Reglas del juego

- **Las EFs declaran capacidad y esfuerzo**. Solo ellas tienen que cumplir SLAs, así que solo ellas marcan qué pueden sostener y a qué coste.
- **Los consumidores (fintechs / PSBIs / PSIPs) declaran necesidad y prioridad**. No votan capacidad; señalan qué necesitan que la EF sostenga y cuán crítico es para sus casos de uso.
- **El regulador (SBS) propone umbrales**. Marca el nivel exigible que considera razonable; puede dejarlo flexible.
- **Cámaras y otros actores observan y consolidan**. No votan números; registran comentarios cualitativos y median.
- **Anchor Brasil siempre visible**. Cada decisión y cada dimensión arranca con la opción / valor que Open Finance Brasil sostiene hoy. La conversación es "hasta dónde adoptamos Brasil", no "qué hacemos desde cero".
- **Input agregado anónimo**. Las EFs como bloque, no por nombre. Esto baja el coste social de declarar honestamente.

## Estructura del día (240 min)

### Bloque 0 — Setup (10 min)
El facilitador (Minsait) registra composición de la mesa, fecha, título del taller. La sala firma las reglas del juego.

### Bloque 1 — Perfil FAPI 2.0 peruano (90 min)
Doce decisiones técnicas agrupadas en cuatro categorías:

- **Seguridad** (3 decisiones): sender-constraining, algoritmos de firma, vida del access token.
- **Granularidad** (2 decisiones): granularidad del consentimiento, modelo de privilegios.
- **Ciclo de vida** (4 decisiones): Grant Management, rotación de refresh, vigencia máxima, multi-autorización para personas jurídicas.
- **Canales** (2 decisiones): JARM, CIBA.
- **Alcance** (1 decisión): catálogo de APIs en fase 1.

Por cada decisión, la mesa ve la opción que Brasil adoptó, discute, y captura: opción adoptada para Perú, esfuerzo declarado por las EFs (bajo / medio / alto), prioridad declarada por consumidores (crítica / deseable / opcional).

### Bloque 2 — SLAs del ecosistema peruano (90 min)
Ocho dimensiones operativas × tres horizontes (corto 0–6 m, medio 6–18 m, largo 24+ m):

- Disponibilidad
- Tiempo de respuesta
- Límite de tráfico agregado
- Cuotas por cliente
- Timeout
- Procesamiento (paginación + ventana histórica)
- Consentimiento (panel de gestión)
- Monitoreo y reporte

Por cada celda (dimensión × horizonte) la mesa captura: capacidad EF (1–5), esfuerzo EF (bajo/medio/alto), necesidad consumidor (1–5), prioridad consumidor (crítica/deseable/opcional), umbral regulador (1–5). Cada celda muestra como referencia el nivel que Brasil sostiene en ese horizonte.

### Bloque 3 — Cierre y export (30 min)
La mesa exporta dos archivos:

- **Ficha-resumen** (Markdown corto) — para circular entre participantes y publicar como salida del taller.
- **Acta detallada** (Markdown largo) — para archivo del facilitador y de la SBS, con todos los inputs, anchors, banderas levantadas y gaps a resolver.

## Banderas

Una **bandera** se levanta automáticamente cuando una celda tiene: gap positivo (consumidor pide más de lo que EF declara) + esfuerzo EF declarado alto + prioridad consumidor declarada crítica. Las banderas son los puntos donde la mesa no puede cerrar consenso operativo y requieren decisión explícita del regulador: extensión de plazo, escalonamiento por tamaño de EF, subsidio o exigencia directa con cronograma de remediación.

## Output del taller

El cierre produce tres artefactos:

1. **Borrador del perfil FAPI 2.0 peruano** con las 12 decisiones tomadas y la posición de cada actor capturada.
2. **Matriz de capacidad SLA del ecosistema** con los 24 puntos cubiertos (8 dimensiones × 3 horizontes), gaps medidos y banderas levantadas.
3. **Ficha-resumen + acta detallada** descargables, listas para entregar a la SBS como input de su proceso normativo.

## Lo que el taller no es

- **No es un perfil oficial.** El output es un borrador técnico estructurado que la SBS usa como input. La norma final exige redacción legal, consulta pública y aprobación regulatoria.
- **No reemplaza el trabajo del equipo legal.** Capta decisiones técnicas con trade-offs documentados; la traducción normativa es trabajo posterior.
- **No es un curso de formación.** Asume conocimiento previo de FAPI 2.0 y SLAs Open Finance (módulos 04 y 04c son prerrequisitos).

## Referencias

- **Open Finance Brasil** — Manual Operacional, Convenção, Estrutura de Governança. Fuente primaria de los anchors.
- **FAPI 2.0 Security Profile (OpenID Foundation)** — Baseline obligatorio.
- **Grant Management for OAuth 2.0** — Especificación de las seis operaciones del ciclo de vida del grant.
- **SBS Perú** — Comunicaciones institucionales del regulador peruano.
