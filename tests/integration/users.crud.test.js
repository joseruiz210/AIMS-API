const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

// Mock user repository to isolate integration tests from database dependencies
jest.mock('../../src/modules/usuarios/repositories/userRepository');

const userRepository = require('../../src/modules/usuarios/repositories/userRepository');

describe('Users CRUD & Authorization Integration Tests', () => {
  const adminUser = {
    id: '11111111-1111-1111-1111-111111111111',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@sena.edu.co',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const instructorUser = {
    id: '22222222-2222-2222-2222-222222222222',
    firstName: 'Instructor',
    lastName: 'User',
    email: 'instructor@sena.edu.co',
    role: 'INSTRUCTOR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const aprendizUser = {
    id: '33333333-3333-3333-3333-333333333333',
    firstName: 'Aprendiz',
    lastName: 'User',
    email: 'aprendiz@gmail.com',
    role: 'APRENDIZ',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminToken = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
    env.jwtSecret,
    { expiresIn: '15m' }
  );

  const instructorToken = jwt.sign(
    { id: instructorUser.id, email: instructorUser.email, role: instructorUser.role },
    env.jwtSecret,
    { expiresIn: '15m' }
  );

  const aprendizToken = jwt.sign(
    { id: aprendizUser.id, email: aprendizUser.email, role: aprendizUser.role },
    env.jwtSecret,
    { expiresIn: '15m' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 1. GET /api/v1/users/profile ─────────────────────────────────────────
  describe('GET /api/v1/users/profile', () => {
    test('should allow APRENDIZ to access their profile (200)', async () => {
      userRepository.findById.mockResolvedValue(aprendizUser);

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('APRENDIZ');
    });

    test('should allow INSTRUCTOR to access their profile (200)', async () => {
      userRepository.findById.mockResolvedValue(instructorUser);

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('INSTRUCTOR');
    });

    test('should allow ADMIN to access their profile (200)', async () => {
      userRepository.findById.mockResolvedValue(adminUser);

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('ADMIN');
    });

    test('should reject profile request without token (401)', async () => {
      const res = await request(app).get('/api/v1/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 2. PUT /api/v1/users/profile ─────────────────────────────────────────
  describe('PUT /api/v1/users/profile', () => {
    test('should update profile and strip role or isActive escalation attempts', async () => {
      userRepository.findById.mockResolvedValue(aprendizUser);
      userRepository.update.mockImplementation(async (id, data) => ({
        ...aprendizUser,
        ...data,
      }));

      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${aprendizToken}`)
        .send({
          firstName: 'NuevoNombre',
          role: 'ADMIN',
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('NuevoNombre');
      expect(res.body.data.role).toBe('APRENDIZ'); // Should NOT be elevated to ADMIN
      expect(res.body.data.isActive).toBe(true); // Should NOT be modified
    });
  });

  // ─── 3. GET /api/v1/users (List users) ────────────────────────────────────
  describe('GET /api/v1/users', () => {
    test('should allow ADMIN to list users (200)', async () => {
      userRepository.findAll.mockResolvedValue({
        users: [adminUser, instructorUser, aprendizUser],
        total: 3,
      });

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
    });

    test('should pass query filters and pagination to repository correctly (200)', async () => {
      userRepository.findAll.mockResolvedValue({
        users: [instructorUser],
        total: 1,
      });

      const res = await request(app)
        .get('/api/v1/users')
        .query({
          page: 1,
          limit: 5,
          role: 'INSTRUCTOR',
          isActive: true,
          search: 'Instructor',
          sortBy: 'lastName',
          order: 'asc',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(userRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 5,
        where: expect.objectContaining({
          role: 'INSTRUCTOR',
          isActive: true,
        }),
        orderBy: { lastName: 'asc' },
      });
    });

    test('should deny access to APRENDIZ (403)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('should deny access to INSTRUCTOR (403)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('should deny access without token (401)', async () => {
      const res = await request(app).get('/api/v1/users');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 4. GET /api/v1/users/:id ─────────────────────────────────────────────
  describe('GET /api/v1/users/:id', () => {
    test('should return user for ADMIN with valid existing UUID (200)', async () => {
      userRepository.findById.mockResolvedValue(aprendizUser);

      const res = await request(app)
        .get(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(aprendizUser.id);
    });

    test('should return 400 Bad Request for invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/v1/users/not-a-valid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 Not Found for non-existent UUID', async () => {
      userRepository.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/users/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should deny access to APRENDIZ (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(403);
    });

    test('should deny access to INSTRUCTOR (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 5. PUT /api/v1/users/:id ─────────────────────────────────────────────
  describe('PUT /api/v1/users/:id', () => {
    test('should allow ADMIN to update user (200)', async () => {
      userRepository.findById.mockResolvedValue(aprendizUser);
      userRepository.update.mockResolvedValue({ ...aprendizUser, firstName: 'Updated' });

      const res = await request(app)
        .put(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should deny access to APRENDIZ (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${aprendizToken}`)
        .send({ firstName: 'Updated' });

      expect(res.status).toBe(403);
    });

    test('should deny access to INSTRUCTOR (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ firstName: 'Updated' });

      expect(res.status).toBe(403);
    });
  });

  // ─── 6. PATCH /api/v1/users/:id/toggle-active ─────────────────────────────
  describe('PATCH /api/v1/users/:id/toggle-active', () => {
    test('should allow ADMIN to toggle active status (200)', async () => {
      userRepository.findById.mockResolvedValue(aprendizUser);
      userRepository.update.mockResolvedValue({ ...aprendizUser, isActive: false });

      const res = await request(app)
        .patch(`/api/v1/users/${aprendizUser.id}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should deny toggle-active to APRENDIZ (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${aprendizUser.id}/toggle-active`)
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(403);
    });

    test('should deny toggle-active to INSTRUCTOR (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${aprendizUser.id}/toggle-active`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 7. DELETE /api/v1/users/:id ──────────────────────────────────────────
  describe('DELETE /api/v1/users/:id', () => {
    test('should allow ADMIN to delete user (200)', async () => {
      userRepository.findById.mockResolvedValue(aprendizUser);
      userRepository.delete.mockResolvedValue(aprendizUser);

      const res = await request(app)
        .delete(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 404 Not Found when ADMIN attempts to delete non-existent user', async () => {
      userRepository.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/v1/users/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    test('should deny delete to APRENDIZ (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${aprendizToken}`);

      expect(res.status).toBe(403);
    });

    test('should deny delete to INSTRUCTOR (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${aprendizUser.id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 7. CREATE USER (ADMIN ONLY) ──────────────────────────────────────────
  describe('POST /api/v1/users', () => {
    test('should allow ADMIN to create a user directly (201)', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockResolvedValue({
        id: 'new-user-uuid',
        firstName: 'Valentina',
        lastName: 'Torres',
        email: 'v.torres@sena.edu.co',
        role: 'INSTRUCTOR',
        isActive: true,
      });

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Valentina',
          lastName: 'Torres',
          email: 'v.torres@sena.edu.co',
          role: 'INSTRUCTOR',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('INSTRUCTOR');
    });

    test('should deny user creation to APRENDIZ (403)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${aprendizToken}`)
        .send({
          firstName: 'Valentina',
          lastName: 'Torres',
          email: 'v.torres@sena.edu.co',
        });

      expect(res.status).toBe(403);
    });
  });
});
