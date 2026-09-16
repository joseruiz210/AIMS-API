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
  ficha: 'ficha',
  fichanumero: 'ficha',
  numerodeficha: 'ficha',
  numeroficha: 'ficha',
  programa: 'programa',
  programadeformacion: 'programa',
  programaformacion: 'programa',
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
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, codepage: 65001 });
  } catch (_error) {
    try {
      const textContent = buffer.toString('utf-8');
      workbook = XLSX.read(textContent, { type: 'string', cellDates: false });
    } catch (_err) {
      throw AppError.badRequest('El archivo no tiene un formato CSV o Excel válido');
    }
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
  if (!rows.length) throw AppError.badRequest('El archivo está vacío');

  const headers = rows[0].map(normalizeHeader);
  const columns = headers.map((header) => HEADER_ALIASES[header] || header);

  if (new Set(columns).size !== columns.length) {
    throw AppError.badRequest('El archivo contiene columnas duplicadas');
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

  async importAprendices(userId, fichaId, file, currentUser = null) {
    const ficha = await prisma.ficha.findUnique({ where: { id: fichaId }, select: { id: true, instructorId: true } });
    if (!ficha) throw AppError.notFound('Ficha de formación no encontrada');
    const isSystemAdmin = currentUser && ['ADMIN', 'SUPERADMIN'].includes(currentUser.role);
    if (!isSystemAdmin && ficha.instructorId !== userId) {
      let assignment = null;
      try {
        if (prisma.instructorFicha) {
          assignment = await prisma.instructorFicha.findFirst({ where: { fichaId, instructorId: userId }, select: { id: true } });
        }
      } catch (error) {
        if (error.code !== 'P2021') throw error;
      }
      if (!assignment) throw AppError.forbidden('Solo un instructor asignado o administrador puede cargar aprendices en esta ficha');
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
        await tx.matricula.upsert({
          where: { fichaId_aprendizId: { fichaId, aprendizId: user.id } },
          create: { fichaId, aprendizId: user.id },
          update: {},
        });
        created.push(user.id);
      }

      return tx.cargaAprendices.create({
        data: { fichaId, uploadedById: userId, fileName, totalRows: learners.length, createdRows: created.length },
        select: { id: true, fileName: true, totalRows: true, createdRows: true, uploadedById: true, createdAt: true },
      });
    }, { maxWait: 15000, timeout: 60000 });

    await logAudit(userId, 'CARGAR_APRENDICES_FICHA', { fichaId, cargaId: result.id, totalRows: result.totalRows });
    return result;
  }

  async importAprendicesGeneral(userId, file, currentUser = null) {
    if (!file) throw AppError.badRequest('Debes adjuntar un archivo en el campo archivo');

    const { fileName, learners } = parseLearnersFile(file.buffer, file.originalname);
    validateLearners(learners);

    const result = await prisma.$transaction(async (tx) => {
      const createdUserIds = [];
      const fichaMap = new Map();
      const programaMap = new Map();

      // Pre-cargar fichas y programas existentes
      const existingFichas = await tx.ficha.findMany({ select: { id: true, numero: true } });
      existingFichas.forEach((f) => fichaMap.set(f.numero, f.id));

      const existingProgramas = await tx.programa.findMany({ select: { id: true, nombre: true } });
      existingProgramas.forEach((p) => programaMap.set(p.nombre.toLowerCase(), p.id));

      // Pre-cargar usuarios existentes
      const emails = learners.map((l) => l.correo.toLowerCase());
      const existingUsers = await tx.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true },
      });
      const userMap = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));

      for (const learner of learners) {
        let currentFichaId;

        if (learner.ficha) {
          const fichaNum = String(learner.ficha).trim();
          if (fichaMap.has(fichaNum)) {
            currentFichaId = fichaMap.get(fichaNum);
          } else {
            const progName = learner.programa || 'Programa de Formación';
            const progKey = progName.toLowerCase();
            let progId = programaMap.get(progKey);

            if (!progId) {
              const progObj = await tx.programa.create({
                data: {
                  nombre: progName,
                  codigo: `PROG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                },
              });
              progId = progObj.id;
              programaMap.set(progKey, progId);
            }

            const fichaObj = await tx.ficha.create({
              data: {
                numero: fichaNum,
                programaId: progId,
                instructorId: currentUser?.role === 'INSTRUCTOR' ? userId : null,
              },
            });
            currentFichaId = fichaObj.id;
            fichaMap.set(fichaNum, currentFichaId);
          }
        } else {
          throw AppError.badRequest(`Fila ${learner.rowNumber}: se requiere indicar la ficha o cargar desde una ficha específica`);
        }

        const email = learner.correo.toLowerCase();
        let user = userMap.get(email);
        if (!user) {
          user = await tx.user.create({
            data: {
              firstName: learner.nombres,
              lastName: learner.apellidos,
              email,
              password: null,
              role: 'APRENDIZ',
              documentType: learner.tipoDocumento.toUpperCase(),
              documentNumber: learner.numeroDocumento,
              isPreRegistered: true,
            },
          });
          userMap.set(email, user);
        }

        await tx.matricula.upsert({
          where: { fichaId_aprendizId: { fichaId: currentFichaId, aprendizId: user.id } },
          create: { fichaId: currentFichaId, aprendizId: user.id },
          update: {},
        });

        createdUserIds.push(user.id);
      }

      return {
        fileName,
        totalRows: learners.length,
        createdRows: createdUserIds.length,
        message: 'Fichas y aprendices procesados exitosamente desde el archivo',
      };
    }, { maxWait: 15000, timeout: 60000 });

    await logAudit(userId, 'CARGAR_APRENDICES_GENERAL', { fileName: result.fileName, totalRows: result.totalRows });
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
