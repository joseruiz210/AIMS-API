const programaRepository = require('../repositories/programaRepository');
const AppError = require('../../../utils/appError');
const logAudit = require('../../../utils/auditLogger');
const { fixMojibake } = require('../../../utils/textUtils');

const sanitizePrograma = (p) => {
  if (!p) return p;
  if (p.nombre) p.nombre = fixMojibake(p.nombre);
  return p;
};

class ProgramaService {
  async getAll() {
    const programas = await programaRepository.getAll();
    return Array.isArray(programas) ? programas.map(sanitizePrograma) : programas;
  }

  async getById(id) {
    const programa = await programaRepository.getById(id);
    if (!programa) {
      throw AppError.notFound('Programa de formación no encontrado');
    }
    return sanitizePrograma(programa);
  }

  async create(userId, data) {
    const existing = await programaRepository.findByCodigo(data.codigo);
    if (existing) {
      throw AppError.conflict('Ya existe un programa registrado con este código');
    }

    if (data.nombre) data.nombre = fixMojibake(data.nombre);
    const nuevoPrograma = await programaRepository.create(data);
    await logAudit(userId, 'CREAR_PROGRAMA', { programaId: nuevoPrograma.id, codigo: nuevoPrograma.codigo });
    return sanitizePrograma(nuevoPrograma);
  }

  async update(userId, id, data) {
    await this.getById(id);
    if (data.codigo) {
      const existing = await programaRepository.findByCodigo(data.codigo);
      if (existing && existing.id !== id) {
        throw AppError.conflict('El código ya pertenece a otro programa');
      }
    }
    if (data.nombre) data.nombre = fixMojibake(data.nombre);
    const programaActualizado = await programaRepository.update(id, data);
    await logAudit(userId, 'ACTUALIZAR_PROGRAMA', { programaId: id });
    return sanitizePrograma(programaActualizado);
  }

  async delete(userId, id) {
    await this.getById(id);
    await programaRepository.delete(id);
    await logAudit(userId, 'ELIMINAR_PROGRAMA', { programaId: id });
  }
}

module.exports = new ProgramaService();
