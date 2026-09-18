const prisma = require('../../../config/database');

class ReportesRepository {
  async getDashboardStats() {
    const [aprendicesCount, instructoresCount, programasCount, fichasActivasCount, aprendicesPorEstado] = await Promise.all([
      prisma.user.count({ where: { role: 'APRENDIZ', isActive: true } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR', isActive: true } }),
      prisma.programa.count(),
      prisma.ficha.count({ where: { estado: 'Activo' } }),
      prisma.user.groupBy({
        by: ['estadoAcademico'],
        where: { role: 'APRENDIZ' },
        _count: { id: true },
      }),
    ]);

    const asistenciasRecientes = await prisma.registroAsistencia.groupBy({
      by: ['estado'],
      _count: { id: true },
    });

    return {
      aprendicesCount,
      instructoresCount,
      programasCount,
      fichasActivasCount,
      aprendicesPorEstado: aprendicesPorEstado.map(group => ({
        estado: group.estadoAcademico || 'EN_FORMACION',
        count: group._count.id,
      })),
      asistenciasRecientes,
    };
  }

  async getRecentActivity(limit = 10) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}

module.exports = new ReportesRepository();