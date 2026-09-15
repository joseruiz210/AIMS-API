const fichaRepository = require('../repositories/fichaRepository');
const userRepository = require('../../usuarios/repositories/userRepository');
const AppError = require('../../../utils/appError');
const logAudit = require('../../../utils/auditLogger');

class FichaService {
  async getAll() {
    return fichaRepository.getAll();
  }

  async getById(id) {
    const ficha = await fichaRepository.getById(id);
    if (!ficha) {
      throw AppError.notFound('Ficha de formación no encontrada');
    }
    return ficha;
  }

  async create(userId, data) {
    const existing = await fichaRepository.findByNumero(data.numero);
    if (existing) {
      throw AppError.conflict('Ya existe una ficha registrada con este número');
    }

    const nuevaFicha = await fichaRepository.create(data);
    await logAudit(userId, 'CREAR_FICHA', { fichaId: nuevaFicha.id, numero: nuevaFicha.numero });
    return nuevaFicha;
  }

  async update(userId, id, data) {
    await this.getById(id);
    if (data.numero) {
      const existing = await fichaRepository.findByNumero(data.numero);
      if (existing && existing.id !== id) {
        throw AppError.conflict('El número de ficha ya está en uso');
      }
    }
    const fichaActualizada = await fichaRepository.update(id, data);
    await logAudit(userId, 'ACTUALIZAR_FICHA', { fichaId: id });
    return fichaActualizada;
  }

  async delete(userId, id) {
    await this.getById(id);
    await fichaRepository.delete(id);
    await logAudit(userId, 'ELIMINAR_FICHA', { fichaId: id });
  }

  async addAprendiz(userId, fichaId, aprendizId) {
    await this.getById(fichaId);
    const aprendiz = await userRepository.findById(aprendizId);
    if (!aprendiz || aprendiz.role !== 'APRENDIZ') {
      throw AppError.badRequest('El usuario no existe o no tiene el rol APRENDIZ');
    }

    const isInFicha = await fichaRepository.isAprendizInFicha(fichaId, aprendizId);
    if (isInFicha) {
      throw AppError.conflict('El aprendiz ya está matriculado en esta ficha');
    }

    const relacion = await fichaRepository.addAprendiz(fichaId, aprendizId);
    await logAudit(userId, 'MATRICULAR_APRENDIZ', { fichaId, aprendizId });
    return relacion;
  }

  async removeAprendiz(userId, fichaId, aprendizId) {
    await this.getById(fichaId);
    const isInFicha = await fichaRepository.isAprendizInFicha(fichaId, aprendizId);
    if (!isInFicha) {
      throw AppError.notFound('El aprendiz no se encuentra matriculado en esta ficha');
    }

    await fichaRepository.removeAprendiz(fichaId, aprendizId);
    await logAudit(userId, 'DESMATRICULAR_APRENDIZ', { fichaId, aprendizId });
  }
}

module.exports = new FichaService();
