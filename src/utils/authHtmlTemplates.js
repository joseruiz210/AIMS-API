/**
 * Plantillas HTML responsivas para las pantallas de verificación y redirección en AIMS.
 * Se muestran cuando el usuario abre los enlaces de correo directamente desde el navegador de su dispositivo móvil o PC.
 */

const LOGO_BASE_STYLE = `
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #0B1220;
  color: #FFFFFF;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const CARD_STYLE = `
  background-color: #0F172A;
  border: 1px solid #C59427;
  border-top: 4px solid #C59427;
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
`;

const BTN_GOLD_STYLE = `
  display: inline-block;
  background-color: #C59427;
  color: #0B1220;
  font-weight: 800;
  font-size: 15px;
  padding: 14px 28px;
  text-decoration: none;
  border-radius: 10px;
  margin-top: 18px;
  letter-spacing: 0.5px;
  transition: background-color 0.2s;
  width: 100%;
  max-width: 320px;
  box-sizing: border-box;
`;

const BTN_OUTLINE_STYLE = `
  display: inline-block;
  background-color: transparent;
  color: #94A3B8;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 20px;
  text-decoration: none;
  border: 1px solid #334155;
  border-radius: 8px;
  margin-top: 10px;
  width: 100%;
  max-width: 320px;
  box-sizing: border-box;
`;

/**
 * Pantalla de verificación de correo exitosa
 */
function renderVerificationSuccessHtml(message = 'Correo electrónico verificado exitosamente.') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIMS - Correo Verificado</title>
  <style>
    body { ${LOGO_BASE_STYLE} }
    .card { ${CARD_STYLE} }
    .btn-gold { ${BTN_GOLD_STYLE} }
    .btn-outline { ${BTN_OUTLINE_STYLE} }
    .btn-gold:hover { background-color: #D4A338; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 56px; margin-bottom: 12px; color: #22C55E;">✓</div>
    <h1 style="color: #C59427; font-size: 24px; margin: 0 0 8px; letter-spacing: 1px;">AIMS</h1>
    <p style="color: #94A3B8; font-size: 12px; margin-top: 0; margin-bottom: 20px; text-transform: uppercase;">SISTEMA DE GESTIÓN ACADÉMICA INTELIGENTE</p>
    
    <h2 style="color: #FFFFFF; font-size: 20px; margin: 0 0 12px;">¡Cuenta Verificada y Activada!</h2>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
      ${message}<br>Ya puedes ingresar a la plataforma y disfrutar de todas las funcionalidades.
    </p>

    <a href="miproyecto://auth" class="btn-gold" id="openAppBtn">ABRIR EN LA APP AIMS →</a>
    <br>
    <a href="aims://auth" class="btn-outline">Abrir con enlace alternativo</a>

    <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
      Si estás en una computadora, regresa a la pestaña donde tienes la aplicación web e inicia sesión.
    </p>
  </div>

  <script>
    // Redirección automática a la app móvil tras 1 segundo
    setTimeout(function() {
      window.location.href = "miproyecto://auth";
    }, 1000);
  </script>
</body>
</html>`;
}

/**
 * Pantalla de error en la verificación de correo
 */
function renderVerificationErrorHtml(error = 'El token de verificación es inválido o ha expirado.') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIMS - Error de Verificación</title>
  <style>
    body { ${LOGO_BASE_STYLE} }
    .card { ${CARD_STYLE} }
    .btn-gold { ${BTN_GOLD_STYLE} }
    .btn-gold:hover { background-color: #D4A338; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 56px; margin-bottom: 12px; color: #EF4444;">✕</div>
    <h1 style="color: #C59427; font-size: 24px; margin: 0 0 8px;">AIMS</h1>
    <h2 style="color: #EF4444; font-size: 18px; margin: 0 0 12px;">No se pudo verificar el correo</h2>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
      ${error}
    </p>

    <a href="miproyecto://auth" class="btn-gold">VOLVER A LA APP AIMS</a>

    <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
      Puedes solicitar un nuevo enlace desde la pantalla de inicio de sesión de la app pulsando "Reenviar correo de verificación".
    </p>
  </div>
</body>
</html>`;
}

/**
 * Pantalla interactiva para restablecer contraseña directamente desde el navegador o abrir la app móvil
 */
function renderResetPasswordHtml({ token, error = null, success = false }) {
  const isInvalidToken = !!error && !success;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIMS - Restablecer Contraseña</title>
  <style>
    body { ${LOGO_BASE_STYLE} }
    .card { ${CARD_STYLE} }
    .btn-gold { ${BTN_GOLD_STYLE} border: none; cursor: pointer; }
    .btn-gold:hover { background-color: #D4A338; }
    .input-field {
      width: 100%;
      box-sizing: border-box;
      background-color: #1E293B;
      border: 1px solid #334155;
      color: #FFFFFF;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 14px;
      outline: none;
    }
    .input-field:focus {
      border-color: #C59427;
    }
    .label {
      display: block;
      text-align: left;
      color: #CBD5E1;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1 style="color: #C59427; font-size: 24px; margin: 0 0 8px; letter-spacing: 1px;">AIMS</h1>
    <p style="color: #94A3B8; font-size: 12px; margin-top: 0; margin-bottom: 20px; text-transform: uppercase;">RECUPERACIÓN DE CONTRASEÑA</p>

    ${
      success
        ? `
        <div style="font-size: 48px; color: #22C55E; margin-bottom: 12px;">✓</div>
        <h2 style="color: #FFFFFF; font-size: 18px; margin-bottom: 8px;">¡Contraseña Actualizada!</h2>
        <p style="color: #CBD5E1; font-size: 14px; margin-bottom: 24px;">Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <a href="miproyecto://auth" class="btn-gold">ABRIR APP E INICIAR SESIÓN →</a>
      `
        : isInvalidToken
        ? `
        <div style="font-size: 48px; color: #EF4444; margin-bottom: 12px;">✕</div>
        <h2 style="color: #EF4444; font-size: 18px; margin-bottom: 8px;">Enlace Expirado o Inválido</h2>
        <p style="color: #CBD5E1; font-size: 14px; margin-bottom: 24px;">${error}</p>
        <a href="miproyecto://forgot-password" class="btn-gold">SOLICITAR NUEVO ENLACE</a>
      `
        : `
        <div style="background-color: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <p style="color: #CBD5E1; font-size: 13px; margin: 0 0 10px;">¿Tienes la aplicación instalada en este dispositivo?</p>
          <a href="miproyecto://reset-password?token=${encodeURIComponent(token || '')}" class="btn-gold" style="margin-top: 0; font-size: 13px; padding: 10px 18px;">ABRIR EN LA APP AIMS 📱</a>
        </div>

        <div style="display: flex; align-items: center; margin: 16px 0;">
          <div style="flex: 1; height: 1px; background-color: #334155;"></div>
          <span style="color: #64748B; font-size: 11px; padding: 0 10px; text-transform: uppercase;">O cámbiala aquí mismo</span>
          <div style="flex: 1; height: 1px; background-color: #334155;"></div>
        </div>

        <form id="resetForm" onsubmit="handleResetPassword(event)">
          <input type="hidden" id="token" value="${token || ''}">
          <label class="label" for="password">Nueva Contraseña</label>
          <input type="password" id="password" class="input-field" placeholder="Mínimo 8 caract., mayúscula, número" required minlength="8">

          <label class="label" for="confirmPassword">Confirmar Contraseña</label>
          <input type="password" id="confirmPassword" class="input-field" placeholder="Repite la nueva contraseña" required minlength="8">

          <div id="feedbackBox" style="display: none; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 12px;"></div>

          <button type="submit" id="submitBtn" class="btn-gold">RESTABLECER CONTRASEÑA →</button>
        </form>

        <script>
          // Intento automático de abrir la app si está en móvil
          if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            setTimeout(function() {
              window.location.href = "miproyecto://reset-password?token=" + encodeURIComponent("${token || ''}");
            }, 800);
          }

          async function handleResetPassword(e) {
            e.preventDefault();
            var pwd = document.getElementById('password').value;
            var confirm = document.getElementById('confirmPassword').value;
            var token = document.getElementById('token').value;
            var box = document.getElementById('feedbackBox');
            var btn = document.getElementById('submitBtn');

            if (pwd !== confirm) {
              box.style.display = 'block';
              box.style.backgroundColor = '#7F1D1D';
              box.style.color = '#FCA5A5';
              box.innerText = 'Las contraseñas no coinciden.';
              return;
            }

            btn.disabled = true;
            btn.innerText = 'Actualizando...';

            try {
              var res = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ token: token, newPassword: pwd })
              });
              var data = await res.json();
              if (res.ok) {
                document.getElementById('resetForm').innerHTML =
                  '<div style="font-size: 48px; color: #22C55E; margin: 12px 0;">✓</div>' +
                  '<h2 style="color: #FFFFFF; font-size: 18px;">¡Contraseña Actualizada con Éxito!</h2>' +
                  '<p style="color: #CBD5E1; font-size: 14px;">Ya puedes iniciar sesión en la App AIMS.</p>' +
                  '<a href="miproyecto://auth" class="btn-gold">ABRIR APP AIMS</a>';
              } else {
                box.style.display = 'block';
                box.style.backgroundColor = '#7F1D1D';
                box.style.color = '#FCA5A5';
                box.innerText = data.message || 'Error al restablecer la contraseña.';
                btn.disabled = false;
                btn.innerText = 'RESTABLECER CONTRASEÑA →';
              }
            } catch (err) {
              box.style.display = 'block';
              box.style.backgroundColor = '#7F1D1D';
              box.style.color = '#FCA5A5';
              box.innerText = 'Error de conexión con el servidor.';
              btn.disabled = false;
              btn.innerText = 'RESTABLECER CONTRASEÑA →';
            }
          }
        </script>
      `
    }
  </div>
</body>
</html>`;
}

/**
 * Pantalla de Magic Link exitosa
 */
function renderMagicLinkSuccessHtml({ token, message = 'Acceso concedido exitosamente.' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIMS - Acceso Directo (Magic Link)</title>
  <style>
    body { ${LOGO_BASE_STYLE} }
    .card { ${CARD_STYLE} }
    .btn-gold { ${BTN_GOLD_STYLE} }
    .btn-gold:hover { background-color: #D4A338; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 56px; margin-bottom: 12px; color: #22C55E;">✓</div>
    <h1 style="color: #C59427; font-size: 24px; margin: 0 0 8px;">AIMS</h1>
    <h2 style="color: #FFFFFF; font-size: 20px; margin: 0 0 12px;">¡Acceso Verificado!</h2>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
      ${message}<br>Redirigiendo a tu cuenta en la aplicación móvil...
    </p>

    <a href="miproyecto://magic-verify?token=${encodeURIComponent(token || '')}" class="btn-gold" id="openAppBtn">ABRIR EN LA APP AIMS →</a>

    <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
      Si la app no se abre automáticamente, toca el botón dorado de arriba.
    </p>
  </div>

  <script>
    setTimeout(function() {
      window.location.href = "miproyecto://magic-verify?token=" + encodeURIComponent("${token || ''}");
    }, 800);
  </script>
</body>
</html>`;
}

/**
 * Pantalla de Magic Link fallida
 */
function renderMagicLinkErrorHtml(error = 'El enlace de acceso es inválido o ha expirado.') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIMS - Error Magic Link</title>
  <style>
    body { ${LOGO_BASE_STYLE} }
    .card { ${CARD_STYLE} }
    .btn-gold { ${BTN_GOLD_STYLE} }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 56px; margin-bottom: 12px; color: #EF4444;">✕</div>
    <h1 style="color: #C59427; font-size: 24px; margin: 0 0 8px;">AIMS</h1>
    <h2 style="color: #EF4444; font-size: 18px; margin: 0 0 12px;">Enlace Inválido o Expirado</h2>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
      ${error}
    </p>

    <a href="miproyecto://auth" class="btn-gold">VOLVER A LA APP AIMS</a>
  </div>
</body>
</html>`;
}

module.exports = {
  renderVerificationSuccessHtml,
  renderVerificationErrorHtml,
  renderResetPasswordHtml,
  renderMagicLinkSuccessHtml,
  renderMagicLinkErrorHtml,
};
