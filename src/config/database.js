require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const logLevels = ['error', 'warn'];
if (process.env.PRISMA_LOG_QUERIES === 'true' || process.env.DEBUG_QUERIES === 'true') {
  logLevels.push('query');
}

const prisma = new PrismaClient({
  adapter,
  log: logLevels,
});

module.exports = prisma;
