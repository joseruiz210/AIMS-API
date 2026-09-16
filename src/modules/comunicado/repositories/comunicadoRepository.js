const prisma = require('../../../config/database');

class ComunicadoRepository {
  async create(data) {
    return prisma.comunicado.create({
      data,
      include: {
        autor: { select: { firstName: true, lastName: true, role: true } },
        ficha: { select: { id: true, numero: true } },
        _count: { select: { lecturas: true } },
      },
    });
  }

  // Verifica que la ficha exista y que ese instructor sea quien la dicta,
  // para que un instructor no pueda mandar avisos a fichas ajenas.
  async fichaPerteneceAInstructor(fichaId, instructorId) {
    const ficha = await prisma.ficha.findFirst({
      where: { id: fichaId, instructorId },
      select: { id: true, numero: true },
    });
    return ficha;
  }

  // Un usuario ve: los avisos globales (fichaId null) + los de su(s) propia(s)
  // ficha(s) según su rol (aprendiz matriculado / instructor a cargo).
  // El admin ve todo.
  async findVisiblesParaUsuario({ role, userId }) {
    let where = { fichaId: null };

    if (role === 'ADMIN') {
      where = {};
    } else if (role === 'INSTRUCTOR') {
      where = {
        OR: [{ fichaId: null }, { ficha: { instructorId: userId } }],
      };
    } else if (role === 'APRENDIZ') {
      where = {
        OR: [
          { fichaId: null },
          { ficha: { matriculas: { some: { aprendizId: userId } } } },
        ],
      };
    }

    const comunicados = await prisma.comunicado.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        autor: { select: { firstName: true, lastName: true, role: true } },
        ficha: { select: { id: true, numero: true } },
        _count: { select: { lecturas: true } },
      },
    });

    return comunicados.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      mensaje: c.mensaje,
      destinatario: c.destinatario,
      fichaId: c.fichaId,
      fichaNumero: c.ficha?.numero || null,
      autor: c.autor ? `${c.autor.firstName} ${c.autor.lastName}` : null,
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
