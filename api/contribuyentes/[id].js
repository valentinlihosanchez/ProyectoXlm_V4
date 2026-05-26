const pool = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.query;

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      'SELECT id, rfc, nombre, datos, created_at FROM contribuyentes WHERE id = $1 AND user_id = $2',
      [id, payload.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    return res.json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { nombre, datos } = req.body;
    const { rows } = await pool.query(
      `UPDATE contribuyentes
       SET nombre = COALESCE($1, nombre),
           datos  = COALESCE($2::jsonb, datos)
       WHERE id = $3 AND user_id = $4
       RETURNING id, rfc, nombre, datos, created_at`,
      [nombre || null, datos ? JSON.stringify(datos) : null, id, payload.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    return res.json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { rowCount } = await pool.query(
      'DELETE FROM contribuyentes WHERE id = $1 AND user_id = $2',
      [id, payload.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.status(204).end();
  }

  res.status(405).end();
};
