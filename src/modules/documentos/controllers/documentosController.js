const { success } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class DocumentosController {
  getDocumentosAprendiz = catchAsync(async (req, res) => {
    const docs = [
      {
        id: '1',
        nombre: 'Certificado de Matrícula Oficial',
        tipo: 'PDF (1.2 MB)',
        fechaEmision: '2024-02-10',
        estado: 'Disponible',
        verificationCode: 'SENA-VERIF-9982412',
      },
      {
        id: '2',
        nombre: 'Carné Digital Institucional SENA',
        tipo: 'PNG / PDF',
        fechaEmision: '2024-02-05',
        estado: 'Disponible',
        verificationCode: 'SENA-VERIF-9982413',
      },
      {
        id: '3',
        nombre: 'Constancia de Calificaciones y Asistencia',
        tipo: 'PDF (850 KB)',
        fechaEmision: '2026-08-20',
        estado: 'Disponible',
        verificationCode: 'SENA-VERIF-9982414',
      },
      {
        id: '4',
        nombre: 'Paz y Salvo Académico de Trimestre',
        tipo: 'PDF',
        fechaEmision: '2026-08-01',
        estado: 'En Trámite',
        verificationCode: 'SENA-VERIF-9982415',
      },
    ];

    return success(res, docs, 'Documentos académicos obtenidos exitosamente');
  });

  descargarDocumento = catchAsync(async (req, res) => {
    return success(
      res,
      {
        docId: req.params.id,
        verificationCode: `SENA-VERIF-${Math.floor(1000000 + Math.random() * 9000000)}`,
        downloadUrl: `/downloads/documento-${req.params.id}.pdf`,
      },
      'Descarga iniciada exitosamente'
    );
  });
}

module.exports = new DocumentosController();
