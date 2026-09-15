const calificacionRepository = require('../repositories/calificacionRepository');
const logAudit = require('../../../utils/auditLogger');
const pushNotificationService = require('../../notificaciones/services/pushNotificationService');

class CalificacionService {
  async getMisCalificaciones(aprendizId) {
    return calificacionRepository.getCalificacionesByAprendiz(aprendizId);
  }

  async getCalificacionesByFicha(fichaId) {
    return calificacionRepository.getCalificacionesByFicha(fichaId);
  }

  async registrarCalificacion(userId, data) {
    const payload = {
      ...data,
      competenciaId: data.competenciaId || data.moduloId,
      instructorId: userId,
    };
    const result = await calificacionRepository.upsertCalificacion(payload);
    await logAudit(userId, 'REGISTRAR_CALIFICACION', { calificacionId: result.id, aprendizId: data.aprendizId, nota: data.nota });

    // Disparar notificación push al aprendiz calificado
    pushNotificationService.notifyUser(data.aprendizId, {
      title: 'Nueva Calificación Registrada',
      body: `Tu instructor ha registrado una calificación: ${data.nota} (${result.estado || 'Evaluado'}).`,
      data: { tipo: 'CALIFICACION', calificacionId: result.id },
    }).catch((err) => console.error('[CalificacionService] Error en notificación push:', err.message));

    return result;
  }
}

module.exports = new CalificacionService();
