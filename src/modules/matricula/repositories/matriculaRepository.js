const prisma = require('../../../config/database');

class MatriculaRepository {
  async create(data) {
    return prisma.matricula.create({
      data,
      include: {
        ficha: {
          include: { programa: true },
        },
        aprendiz: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });
  }

  async findById(id) {
    return prisma.matricula.findUnique({
      where: { id },
      include: {
        ficha: {
          include: { programa: true, instructor: true },
        },
        aprendiz: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });
  }

  async findExisting(fichaId, aprendizId) {
    return prisma.matricula.findUnique({
      where: {
        fichaId_aprendizId: { fichaId, aprendizId },
      },
    });
  }

  async findByAprendizId(aprendizId) {
    return prisma.matricula.findFirst({
      where: { aprendizId },
      include: {
        ficha: {
          include: { programa: true },
        },
      },
    });
  }

  async findAll({ skip = 0, take = 10, where = {}, orderBy = { createdAt: 'desc' } }) {
    const [matriculas, total] = await prisma.$transaction([
      prisma.matricula.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          ficha: {
            include: { programa: true },
          },
          aprendiz: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      }),
      prisma.matricula.count({ where }),
    ]);

    return { matriculas, total };
  }

  async update(id, data) {
    return prisma.matricula.update({
      where: { id },
      data,
      include: {
        ficha: {
          include: { programa: true },
        },
        aprendiz: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async delete(id) {
    return prisma.matricula.delete({
      where: { id },
    });
  }
}

module.exports = new MatriculaRepository();
