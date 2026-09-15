const comunicadoRepository = require('../repositories/comunicadoRepository');

class ComunicadoService {
  async create(adminId, data) {
    return comunicadoRepository.create({
      adminId,
      titulo: data.titulo,
      mensaje: data.mensaje,
      destinatario: data.destinatario || 'Todos los usuarios',
    });
  }

  async findAll() {
    return comunicadoRepository.findAll();
  }

  async registerLectura(comunicadoId, userId) {
    return comunicadoRepository.registerLectura(comunicadoId, userId);
  }
}

module.exports = new ComunicadoService();
