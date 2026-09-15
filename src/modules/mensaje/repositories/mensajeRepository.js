const prisma = require('../../../config/database');

class MensajeRepository {
  async create({ senderId, receptorId, texto }) {
    return prisma.mensaje.create({
      data: {
        senderId,
        receptorId,
        texto,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        receptor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findMyMensajes(userId) {
    const mensajes = await prisma.mensaje.findMany({
      where: {
        OR: [{ senderId: userId }, { receptorId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receptor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return mensajes.map((m) => {
      const isSender = m.senderId === userId;
      const otherUser = isSender ? m.receptor : m.sender;
      const initials = otherUser
        ? `${otherUser.firstName[0] || ''}${otherUser.lastName[0] || ''}`
        : 'US';

      return {
        id: m.id,
        sender: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Usuario',
        initials,
        time: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: m.texto,
        unread: !m.leido && !isSender,
        createdAt: m.createdAt,
      };
    });
  }

  async markAsRead(id, receptorId) {
    return prisma.mensaje.updateMany({
      where: { id, receptorId },
      data: { leido: true },
    });
  }
}

module.exports = new MensajeRepository();
