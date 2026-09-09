const asistenciaRepository = require('./asistencia.repository');
const logAudit = require('../../utils/auditLogger');

class AsistenciaService {
  async getMisAsistencias(aprendizId) {
    const data = await asistenciaRepository.getAsistenciaByAprendiz(aprendizId);
    if (!data) {
      return {
        porcentajeGlobal: 100,
        horasFaltas: 0,
        asistenciaData: [
          { subject: 'Análisis de Datos', totalClasses: 20, attended: 18, percentage: 90 },
          { subject: 'POO', totalClasses: 25, attended: 20, percentage: 80 },
          { subject: 'Requisitos', totalClasses: 15, attended: 15, percentage: 100 },
          { subject: 'Programación BD', totalClasses: 30, attended: 27, percentage: 90 },
        ],
      };
    }
    return data;
  }

  async getAsistenciasByFicha(fichaId, fecha) {
    return asistenciaRepository.getAsistenciasByFicha(fichaId, fecha);
  }

  async registrarAsistenciaSesion(userId, data) {
    const result = await asistenciaRepository.registrarAsistenciaSesion(data);
    await logAudit(userId, 'REGISTRAR_ASISTENCIA', { cantidad: result.length });
    return result;
  }
}

module.exports = new AsistenciaService();
