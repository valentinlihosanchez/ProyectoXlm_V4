import sql from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, rfc, nombre, datos, created_at
      FROM contribuyentes
      WHERE user_id = ${payload.id}
      ORDER BY nombre ASC
    `;
    return res.json(rows);
  }

  if (req.method === 'POST') {
    const { rfc, nombre, datos = {} } = req.body;
    if (!rfc || !nombre)
      return res.status(400).json({ error: 'rfc y nombre son requeridos' });

    const existing = await sql`
      SELECT id FROM contribuyentes WHERE rfc = ${rfc.toUpperCase()} AND user_id = ${payload.id}
    `;
    if (existing.length > 0)
      return res.status(409).json({ error: 'Este RFC ya está registrado' });

    const [row] = await sql`
      INSERT INTO contribuyentes (rfc, nombre, datos, user_id)
      VALUES (${rfc.toUpperCase()}, ${nombre}, ${JSON.stringify(datos)}, ${payload.id})
      RETURNING id, rfc, nombre, datos, created_at
    `;
    return res.status(201).json(row);
  }

  res.status(405).end();
}
