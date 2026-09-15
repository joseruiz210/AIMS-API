const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/asistencia/repositories/asistenciaRepository');
const asistenciaRepository = require('../../src/modules/asistencia/repositories/asistenciaRepository');

describe('Asistencia Integration Tests', () => {
  const instructorToken = jwt.sign({ id: 'inst-id', role: 'INSTRUCTOR' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: '33333333-3333-3333-3333-333333333333', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/asistencia/mis-asistencias', () => {
    test('should allow APRENDIZ to get their attendance stats (200)', async () => {
      asistenciaRepository.getAsistenciaByAprendiz.mockResolvedValue({
        porcentajeGlobal: 95,
        horasFaltas: 4,
        asistenciaData: [],
      });

      const res = await request(app)
        .get('/api/v1/asistencia/mis-asistencias')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.porcentajeGlobal).toBe(95);
    });
  });

  describe('POST /api/v1/asistencia/registrar', () => {
    test('should allow INSTRUCTOR to register bulk attendance (201)', async () => {
      asistenciaRepository.registrarAsistenciaSesion.mockResolvedValue([
        { id: 'att-1', estado: 'PRESENTE' },
      ]);

      const res = await request(app)
        .post('/api/v1/asistencia/registrar')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          registros: [
            {
              fichaAprendizId: '33333333-3333-3333-3333-333333333333',
              horarioId: '44444444-4444-4444-4444-444444444444',
              fecha: '2026-08-26',
              estado: 'PRESENTE',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should reject invalid array format (400)', async () => {
      const res = await request(app)
        .post('/api/v1/asistencia/registrar')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          registros: [],
        });

      expect(res.status).toBe(400);
    });
  });
});
