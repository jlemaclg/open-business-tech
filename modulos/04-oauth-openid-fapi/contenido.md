---
titulo: OAuth 2.0, OpenID Connect y FAPI 2.0 — la llave temporal que sostiene Open Finance
modulo: 04-oauth-openid-fapi
duracion_min: 55
prerrequisitos: [01-fundamentos-api, 02-http-rest-json, 03-seguridad-tls-mtls]
tags: [autorizacion, oauth, openid, fapi, jwt, par, rar, grant-management, sender-constrained]
badge: maestro-del-token
xp_lectura: 30
xp_quiz: 50
xp_quiz_perfecto: 20
fuentes:
  - Knowledge Base/04-arquitectura-seguridad.md
  - Knowledge Base/10-RAR-Grant_Management.md
  - RFC 6749 (OAuth 2.0)
  - RFC 7519 (JWT)
  - RFC 7636 (PKCE)
  - RFC 8705 (mTLS sender-constrained tokens)
  - RFC 9126 (PAR)
  - RFC 9396 (RAR)
  - RFC 9449 (DPoP)
  - FAPI 2.0 Security Profile (OpenID Foundation)
  - Grant Management for OAuth 2.0 (OpenID Foundation)
  - NCG 514 Anexo 3 (CMF Chile)
  - FAD RAR & Grant Management v1.0.0 (CMF Chile)
---

# OAuth 2.0, OpenID Connect y FAPI 2.0 — la llave temporal que sostiene Open Finance

## Por qué este módulo importa para tu día a día

Cuando un cliente pregunta *"¿cómo accede una fintech a las cuentas de mi usuario sin tener su contraseña?"*, la respuesta corta es OAuth 2.0. Pero esa respuesta no cierra una conversación técnica. En cuanto el cliente entra en detalle aparecen OIDC, JWT, PKCE, PAR, RAR, Grant Management y tokens sender-constrained. Si solo conoces el flujo OAuth genérico, dejas un hueco grande.

El núcleo de este módulo es entender que **FAPI 2.0 no es "OAuth con esteroides"**: es un perfil endurecido que cierra ataques que en banca pueden costar millones, y un modelo de consentimiento granular y gestionable que reemplaza al scope clásico — porque "autorizo accounts" en banca no significa nada útil.

## Lo que vas a saber al final

- Los cuatro actores OAuth y cómo se traducen al SFA chileno (Resource Owner, Client, Authorization Server, Resource Server).
- Authorization Code Flow paso a paso, PKCE y por qué FAPI 2.0 lo hace obligatorio.
- Qué es un JWT por dentro: claims registrados, claims FAPI, qué significa cada uno.
- Qué añade OpenID Connect sobre OAuth (id_token, UserInfo, nonce, acr/amr).
- Qué endurece FAPI 2.0: mTLS, PAR, sender-constrained tokens, PS256/ES256.
- Cómo funciona RAR (RFC 9396) y por qué `authorization_details` reemplaza al scope para la granularidad.
- El modelo de privilegios jerárquicos level1/level2/level3 y la regla acumulativa.
- Las seis operaciones de Grant Management (Create / Update / Replace / Merge / Query / Revoke).
- El flujo completo del FAD chileno integrando todo lo anterior en 11 pasos.
- Estado del perfil en Chile (FAPI 2.0 + RAR + GM), Brasil (FAPI 1.0 Advanced → roadmap 2.0), Perú (perfil propio SBS) y México (Open Data primero).

## 1. Los cuatro actores

OAuth 2.0 modeliza la interacción entre cuatro roles. Aprenderlos sin confusión es el prerrequisito de todo lo que viene.

- **Resource Owner.** El usuario final, dueño de los datos. En el SFA es la persona natural o jurídica que se autentica en su banco para autorizar a una fintech. Nunca comparte sus credenciales con el cliente.
- **Client.** La aplicación que quiere acceder a los datos. En el SFA chileno es un PSBI (información) o PSIP (iniciación de pagos). Para ser cliente válido tiene que registrarse vía DCR contra el Directorio CMF y tener su SSA firmado.
- **Authorization Server (AS).** Servidor que autentica al usuario, gestiona el consentimiento, emite los tokens y permite revocarlos. En el SFA lo opera el banco proveedor (IPI / IPC).
- **Resource Server (RS).** Servidor que aloja las APIs reguladas (cuentas, pagos, créditos, etc.). Verifica el token en cada llamada y, en FAPI 2.0, valida también que el certificado mTLS coincida con el del token.

En la práctica, el AS y el RS suelen estar operados por la misma entidad (el banco proveedor) pero son piezas distintas con responsabilidades distintas.

## 2. Authorization Code Flow

Es el flujo base de OAuth para casos donde el usuario está delante de un navegador. Tiene seis pasos:

1. **Authorization Request.** El cliente redirige al navegador del usuario al endpoint `/authorize` del AS, indicando `client_id`, `redirect_uri`, `scope` y `response_type=code`.
2. **Autenticación + consentimiento.** El AS toma el control de la pantalla. Autentica al usuario (con SCA cuando aplica) y le muestra exactamente qué se está pidiendo. El usuario aprueba o rechaza.
3. **Callback con code.** Si aprueba, el AS redirige al `redirect_uri` del cliente con un `code` temporal (single-use, ~30–60 s) en la query string.
4. **Token Request.** El cliente — ya por el canal trasero, no por el navegador — hace `POST /token` al AS con el `code` y su autenticación de cliente. En FAPI 2.0 esa autenticación es mTLS.
5. **Tokens.** El AS responde con `access_token`, `refresh_token` y, si el scope incluyó `openid`, también `id_token`.
6. **Consumo de la API.** El cliente llama a las APIs protegidas presentando el `access_token` en la cabecera `Authorization: Bearer`. El RS lo valida.

Punto fino: el `code` no es el token. Es un ticket de canje. Eso permite, entre otras cosas, que el cliente se autentique en el canje (cosa que no podría hacer si los tokens viajaran directamente por el navegador).

## 3. PKCE — Proof Key for Code Exchange

PKCE (RFC 7636) cierra el ataque donde una app maliciosa en el mismo dispositivo intercepta el callback y captura el `code` antes que el cliente legítimo. La idea:

1. El cliente, antes de iniciar el flujo, genera un secreto aleatorio: el `code_verifier`.
2. Calcula su hash SHA-256 codificado en base64url: el `code_challenge`.
3. Envía el `code_challenge` (no el verifier) en `/authorize`.
4. Al canjear el `code`, envía el `code_verifier` original.
5. El AS recomputa hash(verifier) y compara con el challenge guardado. Si coinciden, sigue. Si no, rechaza.

El atacante que solo intercepta el `code` no tiene el `code_verifier`, no puede canjear. PKCE nació para apps móviles pero **FAPI 2.0 lo exige en todos los flujos** (incluso server-to-server) porque el coste de adoptarlo es trivial y cierra una clase entera de ataques.

FAPI 2.0 además exige `code_challenge_method=S256`. Nunca `plain`.

## 4. JWT — qué es un token por dentro

Un JWT (JSON Web Token, RFC 7519) tiene tres partes separadas por punto:

```
eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9 . eyJpc3MiOi...payload... . firma
```

Cada parte es base64url:
- **Header**: JSON con `alg` (algoritmo de firma), `typ` (siempre "JWT"), `kid` (qué clave usar para verificar).
- **Payload**: JSON con los claims (afirmaciones).
- **Signature**: firma del header + payload con la clave privada del emisor.

### Claims registrados (RFC 7519)

| Claim | Significado |
|---|---|
| `iss` | Issuer — quién emite el token. |
| `sub` | Subject — sujeto del token (ID estable del usuario). |
| `aud` | Audience — a quién va dirigido (la API que debe aceptarlo). |
| `exp` | Expiration — timestamp Unix de caducidad. |
| `nbf` | Not Before — desde cuándo es válido. |
| `iat` | Issued At — cuándo se emitió. |
| `jti` | JWT ID — identificador único (anti-replay). |

### Claims FAPI / SFA críticos

- `scope` — en el SFA siempre incluye `openid`. La granularidad fina va en `authorization_details`.
- `client_id` — el PSBI o PSIP al que se emitió.
- `cnf` — *Confirmation*. En sender-constrained vía mTLS contiene `x5t#S256`: el hash SHA-256 del certificado de cliente. Si en la llamada API el certificado presentado no coincide, el token se rechaza.
- `grant_id` — UUID del grant gestionable vía Grant Management API.

### Firma

La firma es el resultado de aplicar la clave privada del emisor sobre `base64url(header) + "." + base64url(payload)`. El receptor la valida con la clave pública publicada en el JWKS del AS. Si la firma no cuadra, el token entero se descarta.

**FAPI 2.0 exige PS256 o ES256.** Nunca HS256 (clave compartida, no escala) ni `none` (sin firma, vulnerabilidad histórica).

## 5. OpenID Connect — la capa de identidad

OAuth resuelve **autorización**: te da una llave. OpenID Connect (OIDC) añade **identidad**: te dice también a quién pertenece la llave.

OIDC es una capa sobre OAuth. Cuando el cliente solicita el scope `openid`, el AS emite además del `access_token` un `id_token`:

- El `access_token` es para presentar ante las APIs (Resource Server). Su contenido puede ser opaco al cliente.
- El `id_token` es para que el cliente sepa a quién autenticó el AS. Su contenido sí es para el cliente. No se presenta ante las APIs.

Claims típicos del `id_token`:
- `sub` — ID estable del usuario.
- `name`, `email`, `email_verified`.
- `auth_time` — cuándo autenticó realmente el usuario.
- `acr` — Authentication Context Class Reference: nivel/método de autenticación (p.ej. SCA fuerte).
- `amr` — Authentication Methods References: array con los métodos usados (pwd, otp, mfa, fido…).
- `nonce` — replicado del que envió el cliente para detectar replay del id_token.

OIDC define además el endpoint `/userinfo`: el cliente puede llamarlo con el access_token como Bearer para obtener claims actualizados (útil cuando el usuario edita su perfil sin necesidad de re-emitir el id_token).

## 6. FAPI 2.0 — el endurecimiento financiero

OAuth y OIDC son extensibles a propósito: cada implementación decide qué algoritmos firmar, si exigir PKCE, cómo se autentica el cliente. Esa flexibilidad funciona para apps de productividad. No funciona para banca: hay dinero real, hay obligación de no repudio y hay reguladores que necesitan probar conformidad.

FAPI 2.0 (Financial-grade API Security Profile 2.0, de OpenID Foundation) cierra los grados de libertad con cuatro decisiones operativas:

1. **mTLS** para autenticar al cliente — el certificado lo emite la CA del Directorio del ecosistema.
2. **PAR** (RFC 9126) para enviar la solicitud de autorización por canal seguro antes de redirigir.
3. **PKCE con `method=S256`** obligatorio en todos los flujos.
4. **Sender-constrained tokens** atados al certificado mTLS (RFC 8705) o vía DPoP (RFC 9449).

El SFA chileno suma además **RAR** (RFC 9396) y **Grant Management** (OpenID Foundation) para la granularidad y el ciclo de vida del consentimiento.

## 7. PAR — el push antes de redirigir

En OAuth clásico los parámetros de `/authorize` viajan en la URL del navegador del usuario: pasan por historial, logs de proxies, extensiones, referrers. En banca eso es inadmisible cuando el payload sensible (montos, IBANs, identificadores de cuenta) viaja en esa URL.

**PAR** empuja la solicitud antes por un canal mTLS al endpoint `/par` del AS. Tres pasos:

1. Cliente → AS: `POST /par` con `client_id`, `redirect_uri`, `scope`, `code_challenge`, `authorization_details` (todo lo sensible).
2. AS → Cliente: `201 Created` con un `request_uri` URN de vida 90 segundos.
3. Cliente redirige el navegador a `/authorize?client_id=...&request_uri=urn:...:abc`. La URL ya no lleva nada sensible. El AS lee la solicitud completa de su memoria interna.

PAR es obligatorio en FAPI 2.0 y en el FAD chileno.

## 8. RAR — del scope al authorization_details

El scope clásico (`accounts payments`) es una etiqueta plana. No dice sobre qué cuenta, no discrimina leer saldo de leer transacciones, no tiene noción de vigencia.

**RAR** (Rich Authorization Requests, RFC 9396) reemplaza el scope por un objeto JSON expresivo: `authorization_details`. Es un array; cada objeto describe un permiso completo.

### Campos del objeto

| Campo | Obligatoriedad | Significado |
|---|---|---|
| `type` | Sí | API solicitada: Accounts, SinglePayments, Loans, Investments, Insurances, CreditCardAccounts, etc. |
| `actions` | Sí | Operaciones autorizadas (p.ej. `ReadAccounts`, `ReadAccountsTransactions`, `CreateSinglePayments`). |
| `identifier` | Sí | ID del recurso concreto (cuenta, póliza, crédito, inversión). |
| `privileges` | Sí | Niveles jerárquicos de profundidad (`level1`, `level2`, `level3`). Acumulativos. |
| `purpose` | Sí | Finalidad declarada en español, máx. 300 caracteres. Informativo — no restringe técnicamente. |
| `consentType` | Sí | `true` = caduca por `validTo`; `false` = solo por revocación explícita. |
| `recurringIndicator` | Sí | `true` = recurrente; `false` = uso único. |
| `frequency` | Cond. | RFC 5545 (iCalendar). Obligatorio si recurringIndicator=true. |
| `validFrom` | No | Fecha de inicio RFC 3339 UTC. |
| `validTo` | Cond. | Fecha límite. Máximo 36 meses para APIs de datos en SFA. |

### Privilegios jerárquicos

Los `privileges` definen la profundidad de datos. Son acumulativos:

- `level1` — Listado general (`GET /accounts/v1`).
- `level2` — Detalle de un recurso identificado (`GET /accounts/v1/{accountId}`). Incluye level1.
- `level3` — Sub-recursos del recurso identificado (`GET /accounts/v1/{accountId}/transactions`). Incluye level1 y level2.

**Regla crítica**: no se puede pedir un nivel superior sin incluir los inferiores. `["level3"]` solo, inválido. `["level1", "level2", "level3"]`, válido.

Excepción importante: en la operación `merge` de Grant Management, el body trae solo el delta. Por eso ahí sí es válido enviar `["level3"]` — la regla se valida sobre el grant resultante, no sobre el delta.

### Ejemplo de PFM

```json
{
  "type": "Accounts",
  "actions": ["ReadAccounts", "ReadAccountsBalance", "ReadAccountsTransactions"],
  "identifier": "ACC12345",
  "privileges": ["level1", "level2", "level3"],
  "purpose": "Gestión de finanzas personales",
  "recurringIndicator": true,
  "frequency": "R/2025-05-01T00:00:00Z/P1D",
  "validFrom": "2025-04-22T00:00:00Z",
  "validTo": "2026-04-22T00:00:00Z",
  "consentType": false
}
```

Una fintech de PFM pide acceso a una cuenta concreta, con saldo y transacciones, recurrente diario, durante un año.

## 9. Sender-constrained tokens

Un access_token en banca regulada no es portable. Está atado a quien lo pidió.

**mTLS-bound (RFC 8705).** Al emitir el token, el AS añade `cnf.x5t#S256` con el hash SHA-256 del certificado de cliente. En cada llamada API, el cliente presenta el token *y* el mismo certificado por mTLS. El Resource Server compara hash(cert presentado) == cnf.x5t#S256. Si no coincide, descarta el token. Es lo que adoptan SFA Chile, OFB Brasil, OBIE Reino Unido y casi todo Open Finance regulado bancario.

**DPoP (RFC 9449).** Alternativa para clientes públicos donde mTLS no es viable (apps móviles nativas, SPAs). El cliente genera un par de claves asimétricas y firma cada llamada API con un JWT corto (DPoP proof). El access_token lleva en `cnf.jkt` el hash de la clave pública. FAPI 2.0 Baseline acepta DPoP como alternativa, pero la banca regulada bancaria gana mTLS-bound por la facilidad de auditoría.

## 10. El flujo completo del FAD chileno

Integrando todo, el FAD describe un flujo de 11 pasos:

1. **Canal mTLS** entre cliente y AS, ya establecido como prerrequisito.
2. **POST /par** con `authorization_details`, `code_challenge_method=S256`, `grant_management_action=create`, `redirect_uri`, `scope=openid`.
3. **201 Created** con `request_uri` de 90 s.
4. **Redirección** del navegador a `/authorize?request_uri=...`.
5. **Pantalla de consentimiento** granular: recursos, acciones, privilegios, finalidad, vigencia.
6. **Autenticación + aprobación** (SCA). Para persona jurídica con apoderados, el grant queda `AwaitingMultiAuthorisation` hasta que firmen todos.
7. **Grant creado**: el AS asigna `grantId` UUID, estado `Authorised`.
8. **Callback** con `code` y `state`.
9. **POST /token** sobre mTLS. Validación PKCE, devolución de `access_token` (con `cnf.x5t#S256`), `refresh_token` y `grant_id`.
10. **Consumo API**: el cliente llama con Bearer token y el mismo cert mTLS.
11. **Respuesta** del Resource Server tras validar token + cert + grant.

Lo que conviene retener: `authorization_details` viaja exclusivamente en `POST /par`. Las llamadas API solo usan el `access_token`; el AS resuelve internamente qué grant le corresponde.

## 11. Grant Management — el ciclo de vida del consentimiento

Una vez creado el grant, la especificación de Grant Management for OAuth 2.0 (OpenID Foundation) define seis operaciones. Cuatro se invocan vía `POST /par` con el parámetro `grant_management_action`. Dos son endpoints REST directos.

### Create

Crear consentimiento nuevo. Sin `grant_id` previo. Tras aprobación del usuario, el AS genera el `grantId`.

### Update

Extender vigencia o modificar metadatos sin cambiar alcance. Acciones, recursos y privilegios siguen idénticos. Solo cambia, típicamente, `validTo`.

### Replace

Sustituir completamente el set de permisos. Lo anterior se elimina. Útil cuando el usuario quiere reducir el alcance.

### Merge

Agregar nuevos permisos a los existentes. El body trae solo el delta; se suma al grant. La regla jerárquica de privileges se valida sobre el grant resultante, no sobre el delta.

### Query

`GET /grants/{grantId}` con access_token Bearer. Devuelve estado y contenido del grant. También existen `GET /grants` (lista) y `GET /grants/history` (auditoría).

### Revoke

`DELETE /grants/{grantId}` con access_token Bearer. Invalida access_token y refresh_token asociados. El grant pasa al estado `Revoked`.

El SFA exige que tanto el banco (IPI/IPC) como el cliente (PSBI/PSIP) implementen un **Panel de Control de Consentimientos** donde el usuario pueda consultar y revocar.

## 12. Estado regional

- **Chile (SFA).** FAPI 2.0 Baseline + RAR + Grant Management. Es la implementación regulatoria más estricta de LATAM. Materializada en el FAD por la CMF, marco normativo NCG 514 + Ley 21.521.
- **Brasil (OFB).** FAPI 1.0 Advanced en producción con miles de organizaciones registradas. En migración a FAPI 2.0 Baseline + Grant Management.
- **Perú (SBS).** Perfil propio en construcción. Esqueleto FAPI 2.0 pero con decisiones explícitas que el banco/consultor debe tomar (DPoP además de mTLS-bound, JARM o no, alcance inicial de RAR, gestión del ciclo de Grant Management). Un consultor en Perú tiene que poder explicar el menú de opcionales FAPI 2.0 con criterio.
- **México (CNBV).** Avanzó primero en Open Data (información agregada, sin consentimiento individual). Fases siguientes (Open Wealth, iniciación de pagos) en consulta con dirección FAPI 2.0.

## 13. JARM y CIBA — para reconocimiento

**JARM** (JWT Secured Authorization Response Mode). En lugar de devolver `code` y `state` como query params, el AS empuja toda la respuesta del `/authorize` dentro de un JWT firmado. Cierra ataques de manipulación de la respuesta. Está en FAPI 2.0 *Advanced*, no en Baseline. En el SFA chileno es opcional.

**CIBA** (Client Initiated Backchannel Authentication). Permite que el cliente inicie la autenticación por el backchannel y el usuario apruebe en otro dispositivo registrado (típicamente app móvil del banco). Útil para cajeros, call center, IVR, comercio físico. Tres modos: Poll, Ping, Push. Es un perfil OIDC aparte que FAPI puede invocar.

## 14. Lo que tienes que poder explicarle a un cliente

- **"Si ya tengo mTLS, ¿para qué PAR?"** — mTLS protege el canal cliente↔AS. PAR resuelve un problema distinto: en /authorize clásico los parámetros viajan en la URL del navegador (historial, logs, extensiones). PAR los empuja por canal mTLS y deja en la URL solo un `request_uri` opaco.
- **"¿Qué significa sender-constrained?"** — El AS añade al token un claim `cnf.x5t#S256` con el hash del cert de cliente. En cada llamada API el RS compara con el cert presentado. Si no coincide, descarta el token. Aunque alguien robe el token, no lo puede usar sin la clave privada del cert.
- **"¿RAR reemplaza al scope?"** — El scope conserva `openid` para activar OIDC. El resto de la granularidad migra a `authorization_details`. El banco evalúa permisos por `type + actions + identifier + privileges`, no por scope.
- **"¿`replace` o `merge` para sumar transacciones a un grant que ya leía cuentas?"** — Merge. Body con solo el delta (actions ReadAccountsTransactions, privileges level3). Replace sustituye todo el set y perderías ReadAccounts.

## Glosario rápido del módulo

- **OAuth 2.0** — protocolo de autorización delegada. Permite a un tercero acceder a recursos en nombre del usuario sin compartir credenciales.
- **OpenID Connect (OIDC)** — capa de identidad sobre OAuth 2.0. Añade `id_token` y endpoint `/userinfo`.
- **FAPI 2.0** — Financial-grade API Security Profile 2.0. Perfil endurecido para banca.
- **JWT** — JSON Web Token. Header.payload.signature en base64url.
- **JWS / JWE** — firma sobre JWT / cifrado del payload del JWT.
- **PKCE** — Proof Key for Code Exchange. Cierra interceptación del code. Method S256 obligatorio en FAPI 2.0.
- **PAR** — Pushed Authorization Requests. Push de la solicitud antes de redirigir.
- **RAR** — Rich Authorization Requests. Reemplaza scope por `authorization_details`.
- **Grant** — representación técnica de un consentimiento aprobado, con `grantId` UUID.
- **Grant Management** — Create / Update / Replace / Merge / Query / Revoke.
- **Sender-constrained token** — token atado al canal o clave que lo solicitó (mTLS-bound o DPoP).
- **JARM** — respuesta del AS firmada en JWT. FAPI 2.0 Advanced.
- **CIBA** — autenticación sin redirección, por backchannel.
- **Authorization Server / Resource Server / Resource Owner / Client** — los cuatro actores OAuth.
- **SCA** — Strong Customer Authentication. 2FA con al menos dos de tres factores.

## Próximo paso

En el siguiente módulo (05 — Arquitectura Open Finance) verás cómo todas estas piezas (cert mTLS, AS, RS, DCR, SSA, grants) se ensamblan en la topología completa de un ecosistema regulado: Directorio, API Gateway, API Manager, IdP, sandbox, developer portal. El módulo 04 te dio las llaves; el 05 te enseña el edificio.
