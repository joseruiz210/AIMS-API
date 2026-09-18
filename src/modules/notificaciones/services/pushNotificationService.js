const prisma = require('../../../config/database');

/**
 * Servicio de despacho de notificaciones Push (Expo) e internas en base de datos.
 */
class PushNotificationService {
  constructor() {
    this.expoApiUrl = 'https://exp.host/--/api/v2/push/send';
  }

  /**
   * Verifica si un token tiene el formato válido de Expo Push Token
   */
  isValidExpoPushToken(token) {
    return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
  }

  /**
   * Envía un lote de mensajes a los servidores de Expo Push
   * @param {Array<{to: string, title: string, body: string, data?: object, sound?: string}>} messages 
   */
  async sendExpoPushBatch(messages) {
    if (!messages || messages.length === 0) return;

    // Expo recomienda lotes de máximo 100 mensajes
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      try {
        const response = await fetch(this.expoApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('[PushNotification] Error en respuesta de Expo:', response.status, errText);
        }
      } catch (err) {
        console.error('[PushNotification] Error de red enviando a Expo:', err.message);
      }
    }
  }

  /**
   * Envía notificación a todos los aprendices inscritos en una Ficha.
   * Guarda las notificaciones en BD y envía push a quienes tengan pushToken.
   */
  async notifyFicha(fichaId, { title, body, data = {}, tipo = 'INFO' }) {
    if (!fichaId) return;

    try {
      // 1. Obtener los aprendices activos de la ficha
      const matriculas = await prisma.matricula.findMany({
        where: {
          fichaId,
          estado: 'Activo',
        },
        include: {
          aprendiz: {
            select: {
              id: true,
              pushToken: true,
              isActive: true,
            },
          },
        },
      });

      if (!matriculas || matriculas.length === 0) return;

      const activeUsers = matriculas
        .map((m) => m.aprendiz)
        .filter((user) => user && user.isActive);

      if (activeUsers.length === 0) return;

      // 2. Guardar en base de datos la notificación histórica
      await prisma.notificacion.createMany({
        data: activeUsers.map((u) => ({
          userId: u.id,
          titulo: title,
          mensaje: body,
          tipo,
          leida: false,
        })),
      });

      // 3. Filtrar aquellos con Expo Push Token configurado
      const pushMessages = [];
      for (const u of activeUsers) {
        if (u.pushToken && this.isValidExpoPushToken(u.pushToken)) {
          pushMessages.push({
            to: u.pushToken,
            sound: 'default',
            title,
            body,
            data: { ...data, fichaId, tipo },
          });
        }
      }

      if (pushMessages.length > 0) {
        await this.sendExpoPushBatch(pushMessages);
      }
    } catch (error) {
      console.error('[PushNotification] Error al notificar a la ficha:', error.message);
    }
  }

  /**
   * Envía notificación a un usuario puntual (ej: calificación).
   * Guarda en BD y envía push si tiene pushToken.
   */
  async notifyUser(userId, { title, body, data = {}, tipo = 'INFO' }) {
    if (!userId) return;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, pushToken: true, isActive: true },
      });

      if (!user || !user.isActive) return;

      // 1. Guardar en BD
      await prisma.notificacion.create({
        data: {
          userId: user.id,
          titulo: title,
          mensaje: body,
          tipo,
          leida: false,
        },
      });

      // 2. Enviar push si tiene token
      if (user.pushToken && this.isValidExpoPushToken(user.pushToken)) {
        await this.sendExpoPushBatch([
          {
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data: { ...data, userId, tipo },
          },
        ]);
      }
    } catch (error) {
      console.error('[PushNotification] Error al notificar usuario individual:', error.message);
    }
  }

  async notifyGlobal({ title, body, data = {}, tipo = 'SISTEMA', targetRole = null }) {
    try {
      const where = {
        isActive: true,
        ...(targetRole && targetRole !== 'TODOS' && targetRole !== 'ALL' ? { role: targetRole } : {}),
      };
      const users = await prisma.user.findMany({
        where,
        select: { id: true, pushToken: true },
      });

      if (users.length === 0) return { notifiedCount: 0, pushCount: 0 };

      await prisma.notificacion.createMany({
        data: users.map(u => ({
          userId: u.id,
          titulo: title,
          mensaje: body,
          tipo,
          leida: false,
        })),
      });

      const pushMessages = users
        .filter(u => u.pushToken && this.isValidExpoPushToken(u.pushToken))
        .map(u => ({
          to: u.pushToken,
          sound: 'default',
          title,
          body,
          data: { ...data, tipo },
        }));

      if (pushMessages.length > 0) {
        await this.sendExpoPushBatch(pushMessages);
      }

      return { notifiedCount: users.length, pushCount: pushMessages.length };
    } catch (error) {
      console.error('[PushNotification] Error en notificación global:', error.message);
      throw error;
    }
  }
}

module.exports = new PushNotificationService();
