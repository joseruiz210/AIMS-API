const notificacionRepository = require('../repositories/notificacionRepository');

class NotificacionService {
  async getMisNotificaciones(userId) {
    const list = await notificacionRepository.getByUser(userId);
    const unreadCount = list.filter(n => !n.leida).length;
    return {
      unreadCount,
      notificaciones: list,
    };
  }

  async markAsRead(id, userId) {
    return notificacionRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    return notificacionRepository.markAllAsRead(userId);
  }

  async createNotification(data) {
    return notificacionRepository.create(data);
  }
}

module.exports = new NotificacionService();
