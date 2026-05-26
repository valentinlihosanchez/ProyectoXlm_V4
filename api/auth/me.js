const pool = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  const { rows } = await pool.query(
    'SELECT id, email, nombre FROM users WHERE id = $1', [payload.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: rows[0] });
};
