const prisma = require('../../../config/database');

class ObservacionRepository {
  async create(data) {
    return prisma.observacion.create({
      data,
      include: {
        aprendiz: { select: { id: true, firstName: true, lastName: true, email: true } },
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findByAprendiz(aprendizId) {
    return prisma.observacion.findMany({
      where: { aprendizId },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findByInstructor(instructorId) {
    return prisma.observacion.findMany({
      where: { instructorId },
      include: {
        aprendiz: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findAll({ skip = 0, take = 10, where = {} }) {
    const [observaciones, total] = await Promise.all([
      prisma.observacion.findMany({
        where,
        skip,
        take,
        orderBy: { fecha: 'desc' },
        include: {
          aprendiz: { select: { id: true, firstName: true, lastName: true, email: true } },
          instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.observacion.count({ where }),
    ]);

    return { observaciones, total };
  }

  async delete(id) {
    return prisma.observacion.delete({ where: { id } });
  }
}

module.exports = new ObservacionRepository();
