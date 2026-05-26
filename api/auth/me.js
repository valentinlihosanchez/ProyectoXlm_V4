import sql from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const payload = requireAuth(req);
  if (!payload) return res.status(401).json({ error: 'No autenticado' });

  const [user] = await sql`
    SELECT id, email, nombre FROM users WHERE id = ${payload.id}
  `;

  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user });
}
