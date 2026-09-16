const prisma = require('../../../config/database');

async function executeWithRetry(fn, retries = 2, delay = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isTransient =
        error.message?.includes('EAI_AGAIN') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('connection terminated') ||
        error.code === 'P1001';

      if (attempt < retries && isTransient) {
        console.warn(`[DB Retry] Reintentando consulta tras fallo temporal (${attempt + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

class UserRepository {
  async create(data) {
    return executeWithRetry(() =>
      prisma.user.create({
        data,
        select: this._defaultSelect(),
      })
    );
  }

  async findById(id) {
    return executeWithRetry(() =>
      prisma.user.findUnique({
        where: { id },
        select: this._defaultSelect(),
      })
    );
  }

  async findByIdWithPassword(id) {
    return executeWithRetry(() =>
      prisma.user.findUnique({
        where: { id },
      })
    );
  }

  async findByEmail(email) {
    return executeWithRetry(() =>
      prisma.user.findUnique({
        where: { email },
      })
    );
  }

  async findAll({ skip, take, where, orderBy }) {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: this._defaultSelect(),
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: this._defaultSelect(),
    });
  }

  async delete(id) {
    return prisma.user.delete({
      where: { id },
    });

    
  }

  async existsByEmail(email, excludeId = null) {
    const where = { email };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    return executeWithRetry(async () => {
      const user = await prisma.user.findFirst({ where });
      return !!user;
    });
  }

  async count(where = {}) {
    return executeWithRetry(() => prisma.user.count({ where }));
  }

  async updatePushToken(id, pushToken) {
    return prisma.user.update({
      where: { id },
      data: { pushToken },
      select: this._defaultSelect(),
    });
  }

  _defaultSelect() {
    return {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      pushToken: true,
      createdAt: true,
      updatedAt: true,
      password: false,
    };
  }
  async createGoogleUser({ firstName, lastName, email }) {
    return executeWithRetry(() =>
      prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: null,
          authProvider: 'GOOGLE',
          isEmailVerified: true, // Google ya verificó el correo
        },
      })
    );
  }
}



module.exports = new UserRepository();
