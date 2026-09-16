const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/modulos/repositories/moduloRepository');
const moduloRepository = require('../../src/modules/modulos/repositories/moduloRepository');

describe('Modulos Integration Tests', () => {
  const adminToken = jwt.sign({ id: 'admin-id', role: 'ADMIN' }, env.jwtSecret, { expiresIn: '1h' });
  const instructorToken = jwt.sign({ id: 'inst-id', role: 'INSTRUCTOR' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: 'aprendiz-id', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  const mockModulo = {
    id: '55555555-5555-5555-5555-555555555555',
    nombre: 'Programación Orientada a Objetos',
    horasFormacion: 120,
    programaId: '11111111-1111-1111-1111-111111111111',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/modulos', () => {
    test('should allow authenticated user to list modules (200)', async () => {
      moduloRepository.getAll.mockResolvedValue([mockModulo]);

      const res = await request(app)
        .get('/api/v1/modulos')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/modulos', () => {
    test('should allow INSTRUCTOR to create a module (201)', async () => {
      moduloRepository.create.mockResolvedValue(mockModulo);

      const res = await request(app)
        .post('/api/v1/modulos')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          nombre: 'Programación Orientada a Objetos',
          horasFormacion: 120,
          programaId: '11111111-1111-1111-1111-111111111111',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Programación Orientada a Objetos');
    });

    test('should reject invalid body (400)', async () => {
      const res = await request(app)
        .post('/api/v1/modulos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'POO',
          horasFormacion: -5, // Invalid negative hours
        });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/modulos/:id', () => {
    test('should allow ADMIN to delete a module (200)', async () => {
      moduloRepository.getById.mockResolvedValue(mockModulo);
      moduloRepository.delete.mockResolvedValue(mockModulo);

      const res = await request(app)
        .delete(`/api/v1/modulos/${mockModulo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should deny module deletion to INSTRUCTOR (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/modulos/${mockModulo.id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });
  });
});
