/* ============================================================
   Componente: token-inspector
   Muestra un JWT decodificado de forma interactiva.
   - Vista serializada (base64): header.payload.signature
     con cada bloque en color distinto.
   - Vista decodificada: tres paneles (header / payload /
     signature) con cada claim documentado en tooltip.
   - Toggle entre ambas vistas.

   Uso típico: módulos 04 (access_token, id_token),
   05 (SSA del directorio), 07 (request_object PAR).
   ============================================================ */

(function (global) {
  'use strict';

  /* Diccionario de claims registrados + claims FAPI / OIDC más comunes.
     desc es la explicación que aparece en el tooltip al pasar el ratón. */
  const CLAIMS_INFO = {
    // --- Header
    alg: { nombre: 'Algorithm', desc: 'Algoritmo de firma del JWT. FAPI 2.0 exige PS256 o ES256. Nunca HS256 ni "none".' },
    typ: { nombre: 'Type', desc: 'Tipo del token. Siempre "JWT" en este flujo.' },
    kid: { nombre: 'Key ID', desc: 'Identificador de la clave pública (en el JWKS del emisor) que debe usarse para verificar la firma.' },

    // --- Claims registrados RFC 7519
    iss: { nombre: 'Issuer', desc: 'Quién emite el token. Típicamente la URL del Authorization Server (IPI/IPC).' },
    sub: { nombre: 'Subject', desc: 'Sujeto del token: ID estable del usuario final en el AS. No es el RUT ni el email.' },
    aud: { nombre: 'Audience', desc: 'A quién va dirigido. La API que debe aceptar este token. Si no coincide, se rechaza.' },
    exp: { nombre: 'Expiration', desc: 'Timestamp Unix tras el cual el token deja de ser válido. FAPI 2.0 recomienda expiraciones cortas (5–15 min).' },
    nbf: { nombre: 'Not Before', desc: 'Timestamp Unix desde el cual el token es aceptable. Antes de eso, debe rechazarse.' },
    iat: { nombre: 'Issued At', desc: 'Timestamp Unix de emisión del token. Útil para detectar tokens muy antiguos.' },
    jti: { nombre: 'JWT ID', desc: 'Identificador único del token. Sirve para detectar replay attacks (un token solo puede usarse una vez en flujos críticos).' },

    // --- OAuth / FAPI / SFA
    scope: { nombre: 'Scope', desc: 'Alcance OAuth. En el SFA siempre incluye "openid"; la granularidad fina vive en authorization_details.' },
    client_id: { nombre: 'Client ID', desc: 'ID del cliente OAuth (PSBI o PSIP) al que se emitió el token, registrado vía DCR.' },
    cnf: { nombre: 'Confirmation', desc: 'Confirmation claim. En sender-constrained vía mTLS contiene "x5t#S256" — hash SHA-256 del certificado de cliente. Si el cert no coincide en la llamada API, el token se rechaza.' },
    authorization_details: { nombre: 'Authorization Details', desc: 'Array RAR (RFC 9396) con los permisos granulares aprobados: type, actions, identifier, privileges, purpose, vigencia.' },
    grant_id: { nombre: 'Grant ID', desc: 'UUID del grant gestionable vía Grant Management API (Create / Update / Replace / Merge / Query / Revoke).' },

    // --- OIDC id_token
    nonce: { nombre: 'Nonce', desc: 'Valor aleatorio enviado por el cliente en la solicitud. El AS lo replica aquí para que el cliente detecte un replay del id_token.' },
    acr: { nombre: 'ACR', desc: 'Authentication Context Class Reference. Indica el nivel/método con el que el usuario fue autenticado (p.ej. SCA fuerte).' },
    amr: { nombre: 'AMR', desc: 'Authentication Methods References. Array con los métodos efectivamente usados (pwd, otp, mfa, fido…).' },
    auth_time: { nombre: 'Authentication Time', desc: 'Timestamp Unix en que el usuario autenticó realmente. Útil cuando una API exige reautenticación reciente.' },
    name:  { nombre: 'Name',  desc: 'Nombre del usuario tal como lo conoce el IdP. Claim estándar OIDC.' },
    email: { nombre: 'Email', desc: 'Email del usuario tal como lo conoce el IdP. Claim estándar OIDC.' },

    // --- Específicos del SFA / RAR
    type:        { nombre: 'Type (RAR)',        desc: 'Recurso API solicitado: Accounts, SinglePayments, Loans, Investments, Insurances, etc.' },
    actions:     { nombre: 'Actions (RAR)',     desc: 'Operaciones autorizadas sobre el recurso (p.ej. ReadAccounts, ReadAccountsTransactions, CreateSinglePayments).' },
    identifier:  { nombre: 'Identifier (RAR)',  desc: 'ID del recurso concreto (cuenta, póliza, crédito, inversión).' },
    privileges:  { nombre: 'Privileges (RAR)',  desc: 'Niveles jerárquicos de profundidad: level1 (listado), level2 (detalle), level3 (sub-recurso). Acumulativos.' },
    purpose:     { nombre: 'Purpose (RAR)',     desc: 'Finalidad declarada del consentimiento. Informativo, queda en auditoría, no se usa para restringir técnicamente.' },
    recurringIndicator: { nombre: 'Recurring',  desc: 'true = acceso recurrente; false = acceso único.' },
    frequency:   { nombre: 'Frequency (RAR)',   desc: 'Periodicidad en formato RFC 5545 (iCalendar). Ej.: R/2025-05-01T00:00:00Z/P1M = repetir cada mes.' },
    validFrom:   { nombre: 'Valid From',        desc: 'Fecha desde la que es válido el consentimiento (RFC 3339 UTC).' },
    validTo:     { nombre: 'Valid To',          desc: 'Fecha hasta la que es válido. Máximo regulatorio: 36 meses para APIs de datos en SFA.' },
    consentType: { nombre: 'Consent Type',      desc: 'true = caduca por validTo. false = solo finaliza por revocación explícita.' }
  };

  /* Renderiza la cadena JWT compacta header.payload.signature con cada
     bloque envuelto en su span de color. */
  function colorearJWT(jwtCompacto) {
    if (typeof jwtCompacto !== 'string' || !jwtCompacto.includes('.')) {
      return jwtCompacto || '';
    }
    const parts = jwtCompacto.split('.');
    if (parts.length !== 3) return jwtCompacto;
    return [
      '<span class="cmp-token-inspector__jwt-h">' + parts[0] + '</span>',
      '<span class="cmp-token-inspector__jwt-dot">.</span>',
      '<span class="cmp-token-inspector__jwt-p">' + parts[1] + '</span>',
      '<span class="cmp-token-inspector__jwt-dot">.</span>',
      '<span class="cmp-token-inspector__jwt-s">' + parts[2] + '</span>'
    ].join('');
  }

  /* Formatea un valor JSON para render visual.
     - String entre comillas
     - Objeto/array pretty-printed indentado
     - null / true / false como literales sin comillas */
  function formatValue(val, indent) {
    indent = indent || 0;
    const pad = '  '.repeat(indent);
    if (val === null) return 'null';
    if (typeof val === 'boolean' || typeof val === 'number') return String(val);
    if (typeof val === 'string') return '"' + escapeHTML(val) + '"';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      const items = val.map(v => pad + '  ' + formatValue(v, indent + 1));
      return '[\n' + items.join(',\n') + '\n' + pad + ']';
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return '{}';
      const lines = keys.map(k =>
        pad + '  "' + escapeHTML(k) + '": ' + formatValue(val[k], indent + 1)
      );
      return '{\n' + lines.join(',\n') + '\n' + pad + '}';
    }
    return String(val);
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Renderiza un objeto (header o payload) como un set de líneas
     "clave": valor, donde cada clave conocida lleva tooltip. */
  function renderClaims(obj, highlight) {
    if (!obj) return '';
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return '<div class="cmp-token-inspector__empty">(vacío)</div>';
    }
    return entries.map((entry, idx) => {
      const key = entry[0];
      const val = entry[1];
      const info = CLAIMS_INFO[key];
      const isHighlight = highlight && highlight.indexOf(key) !== -1;
      const cls = ['cmp-token-inspector__claim'];
      if (info) cls.push('has-tooltip');
      if (isHighlight) cls.push('is-highlight');
      const tooltip = info
        ? '<span class="cmp-token-inspector__tooltip">' +
          '<strong>' + info.nombre + '</strong>' +
          '<span>' + info.desc + '</span></span>'
        : '';
      const valStr = formatValue(val, 1);
      const isLast = idx === entries.length - 1;
      return '<div class="' + cls.join(' ') + '">' +
        '<span class="cmp-token-inspector__claim-key">"' + escapeHTML(key) + '"</span>' +
        '<span class="cmp-token-inspector__claim-colon">: </span>' +
        '<span class="cmp-token-inspector__claim-val">' + valStr + (isLast ? '' : ',') + '</span>' +
        tooltip +
      '</div>';
    }).join('');
  }

  function montar(contenedor, config) {
    if (!contenedor || !config) return;

    const jwt = config.jwt_demo ||
      'eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FzLmJhbmNvLmNsIn0.firma';
    const header = config.header || {};
    const payload = config.payload || {};
    const highlight = config.highlight_claims || [];
    const sigParte = (jwt.split('.')[2] || 'firma');

    const numHeader = config.numero_concepto != null
      ? '<div class="cmp-token-inspector__num">' + config.numero_concepto + '</div>'
      : '';

    contenedor.innerHTML =
      '<section class="cmp-token-inspector">' +
        '<div class="cmp-token-inspector__header-row">' +
          numHeader +
          '<div class="cmp-token-inspector__titulo">' +
            (config.titulo ? '<h2>' + config.titulo + '</h2>' : '') +
            (config.subtitulo ? '<p>' + config.subtitulo + '</p>' : '') +
          '</div>' +
        '</div>' +

        '<div class="cmp-token-inspector__toggle">' +
          '<button class="cmp-token-inspector__toggle-btn is-active" data-view="decoded">Decodificado</button>' +
          '<button class="cmp-token-inspector__toggle-btn" data-view="raw">Serializado (base64url)</button>' +
        '</div>' +

        /* Vista decodificada — tres paneles */
        '<div class="cmp-token-inspector__view is-active" data-view="decoded">' +
          '<div class="cmp-token-inspector__panels">' +
            '<div class="cmp-token-inspector__panel is-header">' +
              '<div class="cmp-token-inspector__panel-label">HEADER</div>' +
              '<pre class="cmp-token-inspector__panel-body">{' +
                renderClaims(header, highlight) +
              '}</pre>' +
            '</div>' +
            '<div class="cmp-token-inspector__panel is-payload">' +
              '<div class="cmp-token-inspector__panel-label">PAYLOAD</div>' +
              '<pre class="cmp-token-inspector__panel-body">{' +
                renderClaims(payload, highlight) +
              '}</pre>' +
            '</div>' +
            '<div class="cmp-token-inspector__panel is-signature">' +
              '<div class="cmp-token-inspector__panel-label">SIGNATURE</div>' +
              '<div class="cmp-token-inspector__panel-body cmp-token-inspector__sig-body">' +
                '<code>' + escapeHTML(sigParte.slice(0, 96)) + (sigParte.length > 96 ? '…' : '') + '</code>' +
                '<p class="cmp-token-inspector__sig-hint">' +
                  'La firma es el resultado de aplicar la clave privada del emisor sobre <code>base64url(header) + "." + base64url(payload)</code>. ' +
                  'El receptor la valida con la clave pública publicada en el JWKS del Authorization Server. ' +
                  'Si la firma no cuadra, el token entero se descarta.' +
                '</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (config.nota_final ? '<p class="cmp-token-inspector__nota">' + config.nota_final + '</p>' : '') +
        '</div>' +

        /* Vista serializada — la cadena tal cual viaja */
        '<div class="cmp-token-inspector__view" data-view="raw" hidden>' +
          '<div class="cmp-token-inspector__legend">' +
            '<span><span class="cmp-token-inspector__dot is-header"></span>header</span>' +
            '<span><span class="cmp-token-inspector__dot is-payload"></span>payload</span>' +
            '<span><span class="cmp-token-inspector__dot is-signature"></span>signature</span>' +
          '</div>' +
          '<pre class="cmp-token-inspector__jwt-raw">' + colorearJWT(jwt) + '</pre>' +
          '<p class="cmp-token-inspector__hint">' +
            'Tres bloques separados por punto. Header y payload son <strong>base64url</strong> de un objeto JSON, no están cifrados — cualquiera los lee. ' +
            'Lo que evita falsificación es la <strong>firma</strong>: solo el emisor con su clave privada pudo producirla.' +
          '</p>' +
        '</div>' +
      '</section>';

    /* Toggle decoded / raw */
    const root = contenedor.querySelector('.cmp-token-inspector');
    const btns  = root.querySelectorAll('.cmp-token-inspector__toggle-btn');
    const views = root.querySelectorAll('.cmp-token-inspector__view');

    btns.forEach(b => {
      b.addEventListener('click', () => {
        btns.forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        const target = b.dataset.view;
        views.forEach(v => {
          if (v.dataset.view === target) {
            v.removeAttribute('hidden');
            v.classList.add('is-active');
          } else {
            v.setAttribute('hidden', '');
            v.classList.remove('is-active');
          }
        });
      });
    });
  }

  global.TokenInspector = { montar };
})(window);
