@echo off
cd /d "%~dp0"
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'aos_studio',
  password: 'postgres',
  port: 5432,
});

const migration = fs.readFileSync(path.join(__dirname, 'migrations/008_add_compscrap_fields.sql'), 'utf8');

pool.query(migration)
  .then(() => {
    console.log('Migration 008 executed successfully!');
    return pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'headcount_sales'\");
  })
  .then(res => {
    if (res.rows.length > 0) {
      console.log('Column headcount_sales verified:', res.rows);
    }
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e.message);
    pool.end();
  });
"
pause
