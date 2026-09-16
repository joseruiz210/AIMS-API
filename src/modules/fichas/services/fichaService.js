const fichaRepository = require('../repositories/fichaRepository');
const userRepository = require('../../usuarios/repositories/userRepository');
const AppError = require('../../../utils/appError');
const logAudit = require('../../../utils/auditLogger');
const prisma = require('../../../config/database');
const XLSX = require('xlsx');

const REQUIRED_COLUMNS = ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'correo'];
const HEADER_ALIASES = {
  tipodocumento: 'tipoDocumento',
  tipodedocumento: 'tipoDocumento',
  documenttype: 'tipoDocumento',
  numerodocumento: 'numeroDocumento',
  numerodedocumento: 'numeroDocumento',
  documentnumber: 'numeroDocumento',
  nombres: 'nombres',
  nombre: 'nombres',
  firstname: 'nombres',
  apellidos: 'apellidos',
  apellido: 'apellidos',
  lastname: 'apellidos',
  correo: 'correo',
  email: 'correo',
};

const normalizeHeader = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const normalizeValue = (value) => String(value ?? '').trim();

const parseLearnersFile = (buffer, fileName) => {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch (_error) {
    throw AppError.badRequest('El archivo no tiene un formato CSV o Excel válido');
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
  if (!rows.length) throw AppError.badRequest('El archivo está vacío');

  const headers = rows[0].map(normalizeHeader);
  const columns = headers.map((header) => HEADER_ALIASES[header]);
  if (columns.some((column) => !column) || new Set(columns).size !== columns.length) {
    throw AppError.badRequest('El archivo contiene columnas desconocidas o duplicadas');
  }

  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) throw AppError.badRequest(`Faltan columnas obligatorias: ${missing.join(', ')}`);

  const learners = rows.slice(1).map((row, index) => {
    const learner = {};
    columns.forEach((column, columnIndex) => { learner[column] = normalizeValue(row[columnIndex]); });
    learner.rowNumber = index + 2;
    return learner;
  }).filter((learner) => REQUIRED_COLUMNS.some((column) => learner[column] !== ''));

  if (!learners.length) throw AppError.badRequest('El archivo no contiene aprendices');
  return { fileName, learners };
};

const validateLearners = (learners) => {
  const seenDocuments = new Set();
  const seenEmails = new Set();
  const errors = [];

  learners.forEach((learner) => {
    const documentKey = `${learner.tipoDocumento.toUpperCase()}|${learner.numeroDocumento}`;
    const email = learner.correo.toLowerCase();
    if (!learner.tipoDocumento || !learner.numeroDocumento || !learner.nombres || !learner.apellidos || !learner.correo) {
      errors.push(`Fila ${learner.rowNumber}: todos los campos son obligatorios`);
    }
    if (learner.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(learner.correo)) {
      errors.push(`Fila ${learner.rowNumber}: el correo no es válido`);
    }
    if (seenDocuments.has(documentKey)) errors.push(`Fila ${learner.rowNumber}: documento duplicado en el archivo`);
    if (seenEmails.has(email)) errors.push(`Fila ${learner.rowNumber}: correo duplicado en el archivo`);
    seenDocuments.add(documentKey);
    seenEmails.add(email);
  });

  if (errors.length) throw AppError.badRequest('El archivo contiene datos inválidos', errors);
};

class FichaService {
  async getAll(user) {
    return fichaRepository.getAll(user);
  }

  async getById(id, user = null) {
    const ficha = await fichaRepository.getById(id);
    if (!ficha) {
      throw AppError.notFound('Ficha de formación no encontrada');
    }
    if (user?.role === 'INSTRUCTOR' && ficha.instructorId !== user.id && !(ficha.instructorAssignments || []).some((assignment) => assignment.instructorId === user.id)) {
      throw AppError.forbidden('No tienes acceso a esta ficha');
    }
    return ficha;
  }

  async create(userId, data) {
    const existing = await fichaRepository.findByNumero(data.numero);
    if (existing) {
      throw AppError.conflict('Ya existe una ficha registrada con este número');
    }

    const nuevaFicha = await fichaRepository.create(data);
    if (data.instructorId) await this.assignInstructor(userId, nuevaFicha.id, data.instructorId, true);
    await logAudit(userId, 'CREAR_FICHA', { fichaId: nuevaFicha.id, numero: nuevaFicha.numero });
    return nuevaFicha;
  }

  async update(userId, id, data, userRole = 'ADMIN') {
    const ficha = await this.getById(id, { id: userId, role: userRole });
    if (userRole === 'INSTRUCTOR') {
      const { instructorId, ...instructorData } = data;
      data = instructorData;
    }
    if (data.numero) {
      const existing = await fichaRepository.findByNumero(data.numero);
      if (existing && existing.id !== id) {
        throw AppError.conflict('El número de ficha ya está en uso');
      }
    }
    const fichaActualizada = await fichaRepository.update(id, data);
    await logAudit(userId, 'ACTUALIZAR_FICHA', { fichaId: id });
    return fichaActualizada;
  }

  async delete(userId, id) {
    await this.getById(id);
    await fichaRepository.delete(id);
    await logAudit(userId, 'ELIMINAR_FICHA', { fichaId: id });
  }

  async addAprendiz(userId, fichaId, aprendizId) {
    await this.getById(fichaId);
    const aprendiz = await userRepository.findById(aprendizId);
    if (!aprendiz || aprendiz.role !== 'APRENDIZ') {
      throw AppError.badRequest('El usuario no existe o no tiene el rol APRENDIZ');
    }

    const isInFicha = await fichaRepository.isAprendizInFicha(fichaId, aprendizId);
    if (isInFicha) {
      throw AppError.conflict('El aprendiz ya está matriculado en esta ficha');
    }

    const relacion = await fichaRepository.addAprendiz(fichaId, aprendizId);
    await logAudit(userId, 'MATRICULAR_APRENDIZ', { fichaId, aprendizId });
    return relacion;
  }

  async removeAprendiz(userId, fichaId, aprendizId) {
    await this.getById(fichaId);
    const isInFicha = await fichaRepository.isAprendizInFicha(fichaId, aprendizId);
    if (!isInFicha) {
      throw AppError.notFound('El aprendiz no se encuentra matriculado en esta ficha');
    }

    await fichaRepository.removeAprendiz(fichaId, aprendizId);
    await logAudit(userId, 'DESMATRICULAR_APRENDIZ', { fichaId, aprendizId });
  }

  async importAprendices(userId, fichaId, file) {
    const ficha = await prisma.ficha.findUnique({ where: { id: fichaId }, select: { id: true, instructorId: true } });
    if (!ficha) throw AppError.notFound('Ficha de formación no encontrada');
    if (ficha.instructorId !== userId) {
      let assignment = null;
      try {
        if (prisma.instructorFicha) {
          assignment = await prisma.instructorFicha.findFirst({ where: { fichaId, instructorId: userId }, select: { id: true } });
        }
      } catch (error) {
        if (error.code !== 'P2021') throw error;
      }
      if (!assignment) throw AppError.forbidden('Solo un instructor asignado puede cargar aprendices en esta ficha');
    }
    if (!file) throw AppError.badRequest('Debes adjuntar un archivo en el campo archivo');

    const { fileName, learners } = parseLearnersFile(file.buffer, file.originalname);
    validateLearners(learners);

    const result = await prisma.$transaction(async (tx) => {
      const emails = learners.map((learner) => learner.correo.toLowerCase());
      const documents = learners.map((learner) => learner.numeroDocumento);
      const existingUsers = await tx.user.findMany({
        where: { OR: [{ email: { in: emails } }, { documentNumber: { in: documents } }] },
        select: { id: true, email: true, documentType: true, documentNumber: true, role: true },
      });
      const existingByEmail = new Map(existingUsers.map((user) => [user.email.toLowerCase(), user]));
      const existingByDocument = new Map(existingUsers.filter((user) => user.documentNumber)
        .map((user) => [`${user.documentType}|${user.documentNumber}`, user]));
      const errors = [];

      for (const learner of learners) {
        const byEmail = existingByEmail.get(learner.correo.toLowerCase());
        const byDocument = existingByDocument.get(`${learner.tipoDocumento.toUpperCase()}|${learner.numeroDocumento}`);
        if ((byEmail && byEmail.role !== 'APRENDIZ') || (byDocument && byDocument.role !== 'APRENDIZ')) {
          errors.push(`Fila ${learner.rowNumber}: el correo o documento ya pertenece a otro rol`);
        } else if ((byEmail && (byEmail.documentType !== learner.tipoDocumento.toUpperCase() || byEmail.documentNumber !== learner.numeroDocumento)) || (byDocument && byDocument.email.toLowerCase() !== learner.correo.toLowerCase())) {
          errors.push(`Fila ${learner.rowNumber}: correo y documento no pertenecen al mismo aprendiz`);
        }
      }
      if (errors.length) throw AppError.badRequest('No se pudo validar la carga', errors);

      const created = [];
      for (const learner of learners) {
        const existing = existingByEmail.get(learner.correo.toLowerCase());
        const user = existing || await tx.user.create({
          data: {
            firstName: learner.nombres,
            lastName: learner.apellidos,
            email: learner.correo.toLowerCase(),
            password: null,
            role: 'APRENDIZ',
            documentType: learner.tipoDocumento.toUpperCase(),
            documentNumber: learner.numeroDocumento,
            isPreRegistered: true,
          },
        });
        await tx.matricula.create({ data: { fichaId, aprendizId: user.id } });
        created.push(user.id);
      }

      return tx.cargaAprendices.create({
        data: { fichaId, uploadedById: userId, fileName, totalRows: learners.length, createdRows: created.length },
        select: { id: true, fileName: true, totalRows: true, createdRows: true, uploadedById: true, createdAt: true },
      });
    });

    await logAudit(userId, 'CARGAR_APRENDICES_FICHA', { fichaId, cargaId: result.id, totalRows: result.totalRows });
    return result;
  }

  async assignInstructor(adminId, fichaId, instructorId, isLeader = false) {
    const instructor = await prisma.user.findUnique({ where: { id: instructorId }, select: { id: true, role: true } });
    if (!instructor || instructor.role !== 'INSTRUCTOR') throw AppError.badRequest('El usuario debe tener el rol INSTRUCTOR');

    const result = await prisma.$transaction(async (tx) => {
      await tx.ficha.findUniqueOrThrow({ where: { id: fichaId } });
      if (isLeader) await tx.instructorFicha.updateMany({ where: { fichaId }, data: { isLeader: false } });
      const assignment = await tx.instructorFicha.upsert({
        where: { fichaId_instructorId: { fichaId, instructorId } },
        create: { fichaId, instructorId, isLeader },
        update: { isLeader: isLeader || undefined },
      });
      if (isLeader) await tx.ficha.update({ where: { id: fichaId }, data: { instructorId } });
      return assignment;
    });
    await logAudit(adminId, 'ASIGNAR_INSTRUCTOR_FICHA', { fichaId, instructorId, isLeader });
    return result;
  }

  async setLeader(adminId, fichaId, instructorId) {
    const assignment = await prisma.instructorFicha.findUnique({ where: { fichaId_instructorId: { fichaId, instructorId } } });
    if (!assignment) throw AppError.badRequest('El instructor no está asignado a esta ficha');
    return this.assignInstructor(adminId, fichaId, instructorId, true);
  }

  async removeInstructor(adminId, fichaId, instructorId) {
    const assignment = await prisma.instructorFicha.findUnique({ where: { fichaId_instructorId: { fichaId, instructorId } } });
    if (!assignment) throw AppError.notFound('La asignación no existe');
    await prisma.$transaction(async (tx) => {
      await tx.instructorFicha.delete({ where: { fichaId_instructorId: { fichaId, instructorId } } });
      const ficha = await tx.ficha.findUnique({ where: { id: fichaId }, select: { instructorId: true } });
      if (ficha?.instructorId === instructorId) {
        const nextLeader = await tx.instructorFicha.findFirst({ where: { fichaId, isLeader: true }, select: { instructorId: true } });
        await tx.ficha.update({ where: { id: fichaId }, data: { instructorId: nextLeader?.instructorId || null } });
      }
    });
    await logAudit(adminId, 'RETIRAR_INSTRUCTOR_FICHA', { fichaId, instructorId });
  }
}

module.exports = new FichaService();
