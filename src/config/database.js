require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';
const requiresSsl = Boolean(
  isProduction ||
  (connectionString && (connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || connectionString.includes('azure.com')))
);

const pool = new Pool({
  connectionString,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on('error', (err) => {
  console.error('[ERROR] Unexpected error on idle PostgreSQL client:', err.message);
});

const adapter = new PrismaPg(pool, {
  onPoolError: (err) => {
    console.error('[ERROR] Prisma PostgreSQL pool error:', err.message);
  },
});

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;

