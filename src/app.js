const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('.');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');
const compression = require('compression');

const app = express();

// Confianza en proxies inversos (Azure App Service, Nginx, Cloudflare, etc.)
app.set('trust proxy', 1);

// ─── Global Middlewares ───────────────────────────────────────────────────
app.use(compression());
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// â”€â”€â”€ API Documentation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AIMS API Documentation',
}));

// ─── Welcome / Root Endpoint ───────────────────────────────────────────────
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Academic Intelligent Management System (AIMS) API en línea',
    documentation: '/api/docs',
    health: '/api/health',
    version: 'v1',
  });
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AIMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Auth Action Redirects (Deep Linking & Email Links Bridge) ────────────────
app.get('/verify-email', (req, res) => {
  const token = req.query.token ? `?token=${encodeURIComponent(req.query.token)}` : '';
  res.redirect(307, `/api/v1/auth/verify-email${token}`);
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token ? `?token=${encodeURIComponent(req.query.token)}` : '';
  res.redirect(307, `/api/v1/auth/reset-password${token}`);
});

app.get(['/magic-verify', '/magic-link'], (req, res) => {
  const token = req.query.token ? `?token=${encodeURIComponent(req.query.token)}` : '';
  res.redirect(307, `/api/v1/auth/magic-link/verify${token}`);
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// â”€â”€â”€ 404 Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.all('{*splat}', (req, res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

// â”€â”€â”€ Global Error Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(errorHandler);

module.exports = app;

