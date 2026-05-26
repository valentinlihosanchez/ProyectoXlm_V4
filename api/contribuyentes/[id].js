import sql from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.query;

  if (req.method === 'GET') {
    const [row] = await sql`
      SELECT id, rfc, nombre, datos, created_at
      FROM contribuyentes WHERE id = ${id} AND user_id = ${payload.id}
    `;
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(row);
  }

  if (req.method === 'PUT') {
    const { nombre, datos } = req.body;
    const [row] = await sql`
      UPDATE contribuyentes
      SET nombre = COALESCE(${nombre}, nombre),
          datos  = COALESCE(${datos ? JSON.stringify(datos) : null}::jsonb, datos)
      WHERE id = ${id} AND user_id = ${payload.id}
      RETURNING id, rfc, nombre, datos, created_at
    `;
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(row);
  }

  if (req.method === 'DELETE') {
    const result = await sql`
      DELETE FROM contribuyentes WHERE id = ${id} AND user_id = ${payload.id}
    `;
    if (result.count === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.status(204).end();
  }

  res.status(405).end();
}
