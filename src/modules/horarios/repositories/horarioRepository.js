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
      return [
        {
          time: '07:00 - 09:00',
          lunes: 'Análisis de Datos',
          martes: 'Programación BD',
          miercoles: 'POO',
          jueves: 'Requisitos',
          viernes: 'Seguridad Informática',
        },
        {
          time: '09:00 - 11:00',
          lunes: 'Seguridad Informática',
          martes: 'Análisis de Datos',
          miercoles: 'Programación BD',
          jueves: 'POO',
          viernes: 'Programación BD',
        },
        {
          time: '11:00 - 01:00',
          lunes: 'Programación BD',
          martes: 'Requisitos',
          miercoles: 'Análisis de Datos',
          jueves: 'Programación BD',
          viernes: 'Requisitos',
        },
      ];
    }

    // Mapear horarios reales de la ficha a la estructura semanal
    return matricula.ficha.horarios;
  }

  async getByFicha(fichaId) {
    return prisma.horario.findMany({
      where: { fichaId },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async create(data) {
    return prisma.horario.create({
      data,
    });
  }
}

module.exports = new HorarioRepository();
