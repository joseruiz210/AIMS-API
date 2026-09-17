const prisma = require('../../../config/database');

class HorarioRepository {
  async getHorarioByAprendiz(aprendizId) {
    let matricula = null;
    try {
      matricula = await prisma.matricula.findFirst({
        where: { aprendizId },
        include: {
          ficha: {
            include: {
              horarios: true,
            },
          },
        },
      });
    } catch (err) {
      console.error('[HorarioRepository] Error:', err.message);
    }

    if (!matricula || !matricula.ficha?.horarios || matricula.ficha.horarios.length === 0) {
      return [];
    }

    // Mapear horarios reales de la ficha a la estructura semanal
    return matricula.ficha.horarios;
  }

  async create(data) {
    return prisma.horario.create({
      data,
    });
  }
}

module.exports = new HorarioRepository();
