const evidenciaRepository = require('./evidencia.repository');
const AppError = require('../../utils/appError');
const logAudit = require('../../utils/auditLogger');

class EvidenciaService {
  async getAll(query = {}, user) {
    const where = {};
    if (query.fichaId) {
      where.fichaId = query.fichaId;
    }
    if (user.role === 'INSTRUCTOR') {
      where.instructorId = user.id;
    }
    return evidenciaRepository.getAll(where);
  }

  async getById(id) {
    const evidencia = await evidenciaRepository.getById(id);
    if (!evidencia) {
      throw AppError.notFound('Evidencia no encontrada');
    }
    return evidencia;
  }

  async create(instructorId, data) {
    const evidencia = await evidenciaRepository.create({
      ...data,
      fechaLimite: new Date(data.fechaLimite),
      instructorId,
    });
    await logAudit(instructorId, 'CREAR_EVIDENCIA', { evidenciaId: evidencia.id, titulo: evidencia.titulo });
    return evidencia;
  }

  async update(userId, id, data) {
    const updateData = { ...data };
    if (data.fechaLimite) {
      updateData.fechaLimite = new Date(data.fechaLimite);
    }
    const evidencia = await evidenciaRepository.update(id, updateData);
    await logAudit(userId, 'ACTUALIZAR_EVIDENCIA', { evidenciaId: evidencia.id });
    return evidencia;
  }

  async delete(userId, id) {
    const evidencia = await evidenciaRepository.delete(id);
    await logAudit(userId, 'ELIMINAR_EVIDENCIA', { evidenciaId: id });
    return evidencia;
  }

  async entregar(aprendizId, evidenciaId, data) {
    await this.getById(evidenciaId);
    const entrega = await evidenciaRepository.upsertEntrega(evidenciaId, aprendizId, data);
    await logAudit(aprendizId, 'ENTREGAR_EVIDENCIA', { evidenciaId, entregaId: entrega.id });
    return entrega;
  }

  async calificarEntrega(userId, entregaId, nota) {
    const entrega = await evidenciaRepository.calificarEntrega(entregaId, nota);
    await logAudit(userId, 'CALIFICAR_ENTREGA', { entregaId, nota });
    return entrega;
  }

  async getEntregas(evidenciaId) {
    await this.getById(evidenciaId);
    return evidenciaRepository.getEntregasByEvidencia(evidenciaId);
  }
}

module.exports = new EvidenciaService();
