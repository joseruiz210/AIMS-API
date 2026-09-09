const prisma = require('../config/database');

/**
 * Registrar una accion en los logs de auditoria de forma asincrona.
 * El registro se desacopla del flujo principal de la peticion usando
 * setImmediate, para que la respuesta HTTP no espere la escritura en BD.
 *
 * @param {string|null} userId ID del usuario que realizo la accion
 * @param {string} accion Nombre/descripcion de la accion (ej: 'CREAR_USUARIO')
 * @param {object|string} [detalles] Detalles adicionales
 */
const logAudit = (userId, accion, detalles = null) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const detallesStr =
    typeof detalles === 'object' && detalles !== null
      ? JSON.stringify(detalles)
      : detalles;

  // Fire-and-forget: se encola en el siguiente tick del event loop.
  // La peticion HTTP responde al cliente SIN esperar este write.
  setImmediate(() => {
    prisma.auditLog
      .create({
        data: {
          userId: userId || null,
          accion,
          detalles: detallesStr,
        },
      })
      .catch((error) => {
        console.error('Error al guardar log de auditoria:', error.message);
      });
  });
};

module.exports = logAudit;
