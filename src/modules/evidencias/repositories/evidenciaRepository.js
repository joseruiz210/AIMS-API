const prisma = require('../../../config/database');

class EvidenciaRepository {
  async getAll(where = {}, aprendizId = null) {
    const include = {
      ficha: {
        select: {
          id: true,
          numero: true,
          jornada: true,
          programa: {
            select: { id: true, nombre: true, codigo: true },
          },
        },
      },
      instructor: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: {
        select: { entregas: true },
      },
    };

    if (aprendizId) {
      include.entregas = {
        where: { aprendizId },
        select: {
          id: true,
          archivoUrl: true,
          comentario: true,
          nota: true,
          fechaEntrega: true,
        },
      };
    }

    return prisma.evidencia.findMany({
      where,
      include,
      orderBy: { fechaLimite: 'asc' },
    });
  }

  async getById(id) {
    return prisma.evidencia.findUnique({
      where: { id },
      include: {
        ficha: {
          select: {
            id: true,
            numero: true,
            jornada: true,
            programa: { select: { id: true, nombre: true } },
          },
        },
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        entregas: {
          include: {
            aprendiz: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async create(data) {
    return prisma.evidencia.create({
      data,
      include: {
        ficha: {
          select: { id: true, numero: true },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.evidencia.update({
      where: { id },
      data,
      include: {
        ficha: {
          select: { id: true, numero: true },
        },
      },
    });
  }

  async delete(id) {
    return prisma.evidencia.delete({
      where: { id },
    });
  }

  async upsertEntrega(evidenciaId, aprendizId, data) {
    const comentarioGuardar = data.feedback
      ? (data.comentario ? `${data.comentario}\n\n--- Retroalimentación del Instructor ---\n${data.feedback}` : data.feedback)
      : (data.comentario || null);

    const updateFields = {
      archivoUrl: data.archivoUrl || null,
      comentario: comentarioGuardar,
      fechaEntrega: new Date(),
    };
    if (data.nota !== undefined && data.nota !== null) {
      updateFields.nota = data.nota;
    }

    const createFields = {
      evidenciaId,
      aprendizId,
      archivoUrl: data.archivoUrl || null,
      comentario: comentarioGuardar,
    };
    if (data.nota !== undefined && data.nota !== null) {
      createFields.nota = data.nota;
    }

    return prisma.entregaEvidencia.upsert({
      where: {
        evidenciaId_aprendizId: {
          evidenciaId,
          aprendizId,
        },
      },
      update: updateFields,
      create: createFields,
      include: {
        aprendiz: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async calificarEntrega(entregaId, nota) {
    return prisma.entregaEvidencia.update({
      where: { id: entregaId },
      data: { nota },
      include: {
        aprendiz: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        evidencia: {
          select: { id: true, titulo: true },
        },
      },
    });
  }

  async getEntregasByEvidencia(evidenciaId) {
    return prisma.entregaEvidencia.findMany({
      where: { evidenciaId },
      include: {
        aprendiz: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { fechaEntrega: 'desc' },
    });
  }
}

module.exports = new EvidenciaRepository();
