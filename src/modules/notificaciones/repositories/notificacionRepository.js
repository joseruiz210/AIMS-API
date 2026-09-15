const prisma = require('../../../config/database');

class NotificacionRepository {
  async getByUser(userId) {
    return prisma.notificacion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id, userId) {
    return prisma.notificacion.updateMany({
      where: { id, userId },
      data: { leida: true },
    });
  }

  async markAllAsRead(userId) {
    return prisma.notificacion.updateMany({
      where: { userId, leida: false },
      data: { leida: true },
    });
  }

  async create(data) {
    return prisma.notificacion.create({
      data,
    });
  }
}

module.exports = new NotificacionRepository();
