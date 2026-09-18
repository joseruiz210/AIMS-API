const reportesRepository = require('../repositories/reportesRepository');
const calificacionRepository = require('../../calificaciones/repositories/calificacionRepository');
const asistenciaRepository = require('../../asistencia/repositories/asistenciaRepository');
const prisma = require('../../../config/database');
const AppError = require('../../../utils/appError');
const { uploadBuffer, getDownloadUrl } = require('../../../utils/fileStorage');
const { buildPdfBuffer, buildExcelBuffer } = require('../../../utils/reportBuilders');

class ReportesService {
  async getDashboardStats() {
    return reportesRepository.getDashboardStats();
  }

  async getRecentActivity(limit) {
    return reportesRepository.getRecentActivity(limit);
  }

  // Admin/superadmin: acceso a cualquier ficha. Instructor: solo sus fichas (líder o asignado).
  async _checkFichaAccess(fichaId, currentUser) {
    const ficha = await prisma.ficha.findUnique({
      where: { id: fichaId },
      select: { id: true, numero: true, instructorId: true },
    });
    if (!ficha) throw AppError.notFound('Ficha de formación no encontrada');

    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(currentUser.role);
    if (!isAdmin) {
      const isOwner = ficha.instructorId === currentUser.id;
      let isAssigned = false;
      if (!isOwner) {
        const assignment = await prisma.instructorFicha.findFirst({
          where: { fichaId, instructorId: currentUser.id },
          select: { id: true },
        });
        isAssigned = !!assignment;
      }
      if (!isOwner && !isAssigned) {
        throw AppError.forbidden('No tienes acceso a los reportes de esta ficha');
      }
    }
    return ficha;
  }

  async generateNotasFichaReport(fichaId, format, currentUser) {
    const ficha = await this._checkFichaAccess(fichaId, currentUser);
    const competencias = await calificacionRepository.getCalificacionesByFicha(fichaId);

    const rows = [];
    competencias.forEach((comp) => {
      comp.students.forEach((s) => {
        rows.push({
          aprendiz: s.name,
          competencia: comp.title,
          nota: s.nota,
          estado: s.hasRecord ? 'Registrada' : 'Sin registro',
        });
      });
    });

    const columns = [
      { header: 'Aprendiz', key: 'aprendiz', width: 28 },
      { header: 'Competencia', key: 'competencia', width: 28 },
      { header: 'Nota', key: 'nota', width: 10 },
      { header: 'Estado', key: 'estado', width: 16 },
    ];

    return this._buildAndUpload({
      title: `Reporte de notas — Ficha ${ficha.numero}`,
      fileBase: `notas-ficha-${ficha.numero}`,
      columns,
      rows,
      format,
    });
  }

  async generateAsistenciaFichaReport(fichaId, format, fecha, currentUser) {
    const ficha = await this._checkFichaAccess(fichaId, currentUser);
    const registros = await asistenciaRepository.getAsistenciasByFicha(fichaId, fecha);

    const rows = registros.map((r) => ({
      aprendiz: `${r.aprendiz.firstName} ${r.aprendiz.lastName || ''}`.trim(),
      fecha: new Date(r.fecha).toLocaleDateString('es-CO'),
      tema: r.tema || '—',
      estado: r.estado,
      observacion: r.observacion || '',
    }));

    const columns = [
      { header: 'Aprendiz', key: 'aprendiz', width: 28 },
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Tema', key: 'tema', width: 24 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Observación', key: 'observacion', width: 24 },
    ];

    return this._buildAndUpload({
      title: `Reporte de asistencia — Ficha ${ficha.numero}`,
      fileBase: `asistencia-ficha-${ficha.numero}${fecha ? `-${fecha}` : ''}`,
      columns,
      rows,
      format,
    });
  }

  async _buildAndUpload({ title, fileBase, columns, rows, format }) {
    const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
    const fileName = `${fileBase}.${ext}`;
    const mimeType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';

    const buffer = format === 'xlsx'
      ? await buildExcelBuffer({ title, columns, rows })
      : await buildPdfBuffer({ title, subtitle: `Generado ${new Date().toLocaleString('es-CO')}`, columns, rows });

    const { key } = await uploadBuffer(buffer, { folder: 'reportes', originalName: fileName, mimeType });
    const downloadUrl = await getDownloadUrl(key, fileName, { expiresIn: 300 });
    return { downloadUrl, format, fileName };
  }
}

module.exports = new ReportesService();