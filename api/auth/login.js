import bcrypt from 'bcryptjs';
import sql from '../../lib/db.js';
import { signToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email y password son requeridos' });

  const [user] = await sql`
    SELECT id, email, nombre, password_hash FROM users WHERE email = ${email.toLowerCase()}
  `;

  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = signToken({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre } });
}
