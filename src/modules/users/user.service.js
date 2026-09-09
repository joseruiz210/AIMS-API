const bcrypt = require('bcryptjs');
const userRepository = require('./user.repository');
const AppError = require('../../utils/appError');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

class UserService {
  async create(userData) {
    const emailExists = await userRepository.existsByEmail(userData.email);
    if (emailExists) {
      throw AppError.conflict('El email ya está registrado');
    }

    const rawPassword = userData.password || 'Aims2026TempPass!';
    const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);

    const user = await userRepository.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'APRENDIZ',
      phone: userData.phone || null,
      especialidad: userData.especialidad || null,
      isEmailVerified: true,
      isActive: true,
    });

    return user;
  }

  async findAll(queryParams) {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = queryParams;

    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    } else if (typeof isActive === 'string') {
      where.isActive = isActive.toLowerCase() === 'true';
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = { [sortBy]: order };

    const { users, total } = await userRepository.findAll({
      skip,
      take: parsedLimit,
      where,
      orderBy,
    });

    const totalPages = Math.ceil(total / parsedLimit);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }
    return user;
  }

  async update(id, updateData) {
    await this.findById(id);

    if (updateData.email) {
      const emailExists = await userRepository.existsByEmail(
        updateData.email,
        id
      );
      if (emailExists) {
        throw AppError.conflict('El email ya está en uso por otro usuario');
      }
    }

    if (updateData.password) {
      delete updateData.password;
    }

    const updatedUser = await userRepository.update(id, updateData);
    return updatedUser;
  }

  async delete(id) {
    await this.findById(id);
    await userRepository.delete(id);
  }

  async toggleActive(id) {
    const user = await this.findById(id);
    const updatedUser = await userRepository.update(id, {
      isActive: !user.isActive,
    });
    return updatedUser;
  }

  async getProfile(userId) {
    return this.findById(userId);
  }
}

module.exports = new UserService();
