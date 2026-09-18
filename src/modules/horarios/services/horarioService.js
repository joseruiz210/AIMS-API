const horarioRepository = require('../repositories/horarioRepository');
const logAudit = require('../../../utils/auditLogger');
const prisma = require('../../../config/database');
const AppError = require('../../../utils/appError');
const pushNotificationService = require('../../notificaciones/services/pushNotificationService');

class HorarioService {
  async getMiHorario(aprendizId) {
    return horarioRepository.getHorarioByAprendiz(aprendizId);
  }

  async getByFicha(fichaId) {
    return horarioRepository.getByFicha(fichaId);
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

    const diaSemanaStr = String(data.diaSemana);
    const aulaStr = data.aula || (data.tema && data.ambiente ? `${data.tema} • ${data.ambiente}` : data.ambiente || data.tema || null);

    const horario = await prisma.horario.create({
      data: {
        fichaId: data.fichaId,
        diaSemana: diaSemanaStr,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        aula: aulaStr,
      },
    });
    await logAudit(userId, 'CREAR_HORARIO', { horarioId: horario.id, fichaId: data.fichaId });

    // Disparar notificación push a los aprendices de la ficha
    pushNotificationService.notifyFicha(data.fichaId, {
      title: 'Nuevo Horario Publicado',
      body: `Se ha registrado una sesión para día ${diaSemanaStr} de ${data.horaInicio} a ${data.horaFin}${aulaStr ? ' (' + aulaStr + ')' : ''}.`,
      data: { tipo: 'HORARIO', horarioId: horario.id, fichaId: data.fichaId },
    }).catch((err) => console.error('[HorarioService] Error en notificación push:', err.message));

    return horario;
  }

  async update(userId, id, data) {
    const existing = await prisma.horario.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Horario no encontrado');

    const requester = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (requester?.role === 'INSTRUCTOR') {
      const ficha = await prisma.ficha.findFirst({ where: { id: existing.fichaId, instructorId: userId } });
      if (!ficha) {
        let assignment = null;
        try {
          assignment = await prisma.instructorFicha.findFirst({ where: { fichaId: existing.fichaId, instructorId: userId } });
        } catch (error) {
          if (error.code !== 'P2021') throw error;
        }
        if (!assignment) throw AppError.forbidden('No tienes acceso a esta ficha');
      }
    }

    const aulaStr = data.aula !== undefined
      ? data.aula
      : (data.tema && data.ambiente ? `${data.tema} • ${data.ambiente}` : data.ambiente || data.tema || undefined);

    const updated = await prisma.horario.update({
      where: { id },
      data: {
        ...(data.diaSemana !== undefined ? { diaSemana: String(data.diaSemana) } : {}),
        ...(data.horaInicio ? { horaInicio: data.horaInicio } : {}),
        ...(data.horaFin ? { horaFin: data.horaFin } : {}),
        ...(aulaStr !== undefined ? { aula: aulaStr } : {}),
      },
    });

    await logAudit(userId, 'ACTUALIZAR_HORARIO', { horarioId: id, fichaId: existing.fichaId });
    return updated;
  }

  async delete(userId, id) {
    const existing = await prisma.horario.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Horario no encontrado');

    await prisma.horario.delete({ where: { id } });
    await logAudit(userId, 'ELIMINAR_HORARIO', { horarioId: id, fichaId: existing.fichaId });
    return true;
  }
}

module.exports = new HorarioService();
