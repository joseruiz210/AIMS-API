const calificacionRepository = require('./calificacion.repository');
const logAudit = require('../../utils/auditLogger');

class CalificacionService {
  async getMisCalificaciones(aprendizId) {
    return calificacionRepository.getCalificacionesByAprendiz(aprendizId);
  }

  async getCalificacionesByFicha(fichaId) {
    return calificacionRepository.getCalificacionesByFicha(fichaId);
  }

  async registrarCalificacion(userId, data) {
    const result = await calificacionRepository.upsertCalificacion(data);
    const payload = {
      ...data,
      competenciaId: data.competenciaId || data.moduloId,
      instructorId: userId,
    };
    const result = await calificacionRepository.upsertCalificacion(payload);
    await logAudit(userId, 'REGISTRAR_CALIFICACION', { calificacionId: result.id, aprendizId: data.aprendizId, nota: data.nota });
    return result;
  }
}

module.exports = new CalificacionService();
