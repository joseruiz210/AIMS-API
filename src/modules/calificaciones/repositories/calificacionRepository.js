const prisma = require('../../../config/database');

class CalificacionRepository {
  async getCalificacionesByAprendiz(aprendizId) {
    try {
      // 1. Obtener calificaciones directas por competencia
      const list = await prisma.calificacion.findMany({
        where: { aprendizId },
        include: {
          competencia: {
            select: { id: true, nombre: true },
          },
          instructor: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      // 2. Obtener entregas evaluadas de evidencias/actividades formativas
      const entregas = await prisma.entregaEvidencia.findMany({
        where: {
          aprendizId,
          nota: { not: null },
        },
        include: {
          evidencia: {
            select: {
              id: true,
              titulo: true,
              instructor: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      });

      const gradesData = [];

      // Mapear calificaciones directas
      list.forEach((item) => {
        const grade = Number(item.nota || 0);
        gradesData.push({
          id: item.id,
          subject: item.competencia ? item.competencia.nombre : 'Competencia Formativa',
          grade,
          instructor: item.instructor
            ? `${item.instructor.firstName} ${item.instructor.lastName || ''}`.trim()
            : 'Instructor SENA',
          periodo: item.periodo || 'Trimestre Actual',
          estado: grade >= 3.5 ? 'Aprobado' : 'Por Mejorar',
          createdAt: item.createdAt,
        });
      });

      // Mapear evidencias evaluadas
      entregas.forEach((e) => {
        const grade = Number(e.nota || 0);
        gradesData.push({
          id: e.id,
          subject: e.evidencia?.titulo || 'Evidencia Evaluada',
          grade,
          instructor: e.evidencia?.instructor
            ? `${e.evidencia.instructor.firstName} ${e.evidencia.instructor.lastName || ''}`.trim()
            : 'Instructor SENA',
          periodo: 'Trimestre Actual',
          estado: grade >= 3.5 ? 'Aprobado' : 'Por Mejorar',
          createdAt: e.fechaEntrega,
        });
      });

      if (gradesData.length === 0) {
        return {
          promedioGeneral: 0.0,
          notaMasAlta: 0.0,
          materiaNotaMasAlta: 'Sin calificaciones',
          gradesData: [],
        };
      }

      const notas = gradesData.map((g) => g.grade);
      const suma = notas.reduce((acc, curr) => acc + curr, 0);
      const promedio = Number((suma / notas.length).toFixed(1));
      const notaMax = Math.max(...notas);
      const materiaMax = gradesData.find((g) => g.grade === notaMax)?.subject || 'Sin registro';

      return {
        promedioGeneral: promedio,
        notaMasAlta: notaMax,
        materiaNotaMasAlta: materiaMax,
        gradesData,
      };
    } catch (err) {
      console.error('[CalificacionRepository] Error al obtener calificaciones:', err.message);
      return {
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
        evidencias: {
          include: {
            entregas: true,
          },
        },
      },
    });

    if (!ficha) return [];

    const matriculados = ficha.matriculas.map((m) => m.aprendiz);
    const competencias = ficha.programa?.competencias || [];
    const resultGroups = [];

    // 1. Grupos de Competencias Oficiales
    competencias.forEach((comp) => {
      const studentMap = new Map();
      comp.calificaciones.forEach((c) => {
        studentMap.set(c.aprendizId, Number(c.nota));
      });

      const students = matriculados.map((a) => {
        const fullName = `${a.firstName} ${a.lastName || ''}`.trim();
        const nota = studentMap.get(a.id) !== undefined ? studentMap.get(a.id) : null;
        return {
          id: a.id,
          name: fullName,
          nota: nota !== null ? Number(nota) : 0.0,
          hasRecord: nota !== null,
          maxNota: 5.0,
        };
      });

      const gradedStudents = students.filter((s) => s.hasRecord);
      const sum = gradedStudents.reduce((acc, s) => acc + s.nota, 0);
      const overallNota = gradedStudents.length > 0 ? Number((sum / gradedStudents.length).toFixed(1)) : 0.0;

      resultGroups.push({
        id: comp.id,
        title: comp.nombre,
        codigo: comp.codigo,
        overallNota,
        students,
      });
    });

    // 2. Grupos de Actividades / Evidencias de la Ficha
    (ficha.evidencias || []).forEach((ev) => {
      const entregaMap = new Map();
      ev.entregas.forEach((ent) => {
        if (ent.nota !== null && ent.nota !== undefined) {
          entregaMap.set(ent.aprendizId, Number(ent.nota));
        }
      });

      const students = matriculados.map((a) => {
        const fullName = `${a.firstName} ${a.lastName || ''}`.trim();
        const nota = entregaMap.get(a.id) !== undefined ? entregaMap.get(a.id) : null;
        return {
          id: a.id,
          name: fullName,
          nota: nota !== null ? Number(nota) : 0.0,
          hasRecord: nota !== null,
          maxNota: 5.0,
        };
      });

      const gradedStudents = students.filter((s) => s.hasRecord);
      const sum = gradedStudents.reduce((acc, s) => acc + s.nota, 0);
      const overallNota = gradedStudents.length > 0 ? Number((sum / gradedStudents.length).toFixed(1)) : 0.0;

      resultGroups.push({
        id: ev.id,
        title: `Actividad: ${ev.titulo}`,
        codigo: 'ACTIVIDAD',
        overallNota,
        students,
      });
    });

    return resultGroups;
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
