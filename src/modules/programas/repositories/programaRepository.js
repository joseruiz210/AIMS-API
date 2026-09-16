const prisma = require('../../../config/database');

class ProgramaRepository {
  async getAll() {
    return prisma.programa.findMany({
      include: {
        _count: {
          select: { fichas: true, modulos: true },
        },
      },
      orderBy: { nombre: 'asc' },
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
