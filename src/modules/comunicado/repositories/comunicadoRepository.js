const prisma = require('../../../config/database');

class ComunicadoRepository {
  async create(data) {
    return prisma.comunicado.create({
      data,
      include: {
        admin: { select: { firstName: true, lastName: true } },
        _count: { select: { lecturas: true } },
      },
    });
  }

  async findAll() {
    const comunicados = await prisma.comunicado.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { firstName: true, lastName: true } },
        _count: { select: { lecturas: true } },
      },
    });

    return comunicados.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      mensaje: c.mensaje,
      destinatario: c.destinatario,
      fecha: c.createdAt.toISOString().split('T')[0],
      leidos: c._count?.lecturas || 0,
    }));
  }

  async registerLectura(comunicadoId, userId) {
    return prisma.lecturaComunicado.upsert({
      where: {
        comunicadoId_userId: { comunicadoId, userId },
      },
      update: { leidoAt: new Date() },
      create: { comunicadoId, userId },
    });
  }
}

module.exports = new ComunicadoRepository();
