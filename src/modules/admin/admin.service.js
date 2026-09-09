const bcrypt = require('bcryptjs');
const adminRepository = require('./admin.repository');
const userRepository = require('../users/user.repository');
const AppError = require('../../utils/appError');
const logAudit = require('../../utils/auditLogger');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

class AdminService {
  async getDashboardStats() {
    return adminRepository.getDashboardStats();
  }

  async getRecentActivity(limit) {
    return adminRepository.getRecentActivity(limit);
  }

  async createUserByAdmin(adminId, userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw AppError.conflict('El correo electrónico ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const newUserData = {
      ...userData,
      password: hashedPassword,
    };

    const user = await adminRepository.createUserByAdmin(newUserData);
    await logAudit(adminId, 'CREAR_USUARIO_ADMIN', { userId: user.id, email: user.email, role: user.role });
    return user;
  }
}

module.exports = new AdminService();
