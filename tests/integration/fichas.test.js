const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/fichas/repositories/fichaRepository');
const fichaRepository = require('../../src/modules/fichas/repositories/fichaRepository');

describe('Fichas Integration Tests', () => {
  const adminToken = jwt.sign({ id: 'admin-id', role: 'ADMIN' }, env.jwtSecret, { expiresIn: '1h' });
  const instructorToken = jwt.sign({ id: 'inst-id', role: 'INSTRUCTOR' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: 'aprendiz-id', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  const mockFicha = {
    id: '22222222-2222-2222-2222-222222222222',
    numero: '2670145',
    jornada: 'MANANA',
    fechaInicio: new Date('2024-01-15'),
    programaId: '11111111-1111-1111-1111-111111111111',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/fichas', () => {
    test('should allow authenticated users to list fichas (200)', async () => {
      fichaRepository.getAll.mockResolvedValue([mockFicha]);

      const res = await request(app)
        .get('/api/v1/fichas')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/fichas', () => {
    test('should allow INSTRUCTOR to create a ficha (201)', async () => {
      fichaRepository.create.mockResolvedValue(mockFicha);

      const res = await request(app)
        .post('/api/v1/fichas')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          numero: '2670145',
          jornada: 'MANANA',
          fechaInicio: '2024-01-15T00:00:00.000Z',
          programaId: '11111111-1111-1111-1111-111111111111',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.numero).toBe('2670145');
    });

    test('should reject invalid jornada parameter (400)', async () => {
      const res = await request(app)
        .post('/api/v1/fichas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          numero: '2670145',
          jornada: 'INVALIDA',
          fechaInicio: '2024-01-15T00:00:00.000Z',
          programaId: '11111111-1111-1111-1111-111111111111',
        });

      expect(res.status).toBe(400);
    });
  });
});
