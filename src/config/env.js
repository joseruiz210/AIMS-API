require('dotenv').config();


const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: (() => {
    let raw = (process.env.FRONTEND_URL || 'http://localhost:8081').trim();
    if (raw.includes('*') || !raw.startsWith('http')) {
      raw = 'http://localhost:8081';
    }
    return raw.replace(/\/+$/, '');
  })(),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    user: process.env.SMTP_USER || 'aimscorreo15342@gmail.com',
    pass: process.env.SMTP_PASS || 'oufkndvaqnmibjgu',
    from: process.env.EMAIL_FROM || 'AIMS <aimscorreo15342@gmail.com>',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
};

const requiredVars = ['jwtSecret', 'databaseUrl'];
for (const varName of requiredVars) {
  if (!env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

module.exports = env;

