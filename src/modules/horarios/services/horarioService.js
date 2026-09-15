const horarioRepository = require('../repositories/horarioRepository');
const logAudit = require('../../../utils/auditLogger');

class HorarioService {
  async getMiHorario(aprendizId) {
    return horarioRepository.getHorarioByAprendiz(aprendizId);
  }

  async create(userId, data) {
    const horario = await horarioRepository.create(data);
    await logAudit(userId, 'CREAR_HORARIO', { horarioId: horario.id, fichaId: data.fichaId });
    return horario;
  }
}

module.exports = new HorarioService();
