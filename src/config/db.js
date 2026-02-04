const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// Configurar Node.js para que respete el orden de direcciones devuelto por el DNS
// Esto permite que las direcciones IPv6 funcionen si son las únicas disponibles (como en Supabase Direct)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('verbatim');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Test connection and log status
pool.on('connect', () => {
  console.log('[DB] Database connection established');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected database error:', err.message);
});

// Test initial connection
pool.query('SELECT NOW()')
  .then(() => console.log('[DB] Database connection test successful'))
  .catch(err => console.error('[DB] Database connection test failed:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
};