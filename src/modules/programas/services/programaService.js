const programaRepository = require('../repositories/programaRepository');
const AppError = require('../../../utils/appError');
const logAudit = require('../../../utils/auditLogger');

class ProgramaService {
  async getAll() {
    return programaRepository.getAll();
  }

  async getById(id) {
    const programa = await programaRepository.getById(id);
    if (!programa) {
      throw AppError.notFound('Programa de formación no encontrado');
    }
    return programa;
  }

  async create(userId, data) {
    const existing = await programaRepository.findByCodigo(data.codigo);
    if (existing) {
      throw AppError.conflict('Ya existe un programa registrado con este código');
    }

    const nuevoPrograma = await programaRepository.create(data);
    await logAudit(userId, 'CREAR_PROGRAMA', { programaId: nuevoPrograma.id, codigo: nuevoPrograma.codigo });
    return nuevoPrograma;
  }

  async update(userId, id, data) {
    await this.getById(id);
    if (data.codigo) {
      const existing = await programaRepository.findByCodigo(data.codigo);
      if (existing && existing.id !== id) {
        throw AppError.conflict('El código ya pertenece a otro programa');
      }
    }
    const programaActualizado = await programaRepository.update(id, data);
    await logAudit(userId, 'ACTUALIZAR_PROGRAMA', { programaId: id });
    return programaActualizado;
  }

  async delete(userId, id) {
    await this.getById(id);
    await programaRepository.delete(id);
    await logAudit(userId, 'ELIMINAR_PROGRAMA', { programaId: id });
  }
}

module.exports = new ProgramaService();
