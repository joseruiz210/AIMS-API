const PDFDocument = require('pdfkit');

/**
 * Genera un PDF estructurado para reportes de AIMS
 * @param {string} titulo - Título principal del reporte
 * @param {string} subtitulo - Subtítulo o categoría
 * @param {Array<string>} headers - Nombres de las columnas de la tabla
 * @param {Array<Array<string>>} rows - Filas de datos
 * @returns {Promise<Buffer>} - Buffer del archivo PDF generado
 */
function generatePDFReport(titulo, subtitulo, headers, rows) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // --- Encabezado ---
      doc.fillColor('#00324D') // Azul SENA / AIMS
         .fontSize(20)
         .text('SENA - AIMS (Sistema de Gestión Académica)', { align: 'center' });

      doc.fontSize(14)
         .fillColor('#333333')
         .text(titulo, { align: 'center' });

      if (subtitulo) {
        doc.fontSize(10)
           .fillColor('#666666')
           .text(subtitulo, { align: 'center' });
      }

      doc.moveDown(0.5);
      doc.fontSize(9)
         .fillColor('#888888')
         .text(`Fecha de generación: ${new Date().toLocaleString('es-CO')}`, { align: 'right' });

      doc.moveDown(1);
      doc.strokeColor('#00324D').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // --- Tabla de Datos ---
      const tableTop = doc.y;
      const pageWidth = 515; // 595 - 2*40
      const colWidth = Math.floor(pageWidth / headers.length);

      // Dibujar cabecera de tabla
      doc.rect(40, tableTop, pageWidth, 22).fill('#00324D');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');

      headers.forEach((header, index) => {
        const x = 40 + (index * colWidth);
        doc.text(header, x + 5, tableTop + 6, {
          width: colWidth - 10,
          align: 'left',
        });
      });

      let y = tableTop + 24;
      doc.font('Helvetica').fontSize(9);

      rows.forEach((row, rowIndex) => {
        // Nueva página si se acerca al final
        if (y > 750) {
          doc.addPage();
          y = 40;
        }

        // Alternar color de fondo para legibilidad
        if (rowIndex % 2 === 0) {
          doc.rect(40, y, pageWidth, 20).fill('#F4F6F8');
        }

        doc.fillColor('#222222');
        row.forEach((cell, colIndex) => {
          const x = 40 + (colIndex * colWidth);
          doc.text(String(cell || ''), x + 5, y + 5, {
            width: colWidth - 10,
            align: 'left',
          });
        });

        y += 20;
      });

      // --- Pie de Página ---
      doc.moveDown(2);
      const pageCount = doc.bufferedPageRange().count || 1;
      doc.fontSize(8).fillColor('#888888').text(`Documento Generado Oficialmente por AIMS v1.0 | Página 1 de ${pageCount}`, 40, 780, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generatePDFReport,
};
