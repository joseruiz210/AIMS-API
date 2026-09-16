const horarioRepository = require('../repositories/horarioRepository');
const logAudit = require('../../../utils/auditLogger');
const prisma = require('../../../config/database');
const AppError = require('../../../utils/appError');

class HorarioService {
  async getMiHorario(aprendizId) {
    return horarioRepository.getHorarioByAprendiz(aprendizId);
  }

  async create(userId, data) {
    const ficha = await prisma.ficha.findFirst({ where: { id: data.fichaId, instructorId: userId } });
    const requester = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (requester?.role === 'INSTRUCTOR' && !ficha) {
      let assignment = null;
      try {
        assignment = await prisma.instructorFicha.findFirst({ where: { fichaId: data.fichaId, instructorId: userId } });
      } catch (error) {
        if (error.code !== 'P2021') throw error;
      }
      if (!assignment) throw AppError.forbidden('No tienes acceso a esta ficha');
    }
    const horario = await horarioRepository.create(data);
    await logAudit(userId, 'CREAR_HORARIO', { horarioId: horario.id, fichaId: data.fichaId });
    return horario;
  }
}

module.exports = new HorarioService();
