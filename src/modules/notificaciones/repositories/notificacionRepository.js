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
      data: { leido: true },
    });
  }

  async markAllAsRead(userId) {
    return prisma.notificacion.updateMany({
      where: { userId, leido: false },
      data: { leido: true },
    });
  }

  async create(data) {
    return prisma.notificacion.create({
      data,
    });
  }
}

module.exports = new NotificacionRepository();
