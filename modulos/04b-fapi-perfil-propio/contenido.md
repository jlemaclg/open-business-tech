---
titulo: Construyendo un perfil FAPI 2.0 propio
modulo: 04b-fapi-perfil-propio
tipo: profundizacion
duracion_min: 60
prerrequisitos: [04-oauth-openid-fapi]
tags: [fapi, perfil, regulacion, taller, par, rar, grant-management]
badge: disenador-perfil-fapi
xp_lectura: 30
xp_quiz: 30
fuentes:
  - FAPI 2.0 Security Profile (OpenID Foundation)
  - RFC 9126 (PAR)
  - RFC 9396 (RAR)
  - RFC 8705 (mTLS sender-constrained tokens)
  - RFC 9449 (DPoP)
  - Grant Management for OAuth 2.0 (OpenID Foundation)
---

# Construyendo un perfil FAPI 2.0 propio para tu jurisdicción

## Por qué este módulo existe

FAPI 2.0 es un estándar mantenido por OpenID Foundation, ampliamente adoptado, certificado y con perfiles certificadores públicos. Pero **no es un documento prescriptivo cerrado**: define un Baseline obligatorio y deja un conjunto de extensiones y parámetros operativos a la discreción de quien lo adopta.

Una jurisdicción que decide implementar Open Finance no parte de cero — adopta el Baseline — pero sí debe completar el conjunto de decisiones que el estándar deja abiertas. Este módulo presenta esas decisiones de forma estructurada, sin proponer una respuesta correcta. El producto final es un **borrador de perfil** que el regulador o el banco puede usar como punto de partida para su documentación normativa o técnica.

El uso primario previsto es un **taller facilitado** con un equipo regulatorio o un equipo de implementación bancario. Cada decisión se discute, se vota, y el constructor recoge el resultado en una ficha exportable a Markdown.

## Lo que FAPI 2.0 fija (no negociable)

El núcleo Baseline de FAPI 2.0 establece:

- **mTLS o DPoP** para autenticación del cliente y para sender-constraining de los access tokens.
- **PAR** (RFC 9126) obligatorio antes de redirigir el navegador del usuario.
- **PKCE con method=S256** en todos los flujos, incluso server-to-server.
- **Sender-constrained access tokens** vía mTLS (cnf.x5t#S256) o DPoP (cnf.jkt).
- **Algoritmos asimétricos** (PS256 o ES256). Prohibido HS256 y none.
- **Authorization Code Flow** como flujo principal.
- **OpenID Connect** como capa de identidad cuando hay usuario humano.

Sobre eso se construyen las decisiones que sí dependen de la jurisdicción.

## Las 12 decisiones agrupadas en cinco categorías

### Seguridad y tiempos

1. **Sender-constraining** — mTLS-bound only / DPoP only / ambos permitidos.
2. **Algoritmos de firma** — PS256 / ES256 / ambos.
3. **Vida del access token** — 5 min / 15 min / 60 min.

### Granularidad del consentimiento

4. **Modelo de granularidad** — scope clásico / RAR genérico (RFC 9396 puro) / RAR estructurado con esquema propio.
5. **Modelo de privilegios** — sin niveles / jerárquico level1-2-3 / por dominio (atómico).

### Ciclo de vida del consentimiento

6. **Grant Management** — sin Grant Management / mínimo Create+Revoke / completo (las seis operaciones).
7. **Rotación de refresh token** — sin rotación / con rotación obligatoria.
8. **Vigencia máxima** — 90 días / 12 meses / 36 meses / configurable por tipo.
9. **Multi-autorización para personas jurídicas** — no / sincrónica / asíncrona.

### Canales

10. **JARM** — Baseline (no) / Advanced (sí).
11. **CIBA** — deshabilitado / habilitado para canales sin navegador.

### Alcance funcional

12. **Catálogo de APIs fase 1** — solo Cuentas / + Pagos / + Productos / Stack completo.

Cada decisión se discute en el constructor del módulo. Allí están las opciones, su descripción técnica y sus implicaciones operativas.

## Cómo se usa en autoformación

El consultor recorre las decisiones en cualquier orden. Toma una elección por decisión. Si más adelante quiere modificar, vuelve a la decisión y reelige. Al final, la ficha resumen recoge el conjunto de elecciones y puede exportarse como Markdown.

## Cómo se usa en taller facilitado

Recomendación de formato (90 minutos):

1. **Apertura — 10 min.** Explicar el ejercicio. Confirmar que el grupo entiende que FAPI 2.0 Baseline es punto de partida no negociable. Activar el modo "Vista taller" para proyectar.

2. **Decisiones de seguridad y tiempos — 15 min.** Discusión rápida. Decisiones 1, 2 y 3 suelen tener una opción claramente preferida según la madurez del ecosistema técnico.

3. **Decisiones de granularidad — 25 min.** Discusión más densa. Decisiones 4, 5 son estructurales — condicionan toda la implementación. Conviene votar y dar espacio a justificar.

4. **Decisiones de ciclo de vida — 20 min.** Decisiones 6 a 9. Aquí entra la conversación legal-técnica más interesante: vigencias máximas, multi-autorización, gestión del consentimiento.

5. **Decisiones de canales y alcance — 15 min.** Decisiones 10 a 12. Más rápidas porque dependen mucho del cronograma político/regulatorio de la jurisdicción.

6. **Cierre — 5 min.** Revisar la ficha resumen, exportar a Markdown, asignar quién la lleva al siguiente paso (equipo legal, equipo técnico, consulta interna).

## Coherencia entre decisiones

La ficha resumen no bloquea combinaciones técnicamente posibles. Pero antes de exportar conviene revisar puntos de coherencia:

- **Vigencia larga (36 meses) sin Grant Management completo.** El usuario queda sin manera fluida de modificar el consentimiento.
- **DPoP only sin clientes públicos previstos.** Se está adoptando complejidad sin aprovechar el beneficio.
- **RAR estructurado sin privilegios jerárquicos ni por dominio.** Falta la dimensión de profundidad que justifica el coste de RAR.
- **CIBA habilitado sin definir el dispositivo de autenticación.** Requiere infraestructura de notificación que el perfil debe especificar aparte.
- **Catálogo "Stack completo" en fase 1 con vigencias largas.** Sobrecoste de implementación inicial para los bancos.

Ninguna de estas combinaciones es prohibida. Pero en taller conviene marcarlas explícitamente como decisiones meditadas, no accidentales.

## Diferencia entre decisión estructural y decisión operativa

Para el equipo legal-técnico que recibe la ficha resulta útil clasificar:

**Decisiones estructurales** (cambiarlas más adelante exige migración costosa):
- 1 — sender-constraining
- 4 — modelo de granularidad
- 5 — modelo de privilegios
- 6 — alcance de Grant Management

**Decisiones operativas** (admiten ajuste por parámetro):
- 2 — algoritmos de firma (puede ampliarse)
- 3 — vida del access token
- 7 — rotación de refresh
- 8 — vigencia máxima

**Decisiones de roadmap** (definen el cronograma):
- 9 — multi-autorización (puede entrar en fase 2)
- 10 — JARM (puede entrar en fase 2)
- 11 — CIBA (típicamente fase 2-3)
- 12 — catálogo de APIs (define el plan por fases)

## Lo que esta ficha no es

Un perfil oficial. La ficha generada por este módulo es un **borrador técnico de trabajo**. La documentación normativa final exige:

- Redacción legal alineada con la ley marco (cuando existe).
- Consulta pública o sectorial según el procedimiento del regulador.
- Aprobación del organismo regulador competente.
- Anexos técnicos detallados (esquemas RAR específicos, contratos OpenAPI por recurso, JWKS y endpoints del Directorio, etc.).

El valor del ejercicio es que el equipo legal-técnico recibe del equipo técnico un punto de partida estructurado, con decisiones explícitas y trade-offs documentados, en lugar de empezar desde una hoja en blanco.

## Próximos pasos

Una vez exportada la ficha, los pasos típicos son:

1. **Revisión legal** — alineamiento con la ley marco y consultas a otros marcos regulatorios (protección de datos, secreto bancario, etc.).
2. **Validación técnica** — revisión por arquitectos del lado banco y del lado TPP.
3. **Consulta pública** — según el procedimiento del regulador.
4. **Iteración** — incorporar comentarios y rehacer la ficha con las decisiones revisadas.
5. **Publicación normativa** — Norma de Carácter General, Anexo Técnico, FAD o equivalente según la jurisdicción.
6. **Implementación piloto** — sandbox con un grupo reducido de actores antes del go-live regulatorio.

## Glosario rápido del módulo

- **FAPI 2.0 Baseline** — núcleo obligatorio de FAPI 2.0. No negociable.
- **FAPI 2.0 Advanced** — extensiones opcionales sobre Baseline (JARM, request objects firmados adicionales).
- **JARM** — JWT Secured Authorization Response Mode. Respuesta del AS firmada en JWT.
- **CIBA** — Client Initiated Backchannel Authentication. Autenticación sin navegador.
- **DPoP** — Demonstrating Proof of Possession. Sender-constraining sin certificado X.509.
- **Refresh token rotation** — emitir nuevo refresh_token con cada canje, invalidando el anterior.
- **Vigencia configurable por tipo** — topes distintos según el tipo de recurso (datos vs pagos vs reservas).
