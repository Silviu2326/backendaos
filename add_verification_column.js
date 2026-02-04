const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'aos_studio',
  password: 'postgres',
  port: 5432,
});

pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_result JSONB')
  .then(() => {
    console.log('Column verification_result added successfully');
    return pool.end();
  })
  .catch(e => {
    console.log('Error adding column:', e.message);
    pool.end();
  });
