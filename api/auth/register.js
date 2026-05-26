import bcrypt from 'bcryptjs';
import sql from '../../lib/db.js';
import { signToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, nombre } = req.body;
  if (!email || !password || !nombre)
    return res.status(400).json({ error: 'email, password y nombre son requeridos' });

  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length > 0)
    return res.status(409).json({ error: 'Este correo ya está registrado' });

  const hash = await bcrypt.hash(password, 10);
  const [user] = await sql`
    INSERT INTO users (email, password_hash, nombre)
    VALUES (${email.toLowerCase()}, ${hash}, ${nombre})
    RETURNING id, email, nombre
  `;

  const token = signToken({ id: user.id, email: user.email });
  res.status(201).json({ token, user });
}
