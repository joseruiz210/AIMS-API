const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const buildPdfBuffer = ({ title, subtitle, columns, rows }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { align: 'center' });
    if (subtitle) doc.fontSize(10).fillColor('gray').text(subtitle, { align: 'center' });
    doc.moveDown(1);

    const startX = doc.page.margins.left;
    let y = doc.y;
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = usableWidth / columns.length;

    const drawRow = (values, isHeader = false) => {
      doc.fontSize(9);
      if (isHeader) {
        doc.rect(startX, y, usableWidth, 18).fill('#1f2937');
        doc.fillColor('#ffffff');
      } else {
        doc.fillColor('#000000');
      }
      values.forEach((val, i) => {
        doc.text(String(val ?? ''), startX + i * colWidth + 4, y + 5, { width: colWidth - 8 });
      });
      y += 20;
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage({ margin: 40, size: 'A4', layout: 'landscape' });
        y = doc.page.margins.top;
      }
    };

    drawRow(columns.map((c) => c.header), true);
    rows.forEach((row) => drawRow(columns.map((c) => row[c.key])));
    doc.end();
  });
};

const buildExcelBuffer = async ({ title, columns, rows }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 30));
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 22 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  return workbook.xlsx.writeBuffer();
};

module.exports = { buildPdfBuffer, buildExcelBuffer };