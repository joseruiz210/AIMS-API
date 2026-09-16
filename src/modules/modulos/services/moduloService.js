const moduloRepository = require('../repositories/moduloRepository');
const AppError = require('../../../utils/appError');
const logAudit = require('../../../utils/auditLogger');

class ModuloService {
  async getAll(query = {}) {
    const where = {};
    if (query.programaId) {
      where.programaId = query.programaId;
    }
    return moduloRepository.getAll(where);
  }

  async getById(id) {
    const modulo = await moduloRepository.getById(id);
    if (!modulo) {
      throw AppError.notFound('Módulo no encontrado');
    }
    return modulo;
  }

  async create(userId, data) {
    const modulo = await moduloRepository.create(data);
    await logAudit(userId, 'CREAR_MODULO', { moduloId: modulo.id, nombre: modulo.nombre });
    return modulo;
  }

  async update(userId, id, data) {
    await this.getById(id);
    const modulo = await moduloRepository.update(id, data);
    await logAudit(userId, 'ACTUALIZAR_MODULO', { moduloId: modulo.id });
    return modulo;
  }

  async delete(userId, id) {
    await this.getById(id);
    const modulo = await moduloRepository.delete(id);
    await logAudit(userId, 'ELIMINAR_MODULO', { moduloId: id });
    return modulo;
  }
}

module.exports = new ModuloService();
