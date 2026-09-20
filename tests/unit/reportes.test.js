const { generatePDFReport } = require('../../src/utils/pdfGenerator');
const reportesService = require('../../src/modules/reportes/services/reportesService');

describe('PDF Generation & Reportes Service Unit Tests', () => {
  test('generatePDFReport should generate a valid PDF Buffer', async () => {
    const headers = ['Columna 1', 'Columna 2'];
    const rows = [['Dato 1', 'Dato 2'], ['Dato 3', 'Dato 4']];
    const buffer = await generatePDFReport('Test PDF', 'Subtítulo Test', headers, rows);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    // Verificar que los primeros 4 bytes sean la firma mágica del PDF (%PDF)
    const headerString = buffer.toString('utf-8', 0, 5);
    expect(headerString).toBe('%PDF-');
  });

  test('reportesService.exportarReportePDF should generate PDF for asistencia', async () => {
    const result = await reportesService.exportarReportePDF('asistencia');
    expect(result).toHaveProperty('buffer');
    expect(result).toHaveProperty('filename');
    expect(result.filename).toContain('reporte_asistencia');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
  });

  test('reportesService.exportarReportePDF should generate PDF for academico', async () => {
    const result = await reportesService.exportarReportePDF('academico');
    expect(result).toHaveProperty('buffer');
    expect(result.filename).toContain('reporte_academico');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
  });

  test('reportesService.exportarReportePDF should generate PDF for riesgo', async () => {
    const result = await reportesService.exportarReportePDF('riesgo');
    expect(result).toHaveProperty('buffer');
    expect(result.filename).toContain('reporte_riesgo');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
  });
});
