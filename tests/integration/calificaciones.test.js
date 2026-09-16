const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/calificaciones/repositories/calificacionRepository');
const calificacionRepository = require('../../src/modules/calificaciones/repositories/calificacionRepository');

describe('Calificaciones Integration Tests', () => {
  const instructorToken = jwt.sign({ id: 'inst-id', role: 'INSTRUCTOR' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: 'aprendiz-id', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/calificaciones/mis-calificaciones', () => {
    test('should allow APRENDIZ to get their report card (200)', async () => {
      calificacionRepository.getCalificacionesByAprendiz.mockResolvedValue({
        promedioGeneral: 4.5,
        notaMasAlta: 4.8,
        materiaNotaMasAlta: 'POO',
        gradesData: [{ subject: 'POO', grade: 4.8 }],
      });

      const res = await request(app)
        .get('/api/v1/calificaciones/mis-calificaciones')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.promedioGeneral).toBe(4.5);
    });
  });

  describe('POST /api/v1/calificaciones', () => {
    test('should allow INSTRUCTOR to register a grade (201)', async () => {
      calificacionRepository.upsertCalificacion.mockResolvedValue({
        id: 'cal-1',
        nota: 4.5,
      });

      const res = await request(app)
        .post('/api/v1/calificaciones')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          aprendizId: '33333333-3333-3333-3333-333333333333',
          fichaId: '22222222-2222-2222-2222-222222222222',
          moduloId: '55555555-5555-5555-5555-555555555555',
          nota: 4.5,
          periodo: '2026-1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should reject grade out of bounds (400)', async () => {
      const res = await request(app)
        .post('/api/v1/calificaciones')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          aprendizId: '33333333-3333-3333-3333-333333333333',
          fichaId: '22222222-2222-2222-2222-222222222222',
          moduloId: '55555555-5555-5555-5555-555555555555',
          nota: 6.0, // Invalid: max 5.0
        });

      expect(res.status).toBe(400);
    });
  });
});
