const prisma = require('../../../config/database');

class FichaRepository {
  async getAll() {
    return prisma.ficha.findMany({
      include: {
        programa: {
          select: { id: true, nombre: true, codigo: true },
        },
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { aprendices: true, horarios: true },
          select: { matriculas: true, horarios: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id) {
    return prisma.ficha.findUnique({
      where: { id },
      include: {
        programa: true,
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        matriculas: {
          include: {
            aprendiz: {
              select: { id: true, firstName: true, lastName: true, email: true, estadoAcademico: true },
            },
          },
        },
        horarios: true,
      },
    });
  }

  async create(data) {
    return prisma.ficha.create({
      data: {
        numero: data.numero,
        jornada: data.jornada,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        programaId: data.programaId,
        instructorId: data.instructorId || null,
      },
    });
  }

  async update(id, data) {
    const updateData = { ...data };
    if (updateData.fechaInicio) updateData.fechaInicio = new Date(updateData.fechaInicio);
    if (updateData.fechaFin) updateData.fechaFin = new Date(updateData.fechaFin);

    return prisma.ficha.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id) {
    return prisma.ficha.delete({
      where: { id },
    });
  }

  async findByNumero(numero) {
    return prisma.ficha.findUnique({
      where: { numero },
    });
  }

  async addAprendiz(fichaId, aprendizId) {
    return prisma.matricula.create({
      data: {
        fichaId,
        aprendizId,
      },
    });
  }

  async removeAprendiz(fichaId, aprendizId) {
    return prisma.matricula.delete({
      where: {
        fichaId_aprendizId: {
          fichaId,
          aprendizId,
        },
      },
    });
  }

  async isAprendizInFicha(fichaId, aprendizId) {
    const record = await prisma.matricula.findUnique({
      where: {
        fichaId_aprendizId: {
          fichaId,
          aprendizId,
        },
      },
    });
    return !!record;
  }
}

module.exports = new FichaRepository();
