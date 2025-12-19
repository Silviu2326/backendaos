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
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};