---
titulo: HTTP, REST y JSON
modulo: 02-http-rest-json
duracion_min: 35
prerrequisitos: [01-fundamentos-api]
tags: [fundamentos, http, rest, json, lenguaje]
badge: domador-del-json
xp_lectura: 35
xp_quiz: 50
---

# HTTP, REST y JSON

> Este documento es la lectura lineal del módulo. La experiencia primaria está
> en `index.html`, donde los conceptos se operan con componentes interactivos.
> Aquí los tienes en prosa para repaso, búsqueda o futuro chatbot RAG.

## Por qué este módulo importa

El módulo 01 te dio la pieza conceptual: una API es un contrato entre dos
sistemas. Ahora toca aprender el **lenguaje** en el que ese contrato se
expresa: HTTP como protocolo de transporte, REST como estilo arquitectónico,
y JSON como formato de los datos.

Cuando tu cliente bancario abre su Swagger y empieza a pasar pantallas
— `POST /accounts/{id}/transactions`, `GET /consents/{id}`,
`DELETE /consents/{id}` — cada línea tiene un verbo, una ruta, parámetros y
un cuerpo JSON. Si no entiendes la estructura, no sigues la conversación;
esperas a que termine.

## 1. Anatomía de una request HTTP

Una petición HTTP siempre tiene la misma estructura:

1. **Método** — GET, POST, PUT, PATCH, DELETE…
2. **URL** — la ruta del endpoint, incluyendo parámetros si los hay.
3. **Headers** — metadatos: quién pregunta, qué formato espera, identificador
   de trazabilidad.
4. **Body** (opcional) — los datos que el cliente manda, típicamente JSON.

Ejemplo:

```http
POST /open-banking/payments/v1/payments HTTP/1.1
Host: api.banco.cl
Authorization: Bearer eyJhbGciOiJQUzI1NiIs...
Content-Type: application/json
Accept: application/json
x-fapi-interaction-id: 7e2a-...-abc

{
  "amount": { "value": "50000", "currency": "CLP" },
  "destination": { "account": "98765" }
}
```

La response también tiene siempre la misma estructura:

1. **Código de estado** — un número de tres cifras que dice si todo fue bien.
2. **Headers** — formato del cuerpo, identificadores de tracing, etc.
3. **Body** (opcional) — los datos que el servidor devuelve, típicamente JSON.

```http
HTTP/1.1 201 Created
Content-Type: application/json
x-fapi-interaction-id: 7e2a-...-abc

{
  "data": {
    "paymentId": "PAY-12345",
    "status": "ACCEPTED"
  }
}
```

### Headers que importan en Open Finance

- **`Authorization`** — el access token (típicamente un Bearer JWT). Prueba
  quién pide. Sin él, 401.
- **`Content-Type`** — el formato del body de la request. Casi siempre
  `application/json`.
- **`Accept`** — el formato que el cliente espera de respuesta. También JSON.
- **`x-fapi-interaction-id`** — un UUID que el cliente genera para esta
  llamada concreta. El banco lo registra en sus logs. Si algo falla,
  pasarle este id al equipo del banco les permite encontrar el error
  exacto.

## 2. Los verbos REST

REST es un **estilo arquitectónico** que se construye sobre cuatro verbos
HTTP principales. Cada uno tiene una semántica específica que en Open
Finance se respeta a rajatabla.

### GET — leer

- Pides información, no modificas nada.
- **Idempotente**: llamar 10 veces produce el mismo resultado que 1.
- Sin body. Los parámetros van en la URL o en query strings.
- El servidor puede cachear la respuesta.

Casos típicos: `GET /accounts/{id}/balance`, `GET /accounts/{id}/transactions`,
`GET /consents/{id}`, `GET /payments/{id}`.

### POST — crear

- Pides al servidor que cree algo nuevo.
- **NO idempotente**: dos POST pueden crear dos recursos.
- Lleva body con los datos del recurso a crear.
- Devuelve normalmente `201 Created` + el recurso creado.

Casos típicos: `POST /consents`, `POST /payments`, `POST /register` (DCR),
`POST /token` (OAuth).

> **Idempotencia en pagos:** como POST no es idempotente por defecto, en
> pagos se usa una cabecera `x-idempotency-key` con un UUID único: si por
> algún error de red el cliente reintenta, el banco detecta que la clave
> ya fue procesada y devuelve la misma respuesta sin crear el pago de
> nuevo.

### PUT — reemplazar

- Sustituyes todo el recurso por la versión que envías.
- **Idempotente**.
- El body lleva el recurso completo.

### PATCH — modificar parcialmente

- Mandas solo los campos que cambian.
- En Open Finance se usa poco — los recursos suelen ser inmutables o se
  reemplazan completos.

### DELETE — eliminar (o revocar)

- Pides al servidor que el recurso deje de existir o quede inactivo.
- **Idempotente**.
- En Open Finance habitualmente no borra de verdad — marca como revocado,
  por trazabilidad.

Casos típicos: `DELETE /consents/{id}`, `DELETE /tokens/{id}`.

## 3. Códigos de estado HTTP

Cada response empieza por un número de tres cifras. La primera te dice todo
lo que necesitas saber:

- **2xx — éxito**.
- **4xx — error del cliente** (la culpa es de quien pide).
- **5xx — error del servidor** (la culpa es de quien responde).

### 2xx Éxito

| Código | Significado | Cuándo |
|--------|------------|--------|
| 200 OK | La operación funcionó. | Respuesta típica de un GET. |
| 201 Created | Recurso creado correctamente. | Típico de un POST que crea. |
| 202 Accepted | Recibido, en proceso. | Pagos asíncronos. Hay que consultar después. |
| 204 No Content | Funcionó pero no devuelvo cuerpo. | Típico de DELETE. |

### 4xx Error del cliente

| Código | Significado | Acción |
|--------|------------|--------|
| 400 Bad Request | Request mal formada. | Revisar el contrato — algo no encaja. |
| 401 Unauthorized | Falta token o el token expiró. | Renovar y reintentar. |
| 403 Forbidden | Hay token pero no tiene permiso para este recurso. | Problema de scopes (módulo 04). |
| 404 Not Found | El recurso no existe. | Revisar URL. |
| 409 Conflict | El estado del recurso impide la operación. | Estado actual del recurso es incompatible. |
| 429 Too Many Requests | Demasiadas llamadas. | Rate limit — esperar y reintentar con backoff. |

### 5xx Error del servidor

| Código | Significado |
|--------|------------|
| 500 Internal Server Error | Algo se rompió en el banco. |
| 502 Bad Gateway | Un sistema intermedio falló. |
| 503 Service Unavailable | El servicio está caído o en mantenimiento. |
| 504 Gateway Timeout | Un upstream tardó demasiado. |

> Con 5xx en pagos, **siempre consultar el estado antes de reintentar** —
> quizás el pago se llegó a procesar. Reintentar a ciegas puede generar
> doble cargo.

## 4. JSON como lenguaje común

JSON (*JavaScript Object Notation*) es el formato en el que viajan los
datos en Open Finance. Es un texto plano con estructura: objetos
delimitados por `{ }`, arrays por `[ ]`, valores como strings, números,
booleanos o null.

Un payload JSON típico de Open Finance:

```json
{
  "data": {
    "balances": [
      {
        "amount": {
          "value": "1234567",
          "currency": "CLP"
        },
        "type": "AVAILABLE",
        "dateTime": "2026-05-10T14:32:00Z"
      }
    ]
  },
  "meta": {
    "totalPages": 1
  }
}
```

### Convenciones que vas a ver siempre

- **Wrapping `data` / `meta`**: la respuesta envuelve los datos en un
  objeto `data` (los datos pedidos) y opcionalmente `meta` (paginación,
  cursor, totales). Es estándar en OBIE y se replicó en Open Finance Chile, Open Finance
  Brasil y otras iniciativas.
- **Importes como string**: `"value": "1234567"` y no `"value": 1234567`.
  Es para evitar pérdida de precisión decimal con floats. Práctica estándar
  en finanzas.
- **Moneda separada**: el monto y la moneda son dos campos distintos.
- **Fechas en ISO 8601**: `"2026-05-10T14:32:00Z"`. Siempre UTC.

## 5. Caso real: leyendo un saldo en el Open Finance chileno

Un PSBI registrado y autorizado con el access token en mano hace:

```http
GET /open-banking/accounts/v1/12345/balances HTTP/1.1
Host: api.banco-x.cl
Authorization: Bearer eyJ...
x-fapi-interaction-id: 7e2a-...-abc
Accept: application/json
```

El banco responde:

```http
HTTP/1.1 200 OK
Content-Type: application/json
x-fapi-interaction-id: 7e2a-...-abc

{
  "data": {
    "balances": [
      {
        "amount": { "value": "1234567", "currency": "CLP" },
        "type": "AVAILABLE",
        "dateTime": "2026-05-10T14:32:00Z"
      }
    ]
  }
}
```

El PSBI no necesita saber cómo el banco calcula el saldo, ni en qué motor
lo guarda, ni si pasa por un mainframe. Solo necesita el contrato.

## 6. Lo que tienes que poder explicar a un cliente

Tres preguntas que vas a oír en cada conversación con un arquitecto bancario.

### «Esta API no es REST de verdad porque no implementa HATEOAS. ¿Importa eso?»

En Open Finance regulado, no. La industria adoptó hace años un *REST
pragmático*: rutas con sustantivos, los cuatro verbos con su semántica
correcta, JSON como formato común, códigos de estado bien usados. HATEOAS
— la idea de que cada respuesta lleve los enlaces a las acciones siguientes
— es elegante en teoría pero no se ha extendido en el sector financiero,
y los reguladores Open Finance no lo exigen. Lo que sí exigen es la otra
parte: rutas predecibles, idempotencia donde toca, códigos de estado
correctos, y un `x-fapi-interaction-id` trazable.

### «Los importes en el JSON vienen como string, no como número. ¿No es un error de diseño?»

Es la práctica estándar en finanzas, no un error. JSON usa números en
formato de doble precisión — un *float* — y los floats pierden precisión
decimal en ciertas operaciones. Para una moneda como 1.234.567,89 esa
pérdida es inaceptable: te pueden faltar centavos al sumar. Mandar el
importe como string preserva la representación exacta, y el consumidor
lo convierte a un tipo numérico de precisión arbitraria (BigDecimal en
Java, Decimal en Python) antes de operar. Es la solución que adoptaron
OBIE, FAPI 2.0 y todos los ecosistemas Open Finance regulados.

### «El header `x-fapi-interaction-id` me parece sobrediseño. ¿Para qué sirve?»

Para resolver incidencias. El cliente genera un UUID por cada llamada y lo
manda en ese header; el banco lo registra en sus logs. Si algo falla — un
timeout, un 5xx, un comportamiento inesperado — el cliente le pasa al
equipo del banco ese identificador y el banco encuentra inmediatament