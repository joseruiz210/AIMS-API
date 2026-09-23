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
            _count: {
              select: { matriculas: true },
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
      const aprendicesCount = p.fichas.reduce(
        (acc, f) => acc + (f._count?.matriculas || 0),
        0
      );
      // Deduplica instructores (un instructor puede estar en varias fichas)
      const instructoresSet = new Set();
      p.fichas.forEach((f) => {
        f.instructorAssignments.forEach((a) => instructoresSet.add(a.instructorId));
      });

      return {
        ...p,
        aprendicesCount,
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
