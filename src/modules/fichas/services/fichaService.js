const fichaRepository = require('../repositories/fichaRepository');
const userRepository = require('../../usuarios/repositories/userRepository');
const AppError = require('../../../utils/appError');
const logAudit = require('../../../utils/auditLogger');
const prisma = require('../../../config/database');
const XLSX = require('xlsx');
const { uploadBuffer } = require('../../../utils/fileStorage');
const { fixMojibake } = require('../../../utils/textUtils');

const REQUIRED_COLUMNS = ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'correo'];
const HEADER_ALIASES = {
  // tipoDocumento
  tipodocumento: 'tipoDocumento',
  tipodedocumento: 'tipoDocumento',
  tipodoc: 'tipoDocumento',
  tdocumento: 'tipoDocumento',
  documenttype: 'tipoDocumento',
  doctype: 'tipoDocumento',
  tipo: 'tipoDocumento',
  // numeroDocumento
  numerodocumento: 'numeroDocumento',
  numerodedocumento: 'numeroDocumento',
  numerodoc: 'numeroDocumento',
  numdocumento: 'numeroDocumento',
  numdoc: 'numeroDocumento',
  nodocumento: 'numeroDocumento',
  nodoc: 'numeroDocumento',
  documentnumber: 'numeroDocumento',
  docnumber: 'numeroDocumento',
  documento: 'numeroDocumento',
  doc: 'numeroDocumento',
  identificacion: 'numeroDocumento',
  numeroidentificacion: 'numeroDocumento',
  cedula: 'numeroDocumento',
  tarjetaidentidad: 'numeroDocumento',
  // nombres
  nombres: 'nombres',
  nombre: 'nombres',
  firstname: 'nombres',
  name: 'nombres',
  // apellidos
  apellidos: 'apellidos',
  apellido: 'apellidos',
  lastname: 'apellidos',
  surname: 'apellidos',
  // correo
  correo: 'correo',
  correoelectronico: 'correo',
  correoelectronica: 'correo',
  correoelectronic: 'correo',
  correoinstitucional: 'correo',
  correomisenas: 'correo',
  correomisena: 'correo',
  correosena: 'correo',
  correosoysena: 'correo',
  soysena: 'correo',
  email: 'correo',
  mail: 'correo',
  // ficha
  ficha: 'ficha',
  fichas: 'ficha',
  fichanumero: 'ficha',
  numerodeficha: 'ficha',
  numeroficha: 'ficha',
  noficha: 'ficha',
  codigoficha: 'ficha',
  numficha: 'ficha',
  // programa
  programa: 'programa',
  programadeformacion: 'programa',
  programaformacion: 'programa',
  nombreprograma: 'programa',
  formacion: 'programa',
};

const normalizeHeader = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const sanitizeFicha = (f) => {
  if (!f) return f;
  if (f.programa && f.programa.nombre) {
    f.programa.nombre = fixMojibake(f.programa.nombre);
  }
  if (f.jornada) {
    f.jornada = fixMojibake(f.jornada);
  }
  if (f.sede) {
    f.sede = fixMojibake(f.sede);
  }
  return f;
};

const normalizeValue = (value) => fixMojibake(String(value ?? ''));

const cleanDocNumber = (val) => String(val ?? '').replace(/[\.\s-]/g, '').trim();

const normalizeDocType = (val) => {
  const clean = String(val ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
  if (clean.includes('CEDULA DE CIUDADANIA') || clean === 'CC' || clean === 'C.C.') return 'CC';
  if (clean.includes('TARJETA DE IDENTIDAD') || clean === 'TI' || clean === 'T.I.') return 'TI';
  if (clean.includes('CEDULA DE EXTRANJERIA') || clean === 'CE' || clean === 'C.E.') return 'CE';
  if (clean.includes('PASAPORTE') || clean === 'PAS' || clean === 'PA') return 'PAS';
  if (clean.includes('PERMISO ESPECIAL') || clean === 'PEP') return 'PEP';
  if (clean.includes('PERMISO POR PROTECCION') || clean === 'PPT') return 'PPT';
  return clean || 'CC';
};

const resolveHeader = (header) => {
  const norm = normalizeHeader(header);
  if (HEADER_ALIASES[norm]) return HEADER_ALIASES[norm];

  // Documento
  if (norm.includes('documento') || norm.includes('identificacion') || norm.includes('cedula') || norm.includes('tarjeta')) {
    if (norm.includes('tipo') || norm.startsWith('tip')) return 'tipoDocumento';
    return 'numeroDocumento';
  }
  // Nombres
  if ((norm.includes('nombre') || norm.includes('name')) && !norm.includes('programa')) return 'nombres';
  // Apellidos
  if (norm.includes('apellido') || norm.includes('lastname') || norm.includes('surname')) return 'apellidos';
  // Correo / Email (admite gmail, soysena, misena, etc.)
  if (norm.includes('correo') || norm.includes('email') || norm.includes('mail') || norm.includes('soysena') || norm.includes('misena') || norm.includes('gmail')) {
    return 'correo';
  }
  // Ficha
  if (norm.includes('ficha')) return 'ficha';
  // Programa
  if (norm.includes('programa') || norm.includes('formacion')) return 'programa';

  return norm;
};

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

  // Detectar la fila de encabezados dinámicamente (por si hay filas vacías o títulos institucionales arriba)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const candidateRow = rows[i] || [];
    const matchedCount = candidateRow.filter((cell) => {
      const h = resolveHeader(cell);
      return ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'correo'].includes(h);
    }).length;
    if (matchedCount >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = rows[headerRowIndex] || [];
  let emailColIndex = 0;
  const columns = headerRow.map((rawHeader) => {
    const resolved = resolveHeader(rawHeader);
    if (resolved === 'correo') {
      emailColIndex++;
      return emailColIndex === 1 ? 'correo' : `correo_alt_${emailColIndex}`;
    }
    return resolved;
  });

  const nonAltColumns = columns.filter((c) => !c.startsWith('correo_alt_'));
  if (new Set(nonAltColumns).size !== nonAltColumns.length) {
    throw AppError.badRequest('El archivo contiene columnas duplicadas');
  }

  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) throw AppError.badRequest(`Faltan columnas obligatorias: ${missing.join(', ')}`);

  const learners = rows.slice(headerRowIndex + 1).map((row, index) => {
    const learner = {};
    columns.forEach((column, columnIndex) => { learner[column] = normalizeValue(row[columnIndex]); });
    learner.rowNumber = headerRowIndex + index + 2;

    // Si el archivo tiene múltiples columnas de correo (ej. Soy Sena y Gmail/Personal), priorizar institucional o la que esté diligenciada
    const emailCandidates = [
      learner.correo,
      learner.correo_alt_2,
      learner.correo_alt_3,
      learner.correo_alt_4,
    ].map((e) => (e || '').trim()).filter(Boolean);

    const senaEmail = emailCandidates.find((e) => /@(soy\.)?sena\.edu\.co|@misena\.edu\.co/i.test(e));
    learner.correo = senaEmail || emailCandidates[0] || '';

    if (learner.numeroDocumento) {
      learner.numeroDocumento = cleanDocNumber(learner.numeroDocumento);
    }
    if (learner.tipoDocumento) {
      learner.tipoDocumento = normalizeDocType(learner.tipoDocumento);
    }
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
  async searchPublic(search = '') {
    const term = String(search || '').trim();
    const where = {
      estado: 'Activo',
      ...(term
        ? {
            OR: [
              { numero: { contains: term, mode: 'insensitive' } },
              { badgeCode: { contains: term, mode: 'insensitive' } },
              { programa: { nombre: { contains: term, mode: 'insensitive' } } },
              { programa: { codigo: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const fichas = await prisma.ficha.findMany({
      where,
      select: {
        id: true,
        numero: true,
        badgeCode: true,
        estado: true,
        jornada: true,
        programa: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
      take: 20,
      orderBy: { numero: 'asc' },
    });
    return fichas.map(sanitizeFicha);
  }

  async getAll(user, search = '') {
    const fichas = await fichaRepository.getAll(user, search);
    return Array.isArray(fichas) ? fichas.map(sanitizeFicha) : fichas;
  }

  async getById(id, user = null) {
    const ficha = await fichaRepository.getById(id);
    if (!ficha) {
      throw AppError.notFound('Ficha de formación no encontrada');
    }
    return sanitizeFicha(ficha);
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

    const existingMatricula = await prisma.matricula.findFirst({
      where: { aprendizId },
      include: { ficha: true },
    });
    if (existingMatricula) {
      if (existingMatricula.fichaId === fichaId) {
        throw AppError.conflict('El aprendiz ya está matriculado en esta ficha');
      }
      throw AppError.conflict(
        `El aprendiz ya se encuentra matriculado en la ficha ${existingMatricula.ficha?.numero || existingMatricula.fichaId}. Un aprendiz únicamente puede pertenecer a una sola ficha.`
      );
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
            isActive: false,
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
              isActive: false,
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

    try {
  const up = await uploadBuffer(file.buffer, {
    folder: 'cargas',
    originalName: file.originalname,
    mimeType: file.mimetype,
  });
  await prisma.cargaAprendices.create({
    data: {
      uploadedById: userId,
      fileName: result.fileName,
      totalRows: result.totalRows,
      createdRows: result.createdRows,
      fileKey: up.key,
    },
  });
} catch (err) {
  console.error('No se pudo respaldar el CSV:', err.message);
}

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
