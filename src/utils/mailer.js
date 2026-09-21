const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.smtp.user && env.smtp.pass) {
  const isGmail = env.smtp.host?.includes('gmail') || env.smtp.user?.includes('@gmail.com');
  transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: {
            user: env.smtp.user,
            pass: env.smtp.pass,
          },
        }
      : {
          host: env.smtp.host,
          port: env.smtp.port,
          secure: env.smtp.port === 465,
          auth: {
            user: env.smtp.user,
            pass: env.smtp.pass,
          },
        }
  );
}

/**
 * Sanitiza y obtiene una URL base válida (ej: http://localhost:8081 o https://dominio.com)
 * filtrando comodines como '*' o esquemas inválidos.
 */
const _getCleanBaseUrl = (customBaseUrl) => {
  let url = (customBaseUrl || env.frontendUrl || env.backendUrl || 'http://localhost:8081').trim();

  // Si proviene de un header referer o origin completo (ej: http://localhost:8081/login)
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      if (parsed.hostname && !parsed.hostname.includes('*')) {
        url = parsed.origin;
      }
    }
  } catch (e) {}

  url = url.replace(/\/+$/, '');

  // Si en producción la URL apunta a localhost o contiene comodines, usar la URL del backend en Azure
  if (url.includes('*') || !url.startsWith('http') || (env.nodeEnv === 'production' && url.includes('localhost'))) {
    url = env.backendUrl || 'https://academicaimsapp-edh3c3g2eabtgqc2.westus-01.azurewebsites.net';
  }
  return url;
};

/**
 * Sends an email using Nodemailer or logs it in development if SMTP is unconfigured.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log('\n--- EMAIL SIMULATION (DEV MODE) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html}`);
    console.log('-------------------------------------\n');
    return { success: false, simulated: true };
  }

  const mailOptions = {
    from: env.smtp.from,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL OK] Enviado a ${to} - messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] No se pudo enviar a ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends verification email to user
 */
const sendVerificationEmail = async (email, token, clientOrigin) => {
  const baseUrl = _getCleanBaseUrl(clientOrigin);
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  const deepLinkUrl = `miproyecto://verify-email?token=${token}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0B1220; color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #C59427;">
      <div style="background-color: #0B1220; padding: 24px; text-align: center; border-bottom: 2px solid #C59427;">
        <h1 style="color: #C59427; margin: 0; font-size: 24px; letter-spacing: 2px;">AIMS</h1>
        <p style="color: #94A3B8; margin: 4px 0 0; font-size: 12px;">SISTEMA DE GESTIÓN ACADÉMICA INTELIGENTE</p>
      </div>
      <div style="padding: 28px; background-color: #0F172A;">
        <h2 style="color: #FFFFFF; margin-top: 0;">¡Bienvenido a AIMS!</h2>
        <p style="color: #CBD5E1; font-size: 15px; line-height: 1.5;">Por favor confirma tu correo electrónico para activar tu cuenta y poder iniciar sesión en la plataforma:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verificationUrl}" style="background-color: #C59427; color: #0B1220; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 15px; letter-spacing: 0.5px;">Verificar mi Correo</a>
        </div>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">Si estás usando la aplicación móvil AIMS, puedes ingresar este código directamente en la pantalla de verificación:</p>
        <div style="background-color: #1E293B; border: 1px dashed #C59427; padding: 14px; border-radius: 6px; text-align: center; margin: 12px 0;">
          <code style="color: #FCD34D; font-size: 18px; font-weight: bold; letter-spacing: 2px;">${token}</code>
        </div>
        <div style="text-align: center; margin-top: 18px;">
          <a href="${deepLinkUrl}" style="color: #94A3B8; font-size: 13px; text-decoration: underline;">Abrir directamente en la App Móvil</a>
        </div>
        <p style="color: #64748B; font-size: 12px; margin-top: 24px;">Si tú no solicitaste crear esta cuenta, puedes ignorar este mensaje de forma segura.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verifica tu cuenta en AIMS',
    html,
    text: `Verifica tu cuenta en AIMS con este código: ${token} o ingresando a: ${verificationUrl}`,
  });
};

/**
 * Sends password reset email to user
 */
const sendPasswordResetEmail = async (email, token, clientOrigin) => {
  const baseUrl = _getCleanBaseUrl(clientOrigin);
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const deepLinkUrl = `miproyecto://reset-password?token=${token}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0B1220; color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #C59427;">
      <div style="background-color: #0B1220; padding: 24px; text-align: center; border-bottom: 2px solid #C59427;">
        <h1 style="color: #C59427; margin: 0; font-size: 24px; letter-spacing: 2px;">AIMS</h1>
        <p style="color: #94A3B8; margin: 4px 0 0; font-size: 12px;">SISTEMA DE GESTIÓN ACADÉMICA INTELIGENTE</p>
      </div>
      <div style="padding: 28px; background-color: #0F172A;">
        <h2 style="color: #FFFFFF; margin-top: 0;">Recuperación de Contraseña</h2>
        <p style="color: #CBD5E1; font-size: 15px; line-height: 1.5;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AIMS. Haz clic en el botón a continuación:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #C59427; color: #0B1220; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 15px; letter-spacing: 0.5px;">Restablecer mi Contraseña</a>
        </div>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">Si estás usando la app móvil, puedes ingresar este token de recuperación en la pantalla de restablecer contraseña:</p>
        <div style="background-color: #1E293B; border: 1px dashed #C59427; padding: 12px; border-radius: 6px; text-align: center; margin: 12px 0;">
          <code style="color: #FCD34D; font-size: 15px; font-weight: bold; word-break: break-all;">${token}</code>
        </div>
        <div style="text-align: center; margin-top: 18px;">
          <a href="${deepLinkUrl}" style="color: #94A3B8; font-size: 13px; text-decoration: underline;">Abrir directamente en la App Móvil</a>
        </div>
        <p style="color: #F59E0B; font-size: 13px; margin-top: 14px;">⏳ Este token expira en 1 hora por seguridad.</p>
        <p style="color: #64748B; font-size: 12px; margin-top: 24px;">Si tú no solicitaste este cambio, ignora este correo. Tu contraseña actual no cambiará.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - AIMS',
    html,
    text: `Restablece tu contraseña en AIMS con este token (expira en 1h): ${token} o ingresando a: ${resetUrl}`,
  });
};

/**
 * Sends magic link email for passwordless login
 */
const sendMagicLinkEmail = async (email, token, clientOrigin) => {
  const baseUrl = _getCleanBaseUrl(clientOrigin);
  const magicUrl = `${baseUrl}/magic-verify?token=${token}`;
  const deepLinkUrl = `miproyecto://magic-verify?token=${token}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0B1220; color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #C59427;">
      <div style="background-color: #0B1220; padding: 24px; text-align: center; border-bottom: 2px solid #C59427;">
        <h1 style="color: #C59427; margin: 0; font-size: 24px; letter-spacing: 2px;">AIMS</h1>
        <p style="color: #94A3B8; margin: 4px 0 0; font-size: 12px;">SISTEMA DE GESTIÓN ACADÉMICA INTELIGENTE</p>
      </div>
      <div style="padding: 28px; background-color: #0F172A;">
        <h2 style="color: #FFFFFF; margin-top: 0;">Acceso Directo (Magic Link)</h2>
        <p style="color: #CBD5E1; font-size: 15px; line-height: 1.5;">Haz clic en el siguiente botón para iniciar sesión automáticamente sin contraseña en tu cuenta de AIMS:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${magicUrl}" style="background-color: #C59427; color: #0B1220; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 15px; letter-spacing: 0.5px;">Ingresar a AIMS</a>
        </div>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">O copia y pega este código de acceso en la aplicación:</p>
        <div style="background-color: #1E293B; border: 1px dashed #C59427; padding: 12px; border-radius: 6px; text-align: center; margin: 12px 0;">
          <code style="color: #FCD34D; font-size: 15px; font-weight: bold; word-break: break-all;">${token}</code>
        </div>
        <div style="text-align: center; margin-top: 18px;">
          <a href="${deepLinkUrl}" style="color: #94A3B8; font-size: 13px; text-decoration: underline;">Abrir directamente en la App Móvil</a>
        </div>
        <p style="color: #F59E0B; font-size: 13px; margin-top: 14px;">⏳ Este enlace expira en 15 minutos por seguridad.</p>
        <p style="color: #64748B; font-size: 12px; margin-top: 24px;">Si no solicitaste este acceso, puedes ignorar este correo de forma segura.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Acceso Directo sin Contraseña - AIMS',
    html,
    text: `Accede a AIMS usando este token: ${token} o ingresando a: ${magicUrl}`,
  });
};

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error('[SMTP] Conexión fallida al arrancar:', error.message);
    } else {
      console.log('[SMTP] Servidor de correo listo y verificado ✅');
    }
  });
} else {
  console.warn('[SMTP] No configurado — los correos se simularán en consola, no se enviarán de verdad.');
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMagicLinkEmail,
  _getCleanBaseUrl,
};
