const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/reportes/repositories/reportesRepository');
const adminRepository = require('../../src/modules/reportes/repositories/reportesRepository');

describe('Admin Stats & Operations Integration Tests', () => {
  const adminToken = jwt.sign({ id: 'admin-id', role: 'ADMIN' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: 'aprendiz-id', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/stats', () => {
    test('should allow ADMIN to retrieve stats (200)', async () => {
      adminRepository.getDashboardStats.mockResolvedValue({
        totalUsuarios: 100,
        totalAprendices: 80,
        totalInstructores: 15,
        totalFichas: 5,
        totalProgramas: 2,
      });

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsuarios).toBe(100);
    });

    test('should deny access to non-admin users (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/admin/recent-activity', () => {
    test('should allow ADMIN to get audit logs (200)', async () => {
      adminRepository.getRecentActivity.mockResolvedValue([
        { id: 'log-1', accion: 'LOGIN' },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
