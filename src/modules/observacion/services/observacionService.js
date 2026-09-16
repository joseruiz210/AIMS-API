const observacionRepository = require('../repositories/observacionRepository');
const userRepository = require('../../usuarios/repositories/userRepository');
const AppError = require('../../../utils/appError');

class ObservacionService {
  async create(instructorId, data) {
    const aprendiz = await userRepository.findById(data.aprendizId);
    if (!aprendiz) {
      throw AppError.notFound('Aprendiz no encontrado');
    }

    return observacionRepository.create({
      instructorId,
      aprendizId: data.aprendizId,
      tipo: data.tipo,
      materia: data.materia || null,
      descripcion: data.descripcion,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
    });
  }

  async findMyObservaciones(user) {
    if (user.role === 'APRENDIZ') {
      return observacionRepository.findByAprendiz(user.id);
    }
    if (user.role === 'INSTRUCTOR') {
      return observacionRepository.findByInstructor(user.id);
    }
    const { observaciones } = await observacionRepository.findAll({ take: 50 });
    return observaciones;
  }

  async delete(id) {
    return observacionRepository.delete(id);
  }
}

module.exports = new ObservacionService();
