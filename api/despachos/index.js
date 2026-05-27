const pool = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  // GET — listar despachos a los que pertenece el usuario
  if (req.method === 'GET') {
    const { rows } = await pool.query(
      `SELECT d.id, d.nombre, d.admin_id, d.created_at,
              dm.role,
              (SELECT COUNT(*) FROM despacho_members WHERE despacho_id = d.id) AS total_miembros
       FROM despachos d
       JOIN despacho_members dm ON dm.despacho_id = d.id
       WHERE dm.user_id = $1
       ORDER BY d.nombre ASC`,
      [payload.id]
    );
    return res.json(rows);
  }

  // POST — crear nuevo despacho (el creador queda como admin)
  if (req.method === 'POST') {
    const nombre = req.body.nombre?.trim();
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [despacho] } = await client.query(
        'INSERT INTO despachos (nombre, admin_id) VALUES ($1, $2) RETURNING id, nombre, admin_id, created_at',
        [nombre, payload.id]
      );

      await client.query(
        'INSERT INTO despacho_members (despacho_id, user_id, role) VALUES ($1, $2, $3)',
        [despacho.id, payload.id, 'admin']
      );

      await client.query('COMMIT');
      return res.status(201).json(despacho);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  res.status(405).end();
};
