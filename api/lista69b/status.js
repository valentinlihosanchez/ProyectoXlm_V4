const pool = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { rows } = await pool.query(
    'SELECT synced_at, records_count FROM lista_69b_sync ORDER BY synced_at DESC LIMIT 1'
  );

  res.json({
    lastSync: rows[0]?.synced_at || null,
    recordsCount: rows[0]?.records_count || 0,
  });
};
