const comunicadoRepository = require('../repositories/comunicadoRepository');
const AppError = require('../../../utils/appError');

class ComunicadoService {
  // authorUser = { id, role } del usuario autenticado (viene de req.user)
  async create(authorUser, data) {
    const { id: autorId, role } = authorUser;

    if (role === 'ADMIN') {
      // El admin publica avisos globales: nunca lleva fichaId.
      const nuevo = await comunicadoRepository.create({
        autorId,
        fichaId: null,
        titulo: data.titulo,
        mensaje: data.mensaje,
        destinatario: 'Todos los usuarios',
      });

      try {
        const pushNotificationService = require('../../notificaciones/services/pushNotificationService');
        await pushNotificationService.notifyGlobal({
          title: data.titulo,
          body: data.mensaje,
          tipo: 'COMUNICADO',
        });
      } catch (e) {
        console.error('Error enviando notificaciones para comunicado admin:', e.message);
      }

      return nuevo;
    }

    if (role === 'INSTRUCTOR') {
      // El instructor SIEMPRE debe indicar una ficha, y tiene que ser una
      // que él mismo dicta — si no, cualquier instructor podría avisarle
      // a la ficha de otro.
      if (!data.fichaId) {
        throw AppError.badRequest('Debes indicar la ficha a la que va dirigido el aviso');
      }

      const ficha = await comunicadoRepository.fichaPerteneceAInstructor(data.fichaId, autorId);
      if (!ficha) {
        throw AppError.forbidden('Solo puedes publicar avisos en fichas que tienes asignadas');
      }

      const nuevo = await comunicadoRepository.create({
        autorId,
        fichaId: ficha.id,
        titulo: data.titulo,
        mensaje: data.mensaje,
        destinatario: `Ficha ${ficha.numero}`,
      });

      try {
        const pushNotificationService = require('../../notificaciones/services/pushNotificationService');
        await pushNotificationService.notifyFicha(ficha.id, {
          title: data.titulo,
          body: data.mensaje,
          tipo: 'COMUNICADO',
        });
      } catch (e) {
        console.error('Error enviando notificaciones para comunicado ficha:', e.message);
      }

      return nuevo;
    }

    throw AppError.forbidden('No tienes permisos para publicar avisos');
  }

  async findAllForUser(authorUser) {
    return comunicadoRepository.findVisiblesParaUsuario({
      role: authorUser.role,
      userId: authorUser.id,
    });
  }

  async registerLectura(comunicadoId, userId) {
    return comunicadoRepository.registerLectura(comunicadoId, userId);
  }
}

module.exports = new ComunicadoService();
