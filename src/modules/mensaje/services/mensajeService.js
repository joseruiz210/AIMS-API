const mensajeRepository = require('../repositories/mensajeRepository');
const userRepository = require('../../usuarios/repositories/userRepository');
const AppError = require('../../../utils/appError');

class MensajeService {
  async send(senderId, data) {
    const receptor = await userRepository.findById(data.receptorId);
    if (!receptor) {
      throw AppError.notFound('Receptor del mensaje no encontrado');
    }

    return mensajeRepository.create({
      senderId,
      receptorId: data.receptorId,
      texto: data.texto,
    });
  }

  async findMyMensajes(userId) {
    return mensajeRepository.findMyMensajes(userId);
  }

  async markAsRead(id, userId) {
    return mensajeRepository.markAsRead(id, userId);
  }
}

module.exports = new MensajeService();
