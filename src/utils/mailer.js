const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.smtp.user && env.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
}

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
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${env.frontendUrl}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Bienvenido a AIMS API</h2>
      <p>Por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente enlace:</p>
      <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Correo</a>
      <p style="margin-top: 20px;">O copia y pega este token de verificación:</p>
      <code style="background-color: #f4f4f4; padding: 5px 10px; border-radius: 3px;">${token}</code>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verificación de Correo - AIMS API',
    html,
    text: `Verifica tu cuenta con este token: ${token} o ingresando a: ${verificationUrl}`,
  });
};

/**
 * Sends password reset email to user
 */
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Recuperación de Contraseña - AIMS API</h2>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetUrl}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Contraseña</a>
      <p style="margin-top: 20px;">O copia y pega este token de recuperación:</p>
      <code style="background-color: #f4f4f4; padding: 5px 10px; border-radius: 3px;">${token}</code>
      <p style="color: #d9534f; font-size: 13px; margin-top: 15px;">Este token expira en 1 hora.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">Si no solicitaste este cambio, ignora este mensaje y tu contraseña permanecerá segura.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Restablecimiento de Contraseña - AIMS API',
    html,
    text: `Restablece tu contraseña con este token (expira en 1h): ${token} o ingresando a: ${resetUrl}`,
  });
};

/**
 * Sends magic link email for passwordless login
 */
const sendMagicLinkEmail = async (email, token) => {
  const magicUrl = `${env.frontendUrl}/magic-verify?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Acceso Directo (Magic Link) - AIMS</h2>
      <p>Haz clic en el siguiente botón para iniciar sesión automáticamente sin contraseña:</p>
      <a href="${magicUrl}" style="background-color: #D4AF37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ingresar a AIMS</a>
      <p style="margin-top: 20px;">O copia y pega este token en la aplicación:</p>
      <code style="background-color: #f4f4f4; padding: 5px 10px; border-radius: 3px;">${token}</code>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">Si no solicitaste este acceso, puedes ignorar este correo.</p>
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
};
