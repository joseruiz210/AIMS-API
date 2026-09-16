const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/horarios/repositories/horarioRepository');
const horarioRepository = require('../../src/modules/horarios/repositories/horarioRepository');

describe('Horarios Integration Tests', () => {
  const instructorToken = jwt.sign({ id: 'inst-id', role: 'INSTRUCTOR' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: 'aprendiz-id', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/horarios/mi-horario', () => {
    test('should allow APRENDIZ to view schedule (200)', async () => {
      horarioRepository.getHorarioByAprendiz.mockResolvedValue([
        { id: 'h-1', diaSemana: 1, horaInicio: '07:00', horaFin: '12:00' },
      ]);

      const res = await request(app)
        .get('/api/v1/horarios/mi-horario')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/horarios', () => {
    test('should allow INSTRUCTOR to create schedule entry (201)', async () => {
      horarioRepository.create.mockResolvedValue({
        id: 'h-1',
        diaSemana: 1,
        horaInicio: '07:00',
        horaFin: '12:00',
      });

      const res = await request(app)
        .post('/api/v1/horarios')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          fichaId: '22222222-2222-2222-2222-222222222222',
          diaSemana: 1,
          horaInicio: '07:00',
          horaFin: '12:00',
          ambiente: 'Ambiente 204',
          tema: 'Análisis de Requisitos',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should reject invalid time format (400)', async () => {
      const res = await request(app)
        .post('/api/v1/horarios')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          fichaId: '22222222-2222-2222-2222-222222222222',
          diaSemana: 1,
          horaInicio: '7:00 AM', // Invalid: expected HH:mm
          horaFin: '12:00',
        });

      expect(res.status).toBe(400);
    });
  });
});
