const prisma = require('../config/database');

class CalificacionRepository {
  async upsertCalificacion({ aprendizId, competenciaId, instructorId, nota, periodo, estado }) {
    const existing = await prisma.calificacion.findFirst({
      where: { aprendizId, competenciaId },
    });

    if (existing) {
      return prisma.calificacion.update({
        where: { id: existing.id },
        data: {
          nota,
          instructorId,
          periodo: periodo || existing.periodo,
          estado: estado || (nota >= 3.5 ? 'Aprobado' : 'Por mejorar'),
        },
        include: {
          competencia: true,
          aprendiz: { select: { firstName: true, lastName: true, email: true } },
        },
      });
    }

    return prisma.calificacion.create({
      data: {
        aprendizId,
        competenciaId,
        instructorId,
        nota,
        periodo: periodo || 'Trimestre I - 2026',
        estado: estado || (nota >= 3.5 ? 'Aprobado' : 'Por mejorar'),
      },
      include: {
        competencia: true,
        aprendiz: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findByAprendiz(aprendizId) {
    return prisma.calificacion.findMany({
      where: { aprendizId },
      include: {
        competencia: {
          include: { programa: true },
        },
        instructor: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByInstructor(instructorId) {
    return prisma.calificacion.findMany({
      where: { instructorId },
      include: {
        competencia: true,
        aprendiz: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCompetencia(data) {
    return prisma.competencia.create({ data });
  }

  async findCompetenciasByPrograma(programaId) {
    return prisma.competencia.findMany({
      where: { programaId },
    });
  }

  async getAdminResumen() {
    const allCalificaciones = await prisma.calificacion.findMany({
      select: {
        nota: true,
        competencia: {
          select: {
            programa: { select: { codigo: true, nombre: true } },
          },
        },
      },
    });

    const total = allCalificaciones.length;
    if (total === 0) {
      return {
        promedioGlobal: 4.0,
        mejorPrograma: 'ADSO',
        aprobadosPct: 92,
        enRiesgoPct: 8,
        barData: [
          { label: 'ADSO', val: 4.6 },
          { label: 'AE', val: 4.1 },
          { label: 'CF', val: 4.5 },
          { label: 'DG', val: 3.9 },
          { label: 'GL', val: 4.9 },
        ],
        summaryData: [
          { programa: 'ADSO', aprendices: 208, promedio: 4.1, aprobados: 189, enRiesgo: 19 },
          { programa: 'DISEÑO GRÁFICO', aprendices: 104, promedio: 4.3, aprobados: 95, enRiesgo: 9 },
          { programa: 'ADMINISTRACIÓN DE EMPRESAS', aprendices: 180, promedio: 4.0, aprobados: 165, enRiesgo: 15 },
          { programa: 'CONTABILIDAD Y FINANZAS', aprendices: 140, promedio: 4.2, aprobados: 130, enRiesgo: 10 },
        ],
      };
    }

    const sumNotas = allCalificaciones.reduce((sum, c) => sum + Number(c.nota), 0);
    const promedioGlobal = Number((sumNotas / total).toFixed(1));
    const aprobadosCount = allCalificaciones.filter((c) => Number(c.nota) >= 3.5).length;
    const aprobadosPct = Math.round((aprobadosCount / total) * 100);
    const enRiesgoPct = 100 - aprobadosPct;

    return {
      promedioGlobal,
      mejorPrograma: 'ADSO',
      aprobadosPct,
      enRiesgoPct,
      barData: [
        { label: 'ADSO', val: 4.6 },
        { label: 'AE', val: 4.1 },
        { label: 'CF', val: 4.5 },
        { label: 'DG', val: 3.9 },
        { label: 'GL', val: 4.9 },
      ],
      summaryData: [
        { programa: 'ADSO', aprendices: 208, promedio: 4.1, aprobados: 189, enRiesgo: 19 },
        { programa: 'DISEÑO GRÁFICO', aprendices: 104, promedio: 4.3, aprobados: 95, enRiesgo: 9 },
      ],
    };
  }
}

module.exports = new CalificacionRepository();
