const prisma = require('../../../config/database');

class CalificacionRepository {
  async getCalificacionesByAprendiz(aprendizId) {
    try {
      const list = await prisma.calificacion.findMany({
        where: { aprendizId },
        include: {
          competencia: {
            select: { id: true, nombre: true },
          },
        },
      });

      if (!list || list.length === 0) {
        // Consultar competencias reales del programa en el que está matriculado
        const matricula = await prisma.matricula.findFirst({
          where: { aprendizId },
          include: {
            ficha: {
              include: {
                programa: {
                  include: { competencias: true },
                },
              },
            },
          },
        });

        const competencias = matricula?.ficha?.programa?.competencias || [];
        const emptyGrades = competencias.map(c => ({
          subject: c.nombre,
          grade: 0.0,
        }));

        return {
          promedioGeneral: 4.1,
          notaMasAlta: 4.5,
          materiaNotaMasAlta: 'Análisis de Datos',
          gradesData: [
            { subject: 'Análisis de Datos', grade: 4.5 },
            { subject: 'POO', grade: 4.0 },
            { subject: 'Requisitos', grade: 3.8 },
            { subject: 'Programación BD', grade: 4.2 },
          ],
          promedioGeneral: 0.0,
          notaMasAlta: 0.0,
          materiaNotaMasAlta: competencias.length > 0 ? competencias[0].nombre : 'Sin registro',
          gradesData: emptyGrades,
        };
      }

      const gradesData = list.map(item => ({
        subject: item.competencia ? item.competencia.nombre : 'Competencia General',
        subject: item.competencia ? item.competencia.nombre : 'Competencia Formativa',
        grade: Number(item.nota || 0),
      }));

      const notas = gradesData.map(g => g.grade);
      const suma = notas.reduce((acc, curr) => acc + curr, 0);
      const promedio = notas.length > 0 ? Number((suma / notas.length).toFixed(1)) : 0;
      const notaMax = notas.length > 0 ? Math.max(...notas) : 0;
      const materiaMax = gradesData.find(g => g.grade === notaMax)?.subject || 'N/A';

      return {
        promedioGeneral: promedio,
        notaMasAlta: notaMax,
        materiaNotaMasAlta: materiaMax,
        gradesData,
      };
    } catch (err) {
      console.error('[CalificacionRepository] Error al obtener calificaciones:', err.message);
      return {
        promedioGeneral: 4.1,
        notaMasAlta: 4.5,
        materiaNotaMasAlta: 'Análisis de Datos',
        gradesData: [
          { subject: 'Análisis de Datos', grade: 4.5 },
          { subject: 'POO', grade: 4.0 },
          { subject: 'Requisitos', grade: 3.8 },
          { subject: 'Programación BD', grade: 4.2 },
        ],
        promedioGeneral: 0.0,
        notaMasAlta: 0.0,
        materiaNotaMasAlta: 'Error de consulta',
        gradesData: [],
      };
    }
  }

  async getCalificacionesByFicha(fichaId) {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      include: {
        programa: {
          include: {
            competencias: {
              include: {
                calificaciones: {
                  include: {
                    aprendiz: {
                      select: { id: true, firstName: true, lastName: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
        matriculas: {
          include: {
            aprendiz: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!ficha) return [];

    const matriculados = ficha.matriculas.map(m => m.aprendiz);
    const competencias = ficha.programa?.competencias || [];

    return competencias.map(comp => {
      const studentMap = new Map();
      comp.calificaciones.forEach(c => {
        studentMap.set(c.aprendizId, Number(c.nota));
      });

      const students = matriculados.map(a => {
        const fullName = `${a.firstName} ${a.lastName || ''}`.trim();
        const nota = studentMap.get(a.id) !== undefined ? studentMap.get(a.id) : null;
        return {
          id: a.id,
          name: fullName,
          nota: nota !== null ? Number(nota) : 4.0,
          hasRecord: nota !== null,
          maxNota: 5.0,
        };
      });

      const gradedStudents = students.filter(s => s.hasRecord);
      const sum = gradedStudents.reduce((acc, s) => acc + s.nota, 0);
      const overallNota = gradedStudents.length > 0 ? Number((sum / gradedStudents.length).toFixed(1)) : 4.2;

      return {
        id: comp.id,
        title: comp.nombre,
        codigo: comp.codigo,
        overallNota,
        students,
      };
    });
  }

  async upsertCalificacion(data) {
    const existing = await prisma.calificacion.findFirst({
      where: {
        aprendizId: data.aprendizId,
        competenciaId: data.competenciaId || undefined,
      },
    });

    if (existing) {
      return prisma.calificacion.update({
        where: { id: existing.id },
        data: {
          nota: data.nota,
          periodo: data.periodo || existing.periodo,
          estado: data.nota >= 3.5 ? 'Aprobado' : 'Por Mejorar',
          instructorId: data.instructorId || existing.instructorId,
        },
      });
    }

    return prisma.calificacion.create({
      data: {
        aprendizId: data.aprendizId,
        competenciaId: data.competenciaId || null,
        instructorId: data.instructorId || null,
        nota: data.nota,
        periodo: data.periodo || '2026-1',
        estado: data.nota >= 3.5 ? 'Aprobado' : 'Por Mejorar',
      },
    });
  }
}

module.exports = new CalificacionRepository();
