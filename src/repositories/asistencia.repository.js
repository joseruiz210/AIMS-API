const prisma = require('../config/database');

class AsistenciaRepository {
  async createSesionWithRegistros({ fichaId, fecha, tema, registros }) {
    return prisma.sesionAsistencia.create({
      data: {
        fichaId,
        fecha: fecha ? new Date(fecha) : new Date(),
        tema,
        registros: {
          create: registros.map((r) => ({
            aprendizId: r.aprendizId,
            estado: r.estado,
            observacion: r.observacion || null,
          })),
        },
      },
      include: {
        registros: {
          include: {
            aprendiz: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async findSesionesByFicha(fichaId) {
    return prisma.sesionAsistencia.findMany({
      where: { fichaId },
      orderBy: { fecha: 'desc' },
      include: {
        registros: {
          include: {
            aprendiz: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async findRegistrosByAprendiz(aprendizId) {
    return prisma.registroAsistencia.findMany({
      where: { aprendizId },
      orderBy: { createdAt: 'desc' },
      include: {
        sesion: {
          include: {
            ficha: {
              include: { programa: true },
            },
          },
        },
      },
    });
  }

  async getGlobalStats() {
    const totalSesiones = await prisma.sesionAsistencia.count();
    const totalRegistros = await prisma.registroAsistencia.count();
    const presentes = await prisma.registroAsistencia.count({
      where: { estado: 'Presente' },
    });

    const promedioGlobal = totalRegistros > 0 ? Math.round((presentes / totalRegistros) * 100) : 100;

    return {
      totalSesiones,
      totalRegistros,
      promedioGlobal,
    };
  }

  async getResumenPorFicha() {
    const fichas = await prisma.ficha.findMany({
      select: {
        id: true,
        numero: true,
        programa: {
          select: { codigo: true, nombre: true },
        },
        instructor: {
          select: { firstName: true, lastName: true },
        },
        _count: { select: { matriculas: true } },
        sesiones: {
          select: {
            registros: {
              select: { estado: true },
            },
          },
        },
      },
    });

    return fichas.map((f) => {
      let totalRegistros = 0;
      let presentes = 0;

      f.sesiones.forEach((s) => {
        s.registros.forEach((r) => {
          totalRegistros++;
          if (r.estado === 'Presente') presentes++;
        });
      });

      const asistenciaPct = totalRegistros > 0 ? Math.round((presentes / totalRegistros) * 100) : 100;
      const estado = asistenciaPct < 85 ? 'Riesgo' : 'Activo';

      return {
        ficha: f.numero,
        fichaId: f.id,
        programa: f.programa?.codigo || f.programa?.nombre || '',
        instructor: f.instructor ? `${f.instructor.firstName} ${f.instructor.lastName}` : '',
        aprendices: f._count?.matriculas || 0,
        asistenciaPct,
        estado,
      };
    });
  }

  async getResumenPorPrograma() {
    const programas = await prisma.programa.findMany({
      select: {
        codigo: true,
        nombre: true,
        fichas: {
          select: {
            sesiones: {
              select: {
                registros: {
                  select: { estado: true },
                },
              },
            },
          },
        },
      },
    });

    return programas.map((p) => {
      let totalRegistros = 0;
      let presentes = 0;

      p.fichas.forEach((f) => {
        f.sesiones.forEach((s) => {
          s.registros.forEach((r) => {
            totalRegistros++;
            if (r.estado === 'Presente') presentes++;
          });
        });
      });

      const pct = totalRegistros > 0 ? Math.round((presentes / totalRegistros) * 100) : 90;

      return {
        name: p.codigo || p.nombre,
        pct,
      };
    });
  }
}

module.exports = new AsistenciaRepository();
