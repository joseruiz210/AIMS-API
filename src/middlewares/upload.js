const multer = require('multer');
const AppError = require('../utils/appError');

const MAX_MB = 25;
const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp|csv|xls|xlsx)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype) || !ALLOWED_EXT.test(file.originalname)) {
      return cb(AppError.badRequest('Tipo de archivo no permitido. Usa PDF, imagen, CSV o Excel'));
    }
    cb(null, true);
  },
});

// Multer entrega el nombre en latin1: "PresentaciÃ³n.pdf" -> "Presentación.pdf"
const fixFileName = (name = '') => {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? name : decoded;
};

const uploadSingle = (field = 'archivo') => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(AppError.badRequest(`El archivo supera el máximo de ${MAX_MB} MB`));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(AppError.badRequest(`El archivo debe enviarse en el campo "${field}"`));
      }
      return next(err instanceof AppError ? err : AppError.badRequest(err.message));
    }
    if (req.file) req.file.originalname = fixFileName(req.file.originalname);
    next();
  });
};

module.exports = { uploadSingle };