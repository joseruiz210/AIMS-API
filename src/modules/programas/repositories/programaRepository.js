const prisma = require('../../../config/database');

class ProgramaRepository {
  async getAll() {
    const programas = await prisma.programa.findMany({
      include: {
        _count: {
          select: { fichas: true, competencias: true },
        },
        fichas: {
          select: {
            matriculas: {
              select: { aprendizId: true },
            },
            instructorAssignments: {
              select: { instructorId: true },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return programas.map((p) => {
      // Deduplica aprendices por programa (usuarios aprendices únicos en el programa)
      const aprendicesSet = new Set();
      p.fichas.forEach((f) => {
        f.matriculas?.forEach((m) => {
          if (m.aprendizId) aprendicesSet.add(m.aprendizId);
        });
      });

      // Deduplica instructores (un instructor puede estar en varias fichas)
      const instructoresSet = new Set();
      p.fichas.forEach((f) => {
        f.instructorAssignments?.forEach((a) => {
          if (a.instructorId) instructoresSet.add(a.instructorId);
        });
      });

      return {
        ...p,
        aprendicesCount: aprendicesSet.size,
        instructoresCount: instructoresSet.size,
      };
    });
  }

  async getById(id) {
    return prisma.programa.findUnique({
      where: { id },
      include: {
        fichas: true,
        modulos: true,
      },
    });
  }

  async create(data) {
    return prisma.programa.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.programa.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.programa.delete({
      where: { id },
    });
  }

  async findByCodigo(codigo) {
    return prisma.programa.findUnique({
      where: { codigo },
    });
  }
}

module.exports = new ProgramaRepository();
