const request = require('supertest');
const app = require('../../src/app');

// Mock dependencies to isolate integration tests from active database / SMTP services
jest.mock('../../src/modules/usuarios/repositories/userRepository');
jest.mock('../../src/utils/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

const userRepository = require('../../src/modules/usuarios/repositories/userRepository');

describe('Auth Register Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default repository mock implementations
    userRepository.existsByEmail.mockResolvedValue(false);
    userRepository.create.mockImplementation(async (userData) => ({
      id: 'mock-uuid-1234',
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone || null,
      role: userData.role,
      isEmailVerified: userData.isEmailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  test('should register a Gmail email as APRENDIZ', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Juan',
        lastName: 'Gmail',
        email: 'aprendiz.test.gmail@gmail.com',
        password: 'Password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('aprendiz.test.gmail@gmail.com');
    expect(res.body.data.role).toBe('APRENDIZ');
  });

  test('should register a @soy.sena.edu.co email as APRENDIZ', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Juan',
        lastName: 'SenaSoy',
        email: 'aprendiz.test.soy@soy.sena.edu.co',
        password: 'Password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('aprendiz.test.soy@soy.sena.edu.co');
    expect(res.body.data.role).toBe('APRENDIZ');
  });

  test('should register a @sena.edu.co email as INSTRUCTOR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Juan',
        lastName: 'SenaInst',
        email: 'instructor.test.sena@sena.edu.co',
        password: 'Password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('instructor.test.sena@sena.edu.co');
    expect(res.body.data.role).toBe('INSTRUCTOR');
  });

  test('should reject registration with a disallowed email domain', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Juan',
        lastName: 'Outlook',
        email: 'aprendiz.test.outlook@outlook.com',
        password: 'Password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('El dominio del correo no está permitido para registro');
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  test('should ignore and strip role property when client attempts role: ADMIN with gmail.com', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Juan',
        lastName: 'Malicious',
        email: 'aprendiz.test.gmail@gmail.com',
        password: 'Password123',
        role: 'ADMIN',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('APRENDIZ');
  });

  test('should ignore and strip role property when client attempts role: ADMIN with @soy.sena.edu.co', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Maria',
        lastName: 'Sena',
        email: 'maria.estudiante@soy.sena.edu.co',
        password: 'Password123',
        role: 'ADMIN',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('APRENDIZ');
  });

  test('should ignore and strip role property when client attempts role: ADMIN with @sena.edu.co', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Carlos',
        lastName: 'Docente',
        email: 'carlos.docente@sena.edu.co',
        password: 'Password123',
        role: 'ADMIN',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('INSTRUCTOR');
  });

  test('should reject registration when email is already registered (409)', async () => {
    userRepository.existsByEmail.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Duplicado',
        lastName: 'Test',
        email: 'aprendiz.duplicado@gmail.com',
        password: 'Password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('ya está registrado');
  });

  test('should reject registration with weak password (400)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'Usuario',
        email: 'test.usuario@gmail.com',
        password: 'debil',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should reject registration with missing required fields (400)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'incompleto@gmail.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
