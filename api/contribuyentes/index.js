const pool = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      'SELECT id, rfc, nombre, datos, created_at FROM contribuyentes WHERE user_id = $1 ORDER BY nombre ASC',
      [payload.id]
    );
    return res.json(rows);
  }

  if (req.method === 'POST') {
    const { rfc, nombre, datos = {} } = req.body;
    if (!rfc || !nombre)
      return res.status(400).json({ error: 'rfc y nombre son requeridos' });

    const { rows: existing } = await pool.query(
      'SELECT id FROM contribuyentes WHERE rfc = $1 AND user_id = $2',
      [rfc.toUpperCase(), payload.id]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: 'Este RFC ya está registrado' });

    const { rows } = await pool.query(
      'INSERT INTO contribuyentes (rfc, nombre, datos, user_id) VALUES ($1, $2, $3, $4) RETURNING id, rfc, nombre, datos, created_at',
      [rfc.toUpperCase(), nombre, JSON.stringify(datos), payload.id]
    );
    return res.status(201).json(rows[0]);
  }

  res.status(405).end();
};
