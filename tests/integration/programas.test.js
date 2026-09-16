const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/programas/repositories/programaRepository');
const programaRepository = require('../../src/modules/programas/repositories/programaRepository');

describe('Programas Integration Tests', () => {
  const adminToken = jwt.sign({ id: 'admin-id', role: 'ADMIN' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: 'aprendiz-id', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  const mockPrograma = {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'ADSO - Análisis y Desarrollo de Software',
    codigo: '228106',
    duracionMeses: 24,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/programas', () => {
    test('should allow authenticated user to get all programas (200)', async () => {
      programaRepository.getAll.mockResolvedValue([mockPrograma]);

      const res = await request(app)
        .get('/api/v1/programas')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/programas', () => {
    test('should allow ADMIN to create a programa (201)', async () => {
      programaRepository.create.mockResolvedValue(mockPrograma);

      const res = await request(app)
        .post('/api/v1/programas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'ADSO - Análisis y Desarrollo de Software',
          codigo: '228106',
          duracionMeses: 24,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.codigo).toBe('228106');
    });

    test('should reject creation from APRENDIZ (403)', async () => {
      const res = await request(app)
        .post('/api/v1/programas')
        .set('Authorization', `Bearer ${aprendizToken}`)
        .send({
          nombre: 'ADSO',
          codigo: '228106',
          duracionMeses: 24,
        });

      expect(res.status).toBe(403);
    });

    test('should reject invalid body validation (400)', async () => {
      const res = await request(app)
        .post('/api/v1/programas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'AD', // min 3 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
