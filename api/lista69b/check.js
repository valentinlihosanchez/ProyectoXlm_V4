const pool = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { rfc } = req.query;
  if (!rfc) return res.status(400).json({ error: 'rfc es requerido' });

  const [{ rows: found }, { rows: sync }] = await Promise.all([
    pool.query('SELECT rfc, tipo, situacion FROM lista_69b WHERE rfc = $1', [rfc.toUpperCase()]),
    pool.query('SELECT synced_at FROM lista_69b_sync ORDER BY synced_at DESC LIMIT 1'),
  ]);

  res.json({
    found: found.length > 0,
    data: found[0] || null,
    lastSync: sync[0]?.synced_at || null,
  });
};
