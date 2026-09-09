const prisma = require('../config/database');

/**
 * Registrar una acción en los logs de auditoría de forma asíncrona y no bloqueante.
 * No interrumpe ni retrasa la respuesta HTTP al cliente y maneja errores de forma segura.
 * @param {string|null} userId ID del usuario que realizó la acción
 * @param {string} accion Nombre/descripción de la acción (ej: 'CREAR_USUARIO', 'REGISTRAR_ASISTENCIA')
 * @param {object|string} [detalles] Detalles adicionales
 * @returns {Promise<void>}
 */
const logAudit = (userId, accion, detalles = null) => {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve();
  }

  // Ejecución en segundo plano para no bloquear el ciclo de respuesta HTTP
  setImmediate(async () => {
    try {
      const detallesStr = typeof detalles === 'object' && detalles !== null 
        ? JSON.stringify(detalles) 
        : detalles;

      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          accion,
          detalles: detallesStr,
        },
      });
    } catch (error) {
      console.error('[AUDIT_LOGGER_ERROR] Error al guardar log de auditoría:', error.message);
    }
  });

  return Promise.resolve();
};

module.exports = logAudit;
