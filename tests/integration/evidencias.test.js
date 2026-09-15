const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('../../src/modules/evidencias/repositories/evidenciaRepository');
const evidenciaRepository = require('../../src/modules/evidencias/repositories/evidenciaRepository');

describe('Evidencias & Entregas Integration Tests', () => {
  const adminToken = jwt.sign({ id: 'admin-id', role: 'ADMIN' }, env.jwtSecret, { expiresIn: '1h' });
  const instructorToken = jwt.sign({ id: 'inst-id', role: 'INSTRUCTOR' }, env.jwtSecret, { expiresIn: '1h' });
  const aprendizToken = jwt.sign({ id: 'aprendiz-id', role: 'APRENDIZ' }, env.jwtSecret, { expiresIn: '1h' });

  const mockEvidencia = {
    id: '66666666-6666-6666-6666-666666666666',
    titulo: 'Taller Diagrama Entidad Relación',
    descripcion: 'Diseñar el DER para la base de datos del proyecto AIMS',
    fechaLimite: new Date('2026-09-01'),
    fichaId: '22222222-2222-2222-2222-222222222222',
    instructorId: 'inst-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/evidencias', () => {
    test('should allow authenticated users to list evidencias (200)', async () => {
      evidenciaRepository.getAll.mockResolvedValue([mockEvidencia]);

      const res = await request(app)
        .get('/api/v1/evidencias')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/evidencias', () => {
    test('should allow INSTRUCTOR to create an evidencia (201)', async () => {
      evidenciaRepository.create.mockResolvedValue(mockEvidencia);

      const res = await request(app)
        .post('/api/v1/evidencias')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          titulo: 'Taller Diagrama Entidad Relación',
          descripcion: 'Diseñar el DER para la base de datos del proyecto AIMS',
          fechaLimite: '2026-09-01T23:59:59.000Z',
          fichaId: '22222222-2222-2222-2222-222222222222',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titulo).toBe('Taller Diagrama Entidad Relación');
    });

    test('should deny access to APRENDIZ for creating evidencia (403)', async () => {
      const res = await request(app)
        .post('/api/v1/evidencias')
        .set('Authorization', `Bearer ${aprendizToken}`)
        .send({
          titulo: 'Taller',
          descripcion: 'Descripcion',
          fechaLimite: '2026-09-01T23:59:59.000Z',
          fichaId: '22222222-2222-2222-2222-222222222222',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/evidencias/:id/entregas', () => {
    test('should allow APRENDIZ to submit an entrega (201)', async () => {
      evidenciaRepository.getById.mockResolvedValue(mockEvidencia);
      evidenciaRepository.upsertEntrega.mockResolvedValue({
        id: 'entrega-1',
        evidenciaId: mockEvidencia.id,
        aprendizId: 'aprendiz-id',
        archivoUrl: 'https://storage.com/tarea.pdf',
      });

      const res = await request(app)
        .post(`/api/v1/evidencias/${mockEvidencia.id}/entregas`)
        .set('Authorization', `Bearer ${aprendizToken}`)
        .send({
          archivoUrl: 'https://storage.com/tarea.pdf',
          comentario: 'Adjunto solucion del taller',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/evidencias/:id/entregas/:entregaId/calificar', () => {
    test('should allow INSTRUCTOR to grade an entrega (200)', async () => {
      evidenciaRepository.calificarEntrega.mockResolvedValue({
        id: 'entrega-1',
        nota: 4.8,
      });

      const res = await request(app)
        .put(`/api/v1/evidencias/${mockEvidencia.id}/entregas/77777777-7777-7777-7777-777777777777/calificar`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          nota: 4.8,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
