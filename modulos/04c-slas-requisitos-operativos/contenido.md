---
titulo: SLAs y requisitos operativos en Open Finance
modulo: 04c-slas-requisitos-operativos
nivel: intermedio
tipo: profundizacion
duracion_min: 35
prerrequisitos:
  - 01-fundamentos-api
  - 02-http-rest-json
  - 05-arquitectura-open-finance
ecosistemas_cubiertos:
  - Open Banking UK
  - Open Finance Brasil
  - Sistema de Finanzas Abiertas (SFA) Chile
  - Open Finance Colombia
tags:
  - SLA
  - disponibilidad
  - latencia
  - TPS
  - TPM
  - timeout
  - monitoreo
  - consentimiento
  - validacion-ecosistema
badge:
  id: lector-de-slas
  nombre: Lector de SLAs
fuentes:
  - Open Banking Implementation Entity (OBIE) / Open Banking Limited (UK)
  - Banco Central do Brasil — Manual Operacional do Open Finance
  - CMF Chile — NCG 514 y anexos
  - URF Colombia — Decreto 1297/2022 y estándares técnicos
---

# SLAs y requisitos operativos en ecosistemas Open Finance

## Por qué este módulo importa

Una API que devuelve la información correcta el 80% de las veces no es una API funcional: es una API rota. En Open Finance, donde un PSBI puede llamar a decenas de bancos para construir una vista consolidada del usuario, y donde un PSIP inicia pagos en nombre de un cliente que está esperando una confirmación en segundos, la **calidad de servicio** no es un atributo opcional. Es la condición de existencia del ecosistema.

Los SLAs (Service Level Agreements) son el contrato técnico-operativo que define qué nivel de servicio se compromete a entregar cada participante. No son aspiraciones: son **umbrales medibles, auditables y, en muchos casos, reportables al regulador**.

Este módulo cubre las dimensiones que componen un SLA en Open Finance, y describe cómo las han resuelto los cuatro ecosistemas más relevantes para el equipo: Reino Unido, Brasil, Chile y Colombia. El objetivo es que cuando un consultor entre a una reunión con un banco que está dimensionando su plataforma, sepa qué preguntar y qué referencia comparar.

> **Aclaración inicial.** SLAs regulatorios y SLAs comerciales no son lo mismo. Los primeros los fija el regulador o el operador del ecosistema y son obligatorios. Los segundos los pactan dos participantes entre sí (por ejemplo, un agregador con un banco) y pueden ser más exigentes. Este módulo se concentra en los **SLAs regulatorios y de ecosistema**, que son los que el consultor encuentra en proyectos de implementación.

---

## 1. Las dimensiones operativas de un SLA Open Finance

Antes de comparar ecosistemas, conviene tener claras las dimensiones. Un SLA de Open Finance se construye con ocho variables operativas:

| Dimensión | Qué mide | Unidad típica |
|---|---|---|
| **Disponibilidad** | Porcentaje de tiempo en que la API responde correctamente sobre una ventana de medición (mes / trimestre). | % |
| **Tiempo de respuesta** | Latencia desde que llega el request hasta que sale el response. Suele medirse en percentil 95 o 99. | milisegundos |
| **Límite de tráfico** | Capacidad agregada de la API. Define cuántas transacciones puede absorber la plataforma del proveedor. | TPS / TPM |
| **Límite de operaciones por cliente** | Cuotas individuales por consumidor (PSBI / PSIP). Protege al proveedor de un consumidor abusivo y reparte capacidad. | Operaciones por ventana |
| **Timeout** | Tiempo máximo que el consumidor debe esperar antes de considerar fallida la llamada. | segundos |
| **Procesamiento** | Reglas de paginación, ventana histórica de datos disponibles, modo de entrega (tiempo real, batch). | Páginas, meses |
| **Consentimiento** | Existencia y características del panel de gestión de consentimientos del usuario final. | Cualitativo |
| **Monitoreo y reporte** | Mecanismos de observabilidad operados por el ecosistema y obligaciones de reporte al regulador. | Cualitativo / frecuencia |

Cada ecosistema regula estas dimensiones con distinto grado de detalle y distinta exigencia. La sección 6 las consolida en una tabla.

---

## 2. Reino Unido — Open Banking

Open Banking UK es el ecosistema de referencia mundial, tanto por madurez como por trazabilidad pública de su operación. Está coordinado por Open Banking Limited (entidad sucesora de la Open Banking Implementation Entity), bajo supervisión de la FCA (Financial Conduct Authority) y la CMA (Competition and Markets Authority).

### 2.1 Disponibilidad

El estándar operativo de Open Banking UK fija una **disponibilidad mínima del 99.5%** mensual para las APIs dedicadas (Read/Write API), con algunos bancos implementando objetivos superiores (99.9%) por compromiso comercial.

La disponibilidad se calcula sobre el universo completo de transacciones del mes y se reporta de forma estandarizada. Los bancos están obligados a publicar métricas mensuales de disponibilidad por canal, lo que ha generado una cultura de transparencia operativa que es propia de UK.

### 2.2 Tiempo de respuesta

El objetivo definido es **750 milisegundos** como tiempo máximo de respuesta, con una **tasa de error tolerada del 0.5%**. La medición se hace sobre el conjunto agregado de llamadas a las APIs reguladas.

Cuando el tiempo de respuesta o la tasa de error superan los umbrales, el banco debe reportarlo y aplicar planes de remediación.

### 2.3 Procesamiento

UK acepta hasta **100 páginas dentro del payload** para operaciones de paginación. La ventana histórica disponible es de al menos 24 meses para datos transaccionales, con bancos que ofrecen hasta 7 años por compromiso comercial.

### 2.4 Monitoreo

Open Banking UK implementa monitoreo en **tiempo real, global y por API**, con un dashboard público de salud del ecosistema. Cualquier participante puede consultar el estado operativo agregado del ecosistema y el detalle por proveedor.

---

## 3. Brasil — Open Finance Brasil

Open Finance Brasil es el ecosistema con mayor volumen transaccional de Latinoamérica. Lo coordina el Banco Central do Brasil (BACEN) y está estructurado en fases (datos, pagos, seguros, inversiones).

### 3.1 Disponibilidad

El estándar fija una **disponibilidad mínima del 95%** mensual para la mayoría de las APIs. Existen niveles de criticidad: las APIs core (cuentas, pagos) tienen umbrales más estrictos que las APIs de fases posteriores.

### 3.2 Límite de tráfico

Brasil define explícitamente dos métricas de tráfico:

- **200–500 TPMs** (transacciones por minuto) según la API.
- **300 TPS** (transacciones por segundo) como capacidad agregada.

### 3.3 Límite de operaciones por cliente

Es uno de los modelos más detallados del mundo. Brasil clasifica los clientes consumidores en **tres bandas** según su volumen:

| Banda | Operaciones permitidas |
|---|---|
| **Baja** | 4 operaciones/ventana |
| **Media** | 120 operaciones/ventana |
| **Alta** | 420 operaciones/ventana |

Esto le permite al proveedor proteger capacidad y al regulador detectar patrones anómalos de consumo.

### 3.4 Timeout

El timeout estándar es de **15 segundos**. Pasado ese umbral, el consumidor debe considerar la operación fallida y aplicar lógica de reintento o degradación.

### 3.5 Procesamiento

La paginación admite entre **25 y 100 páginas por tipo de recurso**. Hay reglas específicas por tipo de API (cuentas, transacciones, inversiones) que definen cuántos registros caben por página y cómo se navega la colección.

### 3.6 Monitoreo

Brasil opera monitoreo en **tiempo real, global y por API**, gestionado centralizadamente por el BACEN a través del DICT (Diretório de Identificadores de Contas Transacionais) y los sistemas de fiscalización del ecosistema. Hay obligación de reportes periódicos por parte de los participantes.

---

## 4. Chile — Sistema de Finanzas Abiertas (SFA)

El SFA chileno está en fase de implementación bajo la coordinación de la CMF (Comisión para el Mercado Financiero) y el marco normativo de la Ley 21.521 y la NCG 514. La disponibilidad ya está definida por decreto regulatorio en dos niveles diferenciados — productivo y marcha blanca — que reflejan el reconocimiento regulatorio de la curva de maduración del ecosistema. Otros parámetros operativos están aún en discusión técnica con los grupos de trabajo.

### 4.1 Disponibilidad

El umbral fijado es **99% en operación productiva** y **95% durante marcha blanca**. La distinción es operativamente importante: el 95% aplica durante la fase inicial de operación supervisada del participante en el SFA; el 99% es el umbral exigible una vez declarado producción plena.

### 4.2 Tiempo de respuesta

El objetivo definido es **1500 milisegundos**. Es más amplio que el de UK (750 ms), reflejando un balance entre exigencia operativa y la realidad de los stacks bancarios chilenos durante la fase de implementación.

### 4.3 Límite de tráfico

**300 TPS** como capacidad agregada. Hay discusión técnica abierta sobre el método de medición alternativo (por ejemplo, ventana deslizante vs. picos absolutos).

### 4.4 Timeout

En discusión por los grupos de trabajo.

### 4.5 Procesamiento

El SFA establece tres reglas concretas:

- **Paginación: 100** registros por página.
- **Historial: 12 meses** de ventana de datos transaccionales disponibles.
- **Entrega en tiempo real**, sin diferimiento.

### 4.6 Consentimiento

Define la obligatoriedad de una **plataforma de gestión de consentimiento** por participante, con capacidades de consulta y revocación accesibles al usuario final. Es la pieza que conecta con el módulo de RAR + Grant Management.

### 4.7 Monitoreo

En discusión. El modelo de monitoreo agregado del ecosistema aún se está definiendo dentro de los grupos de trabajo.

---

## 5. Colombia — Open Finance Colombia

El ecosistema colombiano se rige por el Decreto 1297 de 2022. **La URF (Unidad de Proyección Normativa y Estudios de Regulación Financiera) no ha emitido todavía SLAs oficiales sobre ninguna de las ocho dimensiones operativas.** Lo único que existe hoy son acuerdos informales de industria que operan entre participantes. La única obligación regulatoria operativa clara es la plataforma de gestión de consentimientos.

### 5.1 Disponibilidad

Sin SLA oficial. La industria opera bajo un **acuerdo informal con umbral mayor al 90%**.

### 5.2 Procesamiento

Sin SLA oficial. Existe un **acuerdo informal de industria** que establece una ventana de procesamiento entre 3 y 6 meses, según el caso.

### 5.3 Consentimiento

Está definida la obligatoriedad de una **plataforma de gestión de consentimientos** por el Decreto 1297. Es la única dimensión operativa con marco regulatorio explícito en Colombia.

### 5.4 Resto de dimensiones

Las dimensiones de tiempo de respuesta, límite de tráfico, límite de operaciones, timeout y monitoreo se encuentran **sin SLA oficial por parte de la URF**. Cada participante opera bajo políticas internas o acuerdos bilaterales. Los acuerdos informales de industria no son anecdóticos: en disputas, se citan como práctica esperada del ecosistema.

---

## 6. Tabla comparativa consolidada

| Dimensión | UK | Brasil | Chile | Colombia |
|---|---|---|---|---|
| **Disponibilidad** | 99.5% | 95% | 99% productivo / 95% marcha blanca | Sin SLA oficial · industria >90% |
| **Tiempo de respuesta** | 750 ms / tasa error 0.5% | — | 1500 ms | Sin SLA oficial |
| **Límite de tráfico** | — | 200–500 TPMs / 300 TPS | 300 TPS (en discusión método alternativo) | Sin SLA oficial |
| **Límite de operaciones por cliente** | — | Baja: 4 / Media: 120 / Alta: 420 | — | Sin SLA oficial |
| **Timeout** | — | 15 segundos | En discusión | Sin SLA oficial |
| **Procesamiento** | Hasta 100 páginas dentro del payload | 25–100 páginas por tipo de recurso | Paginación: 100 / Historial: 12 meses / Tiempo real | Sin SLA oficial · industria 3–6 meses |
| **Consentimiento** | — | — | Plataforma de gestión de consentimiento | Plataforma de gestión de consentimientos (Decreto 1297) |
| **Monitoreo** | Tiempo real global y por API | Tiempo real global y por API | En discusión | Sin SLA oficial |

> Los campos en blanco (—) indican dimensiones que el regulador no define explícitamente en su marco normativo público o que están integradas dentro de otra categoría. No equivalen a "sin definición": en UK y Brasil muchas de estas reglas se rigen por estándares técnicos detallados que no encajan exactamente en la columna correspondiente.

---

## 7. Validación con el ecosistema — tres horizontes

Esta sección es la herramienta operativa del módulo. Cuando un banco está dimensionando su plataforma o cuando el ecosistema necesita acordar un nivel base, la conversación útil no es "qué SLA queremos" sino **qué SLA podemos sostener hoy, en 12 meses y en 24+ meses**.

### 7.1 Corto plazo (0–6 meses)

Lo alcanzable de salida cuando la infraestructura está recién desplegada y los equipos formándose:

- Disponibilidad: **95% mensual** (rango Brasil / Chile).
- Tiempo de respuesta: **1500–2000 ms**.
- Capacidad agregada: **50–100 TPS** iniciales.
- Ventana histórica: **6–12 meses**.
- Monitoreo: operativo interno, reporte mensual al regulador.

Preguntas para abrir mesa: ¿qué disponibilidad real ha sostenido la plataforma core en los últimos 90 días? ¿Cuál es el percentil 95 actual de latencia en las APIs candidatas? ¿Cuántos TPS soporta hoy la capa de exposición sin escalado? ¿Tenéis dashboard operativo en producción o lo estáis montando? ¿Quién en el banco firma los compromisos del SLA — TI o producto?

### 7.2 Medio plazo (6–18 meses)

El nivel que el ecosistema espera de un participante consolidado, tras la curva de aprendizaje:

- Disponibilidad: **99% mensual** en APIs core.
- Tiempo de respuesta: **1000 ms p95**.
- Capacidad agregada: **200–300 TPS** sostenidos.
- Cuotas por cliente: bandas implementadas (modelo Brasil adaptado).
- Timeout: **15 segundos** estandarizado.
- Ventana histórica: **12–24 meses**.
- Monitoreo: tiempo real por API, reportes automatizados.

Preguntas para abrir mesa: ¿habéis identificado las APIs core que necesitan SLA más estricto? ¿Qué inversión en infraestructura está prevista a 12 meses? ¿El modelo de cuotas por cliente está diseñado o se decide ad-hoc? ¿Quién operará el dashboard de monitoreo — banco, ecosistema o proveedor externo? ¿Tenéis política de versionamiento y soporte N1/N2/N3 documentada?

### 7.3 Largo plazo (24+ meses)

El ecosistema en fase de explotación plena, alineado con la referencia UK:

- Disponibilidad: **99.5%+ mensual**.
- Tiempo de respuesta: **750 ms p95**, tasa error <0.5%.
- Capacidad agregada: **500+ TPS** con escalado elástico.
- Cuotas por cliente: bandas refinadas con detección de anomalías.
- Ventana histórica: **24+ meses** (hasta 7 años en algunos sub-recursos).
- Monitoreo: dashboard público de salud del ecosistema.
- Soporte: N1/N2/N3 con SLA propio por nivel.

Preguntas para abrir mesa: ¿la plataforma soporta escalado elástico real o depende de capacidad fija? ¿Hay capacidad de auditoría externa de SLA además de auto-reporte? ¿El ecosistema dispone de dashboard público o sigue siendo opaco al usuario final? ¿Cómo se trata el incumplimiento — sanción, remediación, salida del ecosistema? ¿La política de versionamiento garantiza un periodo de gracia de al menos 6–12 meses?

---

## 8. Procesos operativos asociados a los SLAs

Un SLA no es solo un número en una tabla. Para que se sostenga en producción, requiere un conjunto de procesos operativos que rodean a la API. La normativa de los cuatro ecosistemas referencia, con distinto grado de detalle, los siguientes cuatro procesos.

### 8.1 Versionamiento de las APIs

A medida que el ecosistema evoluciona y se incorporan nuevos casos de uso, las APIs cambian. El versionamiento permite que esos cambios convivan sin romper integraciones existentes.

Hay dos niveles de versionamiento:

- **Versión de API completa** (ej. `v1` → `v2`). Cambia cuando hay rupturas estructurales mayores.
- **Versión de recurso** dentro de la API. Cambia cuando un sub-recurso evoluciona sin afectar al resto.

El estándar internacional es versionar en la ruta del endpoint (`/accounts/v1/...`) y mantener versiones previas operativas durante un período de gracia (típicamente entre 6 y 12 meses) tras publicar una nueva.

### 8.2 Soporte

Un ecosistema de Open Finance es, en la práctica, una infraestructura compartida entre decenas de participantes. Cuando algo falla en producción, el proceso de resolución no puede depender de canales informales.

Los modelos de soporte se estructuran en **niveles** (N1, N2, N3):

| Nivel | Qué resuelve |
|---|---|
| **N1** | Primer contacto. Dudas comunes, errores conocidos, validación de credenciales y conectividad. |
| **N2** | Análisis técnico. Errores no documentados, comportamiento anómalo, revisión de logs. |
| **N3** | Resolución profunda. Bugs de plataforma, escalamiento a equipo de producto, intervención de infraestructura. |

Adicionalmente, se establecen **service desks** o espacios formales para que el ecosistema levante incidencias y consultas, alimentando el ciclo de mejora de los estándares técnicos.

### 8.3 Monitoreo

El monitoreo cumple dos funciones distintas que conviene separar:

- **Monitoreo operativo**: detectar caídas, latencias anómalas, errores 5xx, problemas de disponibilidad. Es responsabilidad del participante (sobre su propia infraestructura) y del operador del ecosistema (a nivel agregado).
- **Monitoreo regulatorio**: medir el cumplimiento de SLAs y generar evidencia auditable para el regulador. En UK y Brasil esto se hace en tiempo real con dashboards públicos o semipúblicos. En Chile y Colombia los modelos aún están en consolidación.

### 8.4 Especificaciones de integración

El último proceso operativo es la **entrega de documentación al ecosistema**. Un PSBI o PSIP que quiere integrarse necesita:

- Especificaciones técnicas de las APIs (OpenAPI / Swagger).
- Guías de usuario y onboarding.
- Roadmap de implementación.
- Guías de buenas prácticas (incluyendo prevención de fraude).

Esta documentación se centraliza típicamente en un **developer portal** operado por el ecosistema (UK, Brasil) o por cada participante (Chile en fase actual, Colombia).

---

## 9. Errores conceptuales frecuentes

Esta sección recoge confusiones que aparecen recurrentemente en conversaciones con clientes durante proyectos de implementación.

| Confusión | Realidad |
|---|---|
| "Disponibilidad del 99% es solo 1% peor que 99.9%." | No. El 99% mensual permite ~7.2 horas de caída; el 99.9% permite ~43 minutos. La diferencia operativa es de un orden de magnitud. |
| "TPS y TPM son lo mismo, solo que en otra unidad." | No exactamente. TPS mide picos instantáneos (segundo a segundo); TPM mide promedios sobre un minuto. Una plataforma puede cumplir TPM y aún así colapsar en picos cortos. |
| "El timeout debe estar lo más alto posible para no fallar." | No. Un timeout alto bloquea recursos del consumidor en operaciones que ya no van a responder. El timeout es un umbral de **decisión de fallo**, no de tolerancia infinita. |
| "Si la API responde 200 OK, está cumpliendo SLA." | No necesariamente. El SLA cubre disponibilidad **y** latencia. Un 200 OK que tarda 4 segundos puede estar incumpliendo el SLA aunque sea técnicamente exitoso. |
| "El monitoreo de SLA lo hace el regulador." | Parcialmente. El regulador audita; el monitoreo operativo es responsabilidad de cada participante. |
| "Los SLAs los fija el banco proveedor." | No en ecosistemas regulados. El banco puede ofrecer SLAs comerciales más estrictos, pero los SLAs base los fija el regulador o el operador del ecosistema. |
| "Si Colombia no tiene SLAs definidos, no hay obligaciones operativas." | No. Los acuerdos informales de industria operan como referencia y, en disputas, se citan como práctica esperada. |

---

## 10. Glosario rápido

- **API Manager** — Plataforma de gestión del ciclo de vida de las APIs (publicación, versionamiento, control de tráfico, autenticación).
- **Banda de criticidad** — Clasificación de un cliente consumidor según su volumen de operaciones permitido. En Brasil: baja, media, alta.
- **Developer Portal** — Sitio público o semipúblico donde el ecosistema o el participante publica especificaciones, guías y herramientas para que los consumidores se integren.
- **DICT** — Diretório de Identificadores de Contas Transacionais. Componente del Open Finance Brasil.
- **Disponibilidad** — Porcentaje de tiempo en que la API responde correctamente sobre una ventana de medición.
- **FCA** — Financial Conduct Authority. Regulador financiero del Reino Unido.
- **N1 / N2 / N3** — Niveles de soporte técnico, escalando en profundidad de análisis.
- **OBIE / OBL** — Open Banking Implementation Entity / Open Banking Limited. Operador del ecosistema de Open Banking UK.
- **Paginación** — Mecanismo de partición de respuestas largas en páginas sucesivas para evitar payloads inmanejables.
- **Service Desk** — Canal formal para que el ecosistema reciba consultas, incidencias y solicitudes de los participantes.
- **SLA (Service Level Agreement)** — Contrato técnico-operativo que define umbrales medibles de calidad de servicio.
- **Timeout** — Tiempo máximo que el consumidor espera antes de considerar fallida una operación.
- **TPS (Transactions Per Second)** — Capacidad medida en picos instantáneos por segundo.
- **TPM (Transactions Per Minute)** — Capacidad medida como promedio por minuto.
- **Ventana histórica** — Rango de tiempo hacia atrás durante el cual los datos transaccionales están disponibles para consulta vía API.
- **Versionamiento** — Política de gestión de cambios de la API que permite que distintas versiones coexistan durante un período de gracia.

---

## 11. Para profundizar

- **Open Banking UK** — Customer Experience Guidelines, Performance Metrics, Operational Guidelines (Open Banking Limited).
- **Open Finance Brasil** — Manual Operacional do Open Finance, Manual de Experiência do Usuário, Convenção do Open Finance (Estrutura de Governança).
- **CMF Chile** — NCG 514 y anexos técnicos del Sistema de Finanzas Abiertas; documentos de trabajo de los Grupos de Trabajo v4.5.
- **URF Colombia** — Decreto 1297/2022 y estándares técnicos emitidos por la Unidad de Proyección Normativa.
