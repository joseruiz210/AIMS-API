const prisma = require('../../../config/database');

class AuthRepository {
  /**
   * Find user by email verification token and ensure it has not expired
   */
  async findUserByVerificationToken(token) {
    return prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Find user by password reset token and ensure it has not expired
   */
  async findUserByResetToken(token) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Update verification token and expiration for user
   */
  async updateVerificationToken(userId, token, expiresAt) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      },
    });
  }

  /**
   * Set user email as verified and clear verification token and expiration
   */
  async verifyUserEmail(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }

  /**
   * Save password reset token and expiration date
   */
  async saveResetPasswordToken(userId, token, expiresAt) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiresAt,
      },
    });
  }

  /**
   * Reset user password and clear reset fields
   */
  async resetPassword(userId, hashedPassword) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  /**
   * Save a new Refresh Token in the database
   */
  async createRefreshToken({ userId, token, expiresAt }) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Find a Refresh Token by token string
   */
  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Revoke a specific Refresh Token by marking revokedAt timestamp
   */
  async revokeRefreshToken(tokenId, replacedByToken = null) {
    return prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
        replacedByToken,
      },
    });
  }

  /**
   * Revoke all active Refresh Tokens for a user (e.g. on password change/reset)
   */
  async revokeAllUserRefreshTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Save magic link token and expiration date
   */
  async saveMagicLinkToken(userId, token, expiresAt) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        magicLinkToken: token,
        magicLinkExpires: expiresAt,
      },
    });
  }

  /**
   * Find user by magic link token and ensure non-expired
   */
  async findUserByMagicLinkToken(token) {
    return prisma.user.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpires: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Clear magic link token fields
   */
  async clearMagicLinkToken(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
        isEmailVerified: true,
      },
    });
  }
}

module.exports = new AuthRepository();
