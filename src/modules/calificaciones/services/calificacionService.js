const calificacionRepository = require('../repositories/calificacionRepository');
const logAudit = require('../../../utils/auditLogger');
const prisma = require('../../../config/database');
const AppError = require('../../../utils/appError');

class CalificacionService {
  async getMisCalificaciones(aprendizId) {
    return calificacionRepository.getCalificacionesByAprendiz(aprendizId);
  }

  async getCalificacionesByFicha(fichaId, user) {
    await this.assertFichaAccess(fichaId, user);
    return calificacionRepository.getCalificacionesByFicha(fichaId);
  }

  async registrarCalificacion(userId, data, userRole = 'INSTRUCTOR') {
    await this.assertFichaAccess(data.fichaId, { id: userId, role: userRole });
    const payload = {
      ...data,
      competenciaId: data.competenciaId || data.moduloId,
      instructorId: userId,
    };
    const result = await calificacionRepository.upsertCalificacion(payload);
    await logAudit(userId, 'REGISTRAR_CALIFICACION', { calificacionId: result.id, aprendizId: data.aprendizId, nota: data.nota });
    return result;
  }

  async assertFichaAccess(fichaId, user) {
    if (user.role !== 'INSTRUCTOR') return;
    const ficha = await prisma.ficha.findFirst({ where: { id: fichaId, instructorId: user.id } });
    if (ficha) return;
    let assignment = null;
    try {
      assignment = await prisma.instructorFicha.findFirst({ where: { fichaId, instructorId: user.id } });
    } catch (error) {
      if (error.code !== 'P2021') throw error;
    }
    if (!assignment) throw AppError.forbidden('No tienes acceso a esta ficha');
  }
}

module.exports = new CalificacionService();
