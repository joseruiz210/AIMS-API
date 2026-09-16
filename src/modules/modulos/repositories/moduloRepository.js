const prisma = require('../../../config/database');

class ModuloRepository {
  async getAll(where = {}) {
    return prisma.modulo.findMany({
      where,
      include: {
        programa: {
          select: { id: true, nombre: true, codigo: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getById(id) {
    return prisma.modulo.findUnique({
      where: { id },
      include: {
        programa: true,
        calificaciones: true,
      },
    });
  }

  async create(data) {
    return prisma.modulo.create({
      data,
      include: {
        programa: {
          select: { id: true, nombre: true, codigo: true },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.modulo.update({
      where: { id },
      data,
      include: {
        programa: {
          select: { id: true, nombre: true, codigo: true },
        },
      },
    });
  }

  async delete(id) {
    return prisma.modulo.delete({
      where: { id },
    });
  }
}

module.exports = new ModuloRepository();
