const matriculaRepository = require('../repositories/matriculaRepository');
const fichaRepository = require('../../fichas/repositories/fichaRepository');
const userRepository = require('../../usuarios/repositories/userRepository');
const AppError = require('../../../utils/appError');

class MatriculaService {
  async create(data) {
    const ficha = await fichaRepository.findById(data.fichaId);
    if (!ficha) {
      throw AppError.notFound('La ficha especificada no existe');
    }

    const aprendiz = await userRepository.findById(data.aprendizId);
    if (!aprendiz) {
      throw AppError.notFound('El aprendiz especificado no existe');
    }

    const existing = await matriculaRepository.findExisting(data.fichaId, data.aprendizId);
    if (existing) {
      throw AppError.conflict('El aprendiz ya se encuentra matriculado en esta ficha');
    }

    return matriculaRepository.create({
      fichaId: data.fichaId,
      aprendizId: data.aprendizId,
      fechaMatricula: data.fechaMatricula ? new Date(data.fechaMatricula) : new Date(),
      estado: data.estado || 'Activo',
    });
  }

  async findAll(queryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      estado,
      fichaId,
      aprendizId,
      sortBy = 'createdAt',
      order = 'desc',
    } = queryParams;

    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (fichaId) {
      where.fichaId = fichaId;
    }

    if (aprendizId) {
      where.aprendizId = aprendizId;
    }

    if (search) {
      where.OR = [
        { aprendiz: { firstName: { contains: search, mode: 'insensitive' } } },
        { aprendiz: { lastName: { contains: search, mode: 'insensitive' } } },
        { aprendiz: { email: { contains: search, mode: 'insensitive' } } },
        { ficha: { numero: { contains: search, mode: 'insensitive' } } },
        { ficha: { programa: { nombre: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy = { [sortBy]: order };

    const { matriculas, total } = await matriculaRepository.findAll({
      skip,
      take: parsedLimit,
      where,
      orderBy,
    });

    const totalPages = Math.ceil(total / parsedLimit);

    const formattedMatriculas = matriculas.map((m) => ({
      id: m.id,
      aprendiz: m.aprendiz ? `${m.aprendiz.firstName} ${m.aprendiz.lastName}` : '',
      aprendizId: m.aprendizId,
      email: m.aprendiz?.email || '',
      ficha: m.ficha?.numero || '',
      fichaId: m.fichaId,
      programa: m.ficha?.programa?.nombre || '',
      fechaMatricula: m.fechaMatricula.toISOString().split('T')[0],
      estado: m.estado,
      createdAt: m.createdAt,
    }));

    return {
      matriculas: formattedMatriculas,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      },
    };
  }

  async findById(id) {
    const matricula = await matriculaRepository.findById(id);
    if (!matricula) {
      throw AppError.notFound('Matrícula académica no encontrada');
    }
    return matricula;
  }

  async update(id, updateData) {
    await this.findById(id);

    if (updateData.fechaMatricula) {
      updateData.fechaMatricula = new Date(updateData.fechaMatricula);
    }

    return matriculaRepository.update(id, updateData);
  }

  async delete(id) {
    await this.findById(id);
    return matriculaRepository.delete(id);
  }
}

module.exports = new MatriculaService();
