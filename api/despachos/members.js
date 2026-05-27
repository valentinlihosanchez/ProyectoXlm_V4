const pool = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

async function isAdmin(despachoId, userId) {
  const { rows } = await pool.query(
    "SELECT role FROM despacho_members WHERE despacho_id = $1 AND user_id = $2",
    [despachoId, userId]
  );
  return rows[0]?.role === 'admin';
}

module.exports = async function handler(req, res) {
  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  const { despacho_id } = req.query;
  if (!despacho_id) return res.status(400).json({ error: 'despacho_id es requerido' });

  // Verificar que el usuario pertenece al despacho
  const { rows: membership } = await pool.query(
    'SELECT role FROM despacho_members WHERE despacho_id = $1 AND user_id = $2',
    [despacho_id, payload.id]
  );
  if (!membership.length) return res.status(403).json({ error: 'No perteneces a este despacho' });

  // GET — listar miembros del despacho
  if (req.method === 'GET') {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.nombre, dm.role, dm.joined_at
       FROM despacho_members dm
       JOIN users u ON u.id = dm.user_id
       WHERE dm.despacho_id = $1
       ORDER BY dm.role ASC, u.nombre ASC`,
      [despacho_id]
    );
    return res.json(rows);
  }

  // POST — invitar miembro por email (solo admin)
  if (req.method === 'POST') {
    if (!(await isAdmin(despacho_id, payload.id)))
      return res.status(403).json({ error: 'Solo el administrador puede invitar miembros' });

    const email = req.body.email?.trim().toLowerCase();
    const role = req.body.role === 'admin' ? 'admin' : 'member';
    if (!email) return res.status(400).json({ error: 'email es requerido' });

    const { rows: user } = await pool.query(
      'SELECT id, email, nombre FROM users WHERE email = $1',
      [email]
    );
    if (!user.length)
      return res.status(404).json({ error: 'No existe un usuario con ese email' });

    const { rows: existing } = await pool.query(
      'SELECT 1 FROM despacho_members WHERE despacho_id = $1 AND user_id = $2',
      [despacho_id, user[0].id]
    );
    if (existing.length)
      return res.status(409).json({ error: 'El usuario ya es miembro de este despacho' });

    await pool.query(
      'INSERT INTO despacho_members (despacho_id, user_id, role) VALUES ($1, $2, $3)',
      [despacho_id, user[0].id, role]
    );

    return res.status(201).json({ message: 'Miembro agregado', user: user[0], role });
  }

  // DELETE — quitar miembro (solo admin, no puede quitar al admin principal)
  if (req.method === 'DELETE') {
    if (!(await isAdmin(despacho_id, payload.id)))
      return res.status(403).json({ error: 'Solo el administrador puede quitar miembros' });

    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id es requerido' });

    // Admin no puede quitarse a sí mismo si es el único admin
    if (Number(user_id) === payload.id) {
      const { rows: admins } = await pool.query(
        "SELECT 1 FROM despacho_members WHERE despacho_id = $1 AND role = 'admin'",
        [despacho_id]
      );
      if (admins.length <= 1)
        return res.status(400).json({ error: 'No puedes salirte siendo el único administrador' });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM despacho_members WHERE despacho_id = $1 AND user_id = $2',
      [despacho_id, user_id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Miembro no encontrado' });

    return res.status(204).end();
  }

  res.status(405).end();
};
