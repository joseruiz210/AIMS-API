const prisma = require('../../../config/database');
const evidenciaRepository = require('../repositories/evidenciaRepository');
const geminiService = require('./geminiService');
const AppError = require('../../../utils/appError');
const logAudit = require('../../../utils/auditLogger');
const pushNotificationService = require('../../notificaciones/services/pushNotificationService');

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

      const enrolledFichaIds = matriculas.map((m) => m.fichaId);
      if (enrolledFichaIds.length === 0) {
        // El aprendiz no está asignado a ninguna ficha, no debe ver evidencias de fichas ajenas
        return [];
      }

      if (query.fichaId) {
        if (!enrolledFichaIds.includes(query.fichaId)) {
          return [];
        }
        where.fichaId = query.fichaId;
      } else {
        where.fichaId = { in: enrolledFichaIds };
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

    let descripcion = data.descripcion;
    if (data.recursoUrl && data.recursoUrl.trim()) {
      descripcion += `\n\n🔗 **Recurso / Material de apoyo:** ${data.recursoUrl.trim()}`;
    }

    const evidencia = await evidenciaRepository.create({
      titulo: data.titulo,
      descripcion,
      fechaLimite: new Date(data.fechaLimite || Date.now() + 7 * 24 * 60 * 60 * 1000),
      fichaId,
      instructorId,
    });

    await logAudit(instructorId, 'CREAR_EVIDENCIA', { evidenciaId: evidencia.id, titulo: evidencia.titulo });

    // Disparar notificación push a los aprendices de la ficha
    pushNotificationService.notifyFicha(fichaId, {
      title: 'Nueva Evidencia Asignada',
      body: `Nueva tarea publicada: "${evidencia.titulo}".`,
      data: { tipo: 'EVIDENCIA', evidenciaId: evidencia.id, fichaId },
    }).catch((err) => console.error('[EvidenciaService] Error en notificación push:', err.message));

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

    // Validar estrictamente que el aprendiz pertenezca a la ficha asignada
    if (evidencia.fichaId) {
      const matricula = await prisma.matricula.findFirst({
        where: {
          aprendizId,
          fichaId: evidencia.fichaId,
        },
      });

      if (!matricula) {
        throw AppError.forbidden('No estás matriculado en la ficha asignada a esta actividad.');
      }
    }

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

    // 4. Sincronizar calificación en la tabla de calificaciones del aprendiz
    if (evaluacion && evaluacion.nota !== undefined) {
      try {
        const notaNum = Number(evaluacion.nota);
        const ficha = await prisma.ficha.findUnique({
          where: { id: evidencia.fichaId },
          include: { programa: { include: { competencias: true } } },
        });
        const compId = ficha?.programa?.competencias?.[0]?.id || null;

        if (compId) {
          const califExistente = await prisma.calificacion.findFirst({
            where: { aprendizId, competenciaId: compId },
          });

          if (califExistente) {
            await prisma.calificacion.update({
              where: { id: califExistente.id },
              data: {
                nota: notaNum,
                estado: notaNum >= 3.5 ? 'Aprobado' : 'Por Mejorar',
                instructorId: evidencia.instructorId || califExistente.instructorId,
              },
            });
          } else {
            await prisma.calificacion.create({
              data: {
                aprendizId,
                competenciaId: compId,
                instructorId: evidencia.instructorId,
                nota: notaNum,
                periodo: '2026-1',
                estado: notaNum >= 3.5 ? 'Aprobado' : 'Por Mejorar',
              },
            });
          }
        }
      } catch (syncErr) {
        console.error('[EvidenciaService] Error sincronizando calificación general:', syncErr.message);
      }
    }

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

    try {
      const notaNum = Number(nota);
      const ev = await prisma.evidencia.findUnique({
        where: { id: entrega.evidenciaId },
        include: { ficha: { include: { programa: { include: { competencias: true } } } } },
      });
      const compId = ev?.ficha?.programa?.competencias?.[0]?.id || null;
      if (compId) {
        const calif = await prisma.calificacion.findFirst({
          where: { aprendizId: entrega.aprendizId, competenciaId: compId },
        });
        if (calif) {
          await prisma.calificacion.update({
            where: { id: calif.id },
            data: {
              nota: notaNum,
              estado: notaNum >= 3.5 ? 'Aprobado' : 'Por Mejorar',
              instructorId: userId,
            },
          });
        } else {
          await prisma.calificacion.create({
            data: {
              aprendizId: entrega.aprendizId,
              competenciaId: compId,
              instructorId: userId,
              nota: notaNum,
              periodo: '2026-1',
              estado: notaNum >= 3.5 ? 'Aprobado' : 'Por Mejorar',
            },
          });
        }
      }
    } catch (syncErr) {
      console.error('[EvidenciaService] Error sincronizando calificacion docente:', syncErr.message);
    }

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
