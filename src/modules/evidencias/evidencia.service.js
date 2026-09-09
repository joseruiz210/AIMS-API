const prisma = require('../../config/database');
const evidenciaRepository = require('./evidencia.repository');
const geminiService = require('../../services/gemini.service');
const AppError = require('../../utils/appError');
const logAudit = require('../../utils/auditLogger');

class EvidenciaService {
  async getAll(query = {}, user) {
    const where = {};
    let aprendizId = null;

    if (query.fichaId) {
      where.fichaId = query.fichaId;
    }

    if (user.role === 'INSTRUCTOR') {
      where.instructorId = user.id;
      // Si el instructor especificó ficha, se filtra por ella; si no, por sus fichas asignadas o instructorId
      if (!query.fichaId) {
        where.OR = [
          { instructorId: user.id },
          { ficha: { instructorId: user.id } },
        ];
      }
    } else if (user.role === 'APRENDIZ') {
      aprendizId = user.id;
      // Consultar fichas en las que está matriculado el aprendiz
      const matriculas = await prisma.matricula.findMany({
        where: { aprendizId: user.id },
        select: { fichaId: true },
      });

      if (matriculas.length > 0) {
        where.fichaId = { in: matriculas.map((m) => m.fichaId) };
      }
    }
    return evidenciaRepository.getAll(where, aprendizId);
  }

  async getById(id) {
    const evidencia = await evidenciaRepository.getById(id);
    if (!evidencia) {
      throw AppError.notFound('Evidencia no encontrada en la base de datos');
    }
    return evidencia;
  }

  async create(instructorId, data) {
    let fichaId = data.fichaId;
    if (!fichaId) {
      const fichaDefault = await prisma.ficha.findFirst({
        where: { OR: [{ instructorId }, { estado: 'Activo' }] },
      });
      if (!fichaDefault) {
        throw AppError.badRequest('No hay fichas académicas disponibles en el sistema.');
      }
      fichaId = fichaDefault.id;
    }

    const evidencia = await evidenciaRepository.create({
      titulo: data.titulo,
      descripcion: data.descripcion,
      fechaLimite: new Date(data.fechaLimite || Date.now() + 7 * 24 * 60 * 60 * 1000),
      fichaId,
      instructorId,
    });

    await logAudit(instructorId, 'CREAR_EVIDENCIA', { evidenciaId: evidencia.id, titulo: evidencia.titulo });
    return evidencia;
  }

  async update(userId, id, data) {
    await this.getById(id);
    const updateData = { ...data };
    if (data.fechaLimite) {
      updateData.fechaLimite = new Date(data.fechaLimite);
    }
    const evidencia = await evidenciaRepository.update(id, updateData);
    await logAudit(userId, 'ACTUALIZAR_EVIDENCIA', { evidenciaId: evidencia.id });
    return evidencia;
  }

  async delete(userId, id) {
    await this.getById(id);
    const evidencia = await evidenciaRepository.delete(id);
    await logAudit(userId, 'ELIMINAR_EVIDENCIA', { evidenciaId: id });
    return evidencia;
  }

  async entregar(aprendizId, evidenciaId, data) {
    // 1. Obtener la evidencia directamente de PostgreSQL
    const evidencia = await this.getById(evidenciaId);

    // 2. Evaluación pedagógica formativa
    let evaluacion = null;
    try {
      evaluacion = await geminiService.calificarEntrega({
        titulo: evidencia.titulo,
        descripcion: evidencia.descripcion,
        archivoUrl: data.archivoUrl,
        comentario: data.comentario,
      });
    } catch (error) {
      console.error('[EvidenciaService] Error en evaluación automatizada:', error.message);
    }

    const payloadEntrega = {
      ...data,
      archivoUrl: data.archivoUrl || null,
      comentario: data.comentario || null,
      nota: evaluacion ? evaluacion.nota : undefined,
      feedback: evaluacion ? evaluacion.feedbackCompleto : undefined,
    };

    // 3. Persistencia estricta en PostgreSQL (tabla entrega_evidencias)
    const entrega = await evidenciaRepository.upsertEntrega(evidenciaId, aprendizId, payloadEntrega);

    await logAudit(aprendizId, 'ENTREGAR_EVIDENCIA', {
      evidenciaId,
      entregaId: entrega.id,
      nota: evaluacion?.nota,
      aprobado: evaluacion?.aprobado,
    });

    return {
      ...entrega,
      nota: entrega.nota !== null && entrega.nota !== undefined ? Number(entrega.nota) : evaluacion?.nota,
      feedback: payloadEntrega.feedback || entrega.comentario,
      evaluacion,
    };
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

  async generarPropuestaIa(data) {
    return geminiService.generarPropuestaActividad(data);
  }
}

module.exports = new EvidenciaService();
